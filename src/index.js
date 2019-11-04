const PIXI      = require("pixi.js")
const Graph     = require('ngraph.graph')
const Path      = require('ngraph.path')
const GraphSprite = require('./GraphSprite')
const Vector    = require('./struc/Vector')

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight
})
document.body.appendChild(app.view)

let graph = Graph()

let graphSprite = GraphSprite(graph, {
    nodeDraggable: false
})
app.stage.addChild(graphSprite)

// triangulation

let rooms = []



function area(x1, y1, x2, y2, x3, y3) {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0) 
}

function center(x1, y1, x2, y2, x3, y3) {
    return [
        (x1 + x2 + x3) / 3,
        (y1 + y2 + y3) / 3,
    ]
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

class Room {
    constructor(p1, p2, p3) {
        this.sprite = new PIXI.Graphics()

        portals.addNode(p1.id, p1.data)
        portals.addNode(p2.id, p2.data)
        portals.addNode(p3.id, p3.data)

        portals.addLink(p1.id, p2.id, {})
        portals.addLink(p3.id, p2.id, {})
        portals.addLink(p3.id, p1.id, {})
        
        this.sprite.beginFill(0x000099)
        this.sprite.drawCircle(...center(
            p1.data.x , p1.data.y,
            p2.data.x , p2.data.y,
            p3.data.x , p3.data.y
        ), 6)
        this.sprite.endFill()

        app.stage.addChild(this.sprite)

        this.p1 = p1
        this.p2 = p2
        this.p3 = p3
    }

    clear() {
        this.sprite.clear()
        this.sprite.render()
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

    split(point) {
        rooms.push(
            new Room(this.p1, this.p2, point)
        )
        rooms.push(
            new Room(this.p1, this.p3, point)
        )
        rooms.push(
            new Room(this.p2, this.p3, point)
        )
    }
}

let portals = Graph()
let portalsSprite = GraphSprite(portals, {
    renderNodes: false,
    linkColor: 0x0000ff,
    linkWidth: 4
})
app.stage.addChild(portalsSprite)

graph.on("changed", (events) => {
    for (let event of events) {
        if (event.changeType == "add") {
            if ("node" in event) {
                if (rooms.length == 0) {
                    if (graph.getNodesCount() >= 3) {
                        let nodes = []
                        graph.forEachNode(function (node) {
                            nodes.push(node)
                            return nodes.length == 3
                        })
                        rooms.push( new Room(...nodes) )
                    }
                    return
                }


                for (let i = 0; i < rooms.length; i++) {
                    let room = rooms[i]
                    if (room.contains(event.node.data.x, event.node.data.y)) {
                        room.split(event.node)

                        room.clear()
                        rooms.splice(i,1)
                        i--
                        return
                    }
                }

                let closest = false
                let minDist = 0
                portals.forEachLink((link) => {
                    let from = graph.getNode(link.fromId).data
                    let to   = graph.getNode(link.toId  ).data

                    dist = distToLine(
                        from.x, from.y,
                        to.x, to.y,
                        event.node.data.x, event.node.data.y
                    )

                    if (!closest || dist < minDist) {
                        closest = link
                        minDist = dist
                    }
                })

                rooms.push(
                    new Room(
                        event.node,
                        graph.getNode(closest.fromId),
                        graph.getNode(closest.toId  )
                    )
                )
            }
        }
    }
})

// add content

let uid = 0
function addNode(x, y) {
    let data = {x: x, y: y}
    let sym = uid
    uid++

    graph.addNode(sym, data)

    return sym
}

let topright    = addNode(0, 0)
let topleft     = addNode(innerWidth,0)
let bottomright = addNode(0, innerHeight)
let bottomleft  = addNode(innerWidth, innerHeight)

graph.addLink(topright, topleft, {})
graph.addLink(topright, bottomright, {})
graph.addLink(bottomleft, bottomright, {})
graph.addLink(bottomleft, topleft, {})

let t1 = addNode(100,100)
let t2 = addNode(200,100)
let t3 = addNode(100,200)

graph.addLink(t1, t2, {})
graph.addLink(t1, t3, {})

graph.addLink(t1, bottomleft, {})