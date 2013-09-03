# Image-Resizer

`image-resizer` is a [Node.js](http://nodejs.org) application that sits as a proxy to an s3 bucket and will resize images on-the-fly. It is Heroku ready, but can also be deployed easily to any cloud provider (has been used with success on AWS).

Originally conceived as a side-project then rolled back into [Fundly](http://fundly.com), `image-resizer` was built to abstract the need to set image dimensions during the upload and storage phase of images in a modern web application. Faffing around with CarrierWave and Paperclip (while great resources for Rails devs) got to be troublesome and the need for resizing images on-the-fly arose.

A version of `image-resizer` has been running succesfully in production since
June 2013 and is handling all user-generated images for [Fundly](http://fundly.com) in both the desktop and mobile-optimised sites.


## Overview

`image-resizer` sits as a middleman between your application and your cloud storage (only S3 at this point).

When a new image size is requested `image-resizer` will pull down the original image from the cloud, resize according to the requested dimensions, then push the new image back to the cloud and store the coordinates in Redis.

Both on the initial request and subsequent ones `image-resizer` will return a cacheable 302 header with a location directive to the new home of the image.

Subsequent requests to existing image versions simply query Redis for the file and return the 302 header, which is a very fast operation (typically < 10ms).


## Dependencies

`image-resizer` only requires a working node/npm environment, `graphicsmagick` and access to a Redis DB. Currently the application is setup as a Heroku/RedisToGo stack but can just as easily be deployed to AWS or other cloud provider.

Unfortunately at this point `image-resizer` is only built to deal with cloud storage on AWS S3.


## Environment Variables

Configuration of `image-resizer` is done via environment variables. This is done to be compatible with Heroku deployments.

To set environment variables in your [Heroku console](https://devcenter.heroku.com/articles/config-vars).

    heroku config:set AWS_ACCESS_KEY_ID=abcd1234

For Heroku deployment the minimum required variables are:

    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    S3_BUCKET
    NODE_ENV
    REDISTOGO_URL

For convenience in local and non-Heroku deployments the variables can be loaded from a file (`local_environment.js`). A sample version is included in the repo.

The available variables are as follows:

    // AWS credentials
    "AWS_ACCESS_KEY_ID": "",
    "AWS_SECRET_ACCESS_KEY": "",
    "S3_BUCKET": "",

    // CDN path
    "CDN_ROOT": "",

    // Environment
    "NODE_ENV": "development",

    // Server port
    "PORT": 5000,

    // Redis connection URL (named for convenience with Heroku)
    "REDISTOGO_URL": "redis://localhost:6379",

    // Redis key namespace
    "REDIS_NAMESPACE": "img-server",

    // Redis lock variables
    "LOCK_INTERVAL": 200,
    "LOCK_WAIT_TIMEOUT": 2000


## CDN

If you chose to add a CDN in front of your S3 bucket (and let's be honest, why wouldn't you?) it is simple to add that to the `image-resizer` configuration. Simply set the CDN_ROOT environment variable and it will be included as part of the image path returned with the 302 headers.


## Usage

`http://images.example.com/:s3_bucket_path?:dimensions`

Call the service via its bucket path, with a dimensions query string.

Current options

*  `s` or `square`: `s=300`
*  `w` or `width`:  `w=300`
*  `h` or `height`: `h=300`
*  `c` or `crop`:   `c=100,200,50,50` which maps to width,height,cropx,cropy

Extra options are:

* `?flush` to clear out the record and overwrite
* `?json` to return the image metadata as JSON

Examples:

* `http://images.example.com/test/image.png?square=50`
* `http://images.example.com/test/image.png?h=50`
* `http://images.example.com/test/image.png?h=50&w=100`
* `http://images.example.com/test/image.png?crop=100,200,50,50`
* `http://images.example.com/test/image.png?json`


## Resizing Logic

For a simple resize operation (eg: `?h=300`) then only caveat is that no operation can make an image dimension larger (we are all about keeping the image looking good).

For requests for square images the logic goes that the smallest dimension is used to resize the image then the cropping removes the excess in the other direction. So an 200x300 image requested to be a 50x50 square will resize in the width to 50 and crop the excess of the height around the center. Vice versa for landscape aspects.

There is no implicit logic for cropping, it merely follows the directions.


## Heroku Deployment

Included are both a `.buildpacks` file and a `Procfile` ready for Heroku deployment. Run the following cmd in your Heroku console to enable the correct buildpacks (copied from [here](https://github.com/mcollina/heroku-buildpack-graphicsmagick)).

    heroku config:set BUILDPACK_URL=https://github.com/ddollar/heroku-buildpack-multi

The `.buildpacks` file will then take care of the installation process.

As mentioned above there is a minimum set of config vars that need to be set before `image-resizer` runs correctly.


## Local development

To run `image-resizer` locally, the following will work for an OSX environment assuming you have node/npm installed - [NVM is useful](https://github.com/creationix/nvm).

    npm install grunt-cli -g
    brew install graphicsmagick
    npm install
    grunt

There are many ways to run the app locally:

* `nodemon` - a great choice that restarts with code changes
* `foreman start` - good for running the app how Heroku does
* `node index.js` - old skool


## Roadmap

* better test coverage
* add multi-vendor cloud support with something like [pkgcloud](https://github.com/nodejitsu/pkgcloud)
* add non-Heroku deployment strategies (the [Fundly](http://fundly.com) production deployment is on s3).