"use strict";
const https = require("https");
var LambdaWatermark = require("./lib/lambdaWatermark");

var options = {
  srcPath: "image/",
  destPath: "media/image/",
  distBucket: "newonlyfans-public",
  getDistKey: (srcKey, opt) => {
    return opt.destPath + srcKey.replace(opt.srcPath, "")
  },
  watermarkImagePath: "./bitapp-white.png"
};

exports.handler = function(event, context, callback) {
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  if (srcKey.split("/")[0] === "image") {
    // add watermark
    new LambdaWatermark(options)(event, context);
  }
  // call convert
  https.get(`https://test.mfans.com/api/media/convert?key=${encodeURIComponent(srcKey)}`,
  (res) => {
    callback(null, res.statusCode);
  }).on("error", (e) => {
    callback(Error(e.message));
  });
};