'use strict';

var _, vars;

_ = require('lodash');

vars = {

  NODE_ENV: 'development',
  PORT: 3001,
  DEFAULT_SOURCE: 's3',
  EXCLUDE_SOURCES: null, // add comma delimited list

  // Restrict to named modifiers strings only
  NAMED_MODIFIERS_ONLY: false,

  // AWS keys
  AWS_ACCESS_KEY_ID: null,
  AWS_SECRET_ACCESS_KEY: null,
  AWS_REGION: null,
  S3_BUCKET: null,

  // Resize options
  RESIZE_PROCESS_ORIGINAL: true,
  AUTO_ORIENT: true,
  REMOVE_METADATA: true,

  // Protect original files
  // by specifying a max image width
  // or height - limits max height/width in parameters
  MAX_IMAGE_DIMENSION: null,

  // Color used when padding an image with the 'pad' crop modifier.
  IMAGE_PADDING_COLOR: 'white',

  // Optimization options
  IMAGE_PROGRESSIVE: true,
  IMAGE_QUALITY: 80,

  // Cache expiries
  IMAGE_EXPIRY: 60 * 60 * 24 * 90,
  IMAGE_EXPIRY_SHORT: 60 * 60 * 24 * 2,
  JSON_EXPIRY: 60 * 60 * 24 * 30,

  // Logging options
  LOG_PREFIX: 'resizer',
  QUEUE_LOG: true,

  // Response settings
  CACHE_DEV_REQUESTS: false,

  // Twitter settings
  TWITTER_CONSUMER_KEY: null,
  TWITTER_CONSUMER_SECRET: null,
  TWITTER_ACCESS_TOKEN: null,
  TWITTER_ACCESS_TOKEN_SECRET: null,

  // Where are the local files kept?
  LOCAL_FILE_PATH: process.cwd(),

  // Display an image if a 404 request is encountered from a source
  IMAGE_404: null,

  // Whitelist arbitrary HTTP source prefixes using EXTERNAL_SOURCE_*
  EXTERNAL_SOURCE_WIKIPEDIA: 'https://upload.wikimedia.org/wikipedia/',

  // Set a key used to force clients to sign requests (reduce risk of DDoS)
  REQUEST_SIGNING_KEY: null
};

_.forEach(vars, function(value, key){
  var keyType = typeof vars[key];

  if (_.has(process.env, key)){
    vars[key] = process.env[key];

    if (keyType === 'number') {
      vars[key] = +(vars[key]);
    }

    // cast any boolean strings to proper boolean values
    if (vars[key] === 'true'){
      vars[key] = true;
    }
    if (vars[key] === 'false'){
      vars[key] = false;
    }
  }

});

// Add external sources from environment vars
vars.externalSources = {};
Object.keys(vars).concat(Object.keys(process.env)).filter(function(key) {
  return (/^EXTERNAL_SOURCE_/).test(key);
}).forEach(function(key) {
  vars.externalSources[key.substr('EXTERNAL_SOURCE_'.length).toLowerCase()] = process.env[key] || vars[key];
});

// A few helpers to quickly determine the environment
vars.development = vars.NODE_ENV === 'development';
vars.test        = vars.NODE_ENV === 'test';
vars.production  = vars.NODE_ENV === 'production';


module.exports = vars;
