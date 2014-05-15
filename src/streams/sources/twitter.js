'use strict';

var stream, util, env, Twit, t, request, _;

stream  = require('stream');
util    = require('util');
env     = require('../../config/environment_vars');
Twit    = require('twit');
request = require('request');
_       = require('lodash');

/* jshint camelcase:false */
t = new Twit({
  consumer_key:         env.TWITTER_CONSUMER_KEY,
  consumer_secret:      env.TWITTER_CONSUMER_SECRET,
  access_token:         env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  env.TWITTER_ACCESS_TOKEN_SECRET
});


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
      profileId, queryString, imgStream,
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

  if (_.isNaN(profileId * 1)){
    queryString = {screen_name: profileId};
  } else {
    queryString = {user_id: profileId};
  }

  t.get('users/show', queryString, function(err, data){
    if (err){
      _this.image.error = new Error(err);
      endStream();
    } else {
      /* jshint camelcase:false */
      var imageUrl = data.profile_image_url
        .replace('_normal', '')
        .replace('_bigger', '')
        .replace('_mini', '');

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
