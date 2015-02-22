'use strict';

var sharp = require('sharp');


module.exports = function(image, callback){

  // create the sharp object
  var r = sharp(image.contents);

  // apply the filter and pass on the stream
  r.blur(10).toBuffer(callback);

};
