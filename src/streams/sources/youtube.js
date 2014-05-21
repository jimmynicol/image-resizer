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

function Youtube(image){
  /* jshint validthis:true */
  if (!(this instanceof Youtube)){
    return new Youtube(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;

  // set the expiry value to the shorter value
  this.image.expiry = env.IMAGE_EXPIRY_SHORT;
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
  url = 'http://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';

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

// http://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api

// you can also get json data about a Youtube vid like this:
//  - http://gdata.youtube.com/feeds/api/videos/lK1vPu6U2B0?v=2&alt=jsonc
