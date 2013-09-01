/*
Logger object
  - writes to stdout, and a redis pub/sub channel for centralized logging.
*/

'use strict';

var Logger, util, _;

util = require('util');
_    = require('lodash');


Logger = (function() {

  function Logger(request, params) {
    if (params === null) {
      params = {};
    }
    this.port = params.port || process.env.PORT;
    this.method = request.method;
    this.url = request.url;
    this.status = 'success';
    this.code = 200;
    this.err = null;
    this.mark = Date.now();
    this.logs = [];
    this.times = [];
  }

  // Take a log str and store it in the queue for printing/publishing later.
  Logger.prototype.log = function() {
    var str;

    // flatten the arguments to a single string
    str = '';
    _.forEach(arguments, function(arg){
      str += '' + arg + ' ';
    });

    // store the string internally
    this.logs.push(str);
  };


  // Store time points for period based logging
  Logger.prototype.time = function(str) {
    this.times[str] = Date.now();
  };


  Logger.prototype.timeEnd = function(str) {
    var t;

    t = this.times[str];
    this.logs.push(
      ('' + str + ': ') +
      ('' + (Date.now() - t)).bold +
      ' ms'
    );
  };


  Logger.prototype.complete = function() {
    var meth;

    // measure the length to completion
    this.elapsed = Date.now() - this.mark;

    // print the timestamped line with method and url
    meth = this.status === 'success' ? this.method.green : this.method.red;
    util.log('' + meth + ' ' + this.url.bold);

    // loop through all the of collected log messages
    _.forEach(this.logs, function(msg){
      console.log(msg);
    });

    // log the error to stdout if present
    if (this.err) {
      console.error(this.err.message);
    }

    // log a complete message to stdout
    console.log(
      this.status === 'success' ? '✔'.green : '✘'.red,
      this._httpCode().bold, 'completed in',
      ('' + this.elapsed).bold,
      'ms\n'
    );
  };

  // Simple list of the used codes and their human readable meanings
  Logger.prototype._httpCode = function() {
    var codes;

    codes = {
      200: '200 OK',
      301: '301 Moved Permanently',
      302: '302 Found',
      404: '404 Not Found',
      500: '500 Internal Server Error'
    };

    return codes[this.code];
  };

  return Logger;

})();


module.exports = Logger;