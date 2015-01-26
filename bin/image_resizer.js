#!/usr/bin/env node

'use strict';

var program, path, fs, mkdirp, pkg, chalk, _;


program = require('commander');
fs      = require('fs');
mkdirp  = require('mkdirp');
path    = require('path');
chalk   = require('chalk');
pkg     = require('../package.json');
_       = require('lodash');

/**
File/Directory helper functions
*/
function write(path, str, mode) {
  fs.writeFile(path, str, { mode: mode || '0666' });
  console.log('    ' + chalk.green('create') + ': ' + path);
}

function copy(from, to) {
  write(to, fs.readFileSync(from, 'utf-8'));
}

function mkdir(path, fn) {
  mkdirp(path, '0755', function(err){
    if (err) {
      throw err;
    }
    console.log('    ' + chalk.green('create') + ': ' + path);
    if (typeof fn === 'function'){
      fn();
    }
  });
}

function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' !== err.code) {
      throw err;
    }
    fn(!files || !files.length);
  });
}

function createApplicationAt(dir){
  var appName, newPkg;

  // Determine the app name from the directory
  appName = path.basename(path.resolve(dir));

  console.log('\n' + chalk.cyan('Creating new ') + chalk.cyan.bold('image-resizer') + chalk.cyan(' app!'));
  console.log();

  process.on('exit', function(){
    console.log();
    console.log(chalk.green('   now install your dependencies') + ':');
    console.log('     $ npm install');
    console.log();
    console.log(chalk.green('   then run the app') + ':');
    console.log('     $ gulp watch');
    console.log();
  });

  // create a new package.json
  newPkg = {
    name: appName,
    version: '1.0.0',
    main: 'index.js',
    description: 'My awesome image resizing service!',
    engines: {
      'node': pkg.engines.node
    },
    dependencies: {
      'image-resizer': '~' + pkg.version,
      'express': pkg.dependencies.express,
      'lodash': pkg.dependencies.lodash,
      'gm': pkg.dependencies.gm
    },
    devDependencies: pkg.devDependencies
  };

  if (program.engine === 'sharp') {
    newPkg.dependencies.sharp = pkg.dependencies.sharp;
  }

  write(dir + '/package.json', JSON.stringify(newPkg, null, 2));

  // create index.js
  var engine = program.engine === 'gm' ? 'gm' : 'sharp';
  var indexTmpl = fs.readFileSync(__dirname + '/./templates/index.js.tmpl');
  write(dir + '/index.js', _.template(indexTmpl, { engine: engine }));

  // create the gulpfile
  copy(__dirname + '/./templates/gulpfile.js.tmpl', dir + '/gulpfile.js');

  // create .env
  var envTmpl = fs.readFileSync(__dirname + '/./templates/.env.tmpl');
  write(dir + '/.env', _.template(envTmpl, {cwd: process.cwd()}));

  // create .gitignore
  copy(__dirname + '/./templates/.gitignore.tmpl', dir + '/.gitignore');

  // create .jshintrc
  copy(__dirname + '/../.jshintrc', dir + '/.jshintrc');

  // create Heroku files
  copy(__dirname + '/./templates/.buildpacks.tmpl', dir + '/.buildpacks');
  copy(__dirname + '/./templates/Procfile.tmpl', dir + '/Procfile');

  // create a README
  copy(__dirname + '/./templates/README.md.tmpl', dir + '/README.md');

  // create plugin folders
  //  - sources
  //  - filters
  mkdir(dir + '/plugins/sources');
  mkdir(dir + '/plugins/filters');
}

/**
Create the program and list the possible commands
*/
program.version(pkg.version);
program.option('-f, --force', 'force app build in an non-empty directory');
program.option('-e, --engine <engine>', 'chose the resize engine (gm|sharp)');
program.command('new')
  .description('Create new clean image-resizer app')
  .action( function () {
    var path = '.';
    emptyDirectory(path, function(empty) {
      if (empty || program.force){
        createApplicationAt(path);
      }
      else {
        console.log(
          chalk.red('\n    The current directory is not empty, please use the force (-f) option to proceed.\n')
        );
      }
    });
  });
program.command('filter <name>')
  .description('Create new filter stream')
  .action( function (filterName) {
    copy(__dirname + '/./templates/filter.js.tmpl', './plugins/filters/' + filterName + '.js');
  });
program.parse(process.argv);
