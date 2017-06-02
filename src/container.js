import _ from 'lodash'
import os from 'os'
import isCircular from 'is-circular'
import Bits from 'buffer-bits'

export class Container {

    constructor(args, kw) {

        this._keysOrder = []
        this._items = {}

        let done = false
        if (_.isArray(args)) {
            _.forEach(args, obj => {
                if (_.isObject(obj)) {
                    if (_.isObject(obj.items)) {
                        _.forIn(obj.items, (v, k) => {
                            this.setItem(k, v)
                        })
                    } else {
                        _.forIn(obj, (v, k) => {
                            this.setItem(k, v)
                        })
                    }
                }
            })
        } else if (_.isObject(args)) {
            if (_.isObject(args.items)) {
                _.forIn(args.items, (v, k) => {
                    this.setItem(k, v)
                })
            } else {
                _.forEach(args, (v, k) => {
                    this.setItem(k, v)
                })
            }
            done = true
        }

        if (!done) {
            _.forEach(kw, (v, k) => {
                this.setItem(k, v)
            })
        }
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

    getItem(key) {
        return this._items[key]
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
        let key = this._keysOrder.pop()
        let value = this._items[key]
        delete this._items[key]
        if (key !== undefined && value !== undefined) {
            let result = {}
            result[key] = value
            return result
        } else {
            return undefined
        }
    }

    update(seqOrDict, kw) {
        if (_.isObject(seqOrDict)) {
            if (_.isObject(seqOrDict.items)) {
                _.forEach(seqOrDict.items, (v, k) => {
                    this.setItem(k, v)
                })
            } else {
                _.forEach(seqOrDict, (v, k) => {
                    this.setItem(k, v)
                })
            }
        }

        _.forEach(kw, (v, k) => {
            this.setItem(k, v)
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
        _.forEach(this.items, (v, k) => {
            if (!_.includes(container.keysOrder, k) || container.items[k] !== v ||
                _.isFunction(container.items[k].equals) && !container.items[k].equals(v)) {
                result = false
            }
        })

        if (!result) return false

        _.forEach(container.items, (v, k) => {
            if (!_.includes(this._keysOrder, k) || this.items[k] !== v ||
                _.isFunction(this.items[k].equals) && !this.items[k].equals(v)) {
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
                result += `(${key}=`
                if (_.isObject(item) && isCircular(item)) {
                    result += '<circular detected>)'
                } else {
                    result += `${(_.isFunction(item.toSimpleString) ? item.toSimpleString() : item)})`
                }
            }
        }
        return result
    }

    toRichString(indent) {
        let result = this.toString() + ' ' + os.EOL
        indent = indent || 1
        for (let i = 0; i < this.length; i++) {
            let key = this._keysOrder[i]
            let item = this._items[key]
            if (!_.startsWith(key, '_')) {
                for (let j = 0; j < indent; j++) {
                    result += '\t'
                }
                result += `${key} = `
                if (_.isObject(item) && isCircular(item)) {
                    result += '<circular detected>'
                } else if (_.isFunction(item.toRichString)) {
                    result += item.toRichString(indent + 1)
                } else if (item instanceof Bits) {
                    if (item.length <= 32) {
                        result += item.toBinaryString() + ` (total ${item.length})`
                    } else {
                        result += _.truncate(item.toBinaryString(), { length: 32 }) + ` (total ${item.length})`
                    }
                } else {
                    result += item
                }
                result += os.EOL
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

export class ListContainer {
    constructor() {
        let args = Array.prototype.slice.call(arguments)
        if (args.length == 1 && _.isArray(args[0])) {
            this._array = args[0]
        } else if (args.length > 1) {
            this._array = args
        } else {
            this._array = []
        }
    }

    getItem(index) {
        return this._array[index]
    }

    setItem(index, value) {
        this._array[index] = value
    }

    get length() {
        return this._array.length
    }

    toString() {
        return '[ListContainer Object]'
    }

    toSimpleString() {
        let result = this.toString() + ' '
        for (let i = 0; i < this._array.length; i++) {
            let item = this._array[i]
            if (i != this._array.length - 1) {
                result += `${item}, `
            } else {
                result += item
            }
        }
        return result
    }

    toRichString(indent) {
        let result = this.toString() + ' ' + os.EOL
        indent = indent || 1
        for (let i = 0; i < this._array.length; i++) {
            let item = this._array[i]
            let str = (_.isFunction(item.toRichString) ? item.toRichString(indent + 1) : item)
            result += `${str}${os.EOL}`
        }
        return result
    }

    _search(compiled_pattern, search_all) {
        let items = []
        for (let i = 0; i < this._array.length; i++) {
            let ret = null
            let item = this._array[i]
            try {
                ret = item._search(compiled_pattern, search_all)
            } catch (e) {
                continue
            }

            if (ret !== null) {
                if (search_all) {
                    items = items.concat(ret)
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
        if (this.length == otherListContainer.length) {
            for (let i = 0; i < this.length; i++) {
                if ((_.isFunction(this[i].equals) && this[i].equals(otherListContainer)) ||
                    this[i] == otherListContainer[i])
                    return true
            }
        }

        return false
    }

    get items() {
        return this._array
    }

    set items(value) {
        this._array = value
    }
}


// // extends does not work in with gulp-babel, use traditional way instead...
//     export function ListContainer() {}

//     ListContainer.prototype = Object.create(Array.prototype)
//     ListContainer.prototype.toString = function() {
//         return '[ListContainer Array]'
//     }

//     ListContainer.prototype.toSimpleString = function() {
//         let result = this.toString() + ' '
//         for (let i = 0; i < this.length; i++) {
//             let item = this[i]
//             if (i != this.length - 1) {
//                 result += `${item}, `
//             } else {
//                 result += item
//             }
//         }
//         return result
//     }

//     ListContainer.prototype.toRichString = function() {
//         let result = this.toString() + ' ' + os.EOL
//         for (let i = 0; i < this.length; i++) {
//             let item = this[i]
//             let str = (_.isFunction(item.toRichString) ? item.toRichString() : item)
//             result += `${str}${os.EOL}`
//         }
//         return result
//     }

//     ListContainer.prototype._search = function(compiled_pattern, search_all) {
//         let items = []
//         for (let i = 0; i < this.length; i++) {
//             let ret = null
//             let item = this[i]
//             try {
//                 ret = item._search(compiled_pattern, search_all)
//             } catch (e) {
//                 continue
//             }

//             if (ret !== null) {
//                 if (search_all) {
//                     items.concat(ret)
//                 } else {
//                     return ret
//                 }
//             }
//         }

//         if (search_all) {
//             return items
//         } else {
//             return null
//         }
//     }

//     ListContainer.prototype.search = function(pattern) {
//         if (pattern instanceof RegExp) {
//             return this._search(pattern, false)
//         }
//         return this._search(new RegExp(pattern), false)
//     }

//     ListContainer.prototype.search_all = function(pattern) {
//         if (pattern instanceof RegExp) {
//             return this._search(pattern, true)
//         }
//         return this._search(new RegExp(pattern), true)
//     }

//     ListContainer.prototype.equals = function(otherListContainer) {
//         if (this.length == otherListContainer.length) {
//             for (let i = 0; i < this.length; i++) {
//                 if ((_.isFunction(this[i].equals) && this[i].equals(otherListContainer)) ||
//                     this[i] == otherListContainer[i])
//                     return true
//             }
//         }

//         return false
//     }

export class LazyContainer {
    constructor(keysbackend, offsetmap, cached, stream, addoffset, context) {
        this._keysbackend = keysbackend
        this._offsetmap = offsetmap
        this._cached = cached
        this._stream = stream
        this._addoffset = addoffset
        this._context = context

        // return new Proxy(this, {
        //     get(target, index) {
        //         if (Number(index) == index && !(index in target)) {
        //             if (!(index in this._cached)) {
        //                 let map = this._offsetmap[index]
        //                 this._stream.seek(this._addoffset + map.at)
        //                 this._cached[index] = map.sc._parse(this._stream, this._context, 'lazy sequence container')
        //                 if (this._cached.length == this.length) {
        //                     this._stream = null
        //                     this._offsetmap = null
        //                 }
        //             }
        //             return this._cached[index]
        //         }
        //         return target[index]
        //     }
        // })
    }

    get length() {
        return this._keysbackend.length
    }

    get keys() {
        return this._keysbackend
    }

    get values() {
        return _.map(this._keysbackend, k => this[k])
    }

    get items() {
        return _.pick(this, this._keysbackend)
    }

    equals(other) {
        if (!_.isObject(other)) {
            return false
        }

        if (this.length != other.length) {
            return false
        }

        let result = true;
        _.forEach(this.items, (v, k) => {
            if (!_.includes(other.keysOrder, k) || other.items[k] !== v ||
                _.isFunction(other.items[k].equals) && !other.items[k].equals(v)) {
                result = false
            }
        })

        if (!result) return false

        _.forEach(other.items, (v, k) => {
            if (!_.includes(this._keysOrder, k) || this.items[k] !== v ||
                _.isFunction(this.items[k].equals) && !this.items[k].equals(v)) {
                result = false
            }
        })

        if (!result) return false

        return true
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

        // return new Proxy(this, {
        //     get(target, index) {
        //         if (Number(index) == index && !(index in target)) {
        //             if (!(index in this._cached)) {
        //                 this._stream.seek(this._addoffset + index * self.subsize)
        //                 this._cached[index] = this._subcon._parse(this._stream, this._context, 'lazy range container')
        //                 if (this._cached.length == this.length) {
        //                     this._stream = null
        //                 }
        //             }
        //             return this._cached[index]
        //         }
        //         return target[index]
        //     }
        // })
    }

    toString() {
        return '[LazyRangeContainer Array]'
    }

    toSimpleString() {
        let result = super.toSimpleString();
        result += os.EOL + `<${this.length} possible items, ${_.keys(this._cached).length} cached>`
        return result
    }

    toRichString(indent) {
        let result = super.toRichString(indent);
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

        // return new Proxy(this, {
        //     get(target, index) {
        //         if (Number(index) == index && !(index in target)) {
        //             if (!(index in this._cached)) {
        //                 let map = this._offsetmap[index]
        //                 this._stream.seek(this._addoffset + map.at)
        //                 this._cached[index] = map.sc._parse(this._stream, this._context, 'lazy sequence container')
        //                 if (this._cached.length == this.length) {
        //                     this._stream = null
        //                     this._offsetmap = null
        //                 }
        //             }
        //             return this._cached[index]
        //         }
        //         return target[index]
        //     }
        // })
    }

    toString() {
        return '[LazySequenceContainer Array]'
    }

    toSimpleString() {
        let result = super.toSimpleString();
        result += os.EOL + `<${this.length} possible items, ${_.keys(this._cached).length} cached>`
        return result
    }

    toRichString(indent) {
        indent = indent || 1
        let result = super.toRichString(indent);
        result += os.EOL + `<${this.length} possible items, ${_.keys(this._cached).length} cached>${os.EOL}`
        return result
    }
}