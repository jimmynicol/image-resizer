/*
Wrapper class for Redis interaction
  - adds deferred objects to each method
  - adds lock wrapper
  - abstracts the persistence layer out of image class so it can be tested
*/

'use strict';

var Q, interval, parsedUrl, redis, redisClient, url, waitTimeout;

url = require('url');
redis = require('redis');
Q = require('q');


// pull out the connection details from env and create a redis connection
parsedUrl = url.parse(process.env.REDISTOGO_URL);
redisClient = redis.createClient(parsedUrl.port, parsedUrl.hostname);

// if there are authentication details add those
if (parsedUrl.auth !== null) {
  redisClient.auth(parsedUrl.auth.split(':')[1]);
}

// set a couple of variables
interval = 200;
waitTimeout = interval * 10;


// Set a key if it doesn't exist
exports.setnx = function(key, value) {
  var deferred;

  deferred = Q.defer();

  redisClient.setnx(key, value, function(err, res) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
};


// Do a standard key set
exports.set = function(key, value) {
  var deferred;

  deferred = Q.defer();

  redisClient.set(key, value, function(err, res) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
};


// Get a key
exports.get = function(key) {
  var deferred;

  deferred = Q.defer();

  redisClient.get(key, function(err, res) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
};


// Delete a key
exports.del = function(keys) {
  var deferred;

  deferred = Q.defer();

  if (typeof keys === 'string') {
    keys = [keys];
  }

  redisClient.del(keys, function(err, res) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
};


// Set a lock key
exports.setLock = function(key) {
  var deferred, timeout;

  deferred = Q.defer();
  timeout = Date.now() + waitTimeout;
  redisClient.setnx(key, timeout, function(err, res) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(res);
    }
    return deferred.complete.apply(deferred, arguments);
  });
  return deferred.promise;
};


// Handle dealing with a lock key
exports.lock = function(key) {
  var deferred;

  deferred = Q.defer();
  redisClient.get(key, function(err, res) {
    var expiration, redisLockTimer;

    if (err) {
      deferred.reject(new Error('lock find error'));
    } else {
      if (res !== null) {
        if (parseInt(res, 10) < Date.now()) {
          deferred.reject(new Error('lock expired'));
        } else {
          expiration = Date.now() + waitTimeout;
          redisLockTimer = setInterval(function() {
            redisClient.get(key, function(e, r) {
              if (e) {
                clearInterval(redisLockTimer);
                deferred.reject(new Error('lock error'));
              } else {
                if (!r) {
                  clearInterval(redisLockTimer);
                  deferred.resolve(new Error('lock absent'));
                } else {
                  if (Date.now() > expiration) {
                    clearInterval(redisLockTimer);
                    deferred.reject(new Error('lock timeout'));
                  }
                }
              }
            });
          }, interval);
        }
      } else {
        deferred.reject(new Error('no lock'));
      }
    }
  });

  return deferred.promise;
};

// Ping the redis server, primarily used in a heartbeat call for load balancing
exports.ping = function() {
  var deferred;

  deferred = Q.defer();

  redisClient.info(function(err, res) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
};