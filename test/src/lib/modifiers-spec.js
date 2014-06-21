'use strict';

var chai   = require('chai'),
    expect = chai.expect,
    sm     = require('sandboxed-module'),
    mod    = require('../../../src/lib/modifiers');

chai.should();


describe('Modifiers module', function(){

  // Metadata calls
  describe('Metadata request', function(){
    it('should recognise a metadata call', function(){
      var request = '/path/to/image.png.json';
      mod.parse(request).action.should.equal('json');
    });

    it('should disregard modifiers in a metadata call', function(){
      var request = '/s50-gne/path/to/image.png.json';
      mod.parse(request).action.should.equal('json');
    });
  });


  // Original image
  describe('No modifiers', function(){
    it('should recognise no modifiers and return original action', function(){
      var request = '/path/to/image.png';
      mod.parse(request).action.should.equal('original');
    });

    it('should not return original if there are valid modifiers', function(){
      var request = '/h500/path/to/image.jpg';
      mod.parse(request).action.should.not.equal('original');
      request = '/h500-gne/path/to/image.jpg';
      mod.parse(request).action.should.not.equal('original');
    });
  });


  // Gravity
  describe('Gravity', function(){
    it('should read gravity as a modifier string', function(){
      var request = '/s50-gne/path/to/image.jpg';
      mod.parse(request).gravity.should.equal('ne');
    });

    it('gravity should not be case sensitive', function(){
      var request = '/s50-gNE/path/to/image.jpg';
      mod.parse(request).gravity.should.equal('ne');
    });

    it('should not accept a non-valid gravity value', function(){
      var request = '/s50-gnorth/path/to/image.jpg';
      mod.parse(request).gravity.should.not.equal('north');
    });

    it('should set the action to square', function(){
      var request = '/s50-gne/path/to/image.jpg';
      mod.parse(request).action.should.equal('square');
    });

    it('should set the action to crop', function(){
      var request = '/h400-w600-gse/path/to/image.jpg';
      mod.parse(request).action.should.equal('crop');
    });
  });


  // Square
  describe('Square', function(){
    it('should set action to square', function(){
      var request = '/s500/path/to/image.jpg';
      mod.parse(request).action.should.equal('square');
    });

    it('should set the height and width correctly', function(){
      var request = '/s500/path/to/image.jpg';
      mod.parse(request).height.should.equal(500);
      mod.parse(request).width.should.equal(500);
    });

    it('should not allow a crop value other than the fill', function(){
      var request = '/s500-gne-cfill/image.jpg';
      mod.parse(request).crop.should.equal('fill');
    });
  });


  // Height
  describe('Height requests', function(){
    it('should set the action to resize', function(){
      var request = '/h400/path/to/image.png';
      mod.parse(request).action.should.equal('resize');
    });
    it('should set the height and leave the width as null', function(){
      var request = '/h400/image.png',
          p = mod.parse(request);
      expect(p.height).to.equal(400);
      expect(p.width).to.be.null;
    });
  });


  // Width
  describe('Width requests', function(){
    it('should set the action to resize', function(){
      var request = '/w400/path/to/image.png';
      mod.parse(request).action.should.equal('resize');
    });
    it('should set the width and leave the height as null', function(){
      var request = '/w400/image.png',
          p = mod.parse(request);
      expect(p.width).to.equal(400);
      expect(p.height).to.be.null;
    });
  });


  describe('Named modifiers', function(){
    var nm = {
      "small-avatar": {
        "square": 60
      },
      "large-avatar": {
        "square": 120
      },
      "gallery": {
        "height": 400,
        "width": 600
      },
      "thumb": {
        "gravity": "ne",
        "square": 50,
        "external": "local"
      }
    };

    it('should read a thumbnail named config and set accordingly', function(){
      var request = '/thumb/path/to/image.png',
          tn = nm.thumb;

      mod.parse(request, nm).gravity.should.equal(tn.gravity);
      mod.parse(request, nm).height.should.equal(tn.square);
      mod.parse(request, nm).width.should.equal(tn.square);
    });

    it('should read a gallery named config and set accordingly', function(){
      var request = '/gallery/path/to/image.png',
          tn = nm.gallery;

      mod.parse(request, nm).height.should.equal(tn.height);
      mod.parse(request, nm).width.should.equal(tn.width);
    });

  });

});