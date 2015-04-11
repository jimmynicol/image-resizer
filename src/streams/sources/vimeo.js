'use strict';

var stream  = require('stream');
var util    = require('util');
var request = require('request');
var env     = require('../../config/environment_vars');


function contentLength(bufs){
  return bufs.reduce(function(sum, buf){
    return sum + buf.length;
  }, 0);
}

function Vimeo(image){
  /* jshint validthis:true */
  if (!(this instanceof Vimeo)){
    return new Vimeo(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;

  // set the expiry value to the shorter value
  this.image.expiry = env.IMAGE_EXPIRY_SHORT;
}

util.inherits(Vimeo, stream.Readable);

Vimeo.prototype._read = function(){
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

  var endStream = function(){
    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  };

  this.image.log.time('vimeo');
  videoId = this.image.image.split('.')[0];
  url = 'http://vimeo.com/api/v2/video/' + videoId + '.json';

  request(url, function(err, response, body){
    if (err){
      _this.image.error = new Error(err);
      endStream();
    } else {
      var json = JSON.parse(body);

      /* jshint camelcase:false */
      var imageUrl = json[0].thumbnail_large;
      imageUrl = imageUrl.replace('_640.jpg', '');

      imgStream = request.get(imageUrl);
      imgStream.on('data',  function(d) { bufs.push(d); });
      imgStream.on('error', function(err) { _this.image.error = err; });
      imgStream.on('end',   function() {
        _this.image.log.timeEnd('vimeo');
        _this.image.contents = Buffer.concat(bufs);
        _this.image.originalContentLength = contentLength(bufs);
        endStream();
      });
    }
  });

};


module.exports = Vimeo;
