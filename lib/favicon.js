/*
Favicon rendering, as described here:
  http://www.senchalabs.org/connect/favicon.html
*/

'use strict';

var fs, crypto, icon, maxAge, path, md5;

fs = require('fs');
crypto = require('crypto');
icon = null;
maxAge = 86400000;
path = __dirname + '/../assets/favicon.ico';

md5 = function(str){
  var hash = crypto.createHash('md5');
  hash.update(str);
  hash.digest('hex');
};


module.exports = function(res){
  if (icon){
    res.writeHead(200, icon.headers);
    res.end(icon.body);
  } else {
    fs.readFile(path, function(err, buf){
      if (err){
        res.writeHead(404);
        res.end();
      } else {
        icon = {
          headers: {
            'Content-Type': 'image/x-icon',
            'Content-Length': buf.length,
            'ETag': md5(buf),
            'Cache-Control': 'public, max-age=' + (maxAge / 1000)
          },
          body: buf
        };

        res.writeHead(200, icon.headers);
        res.end(icon.body);
      }
    });
  }
};