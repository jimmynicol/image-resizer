'use strict';


var env, express, morgan, errorHandler;

env          = require('./environment_vars');
express      = require('express');
morgan       = require('morgan');
errorHandler = require('errorhandler');

module.exports = function(app){

  app.set('views', env.LOCAL_FILE_PATH + '/test');
  app.engine('html', require('ejs').renderFile);
  app.set('port', env.PORT || 3001);
  app.use(morgan('dev'));
  app.use(errorHandler());

};
