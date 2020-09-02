"use strict";
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

exports.handler = function(event, context) {
  // add watermark
  new LambdaWatermark(options)(event, context);
  // call convert
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: "test-justfans.bitapp.net",
      path: "/api/media/convert/" + srcKey
    }, () => {
      const response = {
        statusCode: 200,
        body: JSON.stringify("JobDone!"),
      };
      resolve(response);
    });

    req.on("error", (e) => {
      reject(e.message);
    });
  });
};