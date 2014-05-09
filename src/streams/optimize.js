'use strict';


var map, optimizer, options, bufs, config;

map = require('map-stream');
config = {
  png:  { optimizationLevel: process.env.PNG_OPTIMIZATION_LEVEL || 2 },
  jpeg: { progressive: process.env.JPEG_PROGRESSIVE || true }
};


module.exports = function(){

  return map(function(image, callback){

    if (image.isError()){
      image.log.log('optimize:error', image.error);
      return callback(null, image);
    }

    // let this pass through if we are requesting the metadata as JSON
    if (image.modifiers.action === 'json'){
      image.log.log('optimize: json metadata call');
      return callback(null, image);
    }

    if (!image.isStream()){
      throw 'image needs to be a stream';
    }

    switch(image.format){

    case 'png':
      var Optipng = require('optipng');

      options = [];
      options.push('-o' + config.png.optimizationLevel);

      image.log.log('optimize png: options', options);

      optimizer = new Optipng(options);
      image.contents = image.contents.pipe(optimizer);

      image.contents.on('error', function(err){
        image.log.error('png optimize error', err);
        image.error = new Error(err);
        callback(null, image);
      });

      bufs = [];
      image.contents.on('data', function(data){
        image.log.log('png data');
        bufs.push(data);
      });
      image.contents.on('end', function(){
        image.log.log('png end');
        image.contents = Buffer.concat(bufs);
        callback(null, image);
      });

      break;

    case 'jpg':
    case 'jpeg':
      var Jpegtran = require('jpegtran');

      options = [];
      if (config.jpeg.progressive){
        options.push('-progressive');
      }

      image.log.log('optimize: jpeg - options', options);

      optimizer = new Jpegtran(options);
      image.contents = image.contents.pipe(optimizer);

      image.contents.on('error', function(err){
        image.error = new Error(err);
        image.log.error('jpeg optimize error', err);
      });

      bufs = [];
      image.contents.on('data', function(data){
        bufs.push(data);
      });
      image.contents.on('end', function(){
        image.contents = Buffer.concat(bufs);
        callback(null, image);
      });

      break;

    // TODO: add some gif optimisation

    default:
      callback(null, image);
      break;

    }

  });

};
