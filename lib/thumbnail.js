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
    width: 750,
    height: 750
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
    async.waterfall([
      async.apply(_this._applyResize.bind(_this), image, {
        width: val.width,
        height: val.height
      })
    ], next);
  })
  
};

Thumbnail.prototype._applyResize = function(image, size, next) {
  console.log(this.options.width, Math.round(size.height * this.options.width / size.width))
  gm(image.Body)
    .scale(this.options.width, Math.round(size.height * this.options.width / size.width))
    .toBuffer(function (err, buffer) {
      next(err, buffer, image.ContentType);
    });
};

module.exports = Thumbnail;