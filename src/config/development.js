'use strict';

var express = require('express');

module.exports = function(app){
  app.configure('development', function(){

    app.set('views', process.cwd() + '/test');
    app.engine('html', require('ejs').renderFile);

    app.set('port', process.env.PORT || 3001);
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.errorHandler());

  });
};