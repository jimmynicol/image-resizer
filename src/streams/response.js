'use strict';

var stream, env, util, maxAge;

stream = require('stream');
env    = require('../config/environment_vars');
util   = require('util');
maxAge = 60 * 60 * 24 * 30; // 1 month


function ResponseWriter(request, response){
  if (!(this instanceof ResponseWriter)){
    return new ResponseWriter(request, response);
  }

  this.request = request;
  this.response = response;

  stream.Writable.call(this, { objectMode : true });
}

util.inherits(ResponseWriter, stream.Writable);


ResponseWriter.prototype.expiresIn = function(maxAge){
  var dt = Date.now();
  dt += maxAge * 1000;

  return (new Date(dt)).toGMTString();
};


ResponseWriter.prototype.shouldCacheResponse = function(){

  if (env.development){
    if (env.CACHE_DEV_REQUESTS){
      return true;
    } else {
      return false;
    }
  }

  return true;
};


ResponseWriter.prototype._write = function(image){
  if (image.isError()){
    var statusCode = image.error.statusCode || 500;
    this.response.send(statusCode, null);
    image.log.error(image.error.message);
    image.log.flush();
    return this.end();
  }

  if (image.modifiers.action === 'json'){
    if (this.shouldCacheResponse()){
      this.response.set({
        'Cache-Control':  'public',
        'Expires':        this.expiresIn(env.JSON_EXPIRY),
        'Last-Modified':  (new Date(0)).toGMTString(),
        'Vary':           'Accept-Encoding'
      });
    }

    this.response.json(200, image.contents);
    image.log.flush();

    return this.end();
  }

  if (this.shouldCacheResponse()){
    this.response.set({
      'Cache-Control':  'public',
      'Expires':        this.expiresIn(image.expiry),
      'Last-Modified':  (new Date(0)).toGMTString(),
      'Vary':           'Accept-Encoding'
    });
  }

  this.response.type(image.format);

  if (image.isStream()){
    image.contents.pipe(this.response);
  }

  else {
    image.log.log(
      'original image size:',
      image.log.colors.grey(
        (image.originalContentLength/1000).toString() + 'kb'
      )
    );
    image.log.log(
      'reduction:',
      image.log.colors.grey((image.sizeReduction()).toString() + 'kb')
    );

    // as a debugging step print a checksum for the modified image, so we can
    // track to see if the image is replicated effectively between requests
    if (env.development){
      var crypto = require('crypto'),
          shasum = crypto.createHash('sha1');
      shasum.update(image.contents);
      image.log.log('checksum', shasum.digest('hex'));
    }

    this.response.send(200, image.contents);
  }

  // flush the log messages and close the connection
  image.log.flush();
  this.end();
};


module.exports = ResponseWriter;
