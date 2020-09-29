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
    return next("watermark image type is missing!");
  }

  const _this = this;
  gm(image.Body).size(function(err, val){
    async.waterfall([
      async.apply(_this._resizeWatermarkImage.bind(_this), image, {
        width: val.width,
        height: val.height
      }),
      _this._applyWatermark.bind(_this)
    ], next);
  });
};

Watermarker.prototype._resizeWatermarkImage = function(image, size, next) {
  if (verifyFileTypeFromPath(this.options.watermarkImagePath, "png")) {
    return next("Watermark image is not a png");
  }
  next(null, image, calculateGeometry(this.options.offset), size);
};

Watermarker.prototype._applyWatermark = function(image, geometry, size, next) {
  gm(image.Body)
    .composite(this.options.watermarkImagePath)
    .geometry(geometry)
    .gravity("SouthEast")
    .toBuffer(function (err, buffer) {
      next(err, { Body: buffer, ContentType: image.ContentType, size });
    });
};

module.exports = Watermarker;