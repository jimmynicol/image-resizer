/*
 * Wrapper for s3 interaction.
 *  - returns a promise for each exposed method
 * @author: James Nicol
*/

'use strict';

var fs, knox, Q, client;

fs    = require('fs');
knox  = require('knox');
Q     = require('q');

// create an AWS S3 client with the config data
client = knox.createClient({
  key: process.env.AWS_ACCESS_KEY_ID,
  secret: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.S3_BUCKET
});


// Use the Knox API to retrieve a known object from S3
exports.getFile = function(src){
  var deferred;

  deferred = Q.defer();

  client.getFile(src, function(err, res){
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
};


// Upload a file to s3
exports.upload = function(opts){
  var deferred, readStream, headers;

  deferred = Q.defer();

  // open a stream to the uploaded file
  readStream = fs.createReadStream(opts.src);

  // set the headers
  headers = {
    'Content-Length' : opts.size,
    'Content-Type'   : opts.mime,
    'x-amz-acl'      : 'public-read'
  };

  // stream the image to s3
  client.putStream(readStream, opts.dest, headers, function(err, res){
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
};