import { BaseParser, ParseResult } from './parsers/BaseParser'
import { Container } from './container'
import _ from 'lodash'
import { logFactory } from './logger'

let logger = logFactory.getLogger(require('path').basename(__filename))

export class Struct extends BaseParser {

    /**
     * 
     * 
     * @static
     * @param {Object} options { name: Parser, name2: Parser2 }
     * 
     * @memberof Struct
     */
    static init(options) {
        return new Struct(options)
    }

    _parse(bits, offset, context) {
        let container = new Container()
        if (!this._hasOwnContext) {
            context = context || this
        } else {
            context = this
        }

        try {
            _.forIn(this, (v, k) => {
                if (v instanceof BaseParser) {
                    logger.debug(`start to parse from offset ${offset}`)
                    let obj = {}
                    v.pre_parse(bits, offset, context)
                    let parseResult = v.parse(bits, offset, context)
                    v.post_parse(bits, offset, parseResult, context)
                    if (_.startsWith(k, '_')) {
                        k = k.substring(1, k.length)
                    }
                    logger.debug(`putting key ${k} to container`)
                    obj[k] = parseResult.result
                    container.update(obj)
                    offset = parseResult.nextOffset
                }
            })

            return new ParseResult(container, offset)
        } catch (e) {
            logger.error('Got exception during parsing: ' + e)
        }

        return undefined
    }
}