const PIXI   = require("pixi.js")
const Point  = require("./Point")
const Vector = require("./struc/Vector")

const TileSize = 50

class Tile {
    constructor({position,}) {
        this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        this.sprite.tint = 0x121212
        this.sprite.x = position.x
        this.sprite.y = position.y
        this.sprite.width = TileSize
        this.sprite.height = TileSize

        this.walkable = true


    }

    setWalkable(walkable) {
        this.walkable = walkable

        if (walkable) {
            this.sprite.tint = 0x121212
        } else {
            this.sprite.tint = 0x301212
        }
    }
}

module.exports = class {
    constructor({width, height}) {
        this.tiles = []

        this.sprite = new PIXI.Container()

        for (let x = 0; x < width; x+=TileSize) {
            let row = []
            this.tiles.push(row)
            for (let y = 0; y < height; y+=TileSize) {
                let tile = new Tile({
                    position: new Vector({x: x, y: y}),
                    color: 0x121212
                })

                row.push(tile)
                this.sprite.addChild(tile.sprite)
            }
        }
    }

    get({x, y}) {
        return this.tiles[ Math.floor(x / TileSize) ][ Math.floor(y / TileSize) ]
    }
}