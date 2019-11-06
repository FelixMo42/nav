"use strict"

const PIXI        = require("pixi.js")
const Path        = require('ngraph.path')
const Graph       = require('./ngraph.graph')
const GraphSprite = require('./GraphSprite')
const NavMesh     = require('./NavMesh')
const _           = require('lodash')
const Vector      = require('./struc/Vector')

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight
})
document.body.appendChild(app.view)

let graph = Graph()

let graphSprite = GraphSprite(graph, {
    nodeDraggable: true
})

let navMesh = new NavMesh(graph)

let navMeshPortalsSprite = GraphSprite(navMesh.portals, {
    renderNodes: false,
    linkColor: 0x000088,
    linkWidth: 4
})

let navMeshRoomsSprite = GraphSprite(navMesh.rooms, {
    nodeColor: 0x000088,
    linkColor: 0x000088
})

app.stage.addChild(graphSprite)
app.stage.addChild(navMeshPortalsSprite)
app.stage.addChild(navMeshRoomsSprite)

// add content

let uid = 0
function addNode(x, y, id) {
    let data = {x: x, y: y, rooms: []}
    let sym = id || uid
    uid++

    graph.addNode(sym, data)

    return sym
}

// add geometry to level

let topright    = addNode(innerWidth, 0, "tr")
let topleft     = addNode(0,0,"tl")
let bottomright = addNode(innerWidth, innerHeight,"br")
let bottomleft  = addNode(0, innerHeight,"bl")

graph.addLink(topright   , topleft     , {})
graph.addLink(topright   , bottomright , {})
graph.addLink(bottomleft , bottomright , {})
graph.addLink(bottomleft , topleft     , {})

let points = []

// let center = new Vector({x: innerWidth / 2, y: innerHeight / 2})
// let radius = innerWidth / 2 - 10
// for (let i = 0; i < 6; i++) {
//     let pos = new Vector({x: 0, y: radius}).rotate({
//         angle: 2 * Math.PI / 6 * i
//     } ).add( center )

//     console.log(pos, center)

//     points.push( addNode(pos.x, pos.y) )
// }


let t1 = addNode(300, 300, "t1")
let t2 = addNode(300, 500, "t2")
let t3 = addNode(500, 300, "t3")

graph.addLink(t1, t2, {})
graph.addLink(t1, t3, {})

let n1 = addNode(800, 800, "n1")
let n2 = addNode(800, 600, "n2")
let n3 = addNode(600, 800, "n3")

graph.addLink(n1, n2, {})
graph.addLink(n1, n3, {})

// add targets