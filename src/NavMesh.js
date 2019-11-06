const Graph  = require('./ngraph.graph')
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
    constructor(p1, p2, p3, id, navMesh) {
        this.id = id

        this.navMesh = navMesh
        this.portals = navMesh.portals

        this.p1 = p1
        this.p2 = p2
        this.p3 = p3

        p1.data.rooms.push( this )
        p2.data.rooms.push( this )
        p3.data.rooms.push( this )

        this.calculatePosition()
    }
    
    setup() {
        this.setUpLink(this.p1, this.p2)
        this.setUpLink(this.p3, this.p2)
        this.setUpLink(this.p3, this.p1)
    }

    setUpLink(a, b) {
        let link = this.portals.getLink(a.id, b.id)

        if (link) {
            link.data.rooms.push(this)
        } else {
            this.portals.addLink(a.id, b.id, {rooms: [this]})
            link = this.portals.getLink(a.id, b.id)
        }

        if (link.data.rooms.length == 2) {
            if ( !this.navMesh.graph.hasLink(a.id, b.id) ) {
                this.navMesh.rooms.addLink(
                    link.data.rooms[0].id,
                    link.data.rooms[1].id,
                    {}
                )
            }
        }
    }

    clearLink(a, b) {
        let link = this.portals.getLink(a.id, b.id)
        link.data.rooms = link.data.rooms.filter( item => item != this )

        this.navMesh.rooms.forEachLinkedNode(this.id, (link) => {
            this.portals.removeLink(link)
        })

        if (link.data.rooms.length == 0) {
            this.portals.removeLink(link)
        }
    }

    calculatePosition() {
        this.x = (this.p1.data.x + this.p2.data.x + this.p3.data.x) / 3
        this.y = (this.p1.data.y + this.p2.data.y + this.p3.data.y) / 3
    }

    update() {
        this.calculatePosition()

        this.navMesh.rooms.fire("changed", [{
            changeType: "move",
            node: this.navMesh.rooms.getNode(this.id)
        }])
    }

    delete() {
        this.p1.data.rooms = this.p1.data.rooms.filter( item => item != this )
        this.p2.data.rooms = this.p2.data.rooms.filter( item => item != this )
        this.p3.data.rooms = this.p3.data.rooms.filter( item => item != this )

        this.clearLink(this.p1, this.p2)
        this.clearLink(this.p3, this.p2)
        this.clearLink(this.p3, this.p1)

        this.navMesh.rooms.removeNode(this.id)
    }

    contains(x, y) {
        let x1 = this.p1.data.x
        let y1 = this.p1.data.y
        let x2 = this.p2.data.x
        let y2 = this.p2.data.y
        let x3 = this.p3.data.x
        let y3 = this.p3.data.y

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
    constructor(graph, options) {
        this.graph   = graph

        this.rooms   = Graph({})
        this.portals = Graph({})

        this.iid = 0

        graph.on("changed", (events) => this.onParentGraphChange(events))
    }

    id() {
        this.iid += 1
        return this.iid
    }

    getRoomContaining(node) {
        let data;

        this.rooms.forEachNode(room => {
            if (room.data.contains(node.data.x, node.data.y)) {
                data = room.data
                return true
            }
        })

        return data
    }

    createRoom(p1, p2, p3) {
        let id = this.id()
    
        let room = new Room(p1, p2, p3, id, this)

        this.rooms.addNode( id, room )

        room.setup()
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
                    this.portals.forEachLink((link) => {
                        let from = this.graph.getNode(link.fromId).data
                        let to   = this.graph.getNode(link.toId  ).data
    
                        let dist = distToLine(
                            from.x, from.y,
                            to.x, to.y,
                            node.data.x, node.data.y
                        )
    
                        if (!closest || dist < minDist) {
                            closest = link
                            minDist = dist
                        }
                    })
    
                    this.createRoom(
                        node,
                        this.graph.getNode( closest.fromId ),
                        this.graph.getNode( closest.toId   )
                    )
                }
    
                if ("link" in event) {
                    let link = this.portals.getLink(
                        event.link.fromId,
                        event.link.toId
                    )

                    if ( link ) {
                        if ( link.data.rooms.length == 2 ) {
                            this.rooms.removeLink( this.rooms.getLink(
                                link.data.rooms[0].id,
                                link.data.rooms[1].id
                            ) )
                        }
                    } else {
                        this.addSplitLink(event.link)
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

    addSplitLink(link) {
        let merge = []
        
        for (let room of this.graph.getNode(link.toId).data.rooms) {
            let nodes = []
    
            if ( room.p1.id != link.toId ) { nodes.push(room.p1) }
            if ( room.p2.id != link.toId ) { nodes.push(room.p2) }
            if ( room.p3.id != link.toId ) { nodes.push(room.p3) }
    
            if ( intersect(
                this.graph.getNode( link.fromId ).data,
                this.graph.getNode( link.toId   ).data,
                nodes[0].data,
                nodes[1].data,
            ) ) {
                merge.push(room)
                merge.push(
                    ...this.portals.getLink(nodes[0].id, nodes[1].id)
                    .data.rooms.filter(item => item != room)
                )
            }
        }
    
        let left = []
    
        let right = []
    
        for (let room of merge) {
            for (let p of [room.p1, room.p2, room.p3]) {
                if (p.id !== link.toId || p.id !== link.fromId) {
                    let x0 = this.graph.getNode( link.toId   ).data.x
                    let y0 = this.graph.getNode( link.toId   ).data.y
                    let x1 = this.graph.getNode( link.fromId ).data.x
                    let y1 = this.graph.getNode( link.fromId ).data.y
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
}