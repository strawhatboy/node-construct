var expect = require('chai').expect;
var container = require('../lib/container')

describe('Container', function() {
    describe('ctor', function() {
        it('should be able to allow chained initialization', function() {
            var c = new container.Container({a: 1})
            c.pyCall({b: 2})
                .pyCall({c: 3})
                .pyCall({d: 4});
            expect(c.equals(new container.Container(c))).to.be.true;
        });
    });
});