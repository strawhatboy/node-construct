import { BaseParser, ParseResult, OPTION_DEFAULT } from './BaseParser'
import { ParseException } from '../exceptions'
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

export class Switch extends BaseParser {
    constructor(options) {
        super(options)
    }

    static init(options) {
        logger.debug('Switch initialized with options: ' + JSON.stringify(options))
        return new Switch(options)
    }

    get expression() {
        return this._expression
    }

    get options() {
        return this._options
    }

    _parse(bits, offset, context) {
        let expectedValue = this._expression
        if (typeof this._expression === 'string') {
            expectedValue = eval(this._expression)
        } else if (typeof this._expression === 'function') {
            expectedValue = this._expression.call(this, context)
        }

        if(this._options) {
            let innerParser = this._options[expectedValue] || this._options[OPTION_DEFAULT]
            if (innerParser) {
                return innerParser._parse(bits, offset, context)
            } else {
                throw new ParseException(`Failed to parse the Switch with value: ${expectedValue} because no inner parser for it`)
            }
        } else {
            // parse failed
            throw new ParseException(`Failed to parse the Switch with value: ${expectedValue} because no options specified`)
        }
    }
}

export class IfThenElse extends BaseParser {
    constructor(options) {
        super(options)
    }

    static init(options) {
        logger.debug('IfThenElse initialized with options: ' + JSON.stringify(options))
        return new IfThenElse(options)
    }

    get expression() {
        return this._expression
    }

    get true() {
        return this._true
    }

    get false() {
        return this._false
    }

    _parse(bits, offset, context) {
        let expectedValue = this._expression
        if (typeof this._expression === 'string') {
            expectedValue = eval(this._expression)
        } else if (typeof this._expression === 'function') {
            expectedValue = this._expression.call(this, context)
        }
        
        let innerParser

        if (expectedValue) {
            innerParser = this._true
        } else {
            innerParser = this._false
        }

        if (innerParser) {
            return innerParser._parse(bits, offset, context)
        } else {
            throw new ParseException(`Failed to parse the IfThenElse because no inner parser for it`)
        }
    }
}