const Graph  = require("struk.graph")
const earcut = require("earcut")

module.exports = class NavMesh {
    constructor(shape, options) {
        // get the number of points in the shell
        let shapeSize = shape.length

        // the shell needs to be a polygone, so at least 3 points
        if (shapeSize < 3) {
            return false
        }

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

        // Create nodes for outside edge
        let nodes = shape.map(pos => this.setUpNode(pos))

        // turn the shell into polygones
        this.polygoneToRooms(nodes)

        // Make the sides unwalkable
        for (let i = 0; i < shapeSize; i++) {
            this.addEdge( nodes[i], nodes[(i + 1) % shapeSize] )
        }
    }

    // PRIVATE API //

    // set up //

    setUpNode({x, y}) {
        let node = this.portals.addNode()

        node.x = x
        node.y = y

        node.rooms = []

        return node
    }

    setUpEdge(from, to) {
        let edge = this.portals.addEdge(from, to)



        return edge
    }

    // generators //

    addRoom(points) {
        
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
            nodes[i + 0]
            nodes[i + 1]
            nodes[i + 2]
        }
    }
}