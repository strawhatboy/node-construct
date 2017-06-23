var png = require('../../lib/examples/png').png_file;
var fs = require('fs');
var path = require('path');
var Bits = require('buffer-bits');

describe('Examples - png', function() {
    it('should be able to parse a png file', function() {
        var fileContent = fs.readFileSync(path.join(__dirname, './sample.png'));
        var bits = Bits.from(fileContent);
        var parseResult = png.parse(bits);
        console.log(parseResult.result.toRichString());
    });

    it('should be able to parse a big? png file', function() {
        var fileContent = fs.readFileSync(path.join(__dirname, './screencapture-github-strawhatboy-node-construct.png'));
        var bits = Bits.from(fileContent);
        var parseResult = png.parse(bits);
        console.log(parseResult.result.toRichString());
    });
});