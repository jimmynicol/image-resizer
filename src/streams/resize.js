'use strict';

var gm, env, dims, map;

gm   = require('gm');
env  = require('../config/environment_vars');
dims = require('../lib/dimensions');
map  = require('map-stream');


module.exports = function(){

  return map( function(image, callback){
    var d, wd, ht;

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

    // handle the stream response for any of the resizing actions
    var streamResponse = function(err, data){
      if (err) {
        image.log.error('resize error', err);
        image.error = new Error(err);
      } else {
        image.contents = data;
      }
      image.log.timeEnd('resize');
      callback(null, image);
    };

    image.log.time('resize');

    // create the gm stream
    var r = gm(image.contents, image.format);

    // auto orient the image, so it is always the correct way up
    if (env.AUTO_ORIENT){
      r.autoOrient();
    }

    // remove any image metadata
    if (env.REMOVE_METADATA){
      r.noProfile();
    }

    switch(image.modifiers.action){
    case 'resize':
      r.resize(image.modifiers.width, image.modifiers.height);
      r.stream(streamResponse);
      break;

    case 'square':
      r.size(function(err, size){
        if (err){
          image.error = new Error(err);
          callback(null, image);
          return;
        }

        d = dims.cropFill(image.modifiers, size);

        // resize then crop the image
        r.resize(
            d.resize.width,
            d.resize.height
          ).crop(
            d.crop.width,
            d.crop.height,
            d.crop.x,
            d.crop.y
          );

        // send the stream to the completion handler
        r.stream(streamResponse);
      });

      break;

    case 'crop':
      r.size(function(err, size){
        if (err){
          image.error = new Error(err);
          callback(null, image);
          return;
        }

        switch(image.modifiers.crop){
        case 'fit':
          r.resize(image.modifiers.width, image.modifiers.height);
          break;
        case 'fill':
          d = dims.cropFill(image.modifiers, size);

          // TODO: need to account for null height or width

          r.resize(
              d.resize.width,
              d.resize.height
            ).crop(
              d.crop.width,
              d.crop.height,
              d.crop.x,
              d.crop.y
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
          r.crop(wd, ht, d.x, d.y);
          break;
        case 'scale':
          r.resize(image.modifiers.width, image.modifiers.height, '!');
          break;
        }

        r.stream(streamResponse);
      });

      break;


    case 'original' :
      r.toBuffer(streamResponse);
      break;

    }
  });

};
