import { FixedSizeParser, ParseResult } from './BaseParser'
import { logFactory } from '../logger'

let logger = logFactory.getLogger(require('path').basename(__filename))

export class IntParser extends FixedSizeParser {


    /**
     * 
     * 
     * @static
     * @param {Options} { length: <number>, isLE: <boolean>, isSigned: <boolean> } 
     * @returns 
     * 
     * @memberof IntParser
     */
    static init(options) {
        logger.debug('IntParser initialized with options: ' + JSON.stringify(options))
        return new IntParser(options)
    }

    _parse(bits, offset, context) {
        let parseResult = super._parse(bits, offset, context)
        logger.debug('parsing inside IntParser with result: ' + parseResult.result.toBinaryString())
        let resultInt = 0
        if (this._isSigned) {
            resultInt = this._isLE ? parseResult.result.readIntLE() : parseResult.result.readInt()
        } else {
            resultInt = this._isLE ? parseResult.result.readUIntLE() : parseResult.result.readUInt()
        }
        let result = new ParseResult(resultInt, parseResult.nextOffset)
        logger.debug('get result: ' + JSON.stringify(result))
        return result
    }

    get isLE() {
        return this._isLE
    }

    get isSigned() {
        return this._isSigned
    }
}

export class Int8Parser extends IntParser {

    constructor(options) {
        super(options)
        this._length = 8
    }

    static init(options) {
        options.length = 8
        logger.debug('Int8Parser initialized with options: ' + JSON.stringify(options))
        return new Int8Parser(options)
    }
}

export class Int16Parser extends IntParser {

    constructor(options) {
        super(options)
        this._length = 16
    }

    static init(options) {
        options.length = 16
        logger.debug('Int16Parser initialized with options: ' + JSON.stringify(options))
        return new Int16Parser(options)
    }
}

export class Int32Parser extends IntParser {

    constructor(options) {
        super(options)
        this._length = 32
    }

    static init(options) {
        options.length = 32
        logger.debug('Int32Parser initialized with options: ' + JSON.stringify(options))
        return new Int32Parser(options)
    }
}