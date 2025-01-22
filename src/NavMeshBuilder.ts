import { NavMesh } from "./NavMesh"
import { loop, Graph, Vec, intersects, contains, isConvex, nmod } from "./utils"

type Poly = Vec[]

export default class NavMeshBuilder {
    // Structs
    edges = new Graph<Vec>()
    cells = new Linker<[Vec, Vec], Vec[]>()
    polys = new Linker<Vec, Vec[]>()

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
     * Compute all the cells
     */
    build() {
        // STEP 1: Add inital cells
        this.edges.$edge.forEach(edge => this.addCellToEdge(edge))

        // STEP 2: Find & split gaps
        this.findGaps().forEach(edge => this.addCellToEdge(edge))

        // STEP 3: Merge cells
        this.mergeCells()
        
        // STEP 4: Profit (aka, build a* graph)
        const cells = new Map<Poly, Poly[]>()

        for (const cell of this.cells.values.values()) {
            cells.set(cell, [])
        }

        for (const cell of this.cells.values.values()) {
            loop(cell, (a, b) => {
                const edge = a.sort(b)
                const sides = this.cells.get(edge)
                if (sides.length == 2) {
                    cells.get(sides[0]).push(sides[1])
                    cells.get(sides[1]).push(sides[0])
                }
            })
        }

        return new NavMesh(cells)
    }

    private mergeCells() {
        for (const edge of this.cells.keys) {
            // Get two adjacest cells
            const cells = this.cells.get(edge)
            if (cells.length < 2) continue

            // Compute the merged cells
            const mergedCell = merge(cells[0], cells[1], edge)

            // Check if it's legal
            if (!isConvex(mergedCell)) continue

            // Replace the old cell
            for (const cell of cells) {
                loop(cell, (a, b) => {
                    const edge = a.sort(b)
                    this.cells.replace(edge, cell, mergedCell)
                })
            }
        }
    }

    private findGaps() {
        const gaps = []

        for (const edge of this.cells.keys) {
            // Every edge should be part of two cells, unless:
            //  1) It's at the edge of the world
            //  2) It's part of an obstacle 
            if (this.cells.get(edge).length === 2) continue

            // If both points are part of the same poly, then it's a vertex
            // NOTE: This will not be true for more complex shapes!
            if (this.polys.get(edge[0])[0] === this.polys.get(edge[1])[0]) continue

            // We can skip the edge of the world case cause the initial cells
            // don't includes them, so it's impossible for them to be here
            gaps.push(edge)
        }

        return gaps
    }

    private addCell(cell: Vec[]) {
        // Add this cell to each edge
        loop(cell, (a, b) => this.cells.add(a.sort(b), cell))
    }

    private addCellToEdge([a, b]: [Vec, Vec]) {
        // We're already in two cells, you can't be in any more!
        if (this.cells.get(a.sort(b)).length === 2) return

        for (const c of this.edges.verts()) {
            // We need a triangle, not a line
            if (c === a) continue
            if (c === b) continue

            // Make sure this is not already a cell!
            if (this.cells.get(a.sort(b)).some(cell => cell.includes(c))) continue

            // Make sure this point outward, and not into the polygone
            if (this.polys.get(a).length > 0 && this.polys.get(b).length > 0) {
                if (contains(this.polys.get(a)[0], a.mid(c))) continue
                if (contains(this.polys.get(b)[0], b.mid(c))) continue
            }

            // The area inside the triangle must be clear
            if (!this.clear(a, b, c)) continue

            // Finally: we've found a cell!
            return this.addCell([a, b, c])
        }
    }

    /**
     * Check to make sure there's nothing inside of the cell
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

        // Make sure we don't overlap with any existing cells
        for (const edge of this.cells.keys) {
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
