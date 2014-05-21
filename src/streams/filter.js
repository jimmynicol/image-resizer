'use strict';

var map, filters, _;

map     = require('map-stream');
filters = require('./filters');
_       = require('lodash');


module.exports = function(){

  return map(function(image, callback){

    // pass through if there is an error
    if (image.isError()){
      return callback(null, image);
    }

    // let this pass through if we are requesting the metadata as JSON
    if (image.modifiers.action === 'json'){
      image.log.log('filter: json metadata call');
      return callback(null, image);
    }

    var filter = image.modifiers.filter;

    // don't attempt to process a filter if no appropriate modifier is set
    if (typeof filter === 'undefined'){
      image.log.log('filter:', image.log.colors.bold('none requested'));
      return callback(null, image);
    }

    image.log.time('filter:'+ filter);

    // run the appropriate filter
    filters[image.modifiers.filter](image, function(err, data){
      image.log.timeEnd('filter:'+ filter);

      if (err) {
        image.log.error('filter error', err);
        image.error = new Error(err);
      } else {
        image.contents = data;
      }

      callback(null, image);
    });

  });

};
