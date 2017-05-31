import { FixedSizeParser, ParseResult } from './BaseParser'
import { logFactory } from '../logger'
import _ from 'lodash'

let logger = logFactory.getLogger(require('path').basename(__filename))

export class FlagParser extends FixedSizeParser {
    constructor(options) {
        super(options)
        if (this._length !== 1 && this._length !== 8) {
            this._length = 1
        }
    }

    static init(options) {
        logger.debug('FlagParser initialized with options: ' + JSON.stringify(options))
        return new FlagParser(options)
    }

    _parse(bits, offset) {
        let parsedResult = super._parse(bits, offset)
        let result = new ParseResult(parsedResult.result.readInt() !== 0, parsedResult.nextOffset)
        return result
    }
}

export class EnumParser extends FixedSizeParser {
    constructor(options) {
        super(options)
        if (this._length !== 0 && this._length !== 8) {
            this._length = 8
        }
    }

    static init(options) {
        logger.debug('EnumParser initialized with options: ' + JSON.stringify(options))
        return new EnumParser(options)
    }

    _parse(bits, offset) {
        let parsedResult = super._parse(bits, offset)
        let result = new ParseResult(parsedResult.result.readInt() !== 0, parsedResult.nextOffset)
        return result
    }
}