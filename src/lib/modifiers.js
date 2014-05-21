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

*/
'use strict';


var _, string, filters, sources,  filterKeys, sourceKeys, modifierMap, modKeys;

_          = require('lodash');
string     = require('../utils/string');
filters    = require('../streams/filters');
sources    = require('../streams/sources');
filterKeys = _.keys(filters);
sourceKeys = _.keys(sources);


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
    values: ['fit','fill','cut','scale'],
    default: 'fit'
  },
  {
    key: 'e',
    desc: 'external',
    type: 'string',
    values: sourceKeys,
    default: 's3'
  },
  {
    key: 'f',
    desc: 'filter',
    type: 'string',
    values: filterKeys
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


exports.parse = function(requestUrl){
  var segments, mods, image, key, value, mod, gravity, crop;

  gravity  = getModifier('g');
  crop     = getModifier('c');
  segments = requestUrl.replace(/^\//,'').split('/');
  image    = _.last(segments).toLowerCase();

  // set the mod keys and defaults
  mods = {
    action: 'original',
    height: null,
    width: null,
    gravity: gravity.default,
    crop: crop.default
  };

  _.each(_.first(segments).split('-'), function(item){
    key = item[0];
    value = item.slice(1);

    if (inArray(key, modKeys)){
      // get the modifier object that responds to the listed key
      mod = getModifier(key);

      switch(mod.desc){
      case 'height':
        mods.height = string.sanitize(value);
        break;
      case 'width':
        mods.width = string.sanitize(value);
        break;
      case 'square':
        mods.action = 'square';
        mods.height = string.sanitize(value);
        mods.width = string.sanitize(value);
        break;
      case 'gravity':
        value = string.sanitize(value, 'alpha');
        if (inArray(value.toLowerCase(), mod.values)){
          mods.gravity = value.toLowerCase();
        }
        break;
      case 'top':
        mods.y = string.sanitize(value);
        break;
      case 'left':
        mods.x = string.sanitize(value);
        break;
      case 'crop':
        value = string.sanitize(value, 'alpha');
        if (inArray(value.toLowerCase(), mod.values)){
          mods.crop = value.toLowerCase();
        }
        break;
      case 'external':
        value = string.sanitize(value, 'alpha');
        if (inArray(value.toLowerCase(), mod.values)){
          mods.external = value.toLowerCase();
        }
        break;
      case 'filter':
        value = string.sanitize(value, 'alpha');
        if (inArray(value.toLowerCase(), mod.values)){
          mods.filter = value.toLowerCase();
        }
        break;
      }
    }
  });

  // check to see if this a metadata call, it trumps all other requested mods
  if (image.slice(-5) === '.json'){
    mods.action = 'json';
    return mods;
  }

  if (mods.action === 'square'){
    // make sure crop is set to the default
    mods.crop = 'fill';
    return mods;
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

  return mods;
};
