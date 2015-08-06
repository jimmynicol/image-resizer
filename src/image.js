'use strict';

var _, Logger, env, modifiers, stream, util, crypto;

_         = require('lodash');
Logger    = require('./utils/logger');
env       = require('./config/environment_vars');
modifiers = require('./lib/modifiers');
stream    = require('stream');
util      = require('util');
crypto    = require('crypto');


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

  // split path into parts
  this.pathParts = request.path.replace(/^\//,'').split('/');

  // determine the name and format (mime) of the requested image
  this.parseImage(this.pathParts);

  // reject the request if signing is required and not valid
  if (env.REQUEST_SIGNING_KEY && !this.checkSignature(this.pathParts)){
    this.error = new Error('Signature mismatch');
    this.error.statusCode = 404;
  }

  // reject this request if the image format is not correct
  if (_.indexOf(Image.validFormats, this.format) === -1){
    this.error = new Error(Image.formatErrorText);
    this.error.statusCode = 404;
  }

  // determine the requested modifications
  this.modifiers = modifiers.parse(this.pathParts.join('/'));

  // pull the various parts needed from the request params
  this.parseUrl(this.pathParts);

  // placeholder for the buffer/stream coming from s3, will hold the image
  this.contents = null;

  // placeholder for the size of the original image
  this.originalContentLength = 0;

  // set the default expiry length, can be altered by a source file
  this.expiry = env.IMAGE_EXPIRY;

  // all logging strings will be queued here to be written on response
  this.log = new Logger();
}

Image.validInputFormats = ['jpeg', 'jpg', 'gif', 'png', 'webp'];
Image.validFormats = ['jpeg', 'png', 'webp'];
Image.formatErrorText = 'not valid image format';

// Determine the name and format of the requested image
Image.prototype.parseImage = function(parts){
  var fileStr = _.last(parts);

  // clean out any metadata format
  fileStr = fileStr.replace(/.json$/, '');

  var exts = fileStr.split('.');
  this.format = _.last(exts).toLowerCase();
  if(this.format === 'jpg') {
    this.format = 'jpeg';
  }

  // if path contains valid input and output format extensions, remove the output format from path
  if(exts.length > 1) {
    var inputFormat = exts[exts.length - 2].toLowerCase();
    if (_.indexOf(Image.validFormats, this.format) !== -1 &&
      _.indexOf(Image.validInputFormats, inputFormat) !== -1){
      fileStr = exts.slice(0, -1).join('.');
    }
  }

  this.image  = fileStr;
};


// Determine the file path for the requested image
Image.prototype.parseUrl = function(parts){
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


// Helper method to check that a request signature is valid
Image.prototype.checkSignature = function(parts){
  var signature = parts[0];
  parts.shift();
  this.pathParts = parts;

  var computedHash = crypto.createHmac('sha1', env.REQUEST_SIGNING_KEY)
                     .update(parts.join('/'))
                     .digest('base64')
                     .replace(/\+/g, '-')
                     .replace(/\//g, '_')
                     .replace(/\=/g, 'e')
                     .substr(0,8);

  return signature === computedHash;
}

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


module.exports = Image;
