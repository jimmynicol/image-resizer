/*
Manipulate an image with GM, following the steps from the request options.
  - can resize, make square, or crop
@author: James Nicol, www.friesh.com, May 2013
*/

'use strict';

var Q, fs, gm;

fs = require('fs');
gm = require('gm');
Q  = require('q');


module.exports = function(img, stream) {
  var cropX, cropY, deferred, ht, m, newHt, newWd,
      onClose, resizeHeight, resizeWidth, wd;

  deferred = Q.defer();

  // Handle the close event of the write stream
  onClose = function() {
    // determine the file size and store it to the image object
    fs.stat(img.tmpFile, function(err, stat) {
      if (err) {
        deferred.reject(err);
      } else {
        img.size = stat.size;
        deferred.resolve(img);
      }
    });
  };

  // create a GM object based in the incoming stream
  m = gm(stream, img.filename());

  // manipulate the image based on the options
  switch (img.options.action) {
  case 'resize':
    m.resize(img.options.width, img.options.height);
    break;

  case 'square':
    // determine the resize coords, based on the smallest dimension
    if (img.origDims.width >= img.origDims.height) {

      // need to check for situations where the requested size is bigger than
      // the original dimension.
      //  eg: s=640 for original height of 318.
      //      - in this situation set the resize dims to original
      if (img.options.height > img.origDims.height) {
        resizeWidth = resizeHeight = img.origDims.height;
      } else {
        resizeWidth = resizeHeight = img.options.height;
      }

      ht = newHt = resizeHeight;
      wd = null;
      newWd = ht / img.origDims.height * img.origDims.width;
      cropX = Math.round((newWd - newHt) / 2);
      cropY = 0;

    } else {
      if (img.options.width > img.origDims.width) {
        resizeWidth = resizeHeight = img.origDims.width;
      } else {
        resizeWidth = resizeHeight = img.options.width;
      }

      ht = null;
      wd = newWd = resizeWidth;
      newHt = wd / img.origDims.width * img.origDims.height;
      cropX = 0;
      cropY = Math.round((newHt - newWd) / 2);
    }

    // resize then crop the image
    m.resize(wd, ht);
    m.crop(resizeWidth, resizeHeight, cropX, cropY);
    break;

  case 'crop':
    m.crop(
      img.options.width,
      img.options.height,
      img.options.cropX,
      img.options.cropY
    );
  }

  // make sure there is no EXIF data on the image
  m.noProfile();

  // write the image to disk
  m.write(img.tmpFile, function(err) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      onClose();
    }
  });

  // return a promise
  return deferred.promise;
};