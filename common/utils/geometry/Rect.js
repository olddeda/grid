import { Point } from './index'

export class Rect {
  constructor(x, y, w, h) {
    this.left = x
    this.top = y
    this.right = x + w
    this.bottom = y + h
  }

  static fromFrame(frame) {
    return new Rect(frame.left, frame.top, frame.width, frame.height)
  }

  static fromRect(rect) {
    return new Rect(rect.left, rect.top, rect.right, rect.bottom)
  }

  get frame() {
    return this.getFrame()
  }

  get x() {
    return this.left
  }

  get maxX() {
    return this.right
  }

  get maxY() {
    return this.bottom
  }

  get y() {
    return this.top
  }

  get width() {
    return this.right - this.left
  }

  get height() {
    return this.bottom - this.top
  }

  set x(v) {
    const diff = this.left - v
    this.left = v
    this.right -= diff
  }

  set y(v) {
    const diff = this.top - v
    this.top = v
    this.bottom -= diff
  }

  set width(v) {
    this.right = this.left + v
  }

  set height(v) {
    this.bottom = this.top + v
  }

  isEmpty() {
    return this.left >= this.right || this.top >= this.bottom
  }

  getFrame(unit = 'px') {
    return {
      top: this.top + unit,
      left: this.left + unit,
      width: this.width + unit,
      height: this.height + unit,
    }
  }

  setRect(x, y, w, h) {
    this.left = x
    this.top = y
    this.right = x + w
    this.bottom = y + h

    return this
  }

  setBounds(l, t, r, b) {
    this.top = t
    this.left = l
    this.bottom = b
    this.right = r

    return this
  }

  equals(other) {
    return (
      other != null &&
      ((this.isEmpty() && other.isEmpty()) ||
        (this.top === other.top &&
          this.left === other.left &&
          this.bottom === other.bottom &&
          this.right === other.right))
    )
  }

  clone() {
    return new Rect(
      this.left,
      this.top,
      this.right - this.left,
      this.bottom - this.top
    )
  }

  center() {
    if (this.isEmpty()) {
      throw new Error('Empty rectangles do not have centers')
    }
    return new Point(
      this.left + (this.right - this.left) / 2,
      this.top + (this.bottom - this.top) / 2
    )
  }

  copyFrom(other) {
    this.top = other.top
    this.left = other.left
    this.bottom = other.bottom
    this.right = other.right

    return this
  }

  translate(x, y) {
    this.left += x
    this.right += x
    this.top += y
    this.bottom += y

    return this
  }

  union(other) {
    return this.clone().expandToContain(other)
  }

  contains(other) {
    if (other.isEmpty()) {
      return true
    }
    if (this.isEmpty()) {
      return false
    }

    return (
      other.left >= this.left &&
      other.right <= this.right &&
      other.top >= this.top &&
      other.bottom <= this.bottom
    )
  }

  intersect(other) {
    return this.clone().restrictTo(other)
  }

  intersects(other) {
    if (this.isEmpty() || other.isEmpty()) {
      return false
    }

    const x1 = Math.max(this.left, other.left)
    const x2 = Math.min(this.right, other.right)
    const y1 = Math.max(this.top, other.top)
    const y2 = Math.min(this.bottom, other.bottom)
    return x1 < x2 && y1 < y2
  }

  restrictTo(other) {
    if (this.isEmpty() || other.isEmpty()) {
      return this.setRect(0, 0, 0, 0)
    }

    const x1 = Math.max(this.left, other.left)
    const x2 = Math.min(this.right, other.right)
    const y1 = Math.max(this.top, other.top)
    const y2 = Math.min(this.bottom, other.bottom)
    return this.setRect(x1, y1, Math.max(0, x2 - x1), Math.max(0, y2 - y1))
  }

  expandToContain(other) {
    if (this.isEmpty()) {
      return this.copyFrom(other)
    }
    if (other.isEmpty()) {
      return this
    }

    const l = Math.min(this.left, other.left)
    const r = Math.max(this.right, other.right)
    const t = Math.min(this.top, other.top)
    const b = Math.max(this.bottom, other.bottom)
    return this.setRect(l, t, r - l, b - t)
  }

  round() {
    this.left = Math.floor(this.left)
    this.top = Math.floor(this.top)
    this.right = Math.ceil(this.right)
    this.bottom = Math.ceil(this.bottom)
    return this
  }

  scale(xscl, yscl) {
    this.left *= xscl
    this.right *= xscl
    this.top *= yscl
    this.bottom *= yscl
    return this
  }

  map(f) {
    this.left = f.call(this, this.left)
    this.top = f.call(this, this.top)
    this.right = f.call(this, this.right)
    this.bottom = f.call(this, this.bottom)
    return this
  }

  ranslateInside(other) {
    let offsetX = 0
    if (this.left <= other.left) {
      offsetX = other.left - this.left
    } else if (this.right > other.right) {
      offsetX = other.right - this.right
    }

    let offsetY = 0
    if (this.top <= other.top) {
      offsetY = other.top - this.top
    } else if (this.bottom > other.bottom) {
      offsetY = other.bottom - this.bottom
    }

    return this.translate(offsetX, offsetY)
  }

  subtract(other) {
    const r = new Rect(0, 0, 0, 0)
    const result = []
    other = other.intersect(this)
    if (other.isEmpty()) {
      return [this.clone()]
    }

    r.setBounds(this.left, this.top, other.left, this.bottom)
    if (!r.isEmpty()) {
      result.push(r.clone())
    }

    r.setBounds(other.left, this.top, other.right, other.top)
    if (!r.isEmpty()) {
      result.push(r.clone())
    }
    r.setBounds(other.left, other.bottom, other.right, this.bottom)
    if (!r.isEmpty()) {
      result.push(r.clone())
    }

    r.setBounds(other.right, this.top, this.right, this.bottom)
    if (!r.isEmpty()) {
      result.push(r.clone())
    }

    return result
  }

  blend(rect, scalar) {
    return new Rect(
      this.left + (rect.left - this.left) * scalar,
      this.top + (rect.top - this.top) * scalar,
      this.width + (rect.width - this.width) * scalar,
      this.height + (rect.height - this.height) * scalar
    )
  }

  inflate(xscl, yscl) {
    const xAdj = (this.width * xscl - this.width) / 2
    const s = arguments.length > 1 ? yscl : xscl
    const yAdj = (this.height * s - this.height) / 2
    this.left -= xAdj
    this.right += xAdj
    this.top -= yAdj
    this.bottom += yAdj
    return this
  }

  inflateFixed(fixed) {
    this.left -= fixed
    this.right += fixed
    this.top -= fixed
    this.bottom += fixed
    return this
  }

  toString() {
    return (
      '[' + this.x + ',' + this.y + ',' + this.width + ',' + this.height + ']'
    )
  }
}

export default Rect
