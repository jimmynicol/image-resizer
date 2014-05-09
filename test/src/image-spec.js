'use strict';

var chai = require('chai'),
    expect = chai.expect,
    Img = require('../../src/image');

chai.should();


describe('Image class', function(){


  describe('#parseImage()', function(){
    it('should determine the format from the request', function(){
      var img = new Img({path: '/path/to/image.jpg'});
      img.format.should.equal('jpg');
    });

    it('should still get format from a metadata request', function(){
      var img = new Img({path: '/path/to/image.jpg.json'});
      img.format.should.equal('jpg');
    });

    it('should retrieve image name from the path', function(){
      var img = new Img({path: '/path/to/image.jpg'});
      img.image.should.equal('image.jpg');
    });

    it('should retrieve image name from path even for metadata', function(){
      var img = new Img({path: '/path/to/image.jpg.json'});
      img.image.should.equal('image.jpg');
    });
  });


  describe('#parseUrl()', function(){
    it('should return a clean path', function(){
      var img = new Img({path: '/path/to/image.jpg.json'});
      img.path.should.equal('path/to/image.jpg');
    });
    it('should return path even with modifiers', function(){
      var img = new Img({path: '/s50-gne/path/to/image.jpg'});
      img.path.should.equal('path/to/image.jpg');
    });
  });


  it('should respond in an error state', function(){
    var img = new Img({path: '/path/to/image.jpg'});
    img.error = new Error('sample error');
    img.isError().should.be.true;
  });

});
