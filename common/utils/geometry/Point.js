export class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  clone() {
    return new Point(this.x, this.y)
  }

  equals(x, y) {
    return this.x === x && this.y === y
  }

  map(f) {
    this.x = f.call(this, this.x)
    this.y = f.call(this, this.y)
    return this
  }

  add(x, y) {
    this.x += x
    this.y += y
    return this
  }

  subtract(x, y) {
    this.x -= x
    this.y -= y
    return this
  }

  scale(s) {
    this.x *= s
    this.y *= s
    return this
  }

  isZero() {
    return this.x === 0 && this.y === 0
  }

  toString() {
    return '(' + this.x + ',' + this.y + ')'
  }
}
export default Point
