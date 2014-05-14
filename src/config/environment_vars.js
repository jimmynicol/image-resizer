'use strict';

var _, vars;

_ = require('lodash');

vars = {

  NODE_ENV: 'development',
  PORT: 3001,

  // AWS keys
  AWS_ACCESS_KEY_ID: null,
  AWS_SECRET_ACCESS_KEY: null,
  AWS_REGION: null,
  S3_BUCKET: null,

  // Resize options
  AUTO_ORIENT: true,
  REMOVE_METADATA: true,

  // Optimization options
  JPEG_PROGRESSIVE: true,
  PNG_OPTIMIZATION: 2,
  GIF_INTERLACED: true,

  // Cache expiries
  IMAGE_EXPIRY: 60 * 60 * 24 * 30,
  SOCIAL_IMAGE_EXPIRY: 60 * 60 * 24 * 2,
  JSON_EXPIRY: 60 * 60 * 24 * 30,

  // Logging options
  LOG_PREFIX: 'resizer',
  QUEUE_LOG: true,

  // Response settings
  CACHE_DEV_REQUESTS: false

};

_.forEach(vars, function(value, key){
  if (_.has(process.env, key)){
    vars[key] = process.env[key];
  }

  // cast any boolean strings to proper boolean values
  if (vars[key] === 'true'){
    vars[key] = true;
  }
  if (vars[key] === 'false'){
    vars[key] = false;
  }
});


// A few helpers to quickly determine the environment
vars.development = vars.NODE_ENV === 'development';
vars.test        = vars.NODE_ENV === 'test';
vars.production  = vars.NODE_ENV === 'production';


module.exports = vars;