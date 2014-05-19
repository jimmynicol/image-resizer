#!/usr/bin/env node

'use strict';

var program, path, fs, mkdirp, pkg, chalk,
    dest, appName, action, newPkg;


program = require('commander');
fs      = require('fs');
mkdirp  = require('mkdirp');
path    = require('path');
chalk   = require('chalk');
pkg     = require('../package.json');


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
    console.log('    ' + chalk.green('create') + ' : ' + path);
    if (typeof fn === 'function'){
      fn();
    }
  });
}


function createApplicationAt(path){
  console.log('\n' + chalk.cyan('Creating new ') + chalk.cyan.bold('image-resizer') + chalk.cyan(' app!'));
  console.log();

  process.on('exit', function(){
    console.log();
    console.log(chalk.green('   now install your dependencies') + ':');
    console.log('     $ npm install');
    console.log();
    console.log(chalk.green('   run the app') + ':');
    console.log('     $ gulp watch');
    console.log();
  });

  // create a new package.json
  newPkg = {
    name: appName,
    version: '0.0.1',
    main: 'index.js',
    engines: {
      'node': pkg.engines.node
    },
    dependencies: {
      'image-resizer': '~' + pkg.version,
      'express': pkg.dependencies.express,
      'lodash': pkg.dependencies.lodash
    },
    devDependencies: pkg.devDependencies
  };

  write(path + '/package.json', JSON.stringify(newPkg, null, 2));

  // create index.js
  copy(__dirname + '/./templates/index.js.tmpl', path + '/index.js');

  // create the gulpfile
  copy(__dirname + '/./templates/gulpfile.js.tmpl', path + '/gulpfile.js');

  // create .env
  copy(__dirname + '/./templates/.env.tmpl', path + '/.env');

  // create .gitignore
  copy(__dirname + '/./templates/.gitignore.tmpl', path + '/.gitignore');

  // create .jshintrc
  copy(__dirname + '/../.jshintrc', path + '/.jshintrc');

  // create Heroku files
  //  - Procfile
  //  - .buildpacks
  write (path + '/Procfile', 'web: node index.js');
  copy(__dirname + '/../.buildpacks', path + '/.buildpacks');

  // create plugin folders
  //  - sources
  //  - filters
  mkdir(path + '/plugins/sources');
  mkdir(path + '/plugins/filters');
}

/**
Create the program and list the possible commands
*/
program
  .version(pkg.version)
  .usage('[action] [options]')
  .command('new', 'Create new clean image-resizer app')
  .command('filter [name]', 'Create new filter stream')
  .option('-f, --force', 'force on non-empty directory')
  .parse(process.argv);

dest = '.';
appName = path.basename(path.resolve(dest));
action = program.args[0];

switch(action){
case 'new':
  createApplicationAt(dest);
  break;

case 'filter':
  var filterName = program.args[1];
  copy(__dirname + '/./templates/filter.js.tmpl', dest + '/plugins/filters/' + filterName + '.js');
  break;
}
