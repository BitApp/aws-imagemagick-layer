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

    function download(next) {
      // Download the image from S3 into a buffer.
      s3.getObject({
        Bucket: srcBucket,
        Key: srcKey
      }, next);
    }

    function uploadWatermark(data, contentType, next) {
      // Stream the transformed image to dist S3 bucket.
      s3.putObject({
        Bucket: dstBucket,
        Key: dstKey,
        Body: data,
        ContentType: contentType
      }, (err) => {
        next(err, {
          Bucket: dstBucket,
          Key: dstKey,
          Body: data,
          ContentType: contentType
        });
      });
    }

    function imageMin(data, contentType, next) {
      imagemin.buffer(data, {
        plugins: [
          imageminJpegRecompress(),
          imageminJpegtran(),
          imageminPngquant({
            quality: [0.6, 0.8]
          })
        ]
      }).then((optimizedImage) => {
        next(null, optimizedImage, contentType);
      }, (error) => {
        next(error);
      });
    }

    function uploadThumbnail(data, contentType, next) {
      // Stream the transformed image to dist S3 bucket.
      s3.putObject({
        Bucket: dstBucket,
        Key: dstKey.split(".")[0] + "-thumbnail." + dstKey.split(".")[1],
        Body: data,
        ContentType: contentType
      }, (err) => {
        next(err, {
          Bucket: dstBucket,
          Key: dstKey,
          Body: data,
          ContentType: contentType
        });
      });
    }

    function uploadGlass(data, contentType, next) {
      // Stream the transformed image to dist S3 bucket.
      s3.putObject({
        Bucket: dstBucket,
        Key: dstKey.split(".")[0] + "-glass." + dstKey.split(".")[1],
        Body: data,
        ContentType: contentType
      }, next);
    }

    function done(err) {
      if (err) {
        log.error("Unable to watermark " + srcBucket + "/" + srcKey +
          " and upload to " + dstBucket + "/" + dstKey + " due to an error: " + err);
      } else {
        log.info("Successfully watermarked " + srcBucket + "/" + srcKey +
          " and uploaded to " + dstBucket + "/" + dstKey);
      }
      context.done();
    }
    
    let opFlow = [
      download,
      watermarker.watermark.bind(watermarker),
      uploadWatermark,
      thumbnail.resize.bind(thumbnail),
      // add watermark again
      (data, contentType, next) => {
        watermarker.watermark.bind(watermarker)({
          Body: data,
          ContentType: contentType
        }, next)
      },
      imageMin,
      uploadThumbnail,
      glass.blur.bind(glass),
      uploadGlass
    ];
    async.waterfall(opFlow, done);
  };
};

function inferImageType(filename) {
  var match = filename.match(/\.([^.]*)$/);
  if (!match) {
    throw new Error("unable to infer image type for key: " + filename);
  }
  return match;
}

module.exports = lambdaWrapper;
