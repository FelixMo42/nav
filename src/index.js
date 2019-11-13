"use strict"

// const PIXI        = require("pixi.js")
// const Path        = require('ngraph.path')
// const Graph       = require('ngraph.graph')
// const GraphSprite = require('./GraphSprite')
const NavMesh     = require('./NavMesh')
// const _           = require('lodash')
// const Vector      = require('./struc/Vector')

// const app = new PIXI.Application({
//     width: window.innerWidth,
//     height: window.innerHeight
// })
// document.body.appendChild(app.view)

// let graph = Graph({oriented: false})

// let graphSprite = GraphSprite(graph, {
//     nodeDraggable: true
// })

// let navMesh = new NavMesh(graph)

// let navMeshPortalsSprite = GraphSprite(navMesh.portals, {
//     renderNodes: false,
//     edgeColor: 0x000088,
//     edgeWidth: 4
// })

// let navMeshRoomsSprite = GraphSprite(navMesh.rooms, {
//     nodeColor: 0x000088,
//     edgeColor: 0x000088
// })

// app.stage.addChild(graphSprite)
// app.stage.addChild(navMeshPortalsSprite)
// app.stage.addChild(navMeshRoomsSprite)

// // add content

// function addNode(x, y, id) {
//     let data = {x: x, y: y, rooms: []}
//     let sym = id || data

//     graph.addNode(sym, data)

//     return sym
// }

let navMesh = new NavMesh()

// add geometry to level

let innerWidth = 1100
let innerHeight = 1100

let topright    = navMesh.addNode(innerWidth, 0, "tr")
let topleft     = navMesh.addNode(0,0,"tl")
let bottomright = navMesh.addNode(innerWidth, innerHeight,"br")
let bottomleft  = navMesh.addNode(0, innerHeight,"bl")

// graph.addEdge(topright   , topleft     , {})
// graph.addEdge(topright   , bottomright , {})
// graph.addEdge(bottomleft , bottomright , {})
// graph.addEdge(bottomleft , topleft     , {})

let t1 = navMesh.addNode(300, 300, "t1")
let t2 = navMesh.addNode(300, 500, "t2")
let t3 = navMesh.addNode(500, 300, "t3")

// graph.addEdge(t1, t2, {})
// graph.addEdge(t1, t3, {})

let n1 = navMesh.addNode(800, 800, "n1")
let n2 = navMesh.addNode(800, 600, "n2")
let n3 = navMesh.addNode(600, 800, "n3")

// graph.addEdge(n1, n2, {})
// graph.addEdge(n1, n3, {})

// add targets