module.exports = class Vector {
    constructor({x, y}) {
        this.x = x
        this.y = y
    }

    setX(x) {
        this.x = x
    }

    setY(y) {
        this.y = y
    }

    //

    rotate({angle, source}) {
        let ox = source && source.x || 0
        let oy = source && source.y || 0

        let x = this.x - ox
        let y = this.y - oy

        let cos = Math.cos(angle)
        let sin = Math.sin(angle)

        return new Vector({
            x: x * cos - y * sin + ox,
            y: y * cos + x * sin + oy
        })
    }

    add(vector) {
        return new Vector({
            x: this.x + vector.x,
            y: this.y + vector.y
        })
    }

    sub(vector) {
        return new Vector({
            x: this.x - vector.x,
            y: this.y - vector.y
        })
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y
    }

    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }

    normalize() {
        var m = this.mag()
        return this.div(m)
    }

    mul(s) {
        return new Vector({
            x: this.x * s,
            y: this.y * s
        })
    }

    div(s) {
        return new Vector({
            x: this.x / s,
            y: this.y / s
        })
    }
}