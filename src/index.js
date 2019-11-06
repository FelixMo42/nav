"use strict"

const PIXI        = require("pixi.js")
const Path        = require('ngraph.path')
const Graph       = require('./ngraph.graph')
const GraphSprite = require('./GraphSprite')
const NavMesh     = require('./NavMesh')
const _           = require('lodash')

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight
})
document.body.appendChild(app.view)

let graph = Graph()

let graphSprite = GraphSprite(graph, {
    nodeDraggable: true
})
app.stage.addChild(graphSprite)

let navMesh = new NavMesh(graph)

let navMeshPortalsSprite = GraphSprite(navMesh.portals, {
    renderNodes: false,
    linkColor: 0x000088,
    linkWidth: 4
})
app.stage.addChild(navMeshPortalsSprite)

let navMeshRoomsSprite = GraphSprite(navMesh.rooms, {
    nodeColor: 0x000088,
    linkColor: 0x000088
})
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

let topright    = addNode(innerWidth, 0, "tr")
let topleft     = addNode(0,0,"tl")
let bottomright = addNode(innerWidth, innerHeight,"br")
let bottomleft  = addNode(0, innerHeight,"bl")

graph.addLink(topright   , topleft     , {})
graph.addLink(topright   , bottomright , {})
graph.addLink(bottomleft , bottomright , {})
graph.addLink(bottomleft , topleft     , {})

let t1 = addNode(100, 100, "t1")
let t2 = addNode(200, 100, "t2")
let t3 = addNode(100, 200, "t3")

graph.addLink(t1, t2, {})
graph.addLink(t1, t3, {})
