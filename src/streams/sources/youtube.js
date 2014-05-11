'use strict';

var stream, util, request;

stream  = require('stream');
util    = require('util');
request = require('request');

function contentLength(bufs){
  return bufs.reduce(function(sum, buf){
    return sum + buf.length;
  }, 0);
}

function Youtube(image){
  /* jshint validthis:true */
  if (!(this instanceof Youtube)){
    return new Youtube(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;
}

util.inherits(Youtube, stream.Readable);

Youtube.prototype._read = function(){
  var _this = this,
      url, videoId,
      imgStream,
      bufs = [];

  if ( this.ended ){ return; }

  // pass through if there is an error on the image object
  if (this.image.isError()){
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  videoId = this.image.image.split('.')[0];
  url = 'http://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg';

  this.image.log.time('youtube');

  imgStream = request.get(url);
  imgStream.on('data', function(d){ bufs.push(d); });
  imgStream.on('error', function(err){
    _this.image.error = new Error(err);
  });
  imgStream.on('end', function(){
    _this.image.log.timeEnd('youtube');
    _this.image.contents = Buffer.concat(bufs);
    _this.image.originalContentLength = contentLength(bufs);
    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  });

};


module.exports = Youtube;
