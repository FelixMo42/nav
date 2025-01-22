import * as PIXI from "pixi.js"
import NavMeshDebugView from "./NavMeshDebugView"
import { Vec } from "./utils"
import NavMesh from "./NavMesh"

async function main() {
    const app = new PIXI.Application()
    await app.init({ resizeTo: window })
    document.body.appendChild(app.canvas)

    const nav = new NavMesh()
    app.stage.addChild(NavMeshDebugView(nav))

    nav.setBounds(new Vec(window.innerWidth, window.innerHeight))
    
    const cubes = [
        [100, 100],
        [120, 420],
        [440, 440],
        [460, 160],
    ]

    cubes.forEach(cube => {
        nav.add([
            new Vec(cube[0], cube[1]),
            new Vec(cube[0], cube[1] + 200),
            new Vec(cube[0] + 200, cube[1] + 200),
            new Vec(cube[0] + 200, cube[1]),
        ])
    })
    
    nav.compute()
}

function overlaps(a: [number, number]) {
    return (b: [number, number]) => {
        return (
            a[0] < b[0] && b[0] < a[0] + 200 &&
            a[1] < b[1] && b[1] < a[1] + 200
        )
    }
}

main()
