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
  new LambdaWatermark(options)(event, context);
  const response = {
    statusCode: 200,
    body: JSON.stringify('WaterMark added!'),
  };
  return response;
};