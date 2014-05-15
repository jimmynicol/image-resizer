#!/usr/bin/env node

'use strict';

var program, path, pkg, chalk,
    dest, appName, newPkg;


program = require('commander');
path    = require('path');
chalk   = require('chalk');
pkg     = require('../package.json');


program
  .version(pkg.version)
  .usage('[action] [options] [dir]')
  .parse(process.argv);

dest = program.args.shift() || '.';
appName = path.basename(path.resolve(destination_path));



// create a new package.json
newPkg = {
  name: ''
  dependencies: {

  },
  devDependencies: pkg.devDependencies
};
write(dest + '/package.json', JSON.stringify(newPkg, null, 2));


// create the gulpfile

// create .env

// create .gitignore

// create .jshintrc

// create Heroku files
//  - Procfile
//  - .buildpacks

// create plugin folders
//  - sources
//  - filters


function write(path, str, mode) {
  fs.writeFile(path, str, { mode: mode || 0666 });
  console.log('  ' + chalk.green('create') + ': ' + path);
}

function copy(from, to) {
  write(to, fs.readFileSync(from, 'utf-8'));
}