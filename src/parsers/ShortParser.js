import { FixedSizeParser, ParseResult, OPTION_DEFAULT } from './BaseParser'
import { logFactory } from '../logger'
import _ from 'lodash'
import { ParseException } from '../exceptions'

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

    _parse(bits, offset, context) {
        let parsedResult = super._parse(bits, offset, context)
        let result = new ParseResult(parsedResult.result.readInt() !== 0, parsedResult.nextOffset)
        return result
    }
}

class BaseEnumParser extends FixedSizeParser {

    constructor(options) {
        super(options)
        if (this._length !== 0 && this._length !== 8) {
            this._length = 8
        }

        if (!_.has(this, '_isSigned')) {
            this._isSigned = false
        }
    }

    get options() {
        return this._options
    }

    get isSigned() {
        return this._isSigned
    }

    _parse(bits, offset, context) {
        let parsedResult = super._parse(bits, offset, context)
        if (this._isSigned) {
            return new ParseResult(parsedResult.result.readInt(), parsedResult.nextOffset)
        } else {
            return new ParseResult(parsedResult.result.readUInt(), parsedResult.nextOffset)
        }
    }
}

export class EnumParser extends BaseEnumParser {

    static init(options) {
        logger.debug('EnumParser initialized with options: ' + JSON.stringify(options))
        return new EnumParser(options)
    }

    _parse(bits, offset, context) {
        let parsedResult = super._parse(bits, offset, context)
        let value = parsedResult.result
        if(this._options) {
            let key = _.findKey(this._options, o => o == value) || _.findKey(this._options, o => o === OPTION_DEFAULT)
            if (key) {
                return new ParseResult(key, parsedResult.nextOffset)
            } else {
                // parse failed
                throw new ParseException(`Failed to parse the enum with value: ${value} from enum options: ${JSON.stringify(this._options)}`)
            }
        } else {
            // parse failed
            throw new ParseException(`Failed to parse the enum with value: ${value} because no options specified`)
        }
    }
}

export class FlagsEnumParser extends BaseEnumParser {

    static init(options) {
        logger.debug('FlagsEnumParser initialized with options: ' + JSON.stringify(options))
        return new FlagsEnumParser(options)
    }

    _parse(bits, offset, context) {
        let parsedResult = super._parse(bits, offset, context)
        let value = parsedResult.result
        let flags = []
        if(this._options) {
            _.forIn(this._options, (v, k) => {
                if ((value & v) === v) {
                    flags.push(k)
                }
            })

            return new ParseResult(flags, parsedResult.nextOffset)
        } else {
            // parse failed
            throw new ParseException(`Failed to parse the enum with value: ${value} because no options specified`)
        }
    }
}