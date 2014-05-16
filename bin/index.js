#!/usr/bin/env node

'use strict';

var program, path, fs, mkdirp, pkg, chalk,
    dest, appName, newPkg;


program = require('commander');
fs      = require('fs');
mkdirp  = require('mkdirp');
path    = require('path');
chalk   = require('chalk');
pkg     = require('../package.json');


program
  .version(pkg.version)
  .usage('[action] [options] [dir]')
  .parse(process.argv);

// dest = program.args.shift() || '.';
dest = '.';
appName = path.basename(path.resolve(dest));

// create a new package.json
newPkg = {
  name: appName,
  version: '0.0.1',
  dependencies: {
    "image-resizer": "~" + pkg.version,
    "express": pkg.dependencies.express,
    "lodash": pkg.dependencies.lodash
  },
  devDependencies: pkg.devDependencies
};
write(dest + '/package.json', JSON.stringify(newPkg, null, 2));

// create index.js
copy(__dirname + '/./templates/index.js.tmpl', dest + '/index.js');

// create the gulpfile
copy(__dirname + '/./templates/gulpfile.js.tmpl', dest + '/gulpfile.js');

// create .env
copy(__dirname + '/./templates/.env.tmpl', dest + '/.env');

// create .gitignore
copy(__dirname + '/./templates/.gitignore.tmpl', dest + '/.gitignore');

// create .jshintrc
copy(__dirname + '/../.jshintrc', dest + '/.jshintrc');

// create Heroku files
//  - Procfile
//  - .buildpacks
copy(__dirname + '/../Procfile', dest + '/Procfile');
copy(__dirname + '/../.buildpacks', dest + '/.buildpacks');

// create plugin folders
//  - sources
//  - filters
mkdir(dest + '/plugins/sources');
mkdir(dest + '/plugins/filters');


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
    fn && fn();
  });
}