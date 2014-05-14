'use strict';

var express = require('express'),
    app = express(),
    env = require('./src/config/environment_vars'),
    Img = require('./src/image'),
    streams = require('./src/streams');


app.directory = __dirname;
require('./src/config/' + env.NODE_ENV)(app);


/**
Return the modifiers map as a documentation endpoint
*/
app.get('/modifiers.json', function(request, response){
  var modMap = require('./src/lib/modifiers').map;
  response.json(200, modMap);
});


/**
Some helper endpoints when in development
*/
if (env.development){
  // Show a test page of the image options
  app.get('/test-page', function(request, response){
    response.render('index.html');
  });

  // Show the environment variables and their current values
  app.get('/env', function(request, response){
    response.json(200, env);
  });
}


/*
Return an image modified to the requested parameters
  - request format:
    /:modifers/path/to/image.format:metadata
    eg: https://doapv6pcsx1wa.cloudfront.net/s50/sample/test.png
*/
app.get('/:modifiers/*?', function(request, response){
  var image = new Img(request);

  image.getFile()
    .pipe(new streams.identify())
    .pipe(new streams.resize())
    .pipe(new streams.optimize())
    .pipe(streams.response(request, response));
});


/**
Start the app on the listed port
*/
app.listen(app.get('port'));
