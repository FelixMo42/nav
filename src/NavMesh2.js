const Graph  = require("struk.graph")
const earcut = require("earcut")
const Event  = require("./EventMonger")

let uid = 0

function *forEachCirc(array) {
    let length = array.length
    for (let i = 0; i < length; i++) {
        yield [
            array[i],
            array[ (i + 1) % length ]
        ]
    }
}

function area(p1, p2, p3) {
    return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2.0) 
}

function orientation(p1, p2, p3) {
    let dir = (p2.y - p1.y) * (p3.x - p2.x) - (p2.x - p1.x) * (p3.y - p2.y)

    if (dir == 0) { return 0 }

    return (dir > 0) ? 1 : -1
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

function contains(p1, p2, p3, p) {
    // Calculate area of full triangle ABC
    let A = area(p1, p2, p3) 
  
    // Calculate area of partal triangle PBC  
    let A1 = area(p, p2, p3) 
    
    // Calculate area of partal triangle APC  
    let A2 = area(p1, p, p3) 
    
    // Calculate area of partal triangle ABP  
    let A3 = area(p1, p2, p)

    // do the area add up to the same thing?
    return A == A1 + A2 + A3
}

module.exports = class NavMesh {
    constructor(options) {
        // store the options
        this.options = options

        // create the needed graphs
        this.rooms   = new Graph({trackNodes: true})
        this.portals = new Graph({trackNodes: true})

        // create events for the NavMesh
        this.addNodeEvent = Event.newEvent()
        this.addEdgeEvent = Event.newEvent()
        this.addPortEvent = Event.newEvent()
        this.addRoomEvent = Event.newEvent()

        this.removeNodeEvent = Event.newEvent()
        this.removeEdgeEvent = Event.newEvent()
        this.removePortEvent = Event.newEvent()
        this.removeRoomEvent = Event.newEvent()
    }

    makeShell(shell) {
        // get the number of points in the shell
        let shapeSize = shell.length

        // the shell needs to be a polygone, so at least 3 points
        if (shapeSize < 3) {
            return false
        }

        // Create nodes for outside edge
        let nodes = shell.map(pos => this.setUpNode(pos))

        // turn the shell into polygones
        this.polygoneToRooms(nodes)

        // Make the sides unwalkable
        // for (let i = 0; i < shapeSize; i++) {
        //     this.addEdge( nodes[i], nodes[(i + 1) % shapeSize] )
        // }

        // return the nodes
        return nodes
    }

    addNode(position) {
        // create the node
        let node = this.setUpNode(position)

        // get the room containing the position
        let room = this.getRoomContaining(position)

        // remove the old room
        this.removeRoom(room)

        // split the room into parts and the new rooms
        for (let [node1, node2] of forEachCirc(room.nodes)) {
            this.addRoom([node1, node2, node])
        }

        // return the node
        return node
    }

    addEdge(from, to) {
        // if the edge all ready exist then were good, just return that
        let edge = this.portals.getEdge(from, to)
        if ( edge ) {
            return edge
        }

        // keep track of the nodes on both side of the line and
        // the rooms we visite
        let left  = new Set([from, to])
        let right = new Set([from, to])
        let rooms = []


        let addRoomNodes = (room) => {
            rooms.push(room)

            for (let node of room.nodes) {
                if (orientation(from, to, node) > 0) {
                    left.add( node )
                } else {
                    right.add( node )
                }
            }
        }

        let procRoom = (room, source) => {
            // look throught all the edges in the room
            for (let edge of room.portals) {
                // we came from this edge, dont cheack it again
                if (edge == source) { continue }

                // weve reached are destination!
                if (edge.nodes[0] == to) {
                    addRoomNodes(room)
                    return true
                }

                // do we cross a line
                if ( intersect(...edge.nodes, from, to) ) {
                    let nextRoom =
                        edge.rooms[0] === room ?
                            edge.rooms[1] :
                            edge.rooms[0]

                    addRoomNodes(nextRoom)
                        
                    return procRoom(nextRoom, edge)
                }
            }

            // our mission was a failer, report that back
            return false
        }

        // figure out what conected room the line goes throught or if
        // they are in the same room. Then recusivly get all the rooms.
        for (let room of from.rooms) {
            for (let edge of room.portals) {
                // The target node is in the same room as the origin
                if (edge.nodes[0] == to) {
                    addRoomNodes(room)
                    break
                }

                // skip it if edge leads to origin node
                if (edge.nodes[0] == from || edge.nodes[1] == from) {
                    continue
                }

                // do we cross a line
                if ( intersect(...edge.nodes, from, to) ) {
                    let nextRoom =
                        edge.rooms[0] === room ?
                            edge.rooms[1] :
                            edge.rooms[0]

                    addRoomNodes(room)    
                    procRoom(nextRoom, edge)
                }
            }
        }

        // delete all the rooms we go throught
        for (let room of rooms) {
            this.removeRoom( room )
        }

        // Its safe, we can create the edge
        edge = this.setUpPortal(from, to)

        // turn the two sides into rooms
        this.polygoneToRooms( [...left]  )
        this.polygoneToRooms( [...right] )

        // return the edge
        return edge
    }

    *perimeter(room) {
        for (let endPoints of forEachCirc(room.nodes)) {
            yield this.portals.getEdge(...endPoints)
        }
    }

    // get it //

    getRoomContaining(position) {
        for (let room of this.rooms.allNodes()) {
            if ( contains(...room.nodes, position) ) {
                return room
            }
        }
    }

    /////////////////
    // PRIVATE API //
    /////////////////

    // set up //

    setUpNode({x, y}) {
        let node = this.portals.addNode(uid); uid++
        node.toString = () => `(${x},${y}#${node.data})`
        node.rooms = []
        node.x = x
        node.y = y

        // fire the relevant event
        Event.fire(this.addNodeEvent, node)

        // return the node
        return node
    }

    setUpPortal(from, to) {
        for (let room of this.rooms.allNodes()) {
            for (let edge of room.portals) {
                if (edge.nodes[0] !== from && edge.nodes[1] !== from) {
                    continue
                }
                if (edge.nodes[0] !== to && edge.nodes[1] !== to) {
                    continue
                }
            }
        }

        let edge = this.portals.addEdge(from, to, uid); uid++
        edge.toString = () => `[${from} -> ${to}]#${edge.data}`
        edge.rooms = []

        // fire the relevant event
        Event.fire(this.addPortEvent, edge)

        // return the edge
        return edge
    }

    // room //

    addRoom(nodes) {
        // create room node in graph
        let room = this.rooms.addNode(uid); uid++
        nodes.toString = () => ",".join( nodes )
        room.nodes = nodes
        room.portals = []

        // add room to all the nodes
        nodes.forEach(node => node.rooms.push(room))

        // get the rooms edges
        for (let [from, to] of forEachCirc(nodes) ) {
            // get edge bettween endpoints
            let edge = this.portals.getEdge(from, to)

            // create the edge if it doesent exist
            if (!edge) {
                edge = this.setUpPortal(from, to)
            }

            // update the refrences
            edge.rooms.push(room)
            room.portals.push(edge)
        }

        // calculate the center of mass
        room.x = nodes.reduce((x, node) => x + node.x, 0) / nodes.length
        room.y = nodes.reduce((y, node) => y + node.y, 0) / nodes.length

        // fire the relevant event
        Event.fire(this.addRoomEvent, room)

        // return the room
        return room
    }

    removeRoom(room) {
        // remove room from nodes refrences
        for (let node of room.nodes) {
            node.rooms = node.rooms.filter( item => item != room )
        }

        // remove room from edges refrences
        for (let edge of room.portals) {
            edge.rooms = edge.rooms.filter( item => item != room )

            // if the edge isnt connected to any rooms remove it
            if (edge.rooms.length == 0) {
                this.portals.removeEdge(edge)

                // fire the relevant event
                Event.fire(this.removePortEvent, edge)
            }
        }

        // remove room from rooms graph
        this.rooms.removeNode(room)

        // fire the relevant event
        Event.fire(this.removeRoomEvent, room)

        // return the room
        return room
    }

    polygoneToRooms(nodes) {
        // make a earcut compatible list of positions
        let positions = []
        for (let {x, y} of nodes) {
            positions.push(x)
            positions.push(y)
        }

        // use earcut for polygon triangulation
        let triangles = earcut(positions)

        // turn triangles into rooms
        for (let i = 0; i < triangles.length; i += 3) {
            this.addRoom([
                nodes[ triangles[i + 0] ],
                nodes[ triangles[i + 1] ],
                nodes[ triangles[i + 2] ]
            ])
        }
    }
}