import * as PIXI from "pixi.js"
import GraphSprite from "./GraphSprite"
import NavMesh from "./NavMesh"
import { Vec } from "./utils"

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight
})

document.body.appendChild(app.view)

const innerWidth = window.innerWidth
const innerHeight = window.innerHeight

let navMesh = new NavMesh()

let navSprite = GraphSprite(navMesh, {})
app.stage.addChild(navSprite)

navMesh.makeShell([
    new Vec(0         , 0          ),
    new Vec(innerWidth, 0          ),
    new Vec(innerWidth, innerHeight),
    new Vec(0         , innerHeight)
])

// add content

let t1 = navMesh.addNode(new Vec(300, 300))
let t2 = navMesh.addNode(new Vec(300, 500))
let t3 = navMesh.addNode(new Vec(500, 300))

navMesh.addEdge(t1, t2)
navMesh.addEdge(t1, t3)

// let n1 = navMesh.addNode(800, 800, "n1")
// let n2 = navMesh.addNode(800, 600, "n2")
// let n3 = navMesh.addNode(600, 800, "n3")

// navMesh.addEdge(n1, n2, {})
// navMesh.addEdge(n1, n3, {})