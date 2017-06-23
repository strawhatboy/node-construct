import { EmptyParser, Int32Parser, EnumParser, OPTION_DEFAULT, Computed, Switch, IfThenElse, Const, GreedyRangeParser, RepeatParser, Int8Parser, Int16Parser, FixedSizeByteParser, StringParser, CStringParser } from '../parsers'
import { Struct } from '../struct'
import _ from 'lodash'

let coord = Struct.init({
    x: Int32Parser.init(),
    y: Int32Parser.init()
})

let compression_method = EnumParser.init({ options: { deflate: 0, default: OPTION_DEFAULT } })

let plte_info = Struct.init({
    num_entries: Computed.init(ctx => ctx.parent.len / 3),
    palatte_entries: RepeatParser.init({ 
        times: ctx => ctx.current.num_entries,
        repeatedParser: FixedSizeByteParser.init({ length: 3 })
    })
})

let idat_info = FixedSizeByteParser.init({ length: ctx => ctx.current.len })

let trns_info = Switch.init({ 
    expression: ctx => ctx.parent.image_header.color_type, 
    options: {
        greyscale: Int16Parser.init(),
        truecolor: RepeatParser.init({ times: 3, repeatedParser: Int16Parser.init() }),
        indexed: RepeatParser.init({
            times: ctx => ctx.current.len, 
            repeatedParser: FixedSizeByteParser.init({ length: 1 })
        })
    }
})

let chrm_info = Struct.init({
    white_point: coord,
    rgb: RepeatParser.init({ times: 3, repeatedParser: coord })
})

let gama_info = Struct.init({
    gamma: Int32Parser.init()
})

let iccp_info = Struct.init({
    name: CStringParser.init(),
    compression_method,
    compressed_profile: FixedSizeByteParser.init({ length: ctx => ctx.parent.len - (ctx.current.name.length + 2) })
})

let sbit_info = Switch.init({
    expression: ctx => ctx.parent.image_header.color_type, 
    options: {
        greyscale: FixedSizeByteParser.init({ length: 1 }),
        truecolor: FixedSizeByteParser.init({ length: 3 }),
        indexed: FixedSizeByteParser.init({ length: 3 }),
        greywithalpha: FixedSizeByteParser.init({ length: 2 }),
        truewithalpha: FixedSizeByteParser.init({ length: 4 })
    }
})

let rendering_indent = EnumParser.init({
    options: {
        perceptual: 0,
        relative_colorimetric: 1,
        saturation: 2,
        absolute_colorimetric: 3,
        default: OPTION_DEFAULT
    }
})

let text_info = Struct.init({
    keyword: CStringParser.init(),
    text: FixedSizeByteParser.init({ length: ctx => ctx.parent.len - (ctx.current.keyword.length + 1) })
})

let ztxt_info = Struct.init({
    keyword: CStringParser.init(),
    compression_method,
    compressed_text: FixedSizeByteParser.init({ length: ctx => ctx.parent.len - (ctx.current.name.length + 2) })
})

let itxt_info = Struct.init({
    keyword: CStringParser.init(),
    compression_flag: FixedSizeByteParser.init({ length: 1 }),
    compression_method,
    language_tag: CStringParser.init(),
    translated_keyword: CStringParser.init(),
    text: FixedSizeByteParser.init({ length: ctx => ctx.parent.len - (ctx.current.keyword.length + ctx.current.language_tag.length + ctx.current.translated_keyword.length + 5) })
})

let bkgd_info = Switch.init({
    expression: ctx => ctx.parent.image_header.color_type, 
    options: {
        greyscale: Int16Parser.init(),
        greywithalpha: Int16Parser.init(),
        truecolor: RepeatParser.init({ times: 3, repeatedParser: Int16Parser.init() }),
        truewithalpha: RepeatParser.init({ times: 3, repeatedParser: Int16Parser.init() }),
        indexed: Int8Parser.init()
    }
})

// hist_info
let frequency = RepeatParser.init({
    times: ctx => ctx.parent.len / 2,
    repeatedParser: Int16Parser.init()
})

let phys_info = Struct.init({
    pixels_per_unit_x: Int32Parser.init(),
    pixels_per_unit_y: Int32Parser.init(),
    unit: EnumParser.init({
        options: {
            unknown: 1,
            meter: 1,
            default: OPTION_DEFAULT
        }
    })
})

let split_into_data_length = function (ctx) {
    let entry_size = 0
    if (ctx.current.sample_length === 8) {
        entry_size = 6
    } else {
        entry_size = 10
    }

    return (ctx.parent.len - ctx.current.name.length - 2) / entry_size
}

// splt_info
let data = Struct.init({
    name: CStringParser.init(),
    sample_depth: FixedSizeByteParser.init({ length: 1 }),
    table: IfThenElse.init({
        expression: ctx => ctx.current.sample_depth == 8,
        true: Struct.init({
            rgb: FixedSizeByteParser.init({ length: 3 }),
            alpha: FixedSizeByteParser.init({ length: 1 }),
            frequency: Int16Parser.init()
        }),
        false: Struct.init({
            rgb: FixedSizeByteParser.init({ length: 3 }),
            alpha: Int16Parser.init(),
            frequency: Int16Parser.init()
        })
    })
})

let time_info = Struct.init({
    year: Int16Parser.init(),
    month: FixedSizeByteParser.init({ length: 1 }),
    day: FixedSizeByteParser.init({ length: 1 }),
    hour: FixedSizeByteParser.init({ length: 1 }),
    minute: FixedSizeByteParser.init({ length: 1 }),
    second: FixedSizeByteParser.init({ length: 1 }),
})

let default_chunk_info = FixedSizeByteParser.init({ length: ctx => ctx.current.len })

let chunk = Struct.init({
    len: Int32Parser.init(),
    type: StringParser.init({ length: 4 }),
    data: Switch.init({
        expression: ctx => ctx.current.type,
        options: {
            "PLTE" : plte_info,
            "IEND" : EmptyParser.init(),
            "IDAT" : idat_info,
            "tRNS" : trns_info,
            "cHRM" : chrm_info,
            "gAMA" : gama_info,
            "iCCP" : iccp_info,
            "sBIT" : sbit_info,
            "sRGB" : rendering_indent,
            "tEXt" : text_info,
            "zTXt" : ztxt_info,
            "iTXt" : itxt_info,
            "bKGD" : bkgd_info,
            "hIST" : frequency,
            "pHYs" : phys_info,
            "sPLT" : data,
            "tIME" : time_info,
            OPTION_DEFAULT: default_chunk_info
        }
    }),
    crc: Int32Parser.init()
})

let image_header_chunk = Struct.init({
    len: Int32Parser.init(),
    signature: Const.init({ value: 'IHDR' }),
    width: Int32Parser.init(),
    height: Int32Parser.init(),
    bit_depth: FixedSizeByteParser.init({ length: 1 }),
    color_type: EnumParser.init({
        options: {
            greyscale: 0,
            truecolor: 2,
            indexed: 3,
            greywithalpha:4,
            truewithalpha: 6,
            default: OPTION_DEFAULT,
        }
    }),
    compression_method,
    filter_method: EnumParser.init({ options: { adaptive5: 0, default: OPTION_DEFAULT }}),
    interlace_method: EnumParser.init({ options: { none: 0, adam7: 1, default: OPTION_DEFAULT } }),
    crc: Int32Parser.init()
})

export let png_file = Struct.init({
    signature: Const.init({ value: [0x89].concat(_.map('PNG\r\n\x1a\n', v => v.charCodeAt(0))) }),
    image_header: image_header_chunk,
    chunks: GreedyRangeParser.init({ repeatedParser: chunk })
})