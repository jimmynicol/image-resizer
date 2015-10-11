/**
Image modifier utilities

Sample modifier strings, separated by a dash

  - /s50/path/to/image.png
  - /s50-gne/path/to/image.png
  - /w300-h200/path/to/image.png
  - /image.jpg
  - /path/to/image.png
  - /path/to/image.png.json


Supported modifiers are:

  - height:       eg. h500
  - width:        eg. w200
  - square:       eg. s50
  - crop:         eg. cfill
  - top:          eg. y12
  - left:         eg. x200
  - gravity:      eg. gs, gne
  - filter:       eg. fsepia
  - external:     eg. efacebook
  - quality:      eg. q90

Crop modifiers:
  fit
     - maintain original proportions
     - resize so image fits wholly into new dimensions
         - eg: h400-w500 - 400x600 -> 333x500
     - default option
  fill
     - maintain original proportions
     - resize via smallest dimension, crop the largest
     - crop image all dimensions that dont fit
         - eg: h400-w500 - 400x600 -> 400x500
  cut
     - maintain original proportions
     - no resize, crop to gravity or x/y
  scale
     - do not maintain original proportions
     - force image to be new dimensions (squishing the image)
  pad
     - maintain original proportions
     - resize so image fits wholly into new dimensions
     - padding added on top/bottom or left/right as needed (color is configurable)

*/
'use strict';


var _, string, filters, sources, filterKeys, sourceKeys, modifierMap,
    modKeys, env, environment, fs, namedModifierMap;

_          = require('lodash');
string     = require('../utils/string');
filters    = require('../streams/filters');
sources    = require('../streams/sources');
filterKeys = _.keys(filters);
environment = require('../config/environment_vars');
sourceKeys = _.keys(sources).concat(_.keys(environment.externalSources));
fs         = require('fs');


modifierMap = [
  {
    key: 'h',
    desc: 'height',
    type: 'integer'
  },
  {
    key: 'w',
    desc: 'width',
    type: 'integer'
  },
  {
    key: 's',
    desc: 'square',
    type: 'integer'
  },
  {
    key: 'y',
    desc: 'top',
    type: 'integer'
  },
  {
    key: 'x',
    desc: 'left',
    type: 'integer'
  },
  {
    key: 'g',
    desc: 'gravity',
    type: 'string',
    values: ['c','n','s','e','w','ne','nw','se','sw'],
    default: 'c'
  },
  {
    key: 'c',
    desc: 'crop',
    type: 'string',
    values: ['fit','fill','cut','scale','pad'],
    default: 'fit'
  },
  {
    key: 'e',
    desc: 'external',
    type: 'string',
    values: sourceKeys,
    default: environment.DEFAULT_SOURCE
  },
  {
    key: 'f',
    desc: 'filter',
    type: 'string',
    values: filterKeys
  },
  {
    key: 'q',
    desc: 'quality',
    type: 'integer',
    range: [1, 100],
    default: environment.IMAGE_QUALITY
  }
];

exports.map = modifierMap;

modKeys = _.map(modifierMap, function(value){
  return value.key;
});


function inArray(key, array){
  return _.indexOf(array, key) > -1;
}

function getModifier(key){
  var i, mod;

  for (i in modifierMap){
    mod = modifierMap[i];
    if (mod.key === key){
      return mod;
    }
  }
  return null;
}

exports.mod = getModifier;

// Check to see if there is a config file of named modifier aliases
if (fs.existsSync(process.cwd() + '/named_modifiers.json')){
  var file = fs.readFileSync(process.cwd() + '/named_modifiers.json');
  namedModifierMap = JSON.parse(file);
}


// Take an array of modifiers and parse the keys and values into mods hash
function parseModifiers(mods, modArr) {
  var key, value, mod;

  _.each(modArr, function(item){
    key = item[0];
    value = item.slice(1);

    if (inArray(key, modKeys)){

      // get the modifier object that responds to the listed key
      mod = getModifier(key);

      //this is a limit enforced by sharp. the application will crash without
      //these checks.
      var dimensionLimit = 16383;

      switch(mod.desc){
      case 'height':
        mods.height = string.sanitize(value);
        if (mods.height > dimensionLimit) {
          mods.height = dimensionLimit;
        }
        mods.hasModStr = true;
        break;
      case 'width':
        mods.width = string.sanitize(value);
        if (mods.width > dimensionLimit) {
          mods.width = dimensionLimit;
        }
        mods.hasModStr = true;
        break;
      case 'square':
        mods.action = 'square';
        mods.height = string.sanitize(value);
        mods.width = string.sanitize(value);
        mods.hasModStr = true;
        break;
      case 'gravity':
        value = string.sanitize(value, 'alpha');
        if (inArray(value.toLowerCase(), mod.values)){
          mods.gravity = value.toLowerCase();
        }
        mods.hasModStr = true;
        break;
      case 'top':
        mods.y = string.sanitize(value);
        mods.hasModStr = true;
        break;
      case 'left':
        mods.x = string.sanitize(value);
        mods.hasModStr = true;
        break;
      case 'crop':
        value = string.sanitize(value, 'alpha');
        if (inArray(value.toLowerCase(), mod.values)){
          mods.crop = value.toLowerCase();
        }
        mods.hasModStr = true;
        break;
      case 'external':
        value = string.sanitize(value, 'alphanumeric');
        if (inArray(value.toLowerCase(), mod.values)){
          mods.external = value.toLowerCase();
        }
        mods.hasModStr = true;
        break;
      case 'filter':
        value = string.sanitize(value, 'alpha');
        if (inArray(value.toLowerCase(), mod.values)){
          mods.filter = value.toLowerCase();
        }
        mods.hasModStr = true;
        break;
      case 'quality':
        value = string.sanitize(value);
        if(!isNaN(value)) {
          var min = mod.range[0],
            max = mod.range[1];
          mods.quality = Math.max(min, Math.min(max, value));
        }
        mods.hasModStr = true;
        break;
      }

    }
  });

  return mods;
}

/**
 * @param {Object} mods
 * @return {Object} mods with limited width /height
 */
var limitMaxDimension = function(mods, env){
  // check to see if
  // a max image dimension has been specified
  // and limits the current dimension to that maximum
  var limitDimension = function(dimension, mods){
    if(!env.MAX_IMAGE_DIMENSION){
      return mods;
    }
    var maxDimension = parseInt(env.MAX_IMAGE_DIMENSION, 10);
    if(dimension in mods && mods[dimension] > 0){
      mods[dimension] = Math.min(maxDimension, mods[dimension]);
    }else{
      mods[dimension] = maxDimension;
    }
    if(mods.action === 'original'){
      // override to 'resizeOriginal' type
      mods.action = 'resizeOriginal';
    }
    return mods;
  };

  // limit height and width
  // in the mods
  mods = limitDimension(
    'width',
    limitDimension(
      'height', mods
    )
  );
  return mods;
};

// Exposed method to parse an incoming URL for modifiers, can add a map of
// named (preset) modifiers if need be (mostly just for unit testing). Named
// modifiers are usually added via config json file in root of application.
exports.parse = function(requestUrl, namedMods, envOverride){
  // override 'env' for testing
  if(typeof envOverride !== 'undefined'){
    env = _.clone(envOverride);
  } else {
    env = _.clone(environment);
  }

  var segments, mods, modStr, image, gravity, crop, quality;

  gravity   = getModifier('g');
  crop      = getModifier('c');
  quality   = getModifier('q');
  segments  = requestUrl.replace(/^\//,'').split('/');
  modStr    = _.first(segments);
  image     = _.last(segments).toLowerCase();
  namedMods = typeof namedMods === 'undefined' ? namedModifierMap : namedMods;


  // set the mod keys and defaults
  mods = {
    action: 'original',
    height: null,
    width: null,
    gravity: gravity.default,
    crop: crop.default,
    quality: quality.default,
    hasModStr: false
  };

  // check the request to see if it includes a named modifier
  if (namedMods && !_.isEmpty(namedMods)){
    if (_.has(namedMods, modStr)){
      _.forEach(namedMods[modStr], function(value, key){
        if (key === 'square'){
          mods.action = 'square';
          mods.height = value;
          mods.width = value;
        } else {
          mods[key] = value;
        }
      });
    }
  }

  // check the request for available modifiers, unless we are restricting to
  // only named modifiers.
  if (!env.NAMED_MODIFIERS_ONLY) {
    mods = parseModifiers(mods, modStr.split('-'));
  }


  // check to see if this a metadata call, it trumps all other requested mods
  if (image.slice(-5) === '.json'){
    mods.action = 'json';
    return mods;
  }

  if (mods.action === 'square'){
    // make sure crop is set to the default
    mods.crop = 'fill';
    return limitMaxDimension(mods, env);
  }

  if (mods.height !== null || mods.width !== null){
    mods.action = 'resize';

    if (mods.crop !== crop.default){
      mods.action = 'crop';
    }
    if (mods.gravity !== gravity.default) {
      mods.action = 'crop';
    }
    if (_.has(mods, 'x') || _.has(mods, 'y')) {
      mods.action = 'crop';
    }
  }

  return limitMaxDimension(mods, env);
};
