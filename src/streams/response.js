'use strict';

var stream = require('stream'),
    util = require('util'),
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


ResponseWriter.prototype._write = function(image){
  if (image.isError()){
    var statusCode = image.error.statusCode || 500;
    this.response.send(statusCode, null);
    image.log.flush();

    return this.end();
  }

  if (image.modifiers.action === 'json'){
    this.response.set({
      'Cache-Control':  'public',
      'Expires':        this.expiresIn(maxAge),
      'Last-Modified':  (new Date(0)).toGMTString(),
      'Vary':           'Accept-Encoding'
    });

    this.response.json(200, image.contents);
    image.log.flush();

    return this.end();
  }

  this.response.set({
    'Cache-Control':  'public',
    'Expires':        this.expiresIn(maxAge),
    'Last-Modified':  (new Date(0)).toGMTString(),
    'Vary':           'Accept-Encoding'
  });

  image.log.log(
    'original image size:',
    image.log.colors.grey((image.originalContentLength/1000).toString() + 'kb')
  );

  this.response.type(image.format);

  if (image.isStream()){
    image.contents.pipe(this.response);
    image.log.flush();
  }

  else {
    image.log.log(
      'reduction:',
      image.log.colors.grey((image.sizeReduction()).toString() + 'kb')
    );

    this.response.send(200, image.contents);
    image.log.flush();

    this.end();
  }

};

module.exports = ResponseWriter;
