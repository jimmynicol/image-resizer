'use strict';

var gm = require('gm'),
    dims = require('../lib/dimensions'),
    map = require('map-stream'),
    autoOrient = process.env.AUTO_ORIENT || 'true',
    removeMetadata = process.env.REMOVE_METADATA || 'true';

module.exports = function(){

  return map( function(image, callback){
    var d, wd, ht;

    // do nothing if there is an error on the image object
    if (image.isError()){
      return callback(null, image);
    }

    // let this pass through if we are requesting the metadata as JSON
    if (image.modifiers.action === 'json'){
      image.log.log('resize: no resize, json metadata call');
      return callback(null, image);
    }

    // handle the stream response for any of the resizing actions
    var streamResponse = function(err, stdout){
      if (err) {
        image.error = new Error(err);
      } else {
        image.contents = stdout;
      }
      image.log.timeEnd('resize');
      callback(null, image);
    };

    image.log.time('resize');
    image.log.log('resize:', image.modifiers);

    // create the gm stream
    var r = gm(image.contents, image.format);

    // auto orient the image, so it is always the correct way up
    if (autoOrient === 'true'){
      r.autoOrient();
    }

    // remove any image metadata
    if (removeMetadata === 'true'){
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
      r.stream(streamResponse);
      break;

    }
  });

};