import earcut from "earcut"
import { Event, fire, forEachCirc, Graph, orientation, Vec, intersect } from "./utils"

export default class NavMesh {
    rooms = new Graph()
    edges = new Graph()

    addNodeEvent = Event()
    addEdgeEvent = Event()
    addRoomEvent = Event()

    updateNodeEvent = Event()
    updateEdgeEvent = Event()
    updateRoomEvent = Event()

    removeNodeEvent = Event()
    removeEdgeEvent = Event()
    removeRoomEvent = Event()

    makeShell(shell: Vec[]) {
        // get the number of points in the shell
        const shapeSize = shell.length

        // the shell needs to be a polygone, so at least 3 points
        if (shapeSize < 3) return false

        // Create nodes for outside edge
        const nodes = shell.map(pos => this.setUpNode(pos))

        // turn the shell into polygones
        this.polygoneToRooms(nodes)

        // Make the sides unwalkable
        // for (let i = 0; i < shapeSize; i++) {
        //     this.addEdge( nodes[i], nodes[(i + 1) % shapeSize] )
        // }

        // return the nodes
        return nodes
    }

    addNode(position: Vec) {
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

    addEdge(from: Vec, to: Vec) {
        //TODO: make sure edge is wall

        // If the edge all ready exist then were good, just return that
        const edge = this.edges.getEdge(from, to)
        if (edge) return edge

        // Keep track of the nodes on both side of the line tand he rooms we visite
        const left  = new Set([from, to])
        const right = new Set([from, to])
        const rooms = []

        const addRoomNodes = (room) => {
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
            for (let edge of room.paths) {
                // we came from this edge, dont cheack it again
                if (edge === source) { continue }

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

            // our mission was a failur, reedge that back
            return false
        }

        // figure out what conected room the line goes throught or if
        // they are in the same room. Then recusivly get all the rooms.
        for (let room of from.rooms) {
            for (let edge of room.paths) {
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
        edge = this.setUpEdge(from, to)

        // turn the two sides into rooms
        this.polygoneToRooms( [...left]  )
        this.polygoneToRooms( [...right] )

        // return the edge
        return edge
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
        const node = this.edges.addNode()

        node.toString = () => `(${x},${y}#${node.data})`
        node.rooms = []
        node.x = x
        node.y = y

        // fire the relevant event
        fire(this.addNodeEvent, node)

        // return the node
        return node
    }

    setUpEdge(from, to) {
        for (let room of this.rooms.allNodes()) {
            for (let edge of room.paths) {
                if (edge.nodes[0] !== from && edge.nodes[1] !== from) {
                    continue
                }
                if (edge.nodes[0] !== to && edge.nodes[1] !== to) {
                    continue
                }
            }
        }

        let edge = this.edges.addEdge(from, to, uid); uid++
        edge.toString = () => `[${from} -> ${to}]#${edge.data}`
        edge.rooms = []

        // fire the relevant event
        fire(this.addEdgeEvent, edge)

        // return the edge
        return edge
    }

    // room //

    addRoom(nodes) {
        // create room node in graph
        let room = this.rooms.addNode()
        nodes.toString = () => ",".join( nodes )
        room.nodes = nodes
        room.paths = []

        // add room to all the nodes
        nodes.forEach(node => node.rooms.push(room))

        // get the rooms edges
        for (let [from, to] of forEachCirc(nodes) ) {
            // get edge bettween endpoints
            let edge = this.edges.getEdge(from, to)

            // create the edge if it doesent exist
            if (!edge) {
                edge = this.setUpEdge(from, to)
            }

            // update the refrences
            edge.rooms.push(room)
            room.paths.push(edge)
        }

        // calculate the center of mass
        room.x = nodes.reduce((x, node) => x + node.x, 0) / nodes.length
        room.y = nodes.reduce((y, node) => y + node.y, 0) / nodes.length

        // fire the relevant event
        fire(this.addRoomEvent, room)

        // return the room
        return room
    }

    removeRoom(room) {
        // remove room from nodes refrences
        for (let node of room.nodes) {
            node.rooms = node.rooms.filter( item => item != room )
        }

        // remove room from edges refrences
        for (let edge of room.paths) {
            edge.rooms = edge.rooms.filter( item => item != room )

            // if the edge isnt connected to any rooms remove it
            if (edge.rooms.length == 0) {
                this.edges.removeEdge(edge)

                // fire the relevant event
                fire(this.removeEdgeEvent, edge)
            }
        }

        // remove room from rooms graph
        this.rooms.removeNode(room)

        // fire the relevant event
        fire(this.removeRoomEvent, room)

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
