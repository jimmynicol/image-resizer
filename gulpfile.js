'use strict';

var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    mocha = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    util = require('gulp-util'),
    _ = require('lodash');


gulp.task('lint', function () {
  gulp.src(['src/**/*.js', 'index.js', 'gulpfile.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter(stylish));
});
gulp.task('lint:watch', ['lint'], function(){
  gulp.watch(
    ['src/**/*.js'],
    function(event){
      util.log('file changed:', util.colors.green(event.path));
      gulp.src(event.path)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter(stylish));
    }
  );
});

gulp.task('test', function () {
  gulp.src('test/**/*.js')
    .pipe(mocha({reporter: 'nyan'}))
    .on('error', function(err){
      console.log(err.toString());
      this.emit('end');
    });
});
gulp.task('test:watch', ['lint', 'test'], function (){
  gulp.watch(
    ['src/**/*.js', 'test/**/*.js'],
    ['lint', 'test']
  );
});

function env(){
  var dotenv  = require('dotenv'),
      fs = require('fs'),
      config = {},
      file,
      home = process.env.HOME;

  // useful for storing common AWS credentials with other apps
  if ( fs.existsSync(home + '/.awsrc') ){
    file = fs.readFileSync(home + '/.awsrc');
    _.extend(config, dotenv.parse(file));
  }

  if ( fs.existsSync('.env') ){
    file = fs.readFileSync('.env');
    _.extend(config, dotenv.parse(file));
  }

  // print out the env vars
  _.each(config, function(value, key){
    util.log('Env:', key, util.colors.cyan(value));
  });

  return config;
}

// gulp.task('watch', ['lint', 'test'], function () {
gulp.task('watch', ['lint'], function () {
  nodemon({
    script: 'index.js',
    ext: 'js html',
    env: env()
  // }).on('restart', ['lint', 'test']);
  }).on('restart', ['lint']);
});
