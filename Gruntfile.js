'use strict';

module.exports = function(grunt){

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['Gruntfile.js', 'index.js', 'lib/{,*/}*.js', 'test/{,*/}*.js']
    },
    simplemocha: {
      options: {
        timeout: 3000,
        ignoreleaks: false,
        reporter: 'spec',
        ui: 'bdd'
      },
      all: {
        src: ['test/**/*.js']
      }
    },
    watch: {
      test: {
        files: ['lib/**/*.js', 'test/**/*.js'],
        tasks: ['simplemocha']
      },
      jshint: {
        files: ['Gruntfile.js', 'index.js', 'lib/**/*.js', 'test/**/*.js'],
        tasks: ['jshint']
      }
    }
  });

  grunt.registerTask('test',    ['simplemocha']);
  grunt.registerTask('default', ['jshint', 'test', 'watch']);

};