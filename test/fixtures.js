'use strict';

exports.pathGenerator = function(opts) {
  opts = opts || {};

  var p = {
    domain: opts.domain || 'https://images.friesh.com/',
    dir: opts.dir || 't/o/9ef6f46643',
    uuid: opts.uuid || 'cb6a0c18e6',
    ext: opts.ext || 'jpg',
    query: opts.query || 'h=200&w=300'
  };

  p.path = p.domain + p.dir + '/' + p.uuid + '.' + p.ext + '?' + p.query;

  return p;
};