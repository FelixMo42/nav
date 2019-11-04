"use strict"

const PIXI        = require("pixi.js")
const Path        = require('ngraph.path')
const Graph       = require('./ngraph.graph')
const GraphSprite = require('./GraphSprite')
const Vector      = require('./struc/Vector')

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
    constructor(p1, p2, p3) {
        this.sprite = new PIXI.Graphics()

        this.setUpLink(p1, p2)
        this.setUpLink(p3, p2)
        this.setUpLink(p3, p1)
        
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

        p1.data.rooms.push( this )
        p2.data.rooms.push( this )
        p3.data.rooms.push( this )
    }

    setUpLink(a, b) {
        let link = portals.getLink(a.id, b.id)

        if (link) {
            link.data.rooms.push(this)
        } else {
            portals.addLink(a.id, b.id, {rooms: [this]})
        }

        // console.log( a.id, b.id )
        // console.log( portals.getLink(a.id, b.id).data.rooms )
    }

    clearLink(a, b) {
        let link = portals.getLink(a.id, b.id)
        link.data.rooms = link.data.rooms.filter( item => item != this )

        if (link.data.rooms.length == 0) {
            console.log(link)
            console.log( graph.removeLink(link) )
            console.log("123")
        }
    }

    clear() {
        this.p1.data.rooms = this.p1.data.rooms.filter( item => item != this )
        this.p2.data.rooms = this.p2.data.rooms.filter( item => item != this )
        this.p3.data.rooms = this.p3.data.rooms.filter( item => item != this )

        this.clearLink(this.p1, this.p2)
        this.clearLink(this.p3, this.p2)
        this.clearLink(this.p3, this.p1)

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

let portals = Graph({
    multigraph: false
})
let portalsSprite = GraphSprite(portals, {
    renderNodes: false,
    linkColor: 0x0000ff,
    linkWidth: 4
})
app.stage.addChild(portalsSprite)

function roomMerge(link) {
    let rooms = []
    
    for (let room of graph.getNode(link.toId).data.rooms) {
        let nodes = []

        if ( room.p1.id != link.toId ) { nodes.push(room.p1) }
        if ( room.p2.id != link.toId ) { nodes.push(room.p2) }
        if ( room.p3.id != link.toId ) { nodes.push(room.p3) }

        if ( intersect(
            graph.getNode(link.fromId).data,
            graph.getNode(link.toId).data,
            nodes[0].data,
            nodes[1].data,
        ) ) {
            rooms.push(room)
            rooms.push(
                ...portals.getLink(nodes[0].id, nodes[1].id)
                .data.rooms.filter(item => item != room)
            )
        }
    }

    for (let room of rooms) {
        room.clear()
    }

    console.log(rooms)
}

graph.on("changed", (events) => {
    (() => {
    for (let event of events) {
        if (event.changeType == "add") {
            if ("node" in event) {
                portals.addNode(event.node.id, event.node.data)

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

                    let dist = distToLine(
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

            if ("link" in event) {
                for (let roomA of graph.getNode(event.link.fromId).data.rooms) {
                    for (let roomB of graph.getNode(event.link.toId).data.rooms) {
                        if (roomA == roomB) {
                            return
                        }
                    }
                }

                roomMerge(event.link)
            }
        }
    }
    })()
})

// add content

let uid = 0
function addNode(x, y, id) {
    let data = {x: x, y: y, rooms: []}
    let sym = id || uid
    uid++

    graph.addNode(sym, data)

    return sym
}

let topright    = addNode(innerWidth, 0, "tr")
let topleft     = addNode(0,0,"tl")
let bottomright = addNode(innerWidth, innerHeight,"br")
let bottomleft  = addNode(0, innerHeight,"bl")

graph.addLink(topright, topleft, {})
graph.addLink(topright, bottomright, {})
graph.addLink(bottomleft, bottomright, {})
graph.addLink(bottomleft, topleft, {})

let t1 = addNode(100,100,"t1")
let t2 = addNode(200,100,"t2")
let t3 = addNode(100,200,"t3")

graph.addLink(t1, t2, {})
graph.addLink(t1, t3, {})

// graph.addLink(t1, bottomleft, {})
