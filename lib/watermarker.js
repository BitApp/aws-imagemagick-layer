"use strict";

var gm = require("gm").subClass({
    imageMagick: true
  }), // Enable ImageMagick integration.
  async = require("async"),
  objectAssign = require("object-assign");

function Watermarker(options) {
  if (!(this instanceof Watermarker)) {
    return new Watermarker(options);
  }
  var defaultOptions = {
    offset: {
      x: 40,
      y: 40
    }
  };

  this.options = objectAssign(defaultOptions, options || {});
  // TODO: validate these options
}

function calculateGeometry(offset) {
  return  `+${offset.x}+${offset.y}`; // offset
}

function verifyFileTypeFromPath(path, type) {
  var typeMatch = path && path.match(/\.([^.]*)$/);
  if (!typeMatch) {
    throw new Error("Could not infer filetype from path");
  }

  var imageType = typeMatch[1];
  return imageType.toLowerCase() !== type.toLowerCase();
}

Watermarker.prototype.watermark = function (image, next) {
  // if (!(image && image.Body instanceof Buffer)) {
  //   console.log("image:", image, image.Body instanceof Buffer);
  //   return next("image buffer is not a buffer!");
  // }

  if (!(image && image.ContentType)) {
    return next("image type is missing!");
  }

  async.waterfall([
    async.apply(this._resizeWatermarkImage.bind(this), image),
    this._applyWatermark.bind(this)
  ], next);
};

Watermarker.prototype._resizeWatermarkImage = function(image, next) {
  if (verifyFileTypeFromPath(this.options.watermarkImagePath, "png")) {
    return next("Watermark image is not a png");
  }
  next(null, image, calculateGeometry(this.options.offset));
};

Watermarker.prototype._applyWatermark = function(image, geometry, next) {
  gm(image.Body)
    .composite(this.options.watermarkImagePath)
    .geometry(geometry)
    .gravity("SouthEast")
    .toBuffer(function (err, buffer) {
      next(err, buffer, image.ContentType);
    });
};

module.exports = Watermarker;