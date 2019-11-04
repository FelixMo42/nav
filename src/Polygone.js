const PIXI   = require("pixi.js")
const Point  = require("./Point")
const Vector = require("./struc/Vector")

module.exports = class extends PIXI.Graphics {
    constructor({
        position,
        points=3,
        radius=50,
        angle=0
    }) {
        super()

        this.poly = []
        this.points = []
        for (let i = 0; i < points; i++) {
            let point = new Point({
                position:
                    new Vector({x: 0, y: radius})
                    .add(position)
                    .rotate({
                        angle: (2 * Math.PI / points * i) + angle,
                        source: position
                    }),
                onPickedUp: () => {

                },
                onPutDown: (point) => {
                    this.poly[2 * i] = point.x
                    this.poly[2 * i + 1] = point.y

                    this.points[i] = new Vector(point)

                    this.clear()
                    this.lineStyle(6, 0x008800)
                    this.drawPolygon( this.poly )
                }
            })

            this.addChild( point )
        }

        // this.position = position

        // this.drawPolygon( this.poly )
    }
}