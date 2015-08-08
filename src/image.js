'use strict';

var _, Logger, env, modifiers, stream, util, imgType;

_         = require('lodash');
Logger    = require('./utils/logger');
env       = require('./config/environment_vars');
modifiers = require('./lib/modifiers');
stream    = require('stream');
util      = require('util');
imgType   = require('image-type');


// Simple stream to represent an error at an early stage, for instance a
// request to an excluded source.
function ErrorStream(image){
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
}
util.inherits(ErrorStream, stream.Readable);

ErrorStream.prototype._read = function(){
  this.push(this.image);
  this.push(null);
};


function Image(request){
  // placeholder for any error objects
  this.error = null;

  // set a mark for the start of the process
  this.mark = Date.now();

  // determine the name and format (mime) of the requested image
  this.parseImage(request);

  // determine the requested modifications
  this.modifiers = modifiers.parse(request.path);

  // pull the various parts needed from the request params
  this.parseUrl(request);

  // placeholder for the buffer/stream coming from s3, will hold the image
  this.contents = null;

  // placeholder for the size of the original image
  this.originalContentLength = 0;

  // set the default expiry length, can be altered by a source file
  this.expiry = env.IMAGE_EXPIRY;

  // all logging strings will be queued here to be written on response
  this.log = new Logger();
}

Image.validInputFormats  = ['jpeg', 'jpg', 'gif', 'png', 'webp'];
Image.validOutputFormats = ['jpeg', 'png', 'webp'];

// Determine the name and format of the requested image
Image.prototype.parseImage = function(request){
  var fileStr = _.last(request.path.split('/'));
  var exts = fileStr.split('.').map( function (item) {
    return item.toLowerCase();
  });

  // clean out any metadata format
  if (exts[exts.length - 1] === 'json') {
    this.format = exts[exts.length - 2];
    exts.pop();
    fileStr = exts.join('.');
  }

  // if path contains valid output format, remove it from path
  if (exts.length >= 3) {
    var inputFormat = exts[exts.length - 2];
    var outputFormat = exts.pop();

    if (_.indexOf(Image.validInputFormats, inputFormat) > -1 &&
        _.indexOf(Image.validOutputFormats, outputFormat) > -1) {
      this.outputFormat = outputFormat;
      fileStr = exts.join('.');
    }
  }

  this.image  = fileStr;
};


// Determine the file path for the requested image
Image.prototype.parseUrl = function(request){
  var parts = request.path.replace(/^\//,'').split('/');

  // overwrite the image name with the parsed version so metadata requests do
  // not mess things up
  parts[parts.length - 1] = this.image;

  // if the request is for no modification or metadata then assume the s3path
  // is the entire request path
  if (_.indexOf(['original', 'json', 'resizeOriginal'], this.modifiers.action) > -1){
    if (this.modifiers.external){
      parts.shift();
      this.path = parts.join('/');
    } else {
      this.path = parts.join('/');
    }
  }

  // otherwise drop the first segment and set the s3path as the rest
  else {
    parts.shift();
    this.path = parts.join('/');
  }

  // account for any spaces in the path
  this.path = decodeURI(this.path);
};


Image.prototype.isError = function(){ return this.error !== null; };


Image.prototype.isStream = function(){
  var Stream = require('stream').Stream;
  return !!this.contents && this.contents instanceof Stream;
};


Image.prototype.isBuffer = function(){
  return !!this.contents && Buffer.isBuffer(this.contents);
};


Image.prototype.getFile = function(){
  var sources = require('./streams/sources'),
      excludes = env.EXCLUDE_SOURCES ? env.EXCLUDE_SOURCES.split(',') : [],
      streamType = env.DEFAULT_SOURCE,
      Stream = null;

  // look to see if the request has a specified source
  if (_.has(this.modifiers, 'external')){
    if (_.has(sources, this.modifiers.external)){
      streamType = this.modifiers.external;
    } else if (_.has(env.externalSources, this.modifiers.external)) {
      Stream = sources.external;
      return new Stream(this, this.modifiers.external, env.externalSources[this.modifiers.external]);
    }
  }

  // if this request is for an excluded source create an ErrorStream
  if (excludes.indexOf(streamType) > -1){
    this.error = new Error(streamType + ' is an excluded source');
    Stream = ErrorStream;
  }

  // if all is well find the appropriate stream
  else {
    this.log.log('new stream created!');
    Stream = sources[streamType];
  }

  return new Stream(this);
};


Image.prototype.sizeReduction = function(){
  var size = this.contents.length;
  return (this.originalContentLength - size)/1000;
};


Image.prototype.sizeSaving = function(){
  var oCnt = this.originalContentLength,
      size = this.contents.length;
  return ((oCnt - size)/oCnt * 100).toFixed(2);
};


Image.prototype.isFormatValid = function () {
  if (Image.validInputFormats.indexOf(this.format) === -1) {
    this.error = new Error(
      'The listed format (' + this.format + ') is not valid.'
    );
  }
};

// Setter/getter for image format that normalizes jpeg formats
Object.defineProperty(Image.prototype, 'format', {
  get: function () { return this._format; },
  set: function (value) {
    this._format = value.toLowerCase();
    if (this._format === 'jpg') { this._format = 'jpeg'; }
  }
});

// Setter/getter for image contents that determines the format from the content
// of the image to be processed.
Object.defineProperty(Image.prototype, 'contents', {
  get: function () { return this._contents; },
  set: function (data) {
    this._contents = data;

    if (this.isBuffer()) {
      this.format = imgType(data).ext;
      this.isFormatValid();
    }
  }
});


module.exports = Image;
