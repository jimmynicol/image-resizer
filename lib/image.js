/*
Image object class
  - handles the parsed request data
  - finding a version or the original
  - generating and storing a new version
  - finding image metadata

@author: James Nicol, May 2013
*/

'use strict';

var Q, Img, crypto, fs, gm, manipulate, md5, nuuid,
    parseFormat, parser, redis, s3;

fs         = require('fs');
gm         = require('gm');
redis      = require('redis');
nuuid      = require('node-uuid');
crypto     = require('crypto');
Q          = require('q');

parser     = require('./request_parser');
s3         = require('./s3');
manipulate = require('./manipulate');


// helper utilities
md5 = function(str) {
  var hash;

  hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
};

parseFormat = function(format) {
  switch (format.toLowerCase()) {
  case 'jpeg':
  case 'jpg':
    return 'image/jpeg';
  case 'png':
    return 'image/png';
  case 'gif':
    return 'image/gif';
  default:
    return 'application/octet-stream';
  }
};


Img = (function() {

  function Img(request, logger) {
    // set the logger to an instance variable
    this.logger = logger;

    // establish the bucket and url path to the new image version
    this.bucket = process.env.S3_BUCKET;
    this.cdnRoot = process.env.CDN_ROOT || ('https://s3.amazonaws.com/' + this.bucket + '/');

    // create a unique temporary filepath for this image
    this.tmpFile = '/tmp/' + (nuuid.v4());

    // convert the environment variable into a single character, for use in
    // redis keys and directory listing
    this.env = (process.env.NODE_ENV || 'development')[0];

    // parse the incoming url
    var parsed = parser(request);

    // directory and file variables
    this.dir = parsed.dir;
    this.file = parsed.filename;

    // what is the extension and mime type
    this.ext = parsed.ext;
    this.mime = parseFormat(this.ext);

    // the incoming options for manipulation
    this.options = parsed.options;

    // the requested dimensions for this image version
    this.height = parsed.options.height;
    this.width = parsed.options.width;

    // are we requesting the EXIF data in JSON format?
    this.json = parsed.json;

    // is this request required to flush the store version?
    this.flush = parsed.flush;

    // build a hashed version of the file and directory
    this.uuid = md5('' + this.dir + this.file);

    // is this image an animated GIF?
    this.animatedGif = false;
  }


  // Build a filename from the available options
  Img.prototype.filename = function() {
    return '' +
      this.uuid +
      (this._optionsString()) +
      '.' + (this.ext.toLowerCase());
  };

  // Build a path the image version on S3
  Img.prototype.s3Path = function() {
    return '' + this.env + '/' + (this.filename());
  };

  // Build a path to the original image on S3
  Img.prototype.originalS3Path = function() {
    return '' + this.dir + '/' + this.file + '.' + this.ext;
  };

  // Build a full url to the image (either CDN or S3)
  Img.prototype.s3url = function() {
    return '' + this.cdnRoot + (this.s3Path());
  };

  // Query Redis for the original image params, if not the retrieve it from S3
  Img.prototype.findOriginal = function() {
    var deferred,
        _this = this;

    deferred = new Q.defer();

    redis.get(this._origKey())
      .then(function(res) {
        var data;

        if (res !== null) {
          data = JSON.parse(res);
          _this.origDims = data.d;
          _this.animatedGif = data.a;
          deferred.resolve(_this);
        } else {
          _this.getOriginal(deferred);
        }
      })
      .catch(function(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  };

  // Get the original image from S3, run gm.identify on it and store the info
  Img.prototype.getOriginal = function(deferred) {
    var _this = this;

    deferred = deferred || new Q.defer();

    s3.getFile(this.originalS3Path())
      .done(function(res) {
        _this.logger.time('gm identify');
        gm(res)
          .identify({bufferStream: true}, function(err, data) {
            _this.logger.timeEnd('gm identify');

            _this.origDims = data.size;
            _this.animatedGif = _this._isAnimatedGif(data);
            _this._saveOriginalParams();

            deferred.resolve(_this);
          });
      })
      .catch(function(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  };


  // Determine if the image is an animated gif (they dont resize well)
  Img.prototype._isAnimatedGif = function(info) {
    if (info.format === null) {
      return false;
    }
    if (info.format.toLowerCase() !== 'gif') {
      return false;
    }
    return info.Scene !== null;
  };


  // Store the original parameters of the image into redis for fast retrieval
  Img.prototype._saveOriginalParams = function() {
    var params,
        _this = this;

    params = {
      d: this.origDims,
      a: this.animatedGif
    };

    redis.setnx(this._origKey(), JSON.stringify(params))
      .finally(function() {
        _this.logger.log('original params stored');
      });
  };


  // Query redis to see if there is a version of this image already complete
  Img.prototype.findVersion = function() {
    var deferred,
      _this = this;

    deferred = new Q.defer();

    redis.get(this._versionKey())
      .done(function(res){
        deferred.resolve(res !== null, _this);
      })
      .catch(function(err){
        deferred.reject(new Error(err));
      });

    return deferred.promise;
  };

  Img.prototype.generateVersion = function(cb) {
    var deferred,
        _this = this;

    deferred = new Q.defer();

    redis
      .lock(this._lockKey())
      .fail(function(msg) {
        _this.logger.log(msg);
        _this._processVersion(deferred, cb);
      })
      .done(function(msg) {
        _this.logger.log(msg);
        _this._findVersion(deferred, cb);
      });

    return deferred.promise;
  };

  Img.prototype._processVersion = function(deferred) {
    var _this = this;

    redis
      .setLock(this._lockKey())
      .done(function() {
        return _this.logger.log('set redis lock');
      });

    this.logger.time('s3 download');

    s3.getFile(this.originalS3Path())
      .then(function(res){
        _this.logger.timeEnd('s3 download');

        if (res.statusCode !== 200) {
          redis.del(_this._lockKey());
          deferred.reject(null, res.statusCode);
        }

        _this.logger.time('manipulate image');
        return manipulate(_this, res);
      })
      .then(function(){
        _this.logger.timeEnd('manipulate image');
        _this.logger.time('s3 upload');
        return s3.upload(
          _this.tmpFile,
          _this.s3Path(),
          _this.size,
          _this.mime
        );
      })
      .done(function(res){
        _this.logger.timeEnd('s3 upload');

        if (res.statusCode !== 200) {
          deferred.reject(res);
        } else {
          deferred.resolve(_this);
          _this.save();
        }
      })
      .finally(function(){
        redis.del(_this._lockKey());
      })
      .catch(function(err){
        deferred.reject(err);
      });
  };

  Img.prototype.save = function() {
    var data, deferred,
      _this = this;

    deferred = new Q.defer();
    data = { m: this.mime };

    redis.set(this._versionKey(), JSON.stringify(data))
      .done(function() {
        deferred.resolve(_this);
      })
      .catch(function(err){
        deferred.reject(new Error(err));
      });

    return deferred.promise;
  };

  Img.prototype.deleteTmpFile = function() {
    return fs.unlink(this.tmpFile);
  };

  Img.prototype.getMetadata = function() {
    var deferred;

    deferred = new Q.defer();

    s3.getFile(this.originalS3Path())
      .done(function(res) {
        gm(res).identify(function(err, data) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(data);
          }
        });
      })
      .catch(function(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  };

  Img.prototype._key = function() {
    return 'fi:' + this.env + ':' + this.uuid;
  };

  Img.prototype._origKey = function() {
    return '' + (this._key()) + ':orig';
  };

  Img.prototype._versionKey = function() {
    if (this.options.action === null) {
      return this._key();
    } else {
      return '' + (this._key()) + (this._optionsString());
    }
  };

  Img.prototype._lockKey = function() {
    var key;

    key = 'fi:lock:' + this.env + ':' + this.uuid;
    if (this.options.action === null) {
      return key;
    }

    return '' + key + (this._optionsString());
  };

  Img.prototype._optionsString = function() {
    var str;

    if (this.json) {
      return '';
    }
    if (this.options.action === null) {
      return '';
    }
    str = '_a' + this.options.action[0];
    if (this.options.width !== null) {
      str += '_w' + this.options.width;
    }
    if (this.options.height !== null) {
      str += '_h' + this.options.height;
    }
    if (this.options.cropX !== null) {
      str += '_cx' + this.options.cropX;
    }
    if (this.options.cropY !== null) {
      str += '_cy' + this.options.cropY;
    }

    return str;
  };

  return Img;

})();


module.exports = Img;