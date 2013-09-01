'use strict';

var chai, expect, sm, pg, Img;

chai   = require('chai');
expect = chai.expect;
sm     = require('sandboxed-module');
pg     = require('./fixtures').pathGenerator;

chai.should();

Img = sm.require('../lib/image', {
  requires: {
    './redis': {
      get: 'get',
      set: 'set',
      setnx: 'setnx',
      lock: 'lock',
      ping: 'ping'
    },
    './s3': {
      getFile: 'getFile',
      upload: 'upload'
    }
  }
});


describe('Image', function(){
  var request;

  request = { url: pg().path };

  it('should set some variables on initialization', function(){
    var i = new Img(request);
    i.dir.should.equal(pg().dir);
  });

  describe('#_optionsString', function(){
    it('should set the appropriate string', function(){
      request.url = pg({query: 'h=50&width=50'}).path;
      var i = new Img(request);
      i._optionsString().should.match(/_ar_w50_h50/);
    });

    it('should not include crop dimensions in basic request', function(){
      var i = new Img(request);
      i._optionsString().should.not.match(/_cx/);
      i._optionsString().should.not.match(/_cy/);
    });
  });

});