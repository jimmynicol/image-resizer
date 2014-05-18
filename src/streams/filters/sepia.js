'use strict';

var gm = require('gm');


module.exports = function(image, callback){

  // create the gm stream
  var r = gm(image.contents, image.format);

  // apply the filter and pass on the stream
  r.sepia().stream(callback);

};
