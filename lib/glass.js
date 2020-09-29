"use strict";

var gm = require("gm").subClass({
    imageMagick: true
  }), // Enable ImageMagick integration.
  async = require("async"),
  objectAssign = require("object-assign");

function Glass(options) {
  if (!(this instanceof Glass)) {
    return new Glass(options);
  }
  var defaultOptions = {
    width: 100,
    height: 50,
    radius: 10,
    sigma: 100,
  };

  this.options = objectAssign(defaultOptions, options || {});
  // TODO: validate these options
}

Glass.prototype.blur = function (image, next) {
  
  if (!(image && image.ContentType)) {
    return next("glass image type is missing!");
  }

  const _this = this;
  gm(image.Body).size(function(err, val){
    async.waterfall([
      async.apply(_this._applyBlur.bind(_this), image, {
        width: val.width,
        height: val.height
      })
    ], next);
  })
};

Glass.prototype._applyBlur = function(image, size, next) {
  const width = Math.min(this.options.width, size.width)
  const height = Math.round(width / size.width * size.height)
  gm(image.Body)
    .scale(width, height)
    .gaussian(this.options.radius, this.options.sigma)
    .toBuffer(function (err, buffer) {
      next(err, {Body: buffer, ContentType: image.ContentType, size: {width, height}});
    });
};

module.exports = Glass;