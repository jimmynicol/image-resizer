'use strict';


var env, map, Imagemin, concat;

env      = require('../config/environment_vars');
map      = require('map-stream');
Imagemin = require('imagemin');
concat   = require('concat-stream');

function optimize(image, callback){
  var imgmin;

  imgmin = new Imagemin()
    .src(image.contents)
    .use(Imagemin.gifsicle(env.GIF_INTERLACED))
    .use(Imagemin.jpegtran(env.JPEG_PROGRESSIVE))
    .use(Imagemin.optipng(env.PNG_OPTIMIZATION));

  image.log.time('optimize:' + image.format);

  imgmin.run(function(err, files){
    image.log.timeEnd('optimize:' + image.format);

    if (err){
      image.log.error('optimize error', err);
      image.error = new Error(err);
      callback(null, image);
    } else {
      image.contents = files[0].contents;
      callback(null, image);
    }
  });
}

module.exports = function(){

  return map(function(image, callback){
    // pass through if there is an error
    if (image.isError()){
      return callback(null, image);
    }

    // let this pass through if we are requesting the metadata as JSON
    if (image.modifiers.action === 'json'){
      image.log.log('optimize: json metadata call');
      return callback(null, image);
    }

    // if the incoming image contents are a stream we need to concat them into
    // a buffer to pass to the optimizer
    if (image.isStream()){
      var buffer = concat(function(data){
        image.contents = data;
        optimize(image, callback);
      });
      image.contents.pipe(buffer);
    }

    // if the image is a buffer then just pass it through
    else if (image.isBuffer()) {
      optimize(image, callback);
    }

    else {
      image.log.error('optimize error', 'image is neither stream or buffer');
      image.error = new Error('image is neither stream or buffer');
      callback(null, image);
    }

  });

};
