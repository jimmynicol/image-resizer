'use strict';

var _         = require('lodash'),
    Logger    = require('./utils/logger'),
    modifiers = require('./lib/modifiers');


function Image(request){
  // placeholder for any error objects
  this.error = null;

  // store the query string
  this.queryString = request.query;

  // set a mark for the start of the process
  this.mark = Date.now();

  // determine the name and format (mime) of the requested image
  this.parseImage(request);

  // reject this request if the image format is not correct
  if (_.indexOf(Image.validFormats, this.format) === -1){
    this.error = new Error('not valid image format');
  }

  // determine the requested modifications
  this.modifiers = modifiers.parse(request.path);

  // pull the various parts needed from the request params
  this.parseUrl(request);

  // placeholder for the buffer/stream coming from s3, will hold the image
  this.contents = null;

  // placeholder for the size of the original image
  this.originalContentLength = 0;

  // all logging strings will be queued here to be written on response
  this.log = new Logger();
}


Image.validFormats = ['jpeg', 'jpg', 'gif', 'png', 'webp'];


// Determine the name and format of the requested image
Image.prototype.parseImage = function(request){
  var imgArr = _.last(request.path.split('/')).split('.'),
      imgName = imgArr[0];

  imgName = imgName.replace(/-.*/, '');

  this.format = imgArr[1];
  this.image = [imgName, this.format].join('.');
};


// Determine the file path for the requested image
Image.prototype.parseUrl = function(request){
  var parts = request.path.replace(/^\//,'').split('/');

  // overwrite the image name with the parsed version so metadata requests do
  // not mess things up
  parts[parts.length - 1] = this.image;

  // if the request is for no modification or metadata then assume the s3path
  // is the entire request path
  if (_.indexOf(['original', 'json'], this.modifiers.action) > -1){
    this.path = parts.join('/');
  }

  // otherwise drop the first segment and set the s3path as the rest
  else {
    parts.shift();
    this.path = parts.join('/');
  }
};


Image.prototype.isError = function(){ return this.error !== null; };


Image.prototype.isStream = function(){
  var Stream = require('stream').Stream;
  return !!this.contents && this.contents instanceof Stream;
};


Image.prototype.isBuffer = function(){
  var Buffer = require('buffer');
  Buffer.isBuffer(this.contents);
};


Image.prototype.getFile = function(){
  var sources = require('./streams/sources'),
      Stream = null;

  if (_.has(this.modifiers, 'external')){
    if (_.has(sources, this.modifiers.external)){
      Stream = sources[this.modifiers.external];
    }
  }

  if (Stream === null) {
    Stream = sources.s3;
  }

  this.log.log('new stream created!');
  return new Stream(this);
};


Image.prototype.sizeReduction = function(){
  var size = this.contents.length;
  return (this.originalContentLength - size)/1000;
};


module.exports = Image;
