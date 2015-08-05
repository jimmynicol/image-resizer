'use strict';

var sharp  = require('sharp');
var env    = require('../config/environment_vars');
var map    = require('map-stream');


module.exports = function () {

  return map( function (image, callback) {

    // pass through if there is an error
    if (image.isError()) {
      return callback(null, image);
    }

    // let this pass through if we are requesting the metadata as JSON
    if (image.modifiers.action === 'json'){
      image.log.log('optimize: json metadata call');
      return callback(null, image);
    }

    image.log.time('optimize-sharp:' + image.format);

    var r = sharp(image.contents);

    if (env.IMAGE_PROGRESSIVE) {
      r.progressive();
    }

    // set the output quality
    if (image.modifiers.quality < 100) {
      r.quality(image.modifiers.quality);
    }

    // if a specific output format is specified, set it
    if (image.outputFormat) {
      r.toFormat(image.outputFormat);
    }

    // write out the optimised image to buffer and pass it on
    r.toBuffer( function (err, buffer) {
      if (err) {
        image.log.error('optimize error', err);
        image.error = new Error(err);
      }
      else {
        image.contents = buffer;
      }

      image.log.timeEnd('optimize-sharp:' + image.format);
      callback(null, image);
    });
  });

};