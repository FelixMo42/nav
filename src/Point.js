const PIXI = require("pixi.js")

module.exports = class extends PIXI.Graphics {
    constructor({
        position,
        radius=10,
        color=0xffffff,
        onPickedUp=()=>{},
        onPutDown=()=>{}
    }) {
        super() 

        this.beginFill(color)
        this.drawCircle(0, 0, radius)
        this.endFill()
        
        this.hitArea = new PIXI.Circle(0, 0, radius)
        this.buttonMode = true
        this.interactive = true

        this
            // events for drag start
            .on('mousedown', this.onDragStart)
            .on('touchstart', this.onDragStart)
            // events for drag end
            .on('mouseup', this.onDragEnd)
            .on('mouseupoutside', this.onDragEnd)
            .on('touchend', this.onDragEnd)
            .on('touchendoutside', this.onDragEnd)
            // events for drag move
            .on('mousemove', this.onDragMove)
            .on('touchmove', this.onDragMove)

        this.position = position

        this.onPickedUp = onPickedUp
        this.onPutDown = onPutDown

        this.onPutDown(this)
    }

    onDragStart(event) {
        this.alpha = 0.5
        this.dragging = true
        this.dragData = event.data

        this.onPickedUp(this)
    }

    onDragEnd() {
        this.alpha = 1
        this.dragging = false
        this.dragData = null

        this.onPutDown(this)
    }

    onDragMove() {
        if (this.dragging) {
            var newPosition = this.dragData.getLocalPosition(this.parent)

            this.x = newPosition.x
            this.y = newPosition.y
        }
    }
}