import _ from 'lodash'
import os from 'os'

export class Container {

    constructor(args, kw) {

        this._keysOrder = []
        this._items = {}

        if (_.isArray(args)) {
            _.forEach(args, obj => {
                if (_.isObject(obj)) {
                    if (_.isObject(obj.items)) {
                        _.forEach(obj.items, (v, k) => {
                            this.setItem(k, v)
                        })
                    } else {
                        _.forEach(args, (v, k) => {
                            this.setItem(k, v)
                        })
                    }
                }
            })
        } else if (_.isObject(args)) {
            if (_.isObject(args.items)) {
                _.forEach(args.items, (v, k) => {
                    this.setItem(k, v)
                })
            } else {
                _.forEach(args, (v, k) => {
                    this.setItem(k, v)
                })
            }

            return
        }

        _.forEach(kw, (v, k) => {
            this.setItem(k, v)
        })
    }

    get keysOrder() {
        return this._keysOrder
    }

    set keysOrder(value) {
        this._keysOrder = value
    }

    setItem(key, value) {
        this._keysOrder.push(key)
        this._items[key] = value
    }

    delItem(key) {
        delete this._items[key]
        _.remove(this._keysOrder, n => n == key)
    }

    pyCall(kw) {
        _.forEach(kw, (v, k) => {
            this.setItem(k, v)
        })
        return this
    }

    clear() {
        this._keysOrder = []
        this._items = {}
    }

    pop(key, defaultValue) {
        let val = this._items[key] || defaultValue
        delete this._items[key]
        _.remove(this._keysOrder, n => n == key)
        return val
    }

    popItem() {
        key = this._keysOrder.pop()
        let value = this._items[key]
        delete this._items[key]
        return { key, value }
    }

    update(seqOrDict, kw) {
        if (_.isObject(seqOrDict)) {
            _.forEach(seqOrDict, (v, k) => {
                this._items[k] = v
            })
        }

        _.forEach(kw, (v, k) => {
            this._items[k] = v
        })
    }

    copy() {
        return new Container(this._items)
    }

    get length() {
        return this._keysOrder.length
    }

    get keys() {
        return this._keysOrder
    }

    get values() {
        return _.map(this._keysOrder, k => this._items[k])
    }

    get items() {
        return this._items
    }

    equals(container) {
        if (!_.isObject(container)) {
            return false
        }

        if (!(container instanceof Container)) {
            return false
        }

        if (this.length != container.length) {
            return false
        }

        let result = true;
        _.forEach(this._items, (v, k) => {
            if (!_.includes(container.keysOrder, k) || container.items[k] !== v) {
                result = false
            }
        })

        if (!result) return false

        _.forEach(container._items, (v, k) => {
            if (!_.includes(this._keysOrder, k) || this._items[k] !== v) {
                result = false
            }
        })

        if (!result) return false

        return true
    }

    _search(compiled_pattern, search_all) {
        let items = []
        for (let i = 0; i < this.length; i++) {
            let key = this._keysOrder[i]
            let item = this._items[key]
            if (item instanceof Container || item instanceof ListContainer) {
                let ret = item._search(compiled_pattern, search_all)
                if (!!ret) {
                    if (search_all) {
                        items.concat(ret)
                    } else {
                        return ret
                    }
                }
            } else if (key.match(compiled_pattern)) {
                if (search_all) {
                    items.push(item)
                } else {
                    return item
                }
            }
        }

        if (search_all) {
            return items
        } else {
            return null
        }
    }

    search(pattern) {
        if (pattern instanceof RegExp) {
            return this._search(pattern, false)
        }
        return this._search(new RegExp(pattern), false)
    }

    search_all(pattern) {
        if (pattern instanceof RegExp) {
            return this._search(pattern, true)
        }
        return this._search(new RegExp(pattern), true)
    }

    toString() {
        return '[Container Object]'
    }

    toSimpleString() {
        let result = this.toString() + ' '
        for (let i = 0; i < this.length; i++) {
            let key = this._keysOrder[i]
            let item = this._items[key]
            if (!_.startsWith(key, '_')) {
                result += `(${key}=${item})`
            }
        }
        return result
    }

    toRichString() {
        let result = this.toString() + ' ' + os.EOL
        for (let i = 0; i < this.length; i++) {
            let key = this._keysOrder[i]
            let item = this._items[key]
            if (!_.startsWith(key, '_')) {
                result += `\t${key} = `
                result += (_.isFunction(item.toRichString) ? item.toRichString() : item) + os.EOL
            }
        }
        return result
    }
}

export class FlagsContainer extends Container {
    toString() {
        return '[FlagsContainer Object]'
    }
}

export class ListContainer extends Array {
    toString() {
        return '[ListContainer Array]'
    }

    toSimpleString() {
        let result = this.toString() + ' '
        for (let i = 0; i < this.length; i++) {
            let item = this[i]
            if (i != this.length - 1) {
                result += `${item}, `
            } else {
                result += item
            }
        }
    }

    toRichString() {
        let result = this.toString() + ' ' + os.EOL
        for (let i = 0; i < this.length; i++) {
            let item = this[i]
            let str = (_.isFunction(item.toRichString) ? item.toRichString() : item)
            result += `${str}${os.EOL}`
        }
        return result
    }

    _search(compiled_pattern, search_all) {
        let items = []
        for (let i = 0; i < this.length; i++) {
            let ret = null
            let item = this[i]
            try {
                ret = item._search(compiled_pattern, search_all)
            } catch (e) {
                continue
            }

            if (ret !== null) {
                if (search_all) {
                    items.concat(ret)
                } else {
                    return ret
                }
            }
        }

        if (search_all) {
            return items
        } else {
            return null
        }
    }

    search(pattern) {
        if (pattern instanceof RegExp) {
            return this._search(pattern, false)
        }
        return this._search(new RegExp(pattern), false)
    }

    search_all(pattern) {
        if (pattern instanceof RegExp) {
            return this._search(pattern, true)
        }
        return this._search(new RegExp(pattern), true)
    }

    equals(otherListContainer) {
        // TODO:
    }
}

export class LazyRangeContainer extends ListContainer {
    constructor(subcon, subsize, count, stream, addoffset, context) {
        super()
        this._subcon = subcon
        this._subsize = subsize
        this._count = count
        this._stream = stream
        this._addoffset = addoffset
        this._context = context
        this._cached = {}

        return new Proxy(this, {
            get(target, index) {
                if (Number(index) == index && !(index in target)) {
                    if (!(index in this._cached)) {
                        this._stream.seek(this._addoffset + index * self.subsize)
                        this._cached[index] = this._subcon._parse(this._stream, this._context, 'lazy range container')
                        if (this._cached.length == this.length) {
                            this._stream = null
                        }
                    }
                    return this._cached[index]
                }
                return target[index]
            }
        })
    }

    toString() {
        return '[LazyRangeContainer Array]'
    }

    toSimpleString() {
        let result = super.toSimpleString();
        result += os.EOL + `<${this.length} possible items, ${_.keys(this._cached).length} cached>`
        return result
    }

    toRichString() {
        let result = super.toSimpleString();
        result += os.EOL + `<${this.length} possible items, ${_.keys(this._cached).length} cached>${os.EOL}`
        return result
    }
}

export class LazySequenceContainer extends ListContainer {
    constructor(count, offsetmap, cached, stream, addoffset, context) {
        super()
        this._count = count
        this._offsetmap = offsetmap
        this._cached = cached
        this._addoffset = addoffset
        this._context = context

        return new Proxy(this, {
            get(target, index) {
                if (Number(index) == index && !(index in target)) {
                    if (!(index in this._cached)) {
                        let map = this._offsetmap[index]
                        this._stream.seek(this._addoffset + map.at)
                        this._cached[index] = map.sc._parse(this._stream, this._context, 'lazy sequence container')
                        if (this._cached.length == this.length) {
                            this._stream = null
                            this._offsetmap = null
                        }
                    }
                    return this._cached[index]
                }
                return target[index]
            }
        })
    }

    toString() {
        return '[LazySequenceContainer Array]'
    }

    toSimpleString() {
        let result = super.toSimpleString();
        result += os.EOL + `<${this.length} possible items, ${_.keys(this._cached).length} cached>`
        return result
    }

    toRichString() {
        let result = super.toSimpleString();
        result += os.EOL + `<${this.length} possible items, ${_.keys(this._cached).length} cached>${os.EOL}`
        return result
    }
}