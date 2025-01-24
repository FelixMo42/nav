import { midpoint, Poly, Vec, Pather, contains, intersects, loop, orientation } from "./utils"

export class NavMesh extends Pather<Vec> {
    paths = new Map<Vec, Vec[]>()
    cells = new Map<Vec, Poly>()

    constructor(raw: Map<Poly, Poly[]>) {
        super()

        // First: we need static midpoints for all the cells
        const ps = new Map<Poly, Vec>() 
        for (const cell of raw.keys()) {
            const center = midpoint(cell)
            this.cells.set(center, cell)
            ps.set(cell, center)
        }

        // Second: convert paths of Polygons into paths of Vecs
        for (const [cell, paths] of raw.entries()) {
            this.paths.set(ps.get(cell), paths.map(c => ps.get(c)))
        }
    }

    getCell(coord: Vec) {
        if (this.cells.has(coord)) return coord

        for (const [cell, poly] of this.cells.entries()) {
            if (contains(poly, coord)) {
                return cell
            }
        }
    }

    path(a: Vec, b: Vec) {
        // Get the cells for the start and end positions
        const ca = this.getCell(a)
        const cb = this.getCell(b)
        if (!ca || !cb) return []

        const path = super.path(ca, cb)

        return this.funnel([
            a,
            ...path.slice(1, -1),
            b
        ])
    }

    neighbors(vec: Vec): Vec[] {
        return this.paths.get(vec)
    }

    distance(a: Vec, b: Vec): number {
        return a.distance(b)
    }

    /**
     * Pulls the path tight using the funnel algorithm.
     * 
     * source: https://digestingduck.blogspot.com/2010/03/simple-stupid-funnel-algorithm.html
     */
    funnel(p: Vec[]) {
        // STEP 1: get edges
        const left: Vec[] = [p[0]]
        const right: Vec[] = [p[0]]
        for (let i = 0; i < p.length - 1; i++) {
            const cell = this.cells.get(this.getCell(p[i]))
            const segment = [p[i], p[i + 1]] as [Vec, Vec]
            loop(cell, (a, b) => {
                if (intersects([a, b], segment)) {
                    if (orientation(...segment, a) === 1) {
                        left.push(a)
                        right.push(b)
                    } else {
                        left.push(b)
                        right.push(a)
                    }
                }
            })
        }
        left.push(p[p.length - 1])
        right.push(p[p.length - 1])

        // STEP 2: 

        let leftindex = 0

        const path = [p[0]]

        

        path.push(p[p.length - 1])

        // Step 3: Profit
        return [...left, ...right.reverse()]
    }
}
