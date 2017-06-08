export class Context {
    constructor() {
        this._array = []
    }

    push(obj) {
        this._array.push(obj)
    }

    pop() {
        return this._array.pop()
    }

    get current() {
        if (this._array.length > 0) {
            return this._array[this._array.length - 1]
        }
    }

    get root() {
        if (this._array.length > 0) {
            return this._array[0]
        }
    }

    getParent(depth = 1) {
        if (this._array.length - depth > 0) {
            return this._array[this._array.length - 1 - depth]
        }
    }

    get length() {
        return this._array.length
    }
}