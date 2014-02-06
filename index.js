/*
Copyright (c) 2013 James Andrew Nicol under the terms of the MIT
license found at http://github.com/jimmynicol/image-resizer/raw/master/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

'use strict';

var Img, Logger, env, http, fs, _, port, redis, responses, favicon, server;

// load modules
require('colors');
http      = require('http');
fs        = require('fs');
_         = require('lodash');

// check for a local environment config file
if( fs.existsSync('./local_environment.js')){
  var config = require('./local_environment');

  console.log('\nLoading local config file'.green);

  // add these variables to the environment, basically a convenience from
  // having to set them manually each time.
  _.forEach(config, function(value, key){
    if (value !== ''){
      console.log('adding:', key.bold);
      process.env[key] = value;
    }
  });
}

// load custom modules
Logger    = require('./lib/logger');
Img       = require('./lib/image');
redis     = require('./lib/redis');
responses = require('./lib/response');
favicon   = require('./lib/favicon');

// set the default environment and port
env  = process.env.NODE_ENV || 'development';
port = process.env.PORT || 5000;


server = http.createServer(function(request, response) {
  var generateVersion, img, log;

  // create a Logger instance
  log = new Logger(request, { port: port });

  generateVersion = function(img) {
    img.findOriginal()
      .catch(function(err) {
        responses.response500(response, log, err.message);
      })
      .done(function(original) {
        if (original) {
          log.log('Processing optimised version');

          img.generateVersion()
            .catch(function(err) {
              log.log(err);
              responses.response500(response, log, err.message);
            })
            .finally(function() {
              img.deleteTmpFile();
            })
            .done(function() {
              responses.response302(response, log, img);
            });
        } else {
          log.log('No image can be found by that uuid');
          responses.response404(response, log);
        }
      });
  };

  switch (request.url){
  case '/':
    responses.response404(response, log);
    break;

  case '/favicon.ico':
    favicon(response);
    break;

  case '/health':
    redis.ping()
      .catch(function(err) {
        responses.response500(response, log, err.message);
      })
      .done(function() {
        responses.response200(response, log, 'Success!');
      });
    break;

  default:
    // instantiate an Img class
    img = new Img(request, log);

    // check to see if the extension is in the valid list
    if (!img.validExtension()) {
      log.log('Unknown file extension:', img.ext);
      return responses.response500(response, log, null);
    }

    // if this is a request for the exif metadata in JSON format
    if (img.json) {
      log.log('retrieving image metadata');
      img.getMetadata()
        .catch(function(err){
          responses.response500(response, log, err.message);
        })
        .done(function(metadata) {
          responses.response200(response, log, JSON.stringify(metadata));
        });
      return;
    }

    log.log('Processing: ' + (img.filename().bold));

    // if this is a flush request
    if (img.flush) {
      log.log('Flushing any stored version and recreating');
      img.flushKeys()
        .catch(function(err){
          responses.response500(response, log, err.message);
        })
        .done(function(){
          generateVersion(img);
        });
      return;
    }

    img.findVersion()
      .catch(function(err) {
        responses.response500(response, log, err.message);
      })
      .done(function(versionExists) {
        if (versionExists === true) {
          log.log('Version found');
          responses.response302(response, log, img);
        } else {
          log.log('Version does not exist');
          generateVersion(img);
        }
      });
  }
});

server.listen(port);

console.log(
  '\n✈',
  'image-resizer'.bold.cyan,
  'started!'
);

console.log(
  'port:',
  ('' + port).bold.cyan
);

console.log(
  'environment:',
  ('' + env + '\n').bold.cyan
);