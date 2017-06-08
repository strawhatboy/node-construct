import _ from 'lodash'
import Bits from 'buffer-bits'
import { Container } from '../container'
import { OutOfRangeException } from '../exceptions'
import { logFactory } from '../logger'

let logger = logFactory.getLogger(require('path').basename(__filename))

export const Types = {
    Int8: {
        length: 8
    },

    Int16: {
        length: 16
    },

    Byte: {
        length: 8
    },

    Bytes: function(length) {
        return {
            length: length * 8
        }
    }
}

export class ParseResult {
    constructor(result, nextOffset) {
        this.result = result
        this.nextOffset = nextOffset
        logger.debug(`ParseResult initialized, result: ${JSON.stringify(result)}, nextOffset: ${JSON.stringify(nextOffset)}`)
    }

    update(anotherResult) {
        this.result = anotherResult.result || this.result
        this.nextOffset = anotherResult.nextOffset
    }
}


/**
 * Base Parser for parsing and building binary data
 * 
 * *** NOTE *** 
 * Please don't use _.forEach to enumarate properties inside, use _.forIn instead
 * 
 * @export
 * @class BaseParser
 */
export class BaseParser {

    constructor(options) {
        if (_.isObject(options)) {
            logger.debug('init parser with options: ' + JSON.stringify(options))
            _.forIn(options, (v, k) => {
                logger.debug('setting this property _' + k + ' to ' + JSON.stringify(v))
                this['_' + k] = v
            })
        }
        
        logger.debug('BaseParser initialized')
    }

    _parse() {}

    parse() { return this._parse.apply(this, arguments) }

    _build() {}

    build() { return this._build.apply(this, arguments) }

    _pre_parse() {}

    pre_parse() { return this._pre_parse.apply(this, arguments) }

    _pre_build() {}

    pre_build() { return this._pre_build.apply(this, arguments) }

    _post_parse() {}

    post_parse() { return this._post_parse.apply(this, arguments) }

    _post_build() {}

    post_build() { return this._post_build.apply(this, arguments) }
}

export class FixedSizeParser extends BaseParser {

    static init(options) {
        logger.debug('FixedSizeParser initialized with options: ' + JSON.stringify(options))
        return new FixedSizeParser(options)
    }

    get length() {
        logger.debug('getting FixedSizeParser length: ' + this._length)
        return this._length || 0
    }

    _parse(bits, offset, context) {
        if (offset + this.length > bits.length) {
            // out of range
            throw new OutOfRangeException(this.constructor.name)
        }

        this._bits = Bits.from(bits, offset, this.length)
        return new ParseResult(this._bits, offset + this.length)
    }
}

export class FixedSizeByteParser extends FixedSizeParser {

    constructor(options) {
        super(options)
        this._byteLength = this._length
        this._length <<= 3
    }

    static init(options) {
        logger.debug('FixedSizeByteParser initialized with options: ' + JSON.stringify(options))
        return new FixedSizeByteParser(options)
    }

    get byteLength() {
        return this._byteLength
    }
}

export class RangedSizeParser extends BaseParser {

    constructor(options) {
        super(options)
        this._range = this._range || { lowerBound: 0, upperBound: undefined }
        this._steps = this._steps || 1
    }

    static init(options) {
        logger.debug('RangedSizeParser initialized')
        return new RangedSizeParser(options)
    }

    get range() {
        return this._range
    }

    _parse(bits, offset, context) {
        if (this.range.lowerBound != undefined) {
            // check it like length
            if (offset + this.range.lowerBound >= bits.length) {
                throw new OutOfRangeException(this.constructor.name)
            }
        }

        let parsedLength = 0
        let currentOffset = offset
        this._bits = Bits.from(bits, offset, 0)
        while (currentOffset < bits.length) {
            let parsedBits = Bits.from(bits, currentOffset, this._steps)
            this._bits = this._bits.concat(parsedBits)
            parsedLength += this._steps
            currentOffset += this._steps

            if (this._stop(bits, offset, currentOffset, parsedLength, parsedBits)) {
                // stop the parsing
                break
            }
        }

        return new ParseResult(this._bits, currentOffset)
    }

    _stop(bits, offset, currentOffset, parsedLength, parsedBits) {
        if (this.range.upperBound != undefined) {
            if (parsedLength > this.range.upperBound) {
                return true
            }
        }
        return false
    }
}

export class RangedSizeByteParser extends RangedSizeParser {

    constructor(options) {
        super(options)
        if (this._range.lowerBound) {
            this._range.lowerBound <<= 3
        } 
        if (this._range.upperBound) {
            this._range.upperBound <<= 3
        }
        if (this._steps) {
            this._steps <<= 3
        }
    }

    static init(options) {
        logger.debug('RangedSizeByteParser initialized with options: ' + JSON.stringify(options))
        return new RangedSizeByteParser(options)
    }
}

export class NestedParser extends BaseParser {

    static init(options) {
        logger.debug('NestedParser initialized')
        return new NestedParser(options)
    }

    _parse(bits, offset, context) {
        let result = new ParseResult(undefined, offset)
        let innerResult = this._innerParser.parse(bits, offset, context)
        result.update(innerResult)

        return result
    }

    _build() {
        return this._innerParser.build.apply(this._innerParser, arguments)
    }

    _pre_parse() {
        return this._innerParser.pre_parse.apply(this._innerParser, arguments)
    }

    _post_parse() {
        return this._innerParser.post_parse.apply(this._innerParser, arguments)
    }

    _pre_build() {
        return this._innerParser.pre_build.apply(this._innerParser, arguments)
    }

    _post_build() {
        return this._innerParser.post_build.apply(this._innerParser, arguments)
    }
}

export class RepeatParser extends BaseParser {
    constructor(options) {
        super(options)
        this._times = this._times || 1
    }

    static init(options) {
        logger.debug('RepeatParser initialized with options: ' + JSON.stringify(options))
        return new RepeatParser(options)
    }

    get repeatedParser() {
        return this._repeatedParser
    }
    
    get times() {
        return this._times
    }

    _parse(bits, offset, context) {
        let result = []
        let nextOffset = offset
        let times = this._times
        if (typeof this._times === 'function') {
            times = this._times.call(this, context)
        }
        for (let i = 0; i < times; i++) {
            let tmpResult = this._repeatedParser._parse.call(this._repeatedParser, bits, nextOffset, context)
            result.push(tmpResult.result)
            nextOffset = tmpResult.nextOffset
        }

        return new ParseResult(result, nextOffset)
    }
}

export class OptionalParser extends NestedParser {

    static init(options) {
        logger.debug('OptionalParser initialized')
        return new OptionalParser(options)
    }

    _parse(bits, offset, context) {
        let result = new ParseResult(undefined, offset)
        try {
            let innerResult = super.parse(bits, offset, context)
            result.update(innerResult)
        } catch (e) {
            // do nothing
        }

        return result
    }
}