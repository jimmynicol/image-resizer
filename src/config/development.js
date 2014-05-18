'use strict';


var express, morgan, errorHandler;

express      = require('express');
morgan       = require('morgan');
errorHandler = require('errorhandler');

module.exports = function(app){

  app.set('views', process.cwd() + '/test');
  app.engine('html', require('ejs').renderFile);
  app.set('port', process.env.PORT || 3001);
  app.use(morgan('dev'));
  app.use(errorHandler());

};
