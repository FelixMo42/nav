const Graph  = require("struk.graph")
const earcut = require("earcut")
const Event  = require("./EventMonger")

function forEachCirc(array, callback) {
    let length = array.length
    for (let i = 0; i < length; i++) {
        callback(
            array[i], array[ (i + 1) % length ]
        )
    }
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
    }

    // PRIVATE API //

    // set up //

    setUpNode({x, y}) {
        let node = this.portals.addNode()
        node.rooms = []
        node.x = x
        node.y = y

        // fire the related event
        Event.fire(this.addNodeEvent, node)

        return node
    }

    setUpPortal(from, to) {
        let edge = this.portals.addEdge(from, to)
        edge.rooms = []

        // fire the related event
        Event.fire(this.addPortEvent, edge)

        return edge
    }

    *circumference(nodes) {
        let numNodes = nodes.length
        for (let i = 0; i < numNodes; i++) {
            yield this.portals.getEdge(
                nodes[i], nodes[(i + 1) % numNodes]
            )
        }
    }

    // generators //

    addRoom(nodes) {
        // create room node in graph
        let room = this.rooms.addNode()
        room.nodes = nodes
        room.edges = []

        // add room to all the nodes
        nodes.forEach(node => node.rooms.push(room))

        // get the rooms edges
        forEachCirc(nodes, (from, to) => {
            let edge = this.portals.getEdge(from, to)

            // create the edge if it doesent exist
            if (!edge) {
                edge = this.setUpPortal(from, to)
            }

            // update the listings
            edge.rooms.push(room)
            room.edges.push(edge)
        })

        for (let edge of this.circumference(nodes)) {
            edge.rooms.push(room)
            room.edges.push(edge)
        }

        // fire the related event
        Event.fire(this.addRoomEvent, room)

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