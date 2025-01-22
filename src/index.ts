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
    
    nav.add([
        new Vec(200, 200),
        new Vec(200, 400),
        new Vec(400, 400),
        new Vec(400, 200),
    ])

    nav.add([
        new Vec(450, 450),
        new Vec(450, 650),
        new Vec(650, 650),
        new Vec(650, 450),
    ])

    nav.compute()
}

main()
