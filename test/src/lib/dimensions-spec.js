'use strict';

var chai   = require('chai'),
    expect = chai.expect,
    dim    = require('../../../src/lib/dimensions');

chai.should();


describe('Dimensions module', function(){

  describe('#gravity', function(){
    var gravity = ['c', 600, 400, 100, 100];

    it('should return correct values for center gravity', function(){
      var g = dim.gravity.apply(null, gravity);
      g.x.should.equal(250);
      g.y.should.equal(150);
    });

    it('should return correct values for north gravity', function(){
      gravity[0] = 'n';
      var g = dim.gravity.apply(null, gravity);
      g.x.should.equal(250);
      g.y.should.equal(0);
    });

    it('should return correct values for northeast gravity', function(){
      gravity[0] = 'ne';
      var g = dim.gravity.apply(null, gravity);
      g.x.should.equal(500);
      g.y.should.equal(0);
    });

    it('should return correct values for northwest gravity', function(){
      gravity[0] = 'nw';
      var g = dim.gravity.apply(null, gravity);
      g.x.should.equal(0);
      g.y.should.equal(0);
    });

    it('should return correct values for south gravity', function(){
      gravity[0] = 's';
      var g = dim.gravity.apply(null, gravity);
      g.x.should.equal(250);
      g.y.should.equal(300);
    });

    it('should return correct values for southeast gravity', function(){
      gravity[0] = 'se';
      var g = dim.gravity.apply(null, gravity);
      g.x.should.equal(500);
      g.y.should.equal(300);
    });

    it('should return correct values for southwest gravity', function(){
      gravity[0] = 'sw';
      var g = dim.gravity.apply(null, gravity);
      g.x.should.equal(0);
      g.y.should.equal(300);
    });

    it('should return correct values for east gravity', function(){
      gravity[0] = 'e';
      var g = dim.gravity.apply(null, gravity);
      g.x.should.equal(500);
      g.y.should.equal(150);
    });

    it('should return correct values for west gravity', function(){
      gravity[0] = 'w';
      var g = dim.gravity.apply(null, gravity);
      g.x.should.equal(0);
      g.y.should.equal(150);
    });
  });


  describe('#cropFill', function(){
    var modifiers = { gravity: 'c', height: 50, width: 50 },
        size = { height: 400, width: 600 };

    it('should return correct values for default gravity', function(){
      var s = dim.cropFill(modifiers, size);
      s.resize.height.should.equal(50);
      s.crop.x.should.equal(Math.floor(((50/400 * 600) - 50)/2));
    });

    it('should return correct values for northeast gravity', function(){
      modifiers.gravity = 'ne';
      var s = dim.cropFill(modifiers, size);
      s.crop.x.should.equal(25);
      s.crop.y.should.equal(0);
    });

    it('should return correct values for southeast gravity', function(){
      modifiers.gravity = 'se';
      var s = dim.cropFill(modifiers, size);
      s.crop.x.should.equal(25);
      s.crop.y.should.equal(0);
    });

    it('should crop the largest dimension', function(){
      var mods = { gravity: 'c', height: 40, width: 50 };
      var s = dim.cropFill(mods, size);
      s.crop.height.should.equal(40);
      s.crop.width.should.equal(50);
    });
  });


  describe('#xy', function(){
    var modifiers = { gravity: 'se', height: 50, width: 50, x: 10, y:15 },
        size = { height: 400, width: 600 };

    it('should use the x/y values instead of defined gravity', function(){
      var s = dim.xy(modifiers, size.width, size.height, modifiers.width, modifiers.height);
      s.x.should.equal(modifiers.x);
      s.y.should.equal(modifiers.y);
    });

    it('should not exceed bounds on x value', function(){
      modifiers.width = 90;
      modifiers.x = 700;
      modifiers.y = 40;
      var s = dim.xy(modifiers, size.width, size.height, modifiers.width, modifiers.height);
      s.x.should.equal(510);
      s.y.should.equal(40);
      s.x.should.not.equal(modifiers.x);
      s.y.should.equal(modifiers.y);
    });

    it('should not exceed bounds on y value', function(){
      modifiers.height = 90;
      modifiers.x = 60;
      modifiers.y = 700;
      var s = dim.xy(modifiers, size.width, size.height, modifiers.width, modifiers.height);
      s.x.should.equal(60);
      s.y.should.equal(310);
      s.x.should.equal(modifiers.x);
      s.y.should.not.equal(modifiers.y);
    });



  });

});