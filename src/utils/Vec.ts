export class Vec {
    x: number
    y: number

    constructor(x: number , y: number) {
        this.x = x
        this.y = y
    }

    rotate({ angle, source }) {
        let ox = source && source.x || 0
        let oy = source && source.y || 0

        let x = this.x - ox
        let y = this.y - oy

        let cos = Math.cos(angle)
        let sin = Math.sin(angle)

        return new Vec(
            x * cos - y * sin + ox,
            y * cos + x * sin + oy
        )
    }

    add(vec: Vec) {
        return new Vec(this.x + vec.x, this.y + vec.y)
    }

    sub(vec: Vec) {
        return new Vec(this.x - vec.x, this.y - vec.y)
    }

    dot(vec: Vec) {
        return this.x * vec.x + this.y * vec.y
    }

    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }

    normalize() {
        var m = this.mag()
        return this.div(m)
    }

    distance(b: Vec) {
        return Math.floor((this.x - b.x) ** 2 + (this.y - b.y) ** 2)
    }

    mul(c: number) {
        return new Vec(this.x * c, this.y * c)
    }

    div(c: number) {
        return new Vec(this.x / c, this.y / c)
    }

    /**
     * Get the mid point between two vectors
     */
    mid(b: Vec) {
        return new Vec(
            (this.x + b.x) / 2,
            (this.y + b.y) / 2,
        )
    }

    sort(b: Vec): [Vec, Vec] {
        if (this.x > b.x) return [this, b]
        if (this.x < b.x) return [b, this]
        if (this.y > b.y) return [this, b]
        if (this.y < b.y) return [b, this]
        return [this, b]
    }

    toString() {
        return `(${this.x},${this.y})`
    }
}
