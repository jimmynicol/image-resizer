# Image-Resizer

`image-resizer` is a [Node.js](http://nodejs.org) application that sits as a  custom origin to your CDN and will resize/optimise images on-the-fly. It is Heroku ready, but can also be deployed easily to any cloud provider (has been used with success on AWS).

The primary goal for this project was to abstract the need to set image dimensions during the upload and storage phase of images in a modern web application.


## Overview

Building and deploying your own version of `image-resizer` is as easy as running the cli tool (`image-resizer new`), setting your [Heroku configs](#environment-variables) and firing it up!

Based on Express.js `image-resizer` uses [sharp](https://github.com/lovell/sharp) under the hood to modify and optimise your images.

There is also a plugin architecture that allows you to add your own image sources. Out of the box it supports: S3, Facebook, Twitter, Youtube, Vimeo (and local file system in development mode).

When a new image size is requested of `image-resizer` via the CDN, it will pull down the original image from the cloud. It will then resize according to the requested dimensions, optimize according to file type and optionally filter the image. All responses are crafted with custom responses to maximise the facility of the CDN.


## Getting Started

    $ npm install -g image-resizer gulp
    $ mkdir my_fancy_image_server
    $ cd my_fancy_image_server
    $ image-resizer new
    $ npm install
    $ gulp watch

This will create a new directory structure including all the necessary files needed to run `image-resizer`. The money file is `index.js` which is loads the express configuration and routes.

`image-resizer` can also simply be added as a node_module to any project and the streams interfaces used standalone. `./test.js` has a good example of how the app should work running behind Express.

There is a [RubyGem](https://github.com/jimmynicol/ir-helper) of helpers (both Ruby and Javascript) to assist you in building the endpoints for your `image-resizer` instance.


## Architecture

The new refactored codebase now takes advantage of node streams. The [previous iteration](https://github.com/jimmynicol/image-resizer/tree/v0.0.1) was heavily based on promises but still ended up with spaghetti code to some extent.

Inspired a lot by [Gulp](http://gulpjs.com) `image-resizer` passes around an Image object between each of the streams that contains information about the request and the image data (either as a buffer or stream).

Images are also no longer modified and sent back to s3 for storage. The full power of the CDN is used for storing the modified images. This greatly improves performance both on the server side and client side. Google PageSpeed did not like the 302 redirects returned by an `image-resizer` instance.

Also removing the need to push data to s3 helps the server processing as this can be a wildly inconsistent action.


## Plugins

`image-resizer` now supports a range of custom plugins for both image sources and filters. As mentioned above a number of sources are supported out of the box but each of these can be over written as needed.

The directory structure created via `$ image-resizer new` will include a plugins directory where the initialization script will pick up any scripts and insert them into the application.


## Dependencies

`image-resizer` only requires a working node/npm environment and `libvips`. The necessary buildpack information to load your Heroku environment is included.


## Environment Variables

Configuration of `image-resizer` is done via environment variables. This is done to be compatible with Heroku deployments.

To set environment variables in your [Heroku console](https://devcenter.heroku.com/articles/config-vars).

    heroku config:set AWS_ACCESS_KEY_ID=abcd1234

For Heroku deployment the minimum required variables are:

    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    AWS_REGION
    S3_BUCKET
    NODE_ENV

If you choose to change your default source to be something other than `S3` then the `NODE_ENV` variable is the only required one (and whatever you need for your default source).

For convenience in local and non-Heroku deployments the variables can be loaded from a `.env` file. Sensible local defaults are included in `src/config/environment_vars.js`.

The available variables are as follows:

```javascript
  NODE_ENV: 'development',
  PORT: 3001,
  DEFAULT_SOURCE: 's3',
  EXCLUDE_SOURCES: null, // add comma delimited list

  // Restrict to named modifiers strings only
  NAMED_MODIFIERS_ONLY: false,

  // AWS keys
  AWS_ACCESS_KEY_ID: null,
  AWS_SECRET_ACCESS_KEY: null,
  AWS_REGION: null,
  S3_BUCKET: null,

  // Resize options
  RESIZE_PROCESS_ORIGINAL: true,
  AUTO_ORIENT: true,
  REMOVE_METADATA: true,

  // Protect original files by specifying a max image width or height - limits
  // max height/width in parameters
  MAX_IMAGE_DIMENSION: null,

  // Color used when padding an image with the 'pad' crop modifier.
  IMAGE_PADDING_COLOR: 'white',

  // Optimization options
  IMAGE_QUALITY: 80,
  IMAGE_PROGRESSIVE: true,

  // Cache expiries
  IMAGE_EXPIRY: 60 * 60 * 24 * 90,
  IMAGE_EXPIRY_SHORT: 60 * 60 * 24 * 2,
  JSON_EXPIRY: 60 * 60 * 24 * 30,

  // Logging options
  LOG_PREFIX: 'resizer',
  QUEUE_LOG: true,

  // Response settings
  CACHE_DEV_REQUESTS: false,

  // Twitter settings
  TWITTER_CONSUMER_KEY: null,
  TWITTER_CONSUMER_SECRET: null,
  TWITTER_ACCESS_TOKEN: null,
  TWITTER_ACCESS_TOKEN_SECRET: null,

  // Where are the local files kept?
  LOCAL_FILE_PATH: process.cwd(),

  // Display an image if a 404 request is encountered from a source
  IMAGE_404: null

  // Whitelist arbitrary HTTP source prefixes using EXTERNAL_SOURCE_*
  EXTERNAL_SOURCE_WIKIPEDIA: 'https://upload.wikimedia.org/wikipedia/',

  // Set a key used to force clients to sign requests (reduce risk of DDoS)
  REQUEST_SIGNING_KEY: null
```


## Optimization

Optimization of images is done via [sharp](https://github.com/lovell/sharp#qualityquality). The environment variables to set are:

* `IMAGE_QUALITY`:  1 - 100
* `IMAGE_PROGRESSIVE`:  true | false

You may also adjust the image quality setting per request with the `q` quality modifier described below.

## CDN

While `image-resizer` will work as a standalone app, almost all of its facility is moot unless you run it behind a CDN. This has only been run behind AWS Cloudfront at this point and consequently all of the response headers are customized to work best in that environment. However other CDN's can not operate much differently, any pull requests in this regard would be most appreciated ;-)


## Usage

A couple of routes are included with the default app, but the most important is the image generation one, which is as follows:

`http://my.cdn.com/:modifiers/path/to/image.png[:format][:metadata]`

Modifiers are a dash delimited string of the requested modifications to be made, these include:

*Supported modifiers are:*
* height:       eg. h500
* width:        eg. w200
* square:       eg. s50
* crop:         eg. cfill
* top:          eg. y12
* left:         eg. x200
* gravity:      eg. gs, gne
* filter:       eg. fsepia
* external:     eg. efacebook
* quality:      eg. q90

*Crop modifiers:*
* fit
    * maintain original proportions
    * resize so image fits wholly into new dimensions
        * eg: h400-w500 - 400x600 -> 333x500
    * default option
* fill
    * maintain original proportions
    * resize via smallest dimension, crop the largest
    * crop image all dimensions that dont fit
        * eg: h400-w500 - 400x600 -> 400x500
* cut
    * maintain original proportions
    * no resize, crop to gravity or x/y
* scale
    * do not maintain original proportions
    * force image to be new dimensions (squishing the image)
* pad
    * maintain original proportions
    * resize so image fits wholly into new dimensions
    * padding added on top/bottom or left/right as needed (color is configurable)


*Examples:*
* `http://my.cdn.com/s50/path/to/image.png`
* `http://my.cdn.com/h50/path/to/image.png`
* `http://my.cdn.com/h50-w100/path/to/image.png`
* `http://my.cdn.com/s50-gne/path/to/image.png`
* `http://my.cdn.com/path/to/image.png` - original image request, will be optimized but not resized


## Resizing Logic

It is worthy of note that this application will not scale images up, we are all about keeping images looking good. So a request for `h400` on an image of only 200px in height will not scale it up.

## Request signing

If a REQUEST_SIGNING_KEY is set all requests to the application will require a signature to be passed as the first url segment. This is used to verify the client is allowed to make the request. Request signing can reduce the risk DDoS. It's a simple mechanism to validate requests are coming from trusted clients.

The following PHP method is an example of how a client can generate valid a signature:

```
<?php
function createSignature($str) {
  $hash = base64_encode(hash_hmac('sha1', $str, 'secret key that is same as configure on image-resizer', true));
  return substr(str_replace(['+', '/', '='], ['-', '_', 'e'], $hash), 0, 8);
}

var_dump(':modifiers/path/to/image.jpg');

// <img src="http://cdn.site.com/<?php echo createSignature(':modifiers/path/to/image.jpg'); ?>/:modifiers/path/to/image.jpg" alt="">
```

## S3 source

By default `image-resizer` will use s3 as the image source. To access an s3 object the full path of the image within the bucket is used, minus the bucket name eg:

    https://s3.amazonaws.com/sample.bucket/test/image.png

translates to:

    http://my.cdn.com/test/image.png


## External Sources

It is possible to bring images in from external sources and store them behind your own CDN. This is very useful when it comes to things like Facebook or Vimeo which have very inconsistent load times. Each external source can still enable any of the modification parameters list above.

In addition to the provided external sources, you can easily add your own basic external sources using `EXTERNAL_SOURCE_*` environment variables. For example, to add Wikipedia as an external source, set the following environment variable:

```
EXTERNAL_SOURCE_WIKIPEDIA: 'https://upload.wikimedia.org/wikipedia/'
```

Then you can request images beginning with the provided path using the `ewikipedia` modifier, eg:

    http://my.cdn.com/ewikipedia/en/7/70/Example.png
    
translates to:

    https://upload.wikimedia.org/wikipedia/en/7/70/Example.png

It is worth noting that Twitter requires a full set of credentials as you need to poll their API in order to return profile pics.

A shorter expiry on images from social sources can also be set via `IMAGE_EXPIRY_SHORT` env var so they expiry at a faster rate than other images.

It is also trivial to write new source streams via the plugins directory. Examples are in `src/streams/sources/`.

## Output format

You can convert images to another image format by appending an extra extension to the image path:

* `http://my.cdn.com/path/to/image.png.webp`

JPEG (`.jpg`/`.jpeg`), PNG (`.png`), and WEBP (`.webp`) output formats are supported.

## Metadata requests

`image-resizer` can return the image metadata as a json endpoint:

* `http://my.cdn.com/path/to/image.png.json`

Metadata is removed in all other image requests by default, unless the env var `REMOVE_METADATA` is set to `false`.


## Heroku Deployment

Included are both a `.buildpacks` file and a `Procfile` ready for Heroku deployment. Run the following cmd in your Heroku console to enable the correct buildpacks (copied from [here](https://github.com/mcollina/heroku-buildpack-graphicsmagick)).

    heroku config:set BUILDPACK_URL=https://github.com/ddollar/heroku-buildpack-multi

The `.buildpacks` file will then take care of the installation process.

As mentioned above there is a minimum set of config vars that need to be set before `image-resizer` runs correctly.


## Local development

To run `image-resizer` locally, the following will work for an OSX environment assuming you have node/npm installed - [NVM is useful](https://github.com/creationix/nvm).

```bash
npm install gulp -g
./node_modules/image_resizer/node_modules/sharp/preinstall.sh
npm install
gulp watch
```

The gulp setup includes nodemon which runs the app nicely, restarting between code changes. `PORT` can be set in the `.env` file if you need to run on a port other than 3001.

Tests can be run with: `gulp test`


## Early promise-based version of codebase

*NOTE:* Completely refactored and improved, if you are looking for the older version it is tagged as [v0.0.1](https://github.com/jimmynicol/image-resizer/tree/v0.0.1).

