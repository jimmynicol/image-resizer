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
  AUTO_ORIENT: 'true',
  REMOVE_METADATA: 'true',

  // Optimization options
  JPEG_PROGRESSIVE: 'true',
  OPTIMIZATION_LEVEL: 2,

  // Cache expiries
  IMAGE_EXPIRY: 60 * 60 * 24 * 30,
  JSON_EXPIRY: 60 * 60 * 24 * 30,

  // Logging options
  LOG_PREFIX: 'resizer',
  QUEUE_LOG: 'true'

};

_.forEach(vars, function(value, key){
  if (_.has(process.env, key)){
    vars[key] = process.env[key];
  }
});


module.exports = vars;