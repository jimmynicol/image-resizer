'use strict';

var stream, util, request, env;

stream  = require('stream');
util    = require('util');
request = require('request');
env     = require('../../config/environment_vars');

function contentLength(bufs){
  return bufs.reduce(function(sum, buf){
    return sum + buf.length;
  }, 0);
}

function Facebook(image){
  /* jshint validthis:true */
  if (!(this instanceof Facebook)){
    return new Facebook(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;

  // set the expiry value to the shorter value
  this.image.expiry = env.IMAGE_EXPIRY_SHORT;
}

util.inherits(Facebook, stream.Readable);

Facebook.prototype._read = function(){
  var _this = this,
      url,
      fbStream,
      bufs = [];

  if ( this.ended ){ return; }

  // pass through if there is an error on the image object
  if (this.image.isError()){
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  url = 'https://graph.facebook.com/' + this.image.image.split('.')[0] + '/picture?type=large';

  this.image.log.time('facebook');

  fbStream = request.get(url);
  fbStream.on('data', function(d){ bufs.push(d); });
  fbStream.on('error', function(err){
    _this.image.error = new Error(err);
  });
  fbStream.on('end', function(){
    _this.image.log.timeEnd('facebook');
    _this.image.contents = Buffer.concat(bufs);
    _this.image.originalContentLength = contentLength(bufs);
    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  });

};


module.exports = Facebook;
