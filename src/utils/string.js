'use strict';


exports.sanitize = function(value, type) {
  if (typeof type === 'undefined') {
    type = 'number';
  }
  switch (type) {
  case 'number':
    return value.toString().replace(/[^0-9]/, '') * 1;
  case 'alphanumeric':
    return value.replace(/[^a-z0-9]/i, '');
  case 'alpha':
    return value.replace(/[^a-z]/i, '');
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
