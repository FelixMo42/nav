import { Event, fire, loop, Graph, Vec, intersects, contains, removeItem, isConvex, nmod } from "./utils"

class Linker<A, B> {
    keys = [] as A[]
    values = new Set<B>
    data = new Map<string, B[]>

    add(key: A, val: B) {
        const jkey = JSON.stringify(key)

        if (!this.data.has(jkey)) {
            this.keys.push(key)
            this.data.set(jkey, [])
        }

        this.values.add(val)

        this.data.get(jkey).push(val)
    }

    get(key: A): B[] {
        const jkey = JSON.stringify(key)
        return this.data.get(jkey) ?? []
    }

    replace(key: A, org: B, val: B) {
        // Replace it in the array
        const arr = this.get(key)
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === org) arr[i] = val
        }

        // Update the values list
        this.values.delete(org)
        this.values.add(val)
    }
}

export default class NavMesh {
    // Structs
    edges = new Graph<Vec>()
    zones = new Linker<[Vec, Vec], Vec[]>()
    polys = new Linker<Vec, Vec[]>()
    
    // Events
    addNodeEvent = Event<Vec>()
    addEdgeEvent = Event<[Vec, Vec]>()
    addZoneEvent = Event<Vec[]>()

    setBounds(size: Vec) {
        loop([
            new Vec(0, 0),
            new Vec(0, size.y),
            new Vec(size.x, size.y),
            new Vec(size.x, 0),
        ], (a, b) => {
            this.edges.$vert.set(a, [])
            this.edges.link(a, b)
        })
    }

    add(poly: Vec[]) {
        loop(poly, (a, b) => {
            this.polys.add(a, poly)
            this.edges.link(a, b)
        })
    }

    /**
     * Compute all the zones
     */
    compute() {
        // STEP 1: Compute inital zones
        this.step1()

        // STEP 2: Find & split gaps
        this.findGaps()

        // STEP 3: Merge zones
        this.mergeZones()
        
        // STEP 4: Profit
        this.zones.values.forEach(zone => fire(this.addZoneEvent, zone))
    }

    private mergeZones() {
        for (const edge of this.zones.keys) {
            // Get two adjacest zones
            const zones = this.zones.get(edge)
            if (zones.length < 2) continue

            // Compute the merged zones
            const mergedZone = merge(zones[0], zones[1], edge)

            // Check if it's legal
            if (!isConvex(mergedZone)) continue

            // Replace the old zone
            for (const zone of zones) {
                loop(zone, (a, b) => {
                    const edge = a.sort(b)
                    this.zones.replace(edge, zone, mergedZone)
                })
            }
        }
    }

    private findGaps() {
        const edges = []

        for (const edge of this.zones.keys) {
            // Every edge should be part of two zones, unless:
            //  1) It's at the edge of the world
            //  2) It's part of an obstacle 
            if (this.zones.get(edge).length === 2) continue

            // If both points are part of the same polygone, then it's a poly vertex
            // NOTE: This will not be true for more complex shapes
            if (this.polys.get(edge[0])[0] === this.polys.get(edge[1])[0]) continue

            // We can skip the edge of the world case cause the initial zones
            // don't includes them, so it's impossible for them to be here
            edges.push(edge)
        }

        while (edges.length > 0) {
            const ps = new Set<Vec>(edges.pop())

            while (true) {
                const edge = edges.find(edge => ps.has(edge[0]) || ps.has(edge[1]))
                if (!edge) break
                removeItem(edges, edge)
                ps.add(edge[0]).add(edge[1])
            }

            this.addZone([...ps.values()])
        }
    }

    private addZone(zone: Vec[]) {
        // Add this zone to each edge
        loop(zone, (a, b) => this.zones.add(a.sort(b), zone))

        // Tell the world about it!
        // fire(this.addZoneEvent, zone)
    }

    private splitGaps() {}

    private step1() {
        for (const [a, b] of this.edges.$edge) {
            // TODO: Check if I'm already in a zone

            for (const c of this.edges.verts()) {
                // We need a triangle, not a line
                if (c === a) continue
                if (c === b) continue

                // Make sure this point outward, and not into the polygone
                if (this.polys.get(a).length > 0) {
                    if (contains(this.polys.get(a)[0], a.mid(c))) continue
                    if (contains(this.polys.get(b)[0], b.mid(c))) continue
                }

                // The area inside the triangle must be clear
                if (!this.clear(a, b, c)) continue

                // Finally: we've found a zone!
                this.addZone([a, b, c])
                
                // We're done here, no need to keep looking
                break
            }
        }
    }

    /**
     * Check to make sure there's nothing inside of the zone
     */
    private clear(a: Vec, b: Vec, c: Vec) {
        // Make sure there are no points inside of this triangle
        for (const vert of this.edges.verts()) {
            if (a === vert) continue
            if (b === vert) continue
            if (c === vert) continue

            if (contains([a, b, c], vert)) return false
        }

        // Make sure we don't overlap with any walls
        for (const wall of this.edges.$edge) {
            if (wall.includes(c)) continue

            if (!wall.includes(a) && intersects([a, c], wall)) return false
            if (!wall.includes(b) && intersects([b, c], wall)) return false
        }

        // Make sure we don't overlap with any existing zones
        for (const edge of this.zones.keys) {
            if (edge.includes(c)) continue

            if (!edge.includes(b) && intersects([b, c], edge)) return false
            if (!edge.includes(a) && intersects([a, c], edge)) return false
        }

        // It's clear!
        return true
    }
}

/**
 * Merge two polygons by given edge
 * NOTE: They must share the edge!
 */
function merge(a: Vec[], b: Vec[], edge: [Vec, Vec]) {
    const merged = []

    merged.push(edge[0])

    const start0 = a.findIndex(vert => vert === edge[0])
    const d0 = nmod(a, start0 + 1) === edge[1] ? -1 : 1
    for (let i = 1; i < a.length - 1; i++) {
        merged.push(nmod(a, start0 + i * d0))
    }

    merged.push(edge[1])

    const start1 = b.findIndex(vert => vert === edge[1])
    const d1 = nmod(b, start1 + 1) === edge[0] ? -1 : 1
    for (let i = 1; i < b.length - 1; i++) {
        merged.push(nmod(b, start1 + i * d1))
    }

    return merged
}