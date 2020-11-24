"use strict";

var gm = require("gm").subClass({
    imageMagick: true
  }), // Enable ImageMagick integration.
  async = require("async"),
  objectAssign = require("object-assign");

function Thumbnail(options) {
  if (!(this instanceof Thumbnail)) {
    return new Thumbnail(options);
  }
  var defaultOptions = {
    width: 600,
    height: 1200
  };

  this.options = objectAssign(defaultOptions, options || {});
  // TODO: validate these options
}

Thumbnail.prototype.resize = function (image, next) {
  if (!(image && image.ContentType)) {
    return next("thumbnail image type is missing!");
  }

  const _this = this;
  gm(image.Body).size(function(err, val){
    if (val.width > _this.options.width || 
      val.height > _this.options.height) { 
      async.waterfall([
        async.apply(_this._applyResize.bind(_this), image, {
          width: val.width,
          height: val.height
        })
      ], next);
    } else {
      // next directly
      next(null, {Body: image.Body, ContentType: image.ContentType, size: val})
    }
  })
};

Thumbnail.prototype._applyResize = function(image, size, next) {
  const width = Math.min(this.options.width, size.width)
  const scaleHeight = Math.round(width / size.width * size.height)
  const height = Math.min(this.options.height, scaleHeight)
  gm(image.Body)
    .scale(width, scaleHeight)
    .crop(width, height, 0, 0)
    .colorspace("RGB")
    .toBuffer(function (err, buffer) {
      next(err, {Body: buffer, ContentType: image.ContentType, size: {width, height}});
    });
};

module.exports = Thumbnail;