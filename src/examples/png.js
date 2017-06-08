import { Int32Parser, EnumParser, EnumDefault, Computed, RepeatParser, FixedSizeByteParser } from '../parsers'
import { Struct } from '../struct'

let coord = Struct.init({
    x: Int32Parser.init(),
    y: Int32Parser.init()
})

let compression_method = EnumParser.init({deflate: 0, default: EnumDefault})

let plte_info = Struct.init({
    num_entries: Computed.init(ctx => ctx.getParent().len / 3),
    palatte_entries: RepeatParser.init({ 
        times: ctx => ctx.num_entries,
        repeatedParser: FixedSizeByteParser.init({ length: 3 })
    })
})