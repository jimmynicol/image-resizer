'use strict';

var Img, Logger, env, http, port, redis, responses, favicon, server;

// load modules
require('colors');
http      = require('http');

// load custom modules
Logger    = require('./logger');
Img       = require('./image');
redis     = require('./redis');
responses = require('./responses');
favicon   = require('./favicon');

// set the default environment and port
env = process.env.NODE_ENV || 'development';
port = process.env.PORT || 5000;


server = http.createServer(function(request, response) {
  var generateVersion, img, log;

  // create a Logger instance
  log = new Logger(request, { port: port });

  generateVersion = function(img) {
    img.findOriginal()
      .then(function(original) {
        if (original) {
          log.log('Original retrieved, processing optimised version');

          img.generateVersion()
            .then(function() {
              responses.response302(response, log, img);
            })
            .catch(function(err) {
              responses.response500(response, log, err.message);
            })
            .finally(function() {
              img.deleteTmpFile();
            });
        } else {
          log.log('No image can be found by that uuid');
          responses.response404(response, log);
        }
      })
      .catch(function(err) {
        responses.response500(response, log, err.message);
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
      .done(function() {
        responses.response200(response, log, 'Success!');
      })
      .catch(function(err) {
        responses.response500(response, log, err.message);
      });
    break;

  default:
    // instantiate an Img class
    img = new Img(request, log);

    // check to see if the extension is in the valid list
    if (!img.validExtension()) {
      log.log('Unknown file extension:', img.ext);
      return responses.responses500(response, log, null);
    }

    // if this is a request for the exif metadata in JSON format
    if (img.json) {
      log.log('retrieving image metadata');
      img.getMetadata()
        .done(function(metadata) {
          responses.response200(response, log, JSON.stringify(metadata));
        });
      return;
    }

    log.log('Processing: ' + (img.filename().bold));

    // if this is a flush request
    if (img.flush) {
      log.log('Flushing any stored version and recreating');
      return generateVersion(img);
    }

    img.findVersion()
      .then(function(versionExists) {
        if (versionExists === true) {
          log.log('Version found');
          responses.response302(response, log, img);
        } else {
          log.log('Version does not exist');
          generateVersion(img);
        }
      })
      .catch(function(err) {
        responses.response500(response, log, err.message);
      });
  }
});

server.listen(port);

console.log(
  '\n✈',
  ' Server started on port:'.cyan,
  ('' + port + '\n').bold.cyan
);