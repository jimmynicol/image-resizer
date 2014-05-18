'use strict';

var express = require('express');

module.exports = function(app){
  app.configure('production', function(){

    app.set('port', process.env.PORT || 3001);
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.errorHandler());

  });
};
