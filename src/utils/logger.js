'use strict';

var env, chalk, _, slice, prefix, queueLog, args;

env       = require('../config/environment_vars');
chalk     = require('chalk');
_         = require('lodash');
slice     = [].slice;
prefix    = env.LOG_PREFIX;
queueLog  = env.QUEUE_LOG;

chalk.enabled = true;


function Logger(){
  this.queue = [];
  this.times = {};
  this.queueLog = queueLog;
}

Logger.prototype.colors = chalk;

Logger.prototype.log = function(){
  args = slice.call(arguments);
  if (this.queueLog){
    this.queue.push({ method: 'log',  args: args });
  } else {
    args.unshift('[' + chalk.green(prefix) + ']');
    console.log.apply(console, args);
  }
};

Logger.prototype.error = function(){
  args = slice.call(arguments);
  if (this.queueLog){
    this.queue.push({ method: 'error', args: args });
  } else {
    args.unshift('[' + chalk.green(prefix) + ']');
    console.error.apply(console, args);
  }
};

Logger.prototype.time = function(key){
  if (this.queueLog){
    this.times[key] = Date.now();
  } else {
    key = '[' + chalk.green(prefix) + '] ' + chalk.cyan(key);
    console.time.call(console, key);
  }
};

Logger.prototype.timeEnd = function(key){
  if (this.queueLog){
    var time = Date.now() - this.times[key];
    this.queue.push({ method: 'time', key: key, time: time });
  } else {
    key = '[' + chalk.green(prefix) + '] ' + chalk.cyan(key);
    console.timeEnd.call(console, key);
  }
};

Logger.prototype.flush = function(){
  if (this.queue.length === 0){
    return;
  }

  console.log('');
  _.each(this.queue, function(item){
    var log = '';
    log += '[' + chalk.green(prefix) + '] ';
    switch(item.method){
    case 'log':
      _.each(item.args, function(arg){
        log += arg.toString() + ' ';
      });
      break;
    case 'error':
      _.each(item.args, function(arg){
        log += chalk.red(arg.toString()) + ' ';
      });
      break;
    case 'time':
      log += chalk.cyan(
        item.key + ' - ' + chalk.bold(item.time.toString()) + 'ms'
      );
      break;
    }
    console.log(log);
  });

};


module.exports = Logger;