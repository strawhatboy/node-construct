var expect = require('chai').expect;
var container = require('../lib/container');
var _ = require('lodash');
var EOL = require('os').EOL;
var Bits = require('buffer-bits');

describe('Container', function() {
    describe('ctor', function() {
        it('should be able to allow chained initialization', function() {
            var c = new container.Container({a: 1})
            c.pyCall({b: 2})
                .pyCall({c: 3})
                .pyCall({d: 4});
            expect(c.equals(new container.Container(c))).to.be.true;
        });

        it('should be able to allow array of object', function() {
            var c = new container.Container([{a: 1}]);
            var d = new container.Container({'a': 1});
            expect(c.equals(d)).to.be.true;
        });

        it('should be able to allow array of object with multiple itmes', function() {
            var c = new container.Container([{ a: 1 }, { b: 2 }, { c: 3 }]);
            var d = new container.Container({ a: 1, b: 2, c: 3});
            expect(c.equals(d)).to.be.true;
        });

        // TODO: pickle ?
    });

    describe('item operation', function() {
        it('should be able to get item', function() {
            var c = new container.Container({ a: 1 });
            expect(c['a']).equals(1);
            expect(c.a).equals(1);
        });

        it('should be able to set item', function() {
            var c = new container.Container();
            c.a = 1;
            expect(c['a']).equals(1);
            expect(c.a).equals(1);
            expect(c.items.a).equals(1);
            expect(c.keys[0]).equals('a');

            c['a'] = 2;
            expect(c['a']).equals(2);
            expect(c.a).equals(2);
            expect(c.items.a).equals(2);
        });

        it('should be able to delete item', function() {
            var c = new container.Container({ a: 1, b: 2 });
            delete c.a;
            expect(c.keys.length).equals(1);
            expect(c.a).to.be.undefined;
            expect(c.items.a).to.be.undefined;
            delete c.b;
            expect(c.keys.length).equals(0);
            expect(c.b).to.be.undefined;
            expect(c.items.b).to.be.undefined;

            expect(c.equals(new container.Container())).to.be.true;
        });

        it('should be able to update from container', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            var d = new container.Container();
            d.update(c);
            expect(d.a).equals(1);
            expect(d.b).equals(2);
            expect(d.c).equals(3);
            expect(d.d).equals(4);

            expect(c.equals(d)).to.be.true;
            // list?
        });

        it('should be able to update from dict', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            var d = new container.Container();
            d.update({ a: 1, b: 2, c: 3, d: 4});
            expect(d.a).equals(1);
            expect(d.b).equals(2);
            expect(d.c).equals(3);
            expect(d.d).equals(4);

            expect(c.equals(d)).to.be.true;
            // list?
        });

        it('should be able to pop', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            expect(c.pop('b')).equals(2);
            expect(c.pop('d')).equals(4);
            expect(c.pop('a')).equals(1);
            expect(c.pop('c')).equals(3);

            expect(c.equals(new container.Container())).to.be.true;
        });

        it('should be able to pop item', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            expect(c.popItem()).deep.equals({ d: 4 });
            expect(c.popItem()).deep.equals({ c: 3 });
            expect(c.popItem()).deep.equals({ b: 2 });
            expect(c.popItem()).deep.equals({ a: 1 });
            expect(c.popItem()).to.be.undefined;

            expect(c.equals(new container.Container())).to.be.true;
        });

        it('should be able to clear itself', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            c.clear();
            expect(c.equals(new container.Container())).to.be.true;
        });

        it('should be able to get keys, values, items', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            expect(c.items).deep.equals({ a: 1, b: 2, c: 3, d: 4});
            expect(c.values).deep.equals([1, 2, 3, 4]);
            expect(c.keys).deep.equals(['a', 'b', 'c', 'd']);
        });
    });

    describe('equals', function() {
        it('should be able to return boolean when comparing to others', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4, e: 5});
            var d = new container.Container({ a: 1, b: 2, c: 3, d: 4, e: 5});
            expect(c.equals(c)).to.be.true;
            expect(c.equals(d)).to.be.true;
        });

        it('should be able to return false when comparing to others', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            var d = new container.Container({ a: 1, b: 2, c: 3, d: 4, e: 5});
            expect(c.equals(d)).to.be.false;
            expect(d.equals(c)).to.be.false;
        });

        it('should be able to return false when comparing to another object', function() {
            var c = new container.Container({ a: 1 });
            var d = { a: 1 };
            expect(c.equals(d)).to.be.false;
        });

        it('should be able to return false when comparing to another container with same length', function() {
            var c = new container.Container({ a: 1 });
            var d = new container.Container({ b: 1 });
            expect(c.equals(d)).to.be.false;
        });

        it('should be able to return false when comparing to another container with different value', function() {
            var c = new container.Container({ a: 1 });
            var d = new container.Container({ a: 2 });
            expect(c.equals(d)).to.be.false;
        });
    });

    describe('clone', function() {
        it('should be able to clone itself', function() {
            var c = new container.Container({ a: 1 });
            var d = new container.Container(c);
            expect(c.equals(d)).to.be.true;
            expect(c).not.equals(d);
        });

        it('should be able to be cloned by other libraries', function() {
            var c = new container.Container({ a: 1 });
            var d = _.cloneDeep(c);
            expect(c.equals(d)).to.be.true;
            expect(c).not.equals(d);
        });
    });

    describe('props', function() {
        it('should be able to get length', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            expect(c.length).equals(4);
            c = new container.Container();
            expect(c.length).equals(0);
        });

        it('should be able to support the "in" operator', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            expect('a' in c).to.be.true;
            expect('e' in c).to.be.false;
        });
    });

    describe('to string', function() {
        it('should be able to convert itself (empty) to string', function() {
            var c = new container.Container();
            expect(c.toString()).equals('[Container Object]');
        });

        it('should be able to convert itself (empty) to simple string', function() {
            var c = new container.Container();
            expect(c.toSimpleString()).equals('[Container Object] ');
        });

        it('should be able to convert itself (empty) to rich string', function() {
            var c = new container.Container();
            expect(c.toRichString()).equals('[Container Object] ' + EOL);
        });

        it('should be able to convert itself to string', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            expect(c.toString()).equals('[Container Object]');
        });

        it('should be able to convert itself to simple string', function() {
            var c = new container.Container({ a: 1, b: 2, c: 3, d: 4});
            expect(c.toSimpleString()).equals('[Container Object] (a=1)(b=2)(c=3)(d=4)');
        });

        it('should be able to convert itself to rich string', function() {
            var c = new container.Container({ a: 1, b: 2 });
            expect(c.toRichString()).equals('[Container Object] ' + EOL + '\ta = 1' + EOL + '\tb = 2' + EOL);
        });

        it('should be able to convert itself (nested) to simple string', function() {
            var c = new container.Container({ a: 1, b: new container.Container({ b: 2 }) });
            expect(c.toSimpleString()).equals('[Container Object] (a=1)(b=[Container Object] (b=2))');
        });

        it('should be able to convert itself (nested) to simple string with circular detect', function() {
            var c = new container.Container({ a: 1, b: new container.Container({ b: 2 }) });
            c.c = c;
            expect(c.toSimpleString()).equals('[Container Object] (a=1)(b=[Container Object] (b=2))(c=<circular detected>)');
        });

        it('should be able to convert itself to rich string with Bits inside', function() {
            var bits = Bits.from(Buffer.from([99]), 1, 3);
            var c = new container.Container({ a: bits });
            expect(c.toRichString()).equals(`[Container Object] ${EOL}\ta = 0b110 (total 3)${EOL}`)
        });

        it('should be able to convert itself to rich string with Bits inside', function() {
            var bits = Bits.from(Buffer.from([99]), 1, 3);
            var c = new container.Container({ a: bits });
            expect(c.toRichString()).equals(`[Container Object] ${EOL}\ta = 0b110 (total 3)${EOL}`)
        });

        it('should be able to convert itself to rich string with more than 32 Bits inside', function() {
            var bits = Bits.from(Buffer.from([99, 99, 99, 99, 99]), 1, 33);
            var c = new container.Container({ a: bits });
            expect(c.toRichString()).equals(`[Container Object] ${EOL}\ta = 0b110001101100011011000110110... (total 33)${EOL}`)
        });
    });
});

describe('Flags Container', function() {

    it('to string', function() {
        var c = new container.FlagsContainer({ a: true, b: false, c: true, d: false });
        expect(c.toSimpleString()).equals('[FlagsContainer Object] (a=true)(b=false)(c=true)(d=false)');
    });
    
    it('equals', function() {
        var c = new container.FlagsContainer({ a: true, b: false, c: true, d: false });
        var d = new container.FlagsContainer({ a: true, b: false, c: true, d: false });
        expect(c.equals(d)).to.be.true;
    });
});

describe('List Container', function() {
    it('to string', function() {
        var c = new container.ListContainer(1, 2, 3, 4, 5);
        //c.push(1); c.push(2); c.push(3); c.push(4); c.push(5);
        expect(c.toString()).equals('[ListContainer Object]');
        expect(c.toSimpleString()).equals('[ListContainer Object] 1, 2, 3, 4, 5');
    });

    it('to string2', function() {
        var c = new container.ListContainer(1, 2, 3, 4, 5);
        c.items = c.items.concat(c.items);
        //c.push(1); c.push(2); c.push(3); c.push(4); c.push(5);
        expect(c.toString()).equals('[ListContainer Object]');
        expect(c.toSimpleString()).equals('[ListContainer Object] 1, 2, 3, 4, 5, 1, 2, 3, 4, 5');
    });
});