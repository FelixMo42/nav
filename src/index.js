"use strict"

const PIXI        = require("pixi.js")
const GraphSprite = require("./GraphSprite")
const NavMesh     = require("./NavMesh2")
const Event       = require("./EventMonger")
// const _           = require("lodash")
// const Vector      = require("./struc/Vector")

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight
})
document.body.appendChild(app.view)

let innerWidth = window.innerWidth
let innerHeight = window.innerHeight

let navMesh = new NavMesh()

let navSprite = GraphSprite(navMesh)
app.stage.addChild(navSprite)

navMesh.makeShell([
    {x: 0         , y: 0          },
    {x: innerWidth, y: 0          },
    {x: innerWidth, y: innerHeight},
    {x: 0         , y: innerHeight}
])

// add content

let t1 = navMesh.addNode({x: 300, y: 300}, "t1")
let t2 = navMesh.addNode({x: 300, y: 500}, "t2")
let t3 = navMesh.addNode({x: 500, y: 300}, "t3")

// navMesh.addEdge(t1, t2, {})
// navMesh.addEdge(t1, t3, {})

// let n1 = navMesh.addNode(800, 800, "n1")
// let n2 = navMesh.addNode(800, 600, "n2")
// let n3 = navMesh.addNode(600, 800, "n3")

// navMesh.addEdge(n1, n2, {})
// navMesh.addEdge(n1, n3, {})

// add targets