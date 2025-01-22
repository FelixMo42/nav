import { midpoint, Poly, Vec, Pather, contains } from "./utils"

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

        return [
            a,
            ...path,
            b
        ]
    }

    neighbors(vec: Vec): Vec[] {
        return this.paths.get(vec)
    }

    distance(a: Vec, b: Vec): number {
        return a.distance(b)
    }
}
