'use strict';


exports.sanitize = function(value, type) {
  if (typeof type === 'undefined') {
    type = 'number';
  }
  switch (type) {
  case 'number':
    return value.toString().replace(/[^0-9]/, '') * 1;
  case 'alpha':
    return value.replace(/[0-9]/, '');
  default:
    return value.replace(/[^0-9]/, '');
  }
};


exports.camelCase = function(input){
  return input.toLowerCase()
    .replace(/_(.)/g, function(match, letter){
      return letter.toUpperCase();
    });
};
