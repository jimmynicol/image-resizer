# Image-Resizer

`image-resizer` is a node application that sits as a proxy to an s3 bucket and will resize images on-the-fly. It is Heroku ready, but can also be deployed easily to any cloud provider (has been used with success on AWS).

It was built to abstract the need to set image dimensions during the upload and storage phase of modern web applications? Faffing around with CarrierWave and Paperclip (while great resources) got to be troublesome and the need for resizing images on-the-fly arose.


### Overview

`image-resizer` sits a middleman between your application and your cloud storage (only S3 at this point).

When a new image size is requested `image-resizer` will pull down the original image from the cloud, resize according to the requested dimensions, then push the new image back to the cloud and store the coordinates in Redis.

Both on the initial request and subsequent ones `image-resizer` will return a cacheable 302 header with a location directive to the new home of the image.

Subsequent requests to existing image versions simply query Redis for the file and return the 302 header, which is a very fast operation (typically < 10ms).


### Dependencies

`image-resizer` only requires a working node/npm environment with access to a Redis DB. Currently the application is setup as a Heroku/RedisToGo stack but can just as easily be deployed to AWS or other cloud provider.

Unfortunately at this point `image-resizer` is only built to deal with cloud storage on AWS S3.


### Usage
`https://images.example.com/:s3_bucket_path?:dimensions`

Call the service via its image id, with a dimensions query string.

Current options

*  (s|square): `s=300`
*  (w|width):  `w=300`
*  (h|height): `h=300`
*  (c|crop): `c=100,200,50,50` which maps to width,height,cropx,cropy

Extra options are:

* `?flush` to clear out the record and overwrite
* `?json` to return the image metadata as JSON


### Heroku Deployment

