import { FixedSizeByteParser, ParseResult } from './BaseParser'
import { logFactory } from '../logger'

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
}