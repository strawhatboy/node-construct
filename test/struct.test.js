var expect = require('chai').expect;
var Struct = require('../lib/struct').Struct
var FixedSizeParser = require('../lib/parsers/BaseParser').FixedSizeParser
var Bits = require('buffer-bits')

describe('Struct', function() {
    it('normal parse', function() {
        var struct = Struct.init({ 
            one: FixedSizeParser.init({ length: 3 }),
            two: FixedSizeParser.init({ length: 5 })
        });

        var bits = Bits.from(Buffer.from([99]), 0, 8);
        var parseResult = struct.parse(bits, 0);
        var richString = parseResult.result.toRichString();
        //console.log(richString);
        expect(richString).equals('[Container Object] \r\n\tone = 0b011 (total 3)\r\n\ttwo = 0b00011 (total 5)\r\n');
    });

    it('nested parse', function() {
        var struct = Struct.init({ 
            one: FixedSizeParser.init({ length: 3 }),
            two: FixedSizeParser.init({ length: 5 }),
            three: Struct.init({
                hahaha: FixedSizeParser.init({ length: 4 }),
                hehehe: FixedSizeParser.init({ length: 4 }),
            })
        });

        var bits = Bits.from(Buffer.from([99, 98]), 0, 16);
        var parseResult = struct.parse(bits, 0);
        var richString = parseResult.result.toRichString();
        //console.log(richString);
        expect(richString).equals('[Container Object] \r\n\tone = 0b011 (total 3)\r\n\ttwo = 0b00011 (total 5)\r\n\tthree = [Container Object] \r\n\t\thahaha = 0b1001 (total 4)\r\n\t\thehehe = 0b0010 (total 4)\r\n\r\n');
    });
});