'use strict';

var fs = require('fs'),
    stream = require('stream'),
    util = require('util');


function Local(image){
  /* jshint validthis:true */
  if (!(this instanceof Local)){
    return new Local(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.filePath = process.cwd() + '/' + this.image.path;
  this.ended = false;
}

util.inherits(Local, stream.Readable);

Local.prototype._read = function(){
  var _this = this;

  if ( this.ended ){ return; }

  // pass through if there is an error on the image object
  if (this.image.isError()){
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  this.image.log.time('local filesystem');

  fs.readFile(this.filePath, function(err, data){
    _this.image.log.timeEnd('local filesystem');

    // if there is an error store it on the image object and pass it along
    if (err) {
      _this.image.error = new Error(err);
    }

    // if not store the image buffer
    else {
      _this.image.contents = data;
      _this.image.originalContentLength = data.length;
    }

    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  });
};


module.exports = Local;