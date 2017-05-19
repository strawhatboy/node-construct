var expect = require('chai').expect;
var Struct = require('../lib/struct').Struct
var IntParser = require('../lib/parsers/IntParser').default
var StringParser = require('../lib/parsers/StringParser').default
var Bits = require('buffer-bits')

describe('IntParser', function() {
    it('should be able to parse integer', function() {
        var struct = Struct.init({ 
            one: IntParser.init({ length: 3 }),
            two: IntParser.init({ length: 5 })
        });

        let bits = Bits.from(Buffer.from([99]), 0, 8);
        let parseResult = struct.parse(bits, 0);
        let richString = parseResult.result.toRichString();
        //console.log(richString);
        expect(richString).equals('[Container Object] \r\n\tone = 3\r\n\ttwo = 3\r\n');
    });
});

describe('StringParser', function() {
    it('should be able to parse string', function() {
        var struct = Struct.init({ 
            one: IntParser.init({ length: 3 }),
            two: StringParser.init({ length: 1 }),
            three: IntParser.init({ length: 5 })
        });

        let bits = Bits.from(Buffer.from('gg'), 0, 16);
        expect(bits.toBinaryString()).equals('0b0110011101100111');
        let parseResult = struct.parse(bits, 0);
        let richString = parseResult.result.toRichString();
        //console.log(richString);
        expect(richString).equals('[Container Object] \r\n\tone = 3\r\n\ttwo = \u003B\r\n\tthree = 7\r\n');
    });
});