import { BaseParser, ParseResult } from './BaseParser'
import { logFactory } from '../logger'

let logger = logFactory.getLogger(require('path').basename(__filename))

export class Computed extends BaseParser {
    constructor(options) {
        super(options)
    }

    static init(options) {
        logger.debug('Computed initialized with options: ' + JSON.stringify(options))
        if (typeof options === 'string' || typeof options === 'function') {
            return new Computed({ expression: options })
        }
        return new Computed(options)
    }

    get expression() {
        return this._expression
    }

    _parse(bits, offset, context) {
        if (typeof this._expression === 'string') {
            return new ParseResult(eval(this._expression), offset)
        } else if (typeof this._expression === 'function') {
            return new ParseResult(this._expression.call(this, context))
        }
    }
}