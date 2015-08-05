'use strict';

var chai = require('chai'),
    expect = chai.expect,
    path = require('path'),
    fs = require('fs'),
    Img = require('../../src/image');

chai.should();


describe('Image class', function(){

  describe('#format', function () {
    it('should normalise the format from the request', function(){
      var img = new Img({path: '/path/to/image.JPEG'});
      img.format = 'JPEG'
      img.format.should.equal('jpeg');
    });

    it('should still get format from a metadata request', function(){
      var img = new Img({path: '/path/to/image.jpg.json'});
      img.format.should.equal('jpeg');
    });
  });

  describe('#content', function () {
    it ('should set the format based on the image data', function () {
      var imgSrc = path.resolve(__dirname, '../sample_images/image1.jpg');
      var buf = fs.readFileSync(imgSrc);
      var img = new Img({path: '/path/to/image.jpg'});

      img.contents = buf;
      img.format.should.equal('jpeg');
    });
  });

  describe('#parseImage', function(){
    it('should retrieve image name from the path', function(){
      var img = new Img({path: '/path/to/image.jpg'});
      img.image.should.equal('image.jpg');
    });

    it('should retrieve image from the path with .json in title', function(){
      var img = new Img({path: '/path/to/some.image.with.json.jpg'});
      img.image.should.equal('some.image.with.json.jpg');
    });

    it('should retrieve image name from path even for metadata', function(){
      var img = new Img({path: '/path/to/image.jpg.json'});
      img.image.should.equal('image.jpg');
    });

    it('should handle image names with dashes', function(){
      var dashed = '8b0ccce0-0a6c-4270-9bc0-8b6dfaabea19.jpg',
          img = new Img({path: '/path/to/' + dashed});
      img.image.should.equal(dashed);
    });

    it('should handle metadata for image names with dashes', function(){
      var dashed = '8b0ccce0-0a6c-4270-9bc0-8b6dfaabea19.jpg',
          img = new Img({path: '/path/to/' + dashed + '.json'});
      img.image.should.equal(dashed);
    });

    it('should handle image names with underscores', function(){
      var underscored = '8b0ccce0_0a6c_4270_9bc0_8b6dfaabea19.jpg',
          img = new Img({path: '/path/to/' + underscored});
      img.image.should.equal(underscored);
    });

    it('should handle image names with periods', function(){
      var perioded = '8b0ccce0.0a6c.4270.9bc0.8b6dfaabea19.jpg',
          img = new Img({path: '/path/to/' + perioded});
      img.image.should.equal(perioded);
    });

    it('should handle metadata for image names with periods', function(){
      var perioded = '8b0ccce0.0a6c.4270.9bc0.8b6dfaabea19.jpg',
          img = new Img({path: '/path/to/' + perioded + '.json'});
      img.image.should.equal(perioded);
    });

    describe('#outputFormat', function () {
      it('should exclude second output format from image path', function(){
        var image = 'image.jpg',
            img = new Img({path: '/path/to/' + image + '.webp'});
        img.outputFormat.should.equal('webp');
        img.image.should.equal(image);
        img.path.should.equal('path/to/' + image);
      });

      it('should still get output format from perioded file name', function(){
        var image = '8b0ccce0.0a6c.4270.9bc0.8b6dfaabea19.jpg',
            img = new Img({path: '/path/to/' + image + '.webp'});
        img.outputFormat.should.equal('webp');
        img.image.should.equal(image);
        img.path.should.equal('path/to/' + image);
      });

    });
  });


  describe('#parseUrl', function(){
    it('should return a clean path', function(){
      var img = new Img({path: '/path/to/image.jpg.json'});
      img.path.should.equal('path/to/image.jpg');
    });
    it('should return path even with modifiers', function(){
      var img = new Img({path: '/s50-gne/path/to/image.jpg'});
      img.path.should.equal('path/to/image.jpg');
    });
    it('should return path when only the source is specified', function(){
      var img = new Img({path: '/elocal/path/to/image.jpg'});
      img.path.should.equal('path/to/image.jpg');
    });
  });


  describe('local formats', function(){
    it('should recognise a local source', function(){
      var localPath = '/elocal/path/to/image.png',
          img = new Img({path: localPath});
      img.modifiers.external.should.equal('local');
    });
  });


  // describe('bad formats', function(){
  //   it('should set error if the format is not valid', function(){
  //     var img = new Img({path: '/path/to/image.tiff'});
  //     img.error.message.should.eq(Img.formatErrorText);
  //   });
  // });


  it('should respond in an error state', function(){
    var img = new Img({path: '/path/to/image.jpg'});
    img.error = new Error('sample error');
    img.isError().should.be.true;
  });

});
