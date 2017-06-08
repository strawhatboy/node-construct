var expect = require('chai').expect;
var IpAddressBuilder = require('../lib/parsers/OtherParser').IpAddressBuilder;

describe('IpAddressBuilder test', function() {
    it('should be able to build IpV4 address from array', function() {
        var ipAddress = IpAddressBuilder.init();
        var result = ipAddress.build([20, 30, 40, 50]);
        expect(result.toString()).equals('[Bits Object]');
        expect(result.buffer[0]).equals(20);
        expect(result.buffer[1]).equals(30);
        expect(result.buffer[2]).equals(40);
        expect(result.buffer[3]).equals(50);
    });

    it('should be able to build IpV4 address from string', function() {
        var ipAddress = IpAddressBuilder.init();
        var result = ipAddress.build('20.30.40.50');
        expect(result.toString()).equals('[Bits Object]');
        expect(result.buffer[0]).equals(20);
        expect(result.buffer[1]).equals(30);
        expect(result.buffer[2]).equals(40);
        expect(result.buffer[3]).equals(50);
    });

    it('should be able to build IpV4 address from literal arguments', function() {
        var ipAddress = IpAddressBuilder.init();
        var result = ipAddress.build(20, 30, 40, '50');
        expect(result.toString()).equals('[Bits Object]');
        expect(result.buffer[0]).equals(20);
        expect(result.buffer[1]).equals(30);
        expect(result.buffer[2]).equals(40);
        expect(result.buffer[3]).equals(50);
    });
});