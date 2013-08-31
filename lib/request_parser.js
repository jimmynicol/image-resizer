/*
Parse the incoming url for the available resizing commands
*/

'use strict';

var parser, _, sanitizeInput;

parser = require('url');
_ = require('lodash');


sanitizeInput = function(value, type) {
  if (type === null) {
    type = 'number';
  }
  switch (type) {
  case 'number':
    return value.replace(/[^0-9]/, '');
  case 'alpha':
    return value.replace(/[0-9]/, '');
  default:
    return value.replace(/[^0-9]/, '');
  }
};


module.exports = function(request){
  var dir, ext, filename, flush, img, imgParts, json, options, opts, pathnameParts, payload, url;

  // parse the url with the native parser, returning the querystring as a hash
  url = parser.parse(request.url, true);

  pathnameParts = url.pathname.slice(1).split('/');

  // pull out the image name from the path
  img = pathnameParts.pop();

  // create the bucket path from the remains of the pathname parts
  dir = pathnameParts.join('/');

  // extract the filename and extension from the img string
  imgParts = img.split('.');
  ext = imgParts.pop();
  filename = imgParts.join('.');

  // loop through the query string and extract actions
  options = {};

  _.forEach(url.query, function(value, key){
    switch(key) {

    // convert image to square: ?(s|square)=300
    case 's':
    case 'square':
      options.action = 'square';
      options.height = sanitizeInput(value);
      options.width  = sanitizeInput(value);
      break;

    // set the resize width: ?(w|width)=300
    case 'w':
    case 'width':
      options.action = 'resize';
      options.width  = sanitizeInput(value);
      break;

    // set the resize height: ?(h|height)=300
    case 'h':
    case 'height':
      options.action = 'resize';
      options.height = sanitizeInput(value);
      break;

    // crop the image: ?(c|crop)=[w],[h],[crop_x],[crop_y]
    //   - adding 'x' to width or height will resize to that dimension.
    //   eg: ?c=100x,50,center,center
    case 'c':
    case 'crop':
      opts = value.split(',');
      options.action = 'crop';
      options.width  = sanitizeInput(opts[0]);
      options.height = sanitizeInput(opts[1]);
      options.cropX  = opts[2] ? opts[2] : 'center';
      options.cropY  = opts[3] ? opts[3] : 'center';
      break;

    case 'json':
      json = true;
      break;

    case 'flush':
      flush = true;
    }
  });

  payload = {
    href: request.url,
    dir: dir,
    filename: filename,
    ext: ext,
    json: json || null,
    flush: flush || null,
    options: options
  };

  return payload;
};