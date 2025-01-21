import { Vec } from "../utils";

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
export function orientation(p1: Vec, p2: Vec, p3: Vec) {
    let dir = (p2.y - p1.y) * (p3.x - p2.x) - (p2.x - p1.x) * (p3.y - p2.y)

    if (dir == 0) { return 0 }

    return (dir > 0) ? 1 : -1
}


/**
 * Given line ab, checks if point p is on the line. 
 * 
 * source: https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
 */
export function onSegment(a: Vec, b: Vec, p: Vec) {
    return b.x <= Math.max(a.x, p.x) && b.x >= Math.min(a.x, p.x) && 
           b.y <= Math.max(a.y, p.y) && b.y >= Math.min(a.y, p.y)
}

/**
 * Do the the lines intersect?
 * 
 * source: https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
 */
export function intersect(p1: Vec, q1: Vec, p2: Vec, q2: Vec) {
    let o1 = orientation(p1, q1, p2)
    let o2 = orientation(p1, q1, q2)
    let o3 = orientation(p2, q2, p1)
    let o4 = orientation(p2, q2, q1)

    if (o1 != o2 && o3 != o4) {
        return true
    }

    if (o1 == 0 && onSegment(p1, p2, q1)) {
        return true
    }

    // p1, q1 and q2 are colinear and q2 lies on segment p1q1 
    if (o2 == 0 && onSegment(p1, q2, q1)) {
        return true
    }
  
    // p2, q2 and p1 are colinear and p1 lies on segment p2q2 
    if (o3 == 0 && onSegment(p2, p1, q2)) {
        return true
    }
  
    // p2, q2 and q1 are colinear and q1 lies on segment p2q2 
    if (o4 == 0 && onSegment(p2, q1, q2)) {
        return true
    }
 
    return false
}

/**
 * Does triangle abc contain point p?
 */
export function contains(a: Vec, b: Vec, c: Vec, p: Vec) {
    // Calculate area of full triangle ABC
    let A = area(a, b, c) 
  
    // Calculate area of partal triangle PBC  
    let A1 = area(p, b, c) 
    
    // Calculate area of partal triangle APC  
    let A2 = area(a, p, c) 
    
    // Calculate area of partal triangle ABP  
    let A3 = area(a, b, p)

    // do the area add up to the same thing?
    return A == A1 + A2 + A3
}