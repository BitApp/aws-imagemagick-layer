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
    width: 32,
    height: 32,
  };

  this.options = objectAssign(defaultOptions, options || {});
  // TODO: validate these options
}

Thumbnail.prototype.resize = function (image, next) {
  
  if (!(image && image.ContentType)) {
    return next("thumbnail image type is missing!");
  }

  async.waterfall([
    async.apply(this._applyResize.bind(this), image),
  ], next);
};

Thumbnail.prototype._applyResize = function(image, next) {
  gm(image.Body)
    .scale(this.options.width, this.options.height)
    .toBuffer(function (err, buffer) {
      next(err, buffer, image.ContentType);
    });
};

module.exports = Thumbnail;