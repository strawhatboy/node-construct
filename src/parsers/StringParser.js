import { FixedSizeByteParser, RangedSizeByteParser, ParseResult } from './BaseParser'
import { logFactory } from '../logger'
import { OutOfRangeException } from '../exceptions'
import Bits from 'buffer-bits'

let logger = logFactory.getLogger(require('path').basename(__filename))

export default class StringParser extends FixedSizeByteParser {


    /**
     * 
     * 
     * @static
     * @param {Options} options { length: <number/byteLength>, encoding: <encodings/https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings>}
     * @returns 
     * 
     * @memberof StringParser
     */
    static init(options) {
        logger.debug('initializing StringParser with options: ' + JSON.stringify(options))
        return new StringParser(options)
    }

    _parse(bits, offset) {
        let parseResult = super._parse(bits, offset)
        logger.debug('parsing inside StringParser with result: ' + parseResult.result.toBinaryString())
        let resultString = parseResult.result.readString(this._encoding)
        let result = new ParseResult(resultString, parseResult.nextOffset)
        logger.debug('get result: ' + JSON.stringify(result))
        return result
    }
}

export class CStringParser extends RangedSizeByteParser {

    constructor(options) {
        super(options)
        this._terminators = this._terminators || [ 0 ]
    }

    /**
     * 
     * 
     * @static
     * @param {any} options 
     * @returns 
     * 
     * @memberof CStringParser
     */
    static init(options) {
        logger.debug('initializing CStringParser with options: ' + JSON.stringify(options))
        return new CStringParser(options)
    }

    _parse(bits, offset) {
        let parseResult = super._parse(bits, offset)
        logger.debug('parsing inside CStringParser with result: ' + parseResult.result.toBinaryString())
        let resultString = parseResult.result.readString(this._encoding)
        let result = new ParseResult(resultString, parseResult.nextOffset)
        logger.debug('get result: ' + JSON.stringify(result))
        return result
    }

    _stop(bits, offset, currentOffset, parsedLength, parsedBits /* byte */) {
        let result = super._stop(bits, offset, currentOffset, parsedLength, parsedBits)
        if (_.includes(this._terminators, parsedBits.readInt())) {
            // met terminator, should stop
            logger.debug('got stop terminator, stopping parsing')
            result = false
        }

        return result
    }
}

export class PascalStringParser extends StringParser {

    static init(options) {
        logger.debug('initializing PascalStringParser with options: ' + JSON.stringify(options))
        return new PascalStringParser(options)
    }

    _parse(bits, offset) {
        // try to read 1st byte to determine the size (byte)
        if (offset + 8 > bits.length) {
            throw new OutOfRangeException(this.constructor.name)
        }
        let _1stBits = Bits.from(bits, offset, 8)
        let size = _1stBits.readUInt()
        logger.debug(`got size ${size} when parsing a PascalString`)
        this._length = size
        return super._parse(bits, offset)
    }
}

export class GreedyString extends CStringParser {

    constructor(options) {
        super(options)
        this._terminators = this._terminators || [] // no terminateor
        this._range.upperBound = undefined // always no upperBound
    }

    static init(options) {
        logger.debug('initializing StringParser with options: ' + JSON.stringify(options))
        options.terminators = options.terminators || []
        return new GreedyString(options)
    }
}