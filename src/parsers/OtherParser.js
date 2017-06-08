import { FixedSizeByteParser, ParseResult } from './BaseParser'
import { logFactory } from '../logger'
import { OutOfRangeException } from '../exceptions'
import Bits from 'buffer-bits'
import _ from 'lodash'

let logger = logFactory.getLogger(require('path').basename(__filename))

export class IpAddressParser extends FixedSizeByteParser {

    constructor(options) {
        super(options)
        this._length = 32   // always 4 byte
    }

    static init(options) {
        options = options || { length: 4 }
        logger.debug('IpAddressParser initialized with options: ' + JSON.stringify(options))
        return new IpAddressParser(options)
    }

    _parse(bits, offset, context) {
        let parsedResult = super._parse(bits, offset, context)
        let buf = parsedResult.result.buffer
        return new ParseResult(`${buf[0]}.${buf[1]}.${buf[2]}.${buf[3]}`, parsedResult.nextOffset)
    }

    _build() {
        let parts = []
        if (arguments.length === 4) {
            parts = _.map(Array.prototype.slice.call(arguments), o => parseInt(o))
        } else if (arguments.length === 1) {
            if (typeof arguments[0] === 'string') {
                let strParts = arguments[0].split('.')
                parts = _.map(strParts, o => parseInt(o))
            } else if (_.isArray(arguments[0])) {
                parts = _.map(arguments[0], o => parseInt(o))
            }
        }

        if (parts.length !== 4) {
            // error
            throw new OutOfRangeException('Failed when building the Ip v4 address')
        }

        let result = Bits.alloc(32)
        parts.forEach((o, i) => result.buffer[i] = o)
        return result
    }
}

export let IpAddressBuilder = IpAddressParser
export let IpAddress_V4 = IpAddressParser