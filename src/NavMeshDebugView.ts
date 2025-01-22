import * as PIXI from "pixi.js"
import { midpoint, on, Vec } from "./utils"
import NavMesh from "./NavMesh"

export default function NavMeshDebugView(navMesh: NavMesh) {
    const stage = new PIXI.Container()

    on(navMesh.addEdgeEvent, ([a, b]) => {
        stage.addChild(new PIXI.Graphics({ alpha: 0.25 }))
            .moveTo(a.x, a.y)
            .lineTo(b.x, b.y)
            .stroke({
                color: "blue",
                width: 10,
            })
    })

    on(navMesh.addZoneEvent, (zone) => {
        stage.addChild(new PIXI.Graphics())
            .poly(zone.flatMap(vec => [vec.x, vec.y]))
            .stroke({
                color: 0x666666,
                pixelLine: true,
            })
        
        const point = midpoint(zone)
        stage.addChild(new PIXI.Graphics())
            .circle(point.x, point.y, 5)
            .fill(0x666666)
    })

    return stage
}
