const Graph  = require('struk.graph')
const earcut = require("earcut")
const Vector = require('./struc/Vector')
const _      = require('lodash')

function area(x1, y1, x2, y2, x3, y3) {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0) 
}

function distToLine(x1, y1, x2, y2, x, y) {
    //https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Vector_formulation

    let n = new Vector({x: x1, y: y1})
                .sub( new Vector({x: x2, y: y2}) )
                .normalize()
    
    let a = new Vector({x: x2, y: y2})
    let p = new Vector({x: x, y: y})

    return a.sub(p).sub( n.mul( a.sub(p).dot(n) ) ).mag()
}

function orientation(p1, p2, p3) {
    let val = (p2.y - p1.y) * (p3.x - p2.x) - (p2.x - p1.x) * (p3.y - p2.y)

    if (val == 0) return 0

    return (val > 0)? 1: 2
}

function onSegment(p, q, r) {
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && 
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)) {
        return true
    }
  
    return false
}

function intersect(p1, q1, p2, q2) {
    //https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/

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

class Room {
    constructor(points, node, navMesh) {
        this.node    = node
        this.navMesh = navMesh

        this.points = points
        this.points.forEach(point => {
            point.data.rooms.push( this )
        })

        this.calculatePosition()

        this.edges = []
        for (let i = 0; i < this.points.length; i++) {
            let from = this.points[i]
            let to   = this.points[i == 0 ? points.length - 1 : i - 1]

            let edge = this.navMesh.portals.getEdge(from, to)

            if (edge) {
                edge.data.rooms.push(this)

                if ( !edge.data.isWall ) {
                    this.navMesh.rooms.addEdge(
                        edge.data.rooms[0].node,
                        edge.data.rooms[1].node,
                        {}
                    )
                }
            } else {
                edge = this.navMesh.portals.addEdge(from, to, {rooms: [this]})
            }

            this.edges.push(edge)
        }
    }

    calculatePosition() {
        let {x, y} = this.points.reduce((point, positon) =>
            ({x: positon.x + point.x, y: positon.y + point.y})
        )

        this.x = x / this.points.length
        this.y = y / this.points.length
    }

    update() {
        this.calculatePosition()
    }

    clear() {
        for (let point in this.points) {
            point.data.rooms = point.data.rooms.filter( item => item != this )
        }

        for (let edge in this.edges) {
            edge.data.rooms = edge.data.rooms.filter( item => item != this )

            if (edge.data.rooms.length == 0 && edge.data.isWall == false) {
                this.portals.removeEdge(edge)
            }
        }

        this.navMesh.rooms.removeNode(this.node)
    }

    contains(x, y) {
        let x1 = this.points[0].data.x
        let y1 = this.points[0].data.y
        let x2 = this.points[1].data.x
        let y2 = this.points[1].data.y
        let x3 = this.points[2].data.x
        let y3 = this.points[2].data.y

        let A = area(x1, y1, x2, y2, x3, y3) 
  
        // # Calculate area of triangle PBC  
        let A1 = area(x, y, x2, y2, x3, y3) 
        
        // # Calculate area of triangle PAC  
        let A2 = area(x1, y1, x, y, x3, y3) 
        
        // # Calculate area of triangle PAB  
        let A3 = area(x1, y1, x2, y2, x, y)

        if(A == A1 + A2 + A3) {
            return true
        } else {
            return false
        }
    }
}

module.exports = class NavMesh {
    constructor(options) {
        this.options = options
        
        this.rooms   = new Graph({trackNodes: true})
        this.portals = new Graph({trackNodes: true, trackEdges: true})
    }

    addNode(x, y) {
        let node = this.portals.addNode({x: x, y: y, rooms: []})

        if (this.rooms.getTotalNodes() == 0) {
            if (this.portals.getTotalNodes() == 3) {
                this.createRoom(...this.portals.allNodes())
            }
            return
        }

        let room = this.getRoomContaining(node)

        if ( room ) {
            room.delete()

            this.createRoom(node, room.p1, room.p2)
            this.createRoom(node, room.p1, room.p3)
            this.createRoom(node, room.p2, room.p3)

            return
        }

        let closest = false
        let minDist = 0
        for (let portal of this.portals.allEdges()) {
            let from = portal.nodes[0].data
            let to   = portal.nodes[1].data

            let dist = distToLine(
                from.x, from.y,
                to.x, to.y,
                node.data.x, node.data.y
            )

            if (!closest || dist < minDist) {
                closest = portal
                minDist = dist
            }
        }

        this.createRoom(node, ...closest.nodes)

        return node
    }

    getRoomContaining(node) {
        for (let room in this.rooms.allNodes()) {
            if (room.data.contains(node.data.x, node.data.y)) {
                return room.data
            }
        }
    }

    createRoom(...points) {
        let node = this.rooms.addNode()
        node.data = new Room(points, node, this)
    }

    onParentGraphChange(events) {
        for (let event of events) {
            if (event.changeType == "add") {
                if ("node" in event) {
                    let node = event.node

                    // add the node to the portals graph
                    this.portals.addNode(node.id, node.data)
    
                    // add inital room if their isnt any yet
                    if (this.rooms.getNodesCount() == 0) {
                        if (this.graph.getNodesCount() >= 3) {
                            let nodes = []
                            this.graph.forEachNode((node) => {
                                nodes.push(node)
                                return nodes.length == 3
                            })
                            this.createRoom(...nodes)
                        }

                        continue
                    }
    
                    // split room if node is inside of a room
                    let room = this.getRoomContaining(node)
                    if ( room ) {
                        room.delete()

                        this.createRoom(node, room.p1, room.p2)
                        this.createRoom(node, room.p1, room.p3)
                        this.createRoom(node, room.p2, room.p3)

                        continue
                    }
    
                    // add new room on outside outherwise
                    let closest = false
                    let minDist = 0
                    this.portals.forEachEdge((edge) => {
                        let from = this.graph.getNode(edge.fromId).data
                        let to   = this.graph.getNode(edge.toId  ).data
    
                        let dist = distToLine(
                            from.x, from.y,
                            to.x, to.y,
                            node.data.x, node.data.y
                        )
    
                        if (!closest || dist < minDist) {
                            closest = edge
                            minDist = dist
                        }
                    })
    
                    this.createRoom(
                        node,
                        this.graph.getNode( closest.fromId ),
                        this.graph.getNode( closest.toId   )
                    )
                }
    
                if ("edge" in event) {
                    let edge = this.portals.getEdge(
                        event.edge.fromId,
                        event.edge.toId
                    )

                    if ( edge ) {
                        if ( edge.data.rooms.length == 2 ) {
                            this.rooms.removeEdge( this.rooms.getEdge(
                                edge.data.rooms[0].id,
                                edge.data.rooms[1].id
                            ) )
                        }
                    } else {
                        this.addSplitEdge(event.edge)
                    }
                }
            }
    
            if (event.changeType == "move") {
                for (let room of event.node.data.rooms) {
                    room.update()
                }
                this.portals.fire("changed", [event])
            }
        }
    }

    addSplitEdge(edge) {
        let merge = []

        let from = this.graph.getNode( edge.fromId ).data
        let to = this.graph.getNode( edge.toId   ).data
        
        for (let room of this.graph.getNode(edge.fromId).data.rooms) {
            let nodes = []
    
            if ( room.p1.id != edge.fromId ) { nodes.push(room.p1) }
            if ( room.p2.id != edge.fromId ) { nodes.push(room.p2) }
            if ( room.p3.id != edge.fromId ) { nodes.push(room.p3) }
    
            if ( intersect(from, to, nodes[0].data, nodes[1].data) ) {
                merge.push(room)

                let portal = this.portals.getEdge(nodes[0].id, nodes[1].id)

                let i = 0

                while (true) {                   
                    if ( portal.data.rooms.length == 1 ) {
                        break
                    }

                    let room = portal.data.rooms[0] != _.last(merge) ?
                        portal.data.rooms[0] : 
                        portal.data.rooms[1]

                    merge.push(room)

                    if ( room.points.some( point => point.id == edge.toId ) ) {
                        break
                    }

                    for (let edge of room.edges) {
                        if (edge == portal) {
                            continue
                        }

                        if ( intersect(
                            from, to,
                            this.graph.getNode(edge.fromId).data,
                            this.graph.getNode(edge.toId).data
                        ) ) {
                            portal = edge

                            break
                        }
                    }
                }

                break
            }
        }
    
        let left  = []
        let right = []
    
        for (let room of merge) {
            for (let p of [room.p1, room.p2, room.p3]) {
                if (p.id !== edge.toId || p.id !== edge.fromId) {
                    let x0 = this.graph.getNode( edge.toId   ).data.x
                    let y0 = this.graph.getNode( edge.toId   ).data.y
                    let x1 = this.graph.getNode( edge.fromId ).data.x
                    let y1 = this.graph.getNode( edge.fromId ).data.y
                    let x2 = p.data.x
                    let y2 = p.data.y
                    let dir = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
    
                    if (dir > 0) {
                        right.push(p)
                    } else if (dir < 0) {
                        left.push(p)
                    } else {
                        right.push(p)
                        left.push(p)
                    }
                }
            }
    
            room.delete()
        }
    
        left  = _.uniq( left  )
        right = _.uniq( right )
    
        this.polygoneToRoom(left)
        this.polygoneToRoom(right)
    }
    
    polygoneToRoom(points) {
        let pos = []
        for (let node of points) {
            pos.push(node.data.x)
            pos.push(node.data.y)
        }
    
        let tris = earcut(pos)
        for (let i = 0; i < tris.length; i += 3) {
            this.createRoom(
                points[ tris[i + 0] ],
                points[ tris[i + 1] ],
                points[ tris[i + 2] ]
            )
        }
    }

    optimize(room1, room2) {
        let portal = this.rooms.getEdge(room1.id, room2.id)
        
    }
}