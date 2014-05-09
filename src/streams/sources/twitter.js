'use strict';

var stream, util, request, _;

stream  = require('stream');
util    = require('util');
request = require('request');
_       = require('lodash');


function contentLength(bufs){
  return bufs.reduce(function(sum, buf){
    return sum + buf.length;
  }, 0);
}

function Twitter(image){
  /* jshint validthis:true */
  if (!(this instanceof Twitter)){
    return new Twitter(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;
}

util.inherits(Twitter, stream.Readable);

Twitter.prototype._read = function(){
  var _this = this,
      url, profileId, queryString,
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

  this.image.log.time('twitter');

  profileId = this.image.image.split('.')[0];

  if (_.inNaN(profileId * 1)){
    queryString = 'screen_name=' + profileId;
  } else {
    queryString = 'user_id=' + profileId;
  }

  url = 'https://api.twitter.com/1.1/users/show.json?' + queryString;

  request(url, function(err, response, body){
    if (err){
      _this.image.error = new Error(err);
      endStream();
    } else {
      var json = JSON.parse(body);

      /* jshint camelcase:false */
      var imageUrl = json[0].profile_image_url;
      imageUrl = imageUrl.replace('_640.jpg', '');

      imgStream = request.get(imageUrl);
      imgStream.on('data', function(d){ bufs.push(d); });
      imgStream.on('error', function(err){
        _this.image.error = new Error(err);
      });
      imgStream.on('end', function(){
        _this.image.log.timeEnd('twitter');
        _this.image.contents = Buffer.concat(bufs);
        _this.image.originalContentLength = contentLength(bufs);
        endStream();
      });
    }
  });

};


module.exports = Twitter;
