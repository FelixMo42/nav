import * as PIXI from "pixi.js"
import { NavMesh } from "./NavMesh"

export default function NavMeshDebugView(navMesh: NavMesh) {
    const stage = new PIXI.Container()

    console.info(`Found ${navMesh.cells.size} navmesh cells`)

    navMesh.cells.forEach((cell, center) => {
        stage.addChild(new PIXI.Graphics())
            .poly(cell.flatMap(vec => [vec.x, vec.y]))
            .stroke({
                color: 0x666666,
                pixelLine: true,
            })

        stage.addChild(new PIXI.Graphics())
            .circle(center.x, center.y, 5)
            .fill(0x666666)

        // for (const path of navMesh.paths.get(center)) {
        //     stage.addChild(new PIXI.Graphics())
        //         .moveTo(center.x, center.y)
        //         .lineTo(path.x, path.y)
        //         .stroke({
        //             color: 0x666666,
        //             pixelLine: true,
        //         })
        // }
    })

    return stage
}
