var chai, expect, parser, pg;

chai = require('chai');
expect = chai.expect;
chai.should();
pg = require('./fixtures').pathGenerator;

parser = require('../lib/request_parser');

describe('request_parser', function() {
  var request;

  request = {
    url: pg().path
  };

  it('should return a payload', function() {
    var payload;
    payload = parser(request);
    payload.should.have.property('href');
    payload.should.have.property('dir');
    payload.should.have.property('filename');
    return payload.should.have.property('ext');
  });

  it('should set the url correctly to href property', function() {
    return parser(request).href.should.equal(request.url);
  });

  it('should extract the extension correctly', function() {
    parser(request).ext.should.equal('jpg');
    request = {
      url: pg({
        ext: 'png'
      }).path
    };
    parser(request).ext.should.equal('png');
    request = {
      url: pg({
        ext: 'jpeg'
      }).path
    };
    parser(request).ext.should.equal('jpeg');
    request = {
      url: pg({
        ext: 'gif'
      }).path
    };
    return parser(request).ext.should.equal('gif');
  });

  it('should extract the directory correctly', function() {
    return parser(request).dir.should.equal(pg().dir);
  });

  it('should extract the filename correctly', function() {
    return parser(request).filename.should.equal(pg().uuid);
  });

  describe('options parser', function() {
    it('should set square options correctly', function() {
      var payload;
      request = {
        url: pg({
          query: 's=300'
        }).path
      };
      payload = parser(request);
      payload.options.action.should.equal('square');
      payload.options.width.should.equal('300');
      return payload.options.height.should.equal('300');
    });
    it('should set height properly', function() {
      var payload;
      request = {
        url: pg({
          query: 'h=400'
        }).path
      };
      payload = parser(request);
      payload.options.action.should.equal('resize');
      return payload.options.height.should.equal('400');
    });
    it('should set width properly', function() {
      var payload;
      request = {
        url: pg({
          query: 'w=400'
        }).path
      };
      payload = parser(request);
      payload.options.action.should.equal('resize');
      return payload.options.width.should.equal('400');
    });
    it('should set height and width together', function() {
      var payload;
      request = {
        url: pg({
          query: 'h=400&width=300'
        }).path
      };
      payload = parser(request);
      payload.options.action.should.equal('resize');
      payload.options.height.should.equal('400');
      return payload.options.width.should.equal('300');
    });
    return it('should set crop options correctly', function() {
      var payload;
      request = {
        url: pg({
          query: 'c=100,200,300,400'
        }).path
      };
      payload = parser(request);
      payload.options.action.should.equal('crop');
      payload.options.width.should.equal('100');
      payload.options.height.should.equal('200');
      payload.options.cropX.should.equal('300');
      return payload.options.cropY.should.equal('400');
    });
  });
});