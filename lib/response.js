/*
Canned responses for each of the necessary status codes
*/

'use strict';


exports.response200 = function(response, log, body) {
  log.code = 200;
  log.complete();
  response.writeHead(200);
  response.write(body);

  return response.end();
};

exports.response302 = function(response, log, img) {
  var maxAge;

  log.code = 302;
  log.complete();
  maxAge = 60 * 60 * 24 * 30;
  response.writeHead(302, {
    'Cache-Control':  'public',
    'Content-Length': 0,
    'Content-Type':   img.mime,
    'Expires':        (new Date(Date.now() + maxAge * 1000)).toGMTString(),
    'Last-Modified':  (new Date(0)).toGMTString(),
    'Location':       img.s3url(),
    'Vary':           'Accept-Encoding'
  });

  return response.end();
};

exports.response404 = function(response, log) {
  log.status = 'error';
  log.code = 404;
  log.complete();
  response.writeHead(404);

  return response.end();
};

exports.response500 = function(response, log, err) {
  log.status = 'error';
  log.code = 500;
  log.err = err;
  log.complete();
  response.writeHead(500);

  return response.end();
};