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
    radius: 30,
    sigma: 100,
  };

  this.options = objectAssign(defaultOptions, options || {});
  // TODO: validate these options
}

Glass.prototype.blur = function (image, next) {
  
  if (!(image && image.ContentType)) {
    return next("glass image type is missing!");
  }

  async.waterfall([
    async.apply(this._applyBlur.bind(this), image),
  ], next);
};

Glass.prototype._applyBlur = function(image, next) {
  gm(image.Body)
    .gaussian(this.options.radius, this.options.sigma)
    .toBuffer(function (err, buffer) {
      next(err, buffer, image.ContentType);
    });
};

module.exports = Glass;