import * as PIXI from "pixi.js"
import NavMeshDebugView from "./NavMeshDebugView"
import { Vec } from "./utils"
import NavMeshBuilder from "./NavMeshBuilder"

async function main() {
    // Init
    const app = new PIXI.Application()
    await app.init({ resizeTo: window })
    document.body.appendChild(app.canvas)

    // Build the nav mesh
    const nav = await loadNavMesh()
    app.stage.addChild(NavMeshDebugView(nav))

    // Pathfind!
    const path = nav.path(new Vec(120, 40), new Vec(700, 500))
    app.stage.addChild(showPath(path))
}

function showPath(path: Vec[]) {
    const g = new PIXI.Graphics()
        .moveTo(path[0].x, path[0].y)

    for (const p of path) {
        g.lineTo(p.x, p.y)
    }

    g.stroke({
        color: "blue",
        alpha: 0.5,
        width: 5
    })

    return g
}

async function loadNavMesh() {
    const builder = new NavMeshBuilder()

    builder.setBounds(new Vec(window.innerWidth, window.innerHeight))
    
    const cubes = [
        [100, 100],
        [120, 420],
        [440, 440],
        [460, 160],
    ]

    cubes.forEach(cube => {
        builder.add([
            new Vec(cube[0], cube[1]),
            new Vec(cube[0], cube[1] + 200),
            new Vec(cube[0] + 200, cube[1] + 200),
            new Vec(cube[0] + 200, cube[1]),
        ])
    })

    return builder.build()
}

main()
