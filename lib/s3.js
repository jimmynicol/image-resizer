/*
 * Wrapper for s3 interaction.
 *  - returns a promise for each exposed method
 * @author: James Nicol
*/

'use strict';

var fs, S3, Q, client;

fs = require('fs');
S3 = require('aws-sdk').S3;
Q  = require('q');

// create an AWS S3 client with the config data
client = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

var BUCKET = process.env.S3_BUCKET;

// Use the Knox API to retrieve a known object from S3
exports.getFile = function(src){
  var deferred;

  deferred = Q.defer();

  client.getObject({ Bucket: BUCKET, Key: src }, function(err, data){
    if (err) {
      console.error('Error in s3.js#client.getObject');
      console.error(err);
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(data.Body);
    }
  });

  return deferred.promise;
};


// Upload a file to s3
exports.upload = function(opts){
  var deferred, putParams;

  deferred = Q.defer();

  if (!opts.src) {
    throw new Error('invalid s3 upload src: ' + opts.src);
  }

  // open a stream to the uploaded file
  fs.readFile(opts.src, function (err, data) {
    putParams = {
      Bucket: BUCKET,
      Key: opts.dest,
      Body: data
    };

    client.putObject(putParams, function(err){
      if (err) {
        console.error(err);
        deferred.reject(new Error(err));
      } else {
        deferred.resolve(putParams.Body);
      }
    });
  });

  return deferred.promise;
};