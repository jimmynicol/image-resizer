'use strict';

var express, app, ir, env, Img, streams;

express = require('express');
app     = express();
ir      = require('image-resizer');
env     = ir.env;
Img     = ir.img;
streams = ir.streams;


app.directory = __dirname;
ir.expressConfig(app);


/**
Return the modifiers map as a documentation endpoint
*/
app.get('/modifiers.json', function(request, response){
  response.status(200).json(ir.modifiers);
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
    response.status(200).json(env);
  });
}


/*
Return an image modified to the requested parameters
  - request format:
    /:modifers/path/to/image.format:metadata
    eg: https://doapv6pcsx1wa.cloudfront.net/s50/sample/test.png
*/
app.get('/*?', function(request, response){
  var image = new Img(request);

  image.getFile()
    .pipe(new streams.identify())
    .pipe(new streams.resize())
    .pipe(new streams.filter())
    .pipe(new streams.optimize())
    .pipe(streams.response(request, response));
});


/**
Start the app on the listed port
*/
app.listen(app.get('port'));
