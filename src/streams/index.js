'use strict';

var path    = require('path');
var modules = require('glob').sync(__dirname + '/*.js');
var utils   = require('../utils/string');
var streams = {};


for (var i=0; i < modules.length; i++){
  var stream = path.basename(modules[i], '.js');
  if ( stream !== 'index' ){
    streams[utils.camelCase(stream)] = require(modules[i]);
  }
}

module.exports = streams;
