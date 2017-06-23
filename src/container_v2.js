import _ from 'lodash'
import isCircular from 'is-circular'
import Bits from 'buffer-bits'
import { EOL } from 'os'

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
        let result = this.toString() + ' ' + EOL
        indent = indent || 1
        _.forIn(this, (item, key) => {

            if (!_.startsWith(key, '_')) {
                for (let j = 0; j < indent; j++) {
                    result += '\t'
                }
                result += `${key} = `
                result += this._itemToRichString(item, indent)
                result += EOL
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
        //         result += EOL
        //     }
        // }
        return result
    }

    _itemToRichString(item, indent) {
        let result = ''
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
        } else if (_.isArray(item)) {
            result += '['
            let indentInArray = _.repeat('\t', indent)
            let hasIndent = false
            _.forEach(item, (v, k) => {
                let itemString = this._itemToRichString(v, indent + 1)
                result += itemString
                hasIndent = itemString.endsWith(EOL)
                if (k != item.length - 1) {
                    result += (hasIndent ? indentInArray : '') + ', '
                }
            })
            result += (hasIndent ? indentInArray : '') + ']'
        } else  {
            result += item
        }
        return result
    }
}