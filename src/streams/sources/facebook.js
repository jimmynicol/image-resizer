'use strict';

var stream, util, request, env;

stream  = require('stream');
util    = require('util');
request = require('request');
env     = require('../../config/environment_vars');

// function contentLength(bufs){
//   return bufs.reduce(function(sum, buf){
//     return sum + buf.length;
//   }, 0);
// }

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
      url;

  if ( this.ended ){ return; }

  // pass through if there is an error on the image object
  if (this.image.isError()){
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  var fbUid = this.image.image.split('.').slice(0,-1).join('.');

  url = 'https://graph.facebook.com/' + fbUid + '/picture?type=large';

  this.image.log.time('facebook');

  var opts = {
    url: url,
    encoding: null
  };

  request(opts, function (err, response, body) {
    _this.image.log.timeEnd('facebook');

    if (err) {
      _this.image.error = err;
    }
    else {
      if (response.statusCode === 200) {
        _this.image.contents = body;
        _this.image.originalContentLength = body.length;
        _this.ended = true;
      }
      else {
        _this.image.error = new Error('Facebook user image not found');
        _this.image.error.statusCode = 404;
      }
    }

    _this.push(_this.image);
    _this.push(null);
  });

};


module.exports = Facebook;
