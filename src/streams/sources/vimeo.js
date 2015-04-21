'use strict';

var stream  = require('stream');
var util    = require('util');
var request = require('request');
var env     = require('../../config/environment_vars');


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
      url, videoId;

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
    }
    else {
      var json = JSON.parse(body);

      /* jshint camelcase:false */
      var imageUrl = json[0].thumbnail_large;
      imageUrl = imageUrl.replace('_640.jpg', '');

      var opts = {
        url: imageUrl,
        encoding: null
      };

      request(opts, function (err, response, body) {
        _this.image.log.timeEnd('vimeo');

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
            _this.image.error = new Error('Vimeo image not found');
            _this.image.error.statusCode = 404;
          }
        }

        _this.push(_this.image);
        _this.push(null);
      });

    }
  });

};


module.exports = Vimeo;
