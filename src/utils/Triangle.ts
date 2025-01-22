import { Vec } from "../utils"

export type Poly = Vec[] 

/**
 * Calculate the area of a triangle
 */
export function area(p1: Vec, p2: Vec, p3: Vec) {
    return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2.0) 
}

/**
 * Figure out the orientation of three points
 * 
 * 0 = Linear
 * 1 = Clockwise
 * 2 = Counterclockwise
 * 
 * source: https://www.geeksforgeeks.org/orientation-3-ordered-points/
 */
export function orientation(a: Vec, b: Vec, c: Vec): number {
    const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
    if (val === 0) return 0
    return val > 0 ? 1 : 2
}


/**
 * Given line ab, checks if point p is on the line. 
 * 
 * source: https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
 */
function onSegment(a: Vec, b: Vec, c: Vec) {
    return (
        Math.min(b.x, c.x) <= a.x && a.x <= Math.max(b.x, c.x) &&
        Math.min(b.y, c.y) <= a.y && a.y <= Math.max(b.y, c.y)
    )
}

type Edge = [Vec, Vec]

/**
 * Do the the lines intersect?
 * 
 * source: https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
 */
export function intersects([a1, a2]: Edge, [b1, b2]: Edge) {
    // Find orientations for the combinations of points
    const o1 = orientation(a1, a2, b1)
    const o2 = orientation(a1, a2, b2)
    const o3 = orientation(b1, b2, a1)
    const o4 = orientation(b1, b2, a2)

    // General case: segments intersect if the orientations differ
    if (o1 !== o2 && o3 !== o4) return true

    // Special cases: check for collinear points lying on the other segment
    if (o1 === 0 && onSegment(b1, a1, a2)) return true
    if (o2 === 0 && onSegment(b2, a1, a2)) return true
    if (o3 === 0 && onSegment(a1, b1, b2)) return true
    if (o4 === 0 && onSegment(a2, b1, b2)) return true
 
    // And finally: they don't intersect! 
    return false
}

/**
 * Does the polygone contain point p?
 */
export function contains(poly: Vec[], p: Vec) {
    let inside = false

    for (let i = 0; i < poly.length; i++) {
        const a = poly[i]
        const b = poly[(i + 1) % poly.length]

        if (((a.y > p.y) != (b.y > p.y)) &&  (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)) {
            inside = !inside
        }
    }

    return inside
}

/**
 * What's the midpoint of the polygone?
 */
export function midpoint(poly: Vec[]) {
    return poly.reduce((a, b) => a.add(b)).div(poly.length)
}

export function isConvex(polygon: Vec[]) {
    const n = polygon.length
    if (n < 3) return false // A polygon must have at least 3 vertices

    let isConvex = true
    let prevSign = 0

    for (let i = 0; i < n; i++) {
        // Get three consecutive vertices (wrapping around at the ends)
        const a = polygon[i]
        const b = polygon[(i + 1) % n]
        const c = polygon[(i + 2) % n]

        // Compute the cross product
        const currentSign = orientation(a, b, c)

        // Check for consistency in turning direction
        if (currentSign !== 0) { // Ignore collinear points
            if (prevSign !== 0 && currentSign !== prevSign) {
                isConvex = false
                break
            }
            prevSign = currentSign
        }
    }

    return isConvex
}