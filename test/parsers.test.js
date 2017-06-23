var expect = require('chai').expect;
var Struct = require('../lib/struct').Struct;
var IntParser = require('../lib/parsers').IntParser;
var StringParser = require('../lib/parsers').StringParser;
var CStringParser = require('../lib/parsers').CStringParser;
var PascalStringParser = require('../lib/parsers').PascalStringParser;
var GreedyStringParser = require('../lib/parsers').GreedyStringParser;
var FlagParser = require('../lib/parsers').FlagParser;
var EnumParser = require('../lib/parsers').EnumParser;
var OPTION_DEFAULT = require('../lib/parsers').OPTION_DEFAULT;
var FlagsEnumParser = require('../lib/parsers').FlagsEnumParser;
var IpAddressParser = require('../lib/parsers').IpAddressParser;
var Switch = require('../lib/parsers').Switch;
var IfThenElse = require('../lib/parsers').IfThenElse;
var Const = require('../lib/parsers').Const;
var EmptyParser = require('../lib/parsers').EmptyParser;

var ParseException = require('../lib/exceptions').ParseException;
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
            expect(richString).equals('[Container Object] ' + EOL + '\tone = gg' + EOL + '');
            // only 2 bytes and the stop char parsed
            expect(parseResult.nextOffset).equals(16);
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

        it('should be able to parse Enums with default value', function() {
            var struct = Struct.init({
                one: EnumParser.init({ 
                    options: {
                        optionA: 20,
                        optionB: 30,
                        optionC: 40,
                        optionDefault: OPTION_DEFAULT
                    },
                    isSigned: false // Unsigned int
                })
            });

            var bits = Bits.from(Buffer.from('\x99'), 0, 8);
            var parsedResult = struct.parse(bits, 0);
            expect(parsedResult.result.toRichString()).equals('[Container Object] ' + EOL + '\tone = optionDefault' + EOL);
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
            expect(parsedResult.result.toRichString()).equals('[Container Object] ' + EOL + '\tone = [optionB, optionC, optionD, optionE]' + EOL);
        });
    });

    describe('IpAddressParser', function() {
        it('should be able to parse IpAddress', function() {
            var struct = Struct.init({
                one: IpAddressParser.init()
            });

            var bits = Bits.from(Buffer.from('\x1E\x99\x23\x93'), 0, 32);
            var parsedResult = struct.parse(bits, 0);
            expect(parsedResult.result.toRichString()).equals('[Container Object] ' + EOL + '\tone = 30.194.153.35' + EOL);
        });
    });

    describe('SwitchParser', function() {
        var struct = Struct.init({
            len: IntParser.init({ length: 8 }),
            value: Switch.init({
                expression: ctx => ctx.current.len,
                options: {
                    1: IntParser.init({ length: 8 }),
                    2: IntParser.init({ length: 16 }),
                    3: IntParser.init({ length: 32 }),
                    OPTION_DEFAULT: EmptyParser.init()
                }
            })
        });

        it('should be able to switch between different parsers according to context - A', function() {
            var bits = Bits.from(Buffer.from('\x01\x02\x03\x04\x05\x06\x07'));
            var result = struct.parse(bits, 0)
            expect(result.result.toRichString()).equals('[Container Object] ' + EOL + '\tlen = 1' + EOL + '\tvalue = 2' + EOL);
        });

        it('should be able to switch between different parsers according to context - B', function() {
            var bits = Bits.from(Buffer.from('\x02\x02\x03\x04\x05\x06\x07'));
            var result = struct.parse(bits, 0)
            expect(result.result.toRichString()).equals('[Container Object] ' + EOL + '\tlen = 2' + EOL + '\tvalue = 515' + EOL);
        });
            
        it('should be able to switch between different parsers according to context - C', function() {
            var bits = Bits.from(Buffer.from('\x03\x02\x03\x04\x05\x06\x07'));
            var result = struct.parse(bits, 0)
            expect(result.result.toRichString()).equals('[Container Object] ' + EOL + '\tlen = 3' + EOL + '\tvalue = 33752069' + EOL);
        });
            
        it('should be able to switch between different parsers according to context - D', function() {
            var bits = Bits.from(Buffer.from('\x04\x02\x03\x04\x05\x06\x07'));
            var result = struct.parse(bits, 0)
            expect(result.result.toRichString()).equals('[Container Object] ' + EOL + '\tlen = 4' + EOL + '\tvalue = undefined' + EOL);
        });
    })

    describe('IfElseThenParser', function() {
        var struct = Struct.init({
            len: IntParser.init({ length: 8 }),
            value: IfThenElse.init({
                expression: ctx => ctx.current.len === 1,
                true: IntParser.init({ length: 8 }),
                false: IntParser.init({ length: 16 })
            })
        });

        it('should be able to go to different branch according to the expression - true', function() {
            var bits = Bits.from(Buffer.from('\x01\x02\x03\x04\x05\x06\x07'));
            var result = struct.parse(bits, 0)
            expect(result.result.toRichString()).equals('[Container Object] ' + EOL + '\tlen = 1' + EOL + '\tvalue = 2' + EOL);
        });

        it('should be able to go to different branch according to the expression - false', function() {
            var bits = Bits.from(Buffer.from('\x03\x02\x03\x04\x05\x06\x07'));
            var result = struct.parse(bits, 0)
            expect(result.result.toRichString()).equals('[Container Object] ' + EOL + '\tlen = 3' + EOL + '\tvalue = 515' + EOL);
        });

        it('should be able to go to different branch according to the expression - more false', function() {
            var bits = Bits.from(Buffer.from('\x09\x02\x03\x04\x05\x06\x07'));
            var result = struct.parse(bits, 0)
            expect(result.result.toRichString()).equals('[Container Object] ' + EOL + '\tlen = 9' + EOL + '\tvalue = 515' + EOL);
        });
    })

    describe('ConstParser', function() {
        var struct = Struct.init({
            len: Const.init({ value: '\x09\x33' })
        });

        it('should be able to parse const values', function() {
            var bits = Bits.from(Buffer.from('\x09\x33\x03\x04\x05\x06\x07'));
            var result = struct.parse(bits, 0)
            expect(result.result.toRichString()).equals('[Container Object] ' + EOL + '\tlen = 0b0000100100110011 (total 16)' + EOL);
        });

        it('should throw if the const value does not match', function() {
            var bits = Bits.from(Buffer.from('\x09\x32\x03\x04\x05\x06\x07'));
            var func = struct.parse.bind(struct, bits, 0)
            expect(func).to.throw(Error)
        });
    })
});