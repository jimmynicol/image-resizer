'use strict';

var _ = require('lodash');


function gravity(g, width, height, cropWidth, cropHeight){
  var x, y;

  // set the default x/y, same as gravity 'c' for center
  x = width/2 - cropWidth/2;
  y = height/2 - cropHeight/2;

  switch(g){
  case 'n':
    y = 0;
    break;
  case 'ne':
    x = width - cropWidth;
    y = 0;
    break;
  case 'nw':
    x = 0;
    y = 0;
    break;
  case 's':
    y = height - cropHeight;
    break;
  case 'se':
    x = width - cropWidth;
    y = height - cropHeight;
    break;
  case 'sw':
    x = 0;
    y = height - cropHeight;
    break;
  case 'e':
    x = width - cropWidth;
    break;
  case 'w':
    x = 0;
    break;
  }

  // make sure we do not return numbers less than zero
  if (x < 0){ x = 0; }
  if (y < 0){ y = 0; }

  return {
    x: Math.floor(x),
    y: Math.floor(y)
  };
}
exports.gravity = gravity;


function xy(modifiers, width, height, cropWidth, cropHeight){
  var x,y, dims;

  dims = gravity(modifiers.gravity, width, height, cropWidth, cropHeight);

  if (_.has(modifiers, 'x')){
    x = modifiers.x;
    if (x <= width - cropWidth){
      dims.x = modifiers.x;
    }
  }

  if (_.has(modifiers, 'y')){
    y = modifiers.y;
    if (y <= width - cropWidth){
      dims.y = modifiers.y;
    }
  }

  return dims;
}
exports.xy = xy;


exports.cropFill = function(modifiers, size){
  var wd, ht,
      newWd, newHt,
      cropWidth, cropHeight,
      crop;

  if (modifiers.width === null){
    modifiers.width = modifiers.height;
  }
  if (modifiers.height === null){
    modifiers.height = modifiers.width;
  }

  if (size.width >= size.height) {
    // need to check for situations where the requested size is bigger
    // than the original dimension.
    if (modifiers.height > size.height) {
      cropWidth = cropHeight = size.height;
    } else {
      cropWidth = cropHeight = modifiers.height;
    }

    ht = newHt = cropHeight;
    wd = null;
    newWd = ht / size.height * size.width;
  }

  else {
    if (modifiers.width > size.width) {
      cropWidth = cropHeight = size.width;
    } else {
      cropWidth = cropHeight = modifiers.width;
    }

    ht = null;
    wd = newWd = cropWidth;
    newHt = wd / size.width * size.height;
  }

  // get the crop X/Y as defined by the gravity or x/y modifiers
  crop = xy(modifiers, newWd, newHt, cropWidth, cropHeight);

  return {
    resize: {
      width: wd,
      height: ht
    },
    crop: {
      width: cropWidth,
      height: cropHeight,
      x: crop.x,
      y: crop.y
    }
  };
};