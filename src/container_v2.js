import _ from 'lodash'
import os from 'os'
import isCircular from 'is-circular'
import Bits from 'buffer-bits'

export class Container {

    toString() {
        return '[Container Object]'
    }

    toSimpleString() {
        let result = this.toString() + ' '
        _.forIn(this, (item, key) => {

            if (!_.startsWith(key, '_')) {
                result += `(${key}=`
                if (item === undefined) {
                    result += 'undefined' 
                } else if (_.isObject(item) && isCircular(item)) {
                    result += '<circular detected>)'
                } else {
                    result += `${(_.isFunction(item.toSimpleString) ? item.toSimpleString() : item)})`
                }
            }
        })
        // for (let i = 0; i < this.length; i++) {
        //     let key = this._keysOrder[i]
        //     let item = this._items[key]
        //     if (!_.startsWith(key, '_')) {
        //         result += `(${key}=`
        //         if (_.isObject(item) && isCircular(item)) {
        //             result += '<circular detected>)'
        //         } else {
        //             result += `${(_.isFunction(item.toSimpleString) ? item.toSimpleString() : item)})`
        //         }
        //     }
        // }
        return result
    }

    toRichString(indent) {
        let result = this.toString() + ' ' + os.EOL
        indent = indent || 1
        _.forIn(this, (item, key) => {

            if (!_.startsWith(key, '_')) {
                for (let j = 0; j < indent; j++) {
                    result += '\t'
                }
                result += `${key} = `
                if (item === undefined) {
                    result += 'undefined' 
                } else if (_.isObject(item) && isCircular(item)) {
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
        })
        // for (let i = 0; i < this.length; i++) {
        //     let key = this._keysOrder[i]
        //     let item = this._items[key]
        //     if (!_.startsWith(key, '_')) {
        //         for (let j = 0; j < indent; j++) {
        //             result += '\t'
        //         }
        //         result += `${key} = `
        //         if (_.isObject(item) && isCircular(item)) {
        //             result += '<circular detected>'
        //         } else if (_.isFunction(item.toRichString)) {
        //             result += item.toRichString(indent + 1)
        //         } else if (item instanceof Bits) {
        //             if (item.length <= 32) {
        //                 result += item.toBinaryString() + ` (total ${item.length})`
        //             } else {
        //                 result += _.truncate(item.toBinaryString(), { length: 32 }) + ` (total ${item.length})`
        //             }
        //         } else {
        //             result += item
        //         }
        //         result += os.EOL
        //     }
        // }
        return result
    }
}