# Image-Resizer

*NOTE:* Completely refactored and improved, if you are looking for the older version it is tagged as [v0.0.1](https://github.com/jimmynicol/image-resizer/tree/v0.0.1).

`image-resizer` is a [Node.js](http://nodejs.org) application that sits as a  custom origin to your CDN and will resize/optimise images on-the-fly. It is Heroku ready, but can also be deployed easily to any cloud provider (has been used with success on AWS).

Originally conceived as a side-project then rolled back into [Fundly](http://fundly.com), `image-resizer` was built to abstract the need to set image dimensions during the upload and storage phase of images in a modern web application. Faffing around with CarrierWave and Paperclip (while great resources for Rails devs) got to be troublesome and the need for resizing images on-the-fly arose.

`image-resizer` will be run as service in the Fundly Heroku stack, so it will be actively improved as a result. An earlier version of `image-resizer` was running successfully in production from June 2013.


## Overview

The server is now based on Express 4.0 and removes the previous dependency on Redis so it is now a standalone app that can be run on Heroku (or elsewhere) with out the need for any external services.

`image-resizer` has added a plugin architecture that allows you to add your own image sources. Out of the box it supports: S3, Facebook, Twitter, Youtube, Vimeo (and local file system in development mode).

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

There is a [RubyGem](https://github.com/jimmynicol/image-resizer-rails) of helpers (both Ruby and Javascript) to assist you in building the endpoints for your `image-resizer` instance.


## Architecture

The new refactored codebase now takes advantage of node streams. The [previous iteration](https://github.com/jimmynicol/image-resizer/tree/v0.0.1) was heavily based on promises but still ended up with spaghetti code to some extent.

Inspired a lot by [Gulp](http://gulpjs.com) `image-resizer` passes around an Image object between each of the streams that contains information about the request and the image data (either as a buffer or stream).

Images are also no longer modified and sent back to s3 for storage. The full power of the CDN is used for storing the modified images. This greatly improves performance both on the server side and client side. Google PageSpeed did not like the 302 redirects returned by an `image-resizer` instance.

Also removing the need to push data to s3 helps the server processing as this can be a wildly inconsistent action.

`image-resizer` is now released as a npm package and a cli script can build a working server instance that can be pushed directly to Heroku.


## Plugins

`image-resizer` now supports a range of custom plugins for both image sources and filters. As mentioned above a number of sources are supported out of the box but each of these can be over written as needed.

The directory structure created via `$ image-resizer new` will include a plugins directory where the initialization script will pick up any scripts and insert them into the application.


## Dependencies

`image-resizer` only requires a working node/npm environment and `graphicsmagick`. The necessary buildpack information to load your Heroku environment is included.


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

    // Optimization options
    JPEG_PROGRESSIVE: true,
    PNG_OPTIMIZER: 'pngquant',
    PNG_OPTIMIZATION: 2,
    GIF_INTERLACED: true,

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
    LOCAL_FILE_PATH: process.cwd()


## Optimization

Optimization of images is done via [Imagemin](https://github.com/kevva/imagemin). Each image type optimizer is as follows:

* *.png*:  pngquant (default level of 2, configurable by `PNG_OPTIMIZATION`)
* *.jpeg*: jpegtran (progressive by default, `JPEG_PROGRESSIVE`)
* *.gif*:  gifsicle (interlaced by default, `GIF_INTERLACED`)


## CDN

While `image-resizer` will work as a standalone app, almost all of its facility is moot unless you run it behind a CDN. This has only been run behind AWS Cloudfront at this point and consequently all of the response headers are customized to work best in that environment. However other CDN's can not operate much differently, any pull requests in this regard would be most appreciated ;-)


## Usage

A couple of routes are included with the default app, but the most important is the image generation one, which is as follows:

`http://my.cdn.com/:modifiers/path/to/image.png[:metadata]`

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

*Examples:*
* `http://my.cdn.com/s50/path/to/image.png`
* `http://my.cdn.com/h50/path/to/image.png`
* `http://my.cdn.com/h50-w100/path/to/image.png`
* `http://my.cdn.com/s50-gne/path/to/image.png`
* `http://my.cdn.com/path/to/image.png` - original image request, will be optimized but not resized


## Resizing Logic

It is worthy of note that this application will not scale images up, we are all about keeping images looking good. So a request for `h400` on an image of only 200px in height will not scale it up.


## S3 source

By default `image-resizer` will use s3 as the image source. To access an s3 object the full path of the image within the bucket is used, minus the bucket name eg:

    https://s3.amazonaws.com/sample.bucket/test/image.png

translates to:

    http://my.cdn.com/test/image.png


## External Sources

It is possible to bring images in from external sources and store them behind your own CDN. This is very useful when it comes to things like Facebook or Vimeo which have very inconsistent load times. Each external source can still enable any of the modification parameters list above.

It is worth noting that Twitter requires a full set of credentials as you need to poll their API in order to return profile pics.

A shorter expiry on images from social sources can also be set via `SOCIAL_IMAGE_EXPIRY` env var so they expiry at a faster rate than other images.

It is also trivial to write new source streams via the plugins directory. Examples are in `src/streams/sources/`.


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

    npm install gulp -g
    brew install graphicsmagick
    npm install
    gulp watch

The gulp setup includes nodemon which runs the app nicely, restarting between code changes. `PORT` can be set in the `.env` file if you need to run on a port other than 3001.

Tests can be run with: `gulp test`
