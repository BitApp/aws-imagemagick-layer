"use strict";

var async = require("async"),
  AWS = require("aws-sdk"),
  s3 = new AWS.S3(),
  Watermarker = require("./watermarker"),
  Glass = require("./glass"),
  Thumbnail = require("./thumbnail"),
  log = require("loglevel");

const imagemin = require('imagemin');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');

var lambdaWrapper = function (options) {
  // TODO: provide default options or at least require watermarkImagePath

  var watermarker = new Watermarker(options);
  var glass = new Glass(options);
  var thumbnail = new Thumbnail(options);

  return function (event, context) {
    var srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    var srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    // TODO: figure out dist bucket/key based on options (replace)
    var dstBucket = options.distBucket || srcBucket;
    var dstKey = options.getDistKey(srcKey, options) || srcKey;

    var typeMatch = inferImageType(srcKey);

    var imageType = typeMatch[1];
    if (imageType.toLowerCase() !== "jpg" && imageType.toLowerCase() !== "png" && imageType.toLowerCase() !== "jpeg") {
      log.warn("skipping non-image " + srcKey);
      return null;
    }

    function uploadWatermark(image, next) {
      // Stream the transformed image to dist S3 bucket.
      s3.putObject({
        Bucket: dstBucket,
        Key: dstKey.split(".")[0] + `(${image.size.width}*${image.size.height}).` + dstKey.split(".")[1],
        Body: image.Body,
        ContentType: image.ContentType
      }, next);
    }

    function imageMin(image, next) {
      imagemin.buffer(image.Body, {
        plugins: [
          imageminJpegRecompress(),
          imageminJpegtran(),
          imageminPngquant({
            quality: [0.6, 0.8]
          })
        ]
      }).then((optimizedImage) => {
        next(null, {Body: optimizedImage, ContentType: image.ContentType, size: image.size});
      }, (error) => {
        next(error);
      });
    }

    function uploadThumbnail(image, next) {
      // Stream the transformed image to dist S3 bucket.
      s3.putObject({
        Bucket: dstBucket,
        Key: dstKey.split(".")[0] + `_thumbnail(${image.size.width}*${image.size.height}).` + dstKey.split(".")[1],
        Body: image.Body,
        ContentType: image.ContentType
      }, (err) => {
        next(err, {
          Bucket: dstBucket,
          Key: dstKey,
          Body: image.Body,
          ContentType: image.ContentType
        });
      });
    }

    function uploadGlass(image, next) {
      // Stream the transformed image to dist S3 bucket.
      s3.putObject({
        Bucket: dstBucket,
        Key: dstKey.split(".")[0] + `_glass(${image.size.width}*${image.size.height}).` + dstKey.split(".")[1],
        Body: image.Body,
        ContentType: image.ContentType
      }, next);
    }

    let thumbnailIsDone = false, watermarkIsDone = false;
    function watermarkDone(err) {
      if (err) {
        log.error("Unable to watermark " + srcBucket + "/" + srcKey +
          " and upload to " + dstBucket + "/" + dstKey + " due to an error: " + err);
      } else {
        log.info("Successfully watermarked " + srcBucket + "/" + srcKey +
          " and uploaded to " + dstBucket + "/" + dstKey);
      }
      watermarkIsDone = true;
      if (watermarkIsDone && thumbnailIsDone) {
        context.done();
      }
    }

    function thumbnailDone(err) {
      if (err) {
        log.error("Unable to reized " + srcBucket + "/" + srcKey +
          " and upload to " + dstBucket + "/" + dstKey + " due to an error: " + err);
      } else {
        log.info("Successfully reized " + srcBucket + "/" + srcKey +
          " and uploaded to " + dstBucket + "/" + dstKey);
      }
      thumbnailIsDone = true
      if (watermarkIsDone && thumbnailIsDone) {
        context.done();
      }
    }
    
    return s3.getObject({
      Bucket: srcBucket,
      Key: srcKey
    }, (err, image) => {
      if (err) {
        log.error("s3.getObject error", err);
      } else {
        const rawFlow = [
          (next) => {
            watermarker.watermark.bind(watermarker)(image, next)
          },
          uploadWatermark
        ];
        const thumbnailFlow = [
          (next) => {
            thumbnail.resize.bind(thumbnail)(image, next)
          },
          // add watermark
          watermarker.watermark.bind(watermarker),
          imageMin,
          uploadThumbnail,
          glass.blur.bind(glass),
          uploadGlass
        ];
        async.waterfall(thumbnailFlow, thumbnailDone);
        async.waterfall(rawFlow, watermarkDone);
      }
    });
  }
};

function inferImageType(filename) {
  var match = filename.match(/\.([^.]*)$/);
  if (!match) {
    throw new Error("unable to infer image type for key: " + filename);
  }
  return match;
}

module.exports = lambdaWrapper;
