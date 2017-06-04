var expect = require('chai').expect;
var Struct = require('../lib/struct').Struct;
var IntParser = require('../lib/parsers/IntParser').default;
var StringParser = require('../lib/parsers/StringParser').default;
var CStringParser = require('../lib/parsers/StringParser').CStringParser;
var PascalStringParser = require('../lib/parsers/StringParser').PascalStringParser;
var GreedyStringParser = require('../lib/parsers/StringParser').GreedyStringParser;
var FlagParser = require('../lib/parsers/ShortParser').FlagParser;
var EnumParser = require('../lib/parsers/ShortParser').EnumParser;
var FlagsEnumParser = require('../lib/parsers/ShortParser').FlagsEnumParser
var Bits = require('buffer-bits');
var EOL = require('os').EOL;

describe('IntParser', function() {
    it('should be able to parse integer', function() {
        var struct = Struct.init({ 
            one: IntParser.init({ length: 3 }),
            two: IntParser.init({ length: 5 })
        });

        var bits = Bits.from(Buffer.from([99]), 0, 8);
        var parseResult = struct.parse(bits, 0);
        var richString = parseResult.result.toRichString();
        //console.log(richString);
        expect(richString).equals('[Container Object] ' + EOL + '\tone = 3' + EOL + '\ttwo = 3' + EOL + '');
    });
});

describe('StringParser', function() {
    it('should be able to parse string', function() {
        var struct = Struct.init({ 
            one: IntParser.init({ length: 3 }),
            two: StringParser.init({ length: 1 }),
            three: IntParser.init({ length: 5 })
        });

        var bits = Bits.from(Buffer.from('gg'), 0, 16);
        expect(bits.toBinaryString()).equals('0b0110011101100111');
        var parseResult = struct.parse(bits, 0);
        var richString = parseResult.result.toRichString();
        //console.log(richString);
        expect(richString).equals('[Container Object] ' + EOL + '\tone = 3' + EOL + '\ttwo = \u003B' + EOL + '\tthree = 7' + EOL + '');
    });

    describe('CStringParser', function() {
        it('should be able to parse CString - ended by \\x00', function() {
            var struct = Struct.init({ 
                one: CStringParser.init()
            });

            var bits = Bits.from(Buffer.from('gg\x00666'), 0, 36);
            var parseResult = struct.parse(bits, 0);
            var richString = parseResult.result.toRichString();
            expect(richString).equals('[Container Object] ' + EOL + '\tone = gg\x00' + EOL + '');
            // only 2 bytes and the stop char parsed
            expect(parseResult.nextOffset).equals(24);
        });
    });

    describe('PascalStringParser', function() {
        it('should be able to parse PascalString - 1st byte tell the length', function() {
            var struct = Struct.init({ 
                one: PascalStringParser.init()
            });

            var bits = Bits.from(Buffer.from('\x03g6gppqqpq'), 0, 64);
            var parseResult = struct.parse(bits, 0);
            var richString = parseResult.result.toRichString();
            expect(richString).equals('[Container Object] ' + EOL + '\tone = g6g' + EOL + '');
            expect(parseResult.nextOffset).equals(32);
        });
    });

    describe('GreedyStringParser', function() {
        it('should be able to parse GreedyStringParser - parse to end of the bits', function() {
            var struct = Struct.init({ 
                one: GreedyStringParser.init()
            });

            var bits = Bits.from(Buffer.from('\x03g6gppqqpq'), 0, 64);
            var parseResult = struct.parse(bits, 0);
            var richString = parseResult.result.toRichString();
            expect(richString).equals('[Container Object] ' + EOL + '\tone = \x03g6gppqq' + EOL + '');
            expect(parseResult.nextOffset).equals(64);
        });
    });
});

describe('Short parsers', function() {
    describe('FlagParser', function() {
        it('should be able to parse flag', function() {
            var struct = Struct.init({
                one: FlagParser.init()
            });

            var bits = Bits.from(Buffer.from('\x03g6gppqqpq'), 0, 64);
            var parseResult = struct.parse(bits, 0);
            var richString = parseResult.result.toRichString();
            expect(richString).equals('[Container Object] ' + EOL + '\tone = false' + EOL + '');
            expect(parseResult.nextOffset).equals(1);
        });

        it('should be able to parse byte flag - false', function() {
            var struct = Struct.init({
                one: FlagParser.init({length: 8})
            });

            var bits = Bits.from(Buffer.from('\x00g6gppqqpq'), 0, 64);
            var parseResult = struct.parse(bits, 0);
            var richString = parseResult.result.toRichString();
            expect(richString).equals('[Container Object] ' + EOL + '\tone = false' + EOL + '');
            expect(parseResult.nextOffset).equals(8);
        });

        it('should be able to parse byte flag - true', function() {
            var struct = Struct.init({
                one: FlagParser.init({length: 8})
            });

            var bits = Bits.from(Buffer.from('\x03g6gppqqpq'), 0, 64);
            var parseResult = struct.parse(bits, 0);
            var richString = parseResult.result.toRichString();
            expect(richString).equals('[Container Object] ' + EOL + '\tone = true' + EOL + '');
            expect(parseResult.nextOffset).equals(8);
        });
    });

    describe('EnumParser', function() {
        it('should be able to parse Enums', function() {
            var struct = Struct.init({
                one: EnumParser.init({ 
                    options: {
                        optionA: 20,
                        optionB: 30,
                        optionC: 40
                    },
                    isSigned: false // Unsigned int
                })
            });

            var bits = Bits.from(Buffer.from('\x1E'), 0, 8);
            var parsedResult = struct.parse(bits, 0);
            expect(parsedResult.result.toRichString()).equals('[Container Object] ' + EOL + '\tone = optionB' + EOL);
        });

        it('should be able to parse FlagsEnum', function() {
            var struct = Struct.init({
                one: FlagsEnumParser.init({ 
                    options: {
                        optionA: 1,
                        optionB: 2,
                        optionC: 4,
                        optionD: 8,
                        optionE: 16
                    }
                })
            });
            
            var bits = Bits.from(Buffer.from('\x1E'), 0, 8);
            var parsedResult = struct.parse(bits, 0);
            expect(parsedResult.result.toRichString()).equals('[Container Object] ' + EOL + '\tone = optionB,optionC,optionD,optionE' + EOL);
        });
    });
});