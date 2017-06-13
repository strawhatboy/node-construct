import { Int32Parser, EnumParser, OPTION_DEFAULT, Computed, Switch, IfThenElse, RepeatParser, Int8Parser, Int16Parser, FixedSizeByteParser, CStringParser } from '../parsers'
import { Struct } from '../struct'

let coord = Struct.init({
    x: Int32Parser.init(),
    y: Int32Parser.init()
})

let compression_method = EnumParser.init({ options: { deflate: 0, default: OPTION_DEFAULT } })

let plte_info = Struct.init({
    num_entries: Computed.init(ctx => ctx.getParent().len / 3),
    palatte_entries: RepeatParser.init({ 
        times: ctx => ctx.num_entries,
        repeatedParser: FixedSizeByteParser.init({ length: 3 })
    })
})

let idat_info = FixedSizeByteParser.init({ length: ctx => ctx.length })

let trns_info = Switch.init({ 
    expression: ctx => ctx.getParent().image_header.color_type, 
    options: {
        greyscale: Int16Parser.init(),
        truecolor: RepeatParser.init({ times: 3, repeatedParser: Int16Parser.init() }),
        indexed: RepeatParser.init({
            times: ctx => ctx.len, 
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
    compressed_profile: FixedSizeByteParser({ length: ctx => ctx.getParent().len - (ctx.name.length + 2) })
})

let sbit_info = Switch.init({
    expression: ctx => ctx.getParent().image_header.color_type, 
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
    text: FixedSizeByteParser({ length: ctx => ctx.getParent().len - (ctx.keyword.length + 1) })
})

let ztxt_info = Struct.init({
    keyword: CStringParser.init(),
    compression_method,
    compressed_text: FixedSizeByteParser({ length: ctx => ctx.getParent().len - (ctx.name.length + 2) })
})

let itxt_info = Struct.init({
    keyword: CStringParser.init(),
    compression_flag: FixedSizeByteParser.init({ length: 1 }),
    compression_method,
    language_tag: CStringParser.init(),
    translated_keyword: CStringParser.init(),
    text: FixedSizeByteParser({ length: ctx => ctx.getParent().len - (ctx.keyword.length + ctx.language_tag.length + ctx.translated_keyword.length + 5) })
})

let bkgd_info = Switch.init({
    expression: ctx => ctx.getParent().image_header.color_type, 
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
    times: ctx => ctx.getParent().len / 2,
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
    if (ctx.sample_length === 8) {
        entry_size = 6
    } else {
        entry_size = 10
    }

    return (ctx.getParent().len - ctx.name.length - 2) / entry_size
}

// splt_info
let data = Struct.init({
    name: CStringParser.init(),
    sample_depth: FixedSizeByteParser.init({ length: 1 }),
    table: IfThenElse.init({
        expression: ctx => ctx.sample_depth == 8,
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
