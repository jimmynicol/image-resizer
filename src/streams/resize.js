'use strict';

var sharp = require('sharp');
var map   = require('map-stream');
var env   = require('../config/environment_vars');
var dims  = require('../lib/dimensions');


module.exports = function () {

  return map( function(image, callback) {

    // do nothing if there is an error on the image object
    if (image.isError()){
      return callback(null, image);
    }

    // let this pass through if we are requesting the metadata as JSON
    if (image.modifiers.action === 'json'){
      image.log.log('resize: json metadata call');
      return callback(null, image);
    }

    if (image.modifiers.action === 'original' && env.RESIZE_PROCESS_ORIGINAL === false){
      image.log.log('resize: original no resize');
      return callback(null, image);
    }

    image.log.time('resize');

    var resizeResponse = function (err, buffer) {
      if (err) {
        image.log.error('resize error', err);
        image.error = new Error(err);
      }
      else {
        image.contents = buffer;
      }

      image.log.timeEnd('resize');
      callback(null, image);
    };

    var r = sharp(image.contents);

    // never enlarge an image beyonds its original size
    r.withoutEnlargement();

    // if allowed auto rotate images, very helpful for photos off of an iphone
    // which are landscape by default and the metadata tells them what to show.
    if (env.AUTO_ORIENT) {
      r.rotate();
    }

    // by default we remove the metadata from resized images, setting the env
    // var to false can retain it.
    if (!env.REMOVE_METADATA) {
      r.withMetadata();
    }

    var d, wd, ht;

    switch(image.modifiers.action){
    case 'original' :
      r.toBuffer(resizeResponse);
      break;

    case 'resize':
      r.resize(image.modifiers.width, image.modifiers.height);
      r.max();
      r.toBuffer(resizeResponse);
      break;

    case 'square':
      r.metadata(function(err, metadata){
        if (err){
          image.error = new Error(err);
          callback(null, image);
          return;
        }

        d = dims.cropFill(image.modifiers, metadata);

        // resize then crop the image
        r.resize(
            d.resize.width,
            d.resize.height
          ).extract(
            d.crop.y,
            d.crop.x,
            d.crop.width,
            d.crop.height
          );

        r.toBuffer(resizeResponse);
      });

      break;

    case 'crop':
      r.metadata(function(err, size){
        if (err){
          image.error = new Error(err);
          callback(null, image);
          return;
        }

        switch(image.modifiers.crop){
        case 'fit':
          r.resize(image.modifiers.width, image.modifiers.height);
          r.max();
          break;
        case 'fill':
          d = dims.cropFill(image.modifiers, size);

          r.resize(
              d.resize.width,
              d.resize.height
            ).extract(
              d.crop.y,
              d.crop.x,
              d.crop.width,
              d.crop.height
            );
          break;
        case 'cut':
          wd = image.modifiers.width || image.modifiers.height;
          ht = image.modifiers.height || image.modifiers.width;

          d = dims.gravity(
            image.modifiers.gravity,
            size.width,
            size.height,
            wd,
            ht
          );
          r.extract(d.y, d.x, wd, ht);
          break;
        case 'scale':
          // TODO: deal with scale
          r.resize(image.modifiers.width, image.modifiers.height);
          break;
        }

        r.toBuffer(resizeResponse);
      });

      break;
    }
  });

};
