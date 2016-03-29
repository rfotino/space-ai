/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that returns a constructor for Viewport objects. Can be used for
 * view transformations, getting viewable bounds, etc.
 */

/**
 * A constructor for Viewport objects.
 */
var Viewport = function() {
    this.reset();
};

/**
 * Scales the viewport by the given amount in both the x and y directions,
 * relative to any already applied scale transformations.
 *
 * @param {Number} scale
 * @param {Boolean} clamp If true, clamp scale to min/max values.
 */
Viewport.prototype.scale = function(scale, clamp) {
    this._scale *= scale;
    if (clamp) {
        var minScale = 0.2;
        var maxScale = 1;
        if (this._scale < minScale) {
            this._scale = minScale;
        } else if (maxScale < this._scale) {
            this._scale = maxScale;
        }
    }
};

/**
 * @return {Number} The current scale factor.
 */
Viewport.prototype.getScale = function() {
    return this._scale;
};

/**
 * Translates the viewport by the given amount, relative to any already
 * applied translate transformations.
 *
 * @param {Number} x
 * @param {Number} y
 */
Viewport.prototype.translate = function(x, y) {
    this._translation.x += x;
    this._translation.y += y;
};

/**
 * @return {Point} The current translation.
 */
Viewport.prototype.getTranslation = function() {
    return { x: this._translation.x, y: this._translation.y };
};

/**
 * Centers the viewport on the given game object, using its position.
 * Overrides existing translations.
 *
 * @param {GameObject} gameObj
 */
Viewport.prototype.focus = function(gameObj) {
    this._focusObj = gameObj;
};

/**
 * Returns true if the viewport is focused on a game object, false otherwise.
 *
 * @return {Boolean}
 */
Viewport.prototype.isFocused = function() {
    return !!this._focusObj;
};

/**
 * Fixes the viewport to the given in-game bounds, given the pixel
 * dimensions of the view bounds.
 *
 * @param {Rectangle} bounds
 * @param {Number} viewWidth
 * @param {Number} viewHeight
 * @param {Boolean} clamp If true, clamp the scale to min/max values.
 */
Viewport.prototype.fixToBounds = function(bounds, viewWidth, viewHeight,
                                          clamp) {
    this.reset();
    var scaleX = viewWidth / bounds.width;
    var scaleY = viewHeight / bounds.height;
    var scale = Math.min(scaleX, scaleY);
    this.scale(scale, clamp);
    scale = this.getScale();
    this.translate(-bounds.x + (((viewWidth / scale) - bounds.width) / 2),
                   bounds.y + (((viewHeight / scale) + bounds.height) / 2));
};

/**
 * Resets the viewport's scale and translation, and unsets the focused
 * object.
 */
Viewport.prototype.reset = function() {
    this._scale = 1;
    this._translation = { x: 0, y: 0 };
    this._focusObj = null;
};

/**
 * Updates the transformation on the given graphics context for this
 * viewport.
 *
 * @param {CanvasRenderingContext2D} ctx
 */
Viewport.prototype.update = function(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this._focusObj) {
        this._translation.x = -this._focusObj.pos.x +
            ((ctx.canvas.width / 2) / this._scale);
        this._translation.y = this._focusObj.pos.y +
            ((ctx.canvas.height / 2) / this._scale);
    }
    ctx.scale(this._scale, this._scale);
    ctx.translate(this._translation.x, this._translation.y);
    // Flip y-axis
    ctx.scale(1, -1);
};

/**
 * Gets the in-game bounds that correspond to this viewport.
 *
 * @param {Number} viewWidth
 * @param {Number} viewHeight
 */
Viewport.prototype.bounds = function(viewWidth, viewHeight) {
    return {
        x: -this._translation.x,
        y: this._translation.y - (viewHeight / this._scale),
        width: viewWidth / this._scale,
        height: viewHeight / this._scale
    };
};

/**
 * Converts in-game coordinates to viewport coordinates.
 *
 * @param {Point} gameCoords
 * @return {Point}
 */
Viewport.prototype.getViewCoords = function(gameCoords) {
    return {
        x: (gameCoords.x + this._translation.x) * this._scale,
        y: (-gameCoords.y + this._translation.y) * this._scale
    };
};

/**
 * Converts viewport coordinates to in-game coordinates.
 *
 * @param {Point} viewCoords
 * @return {Point}
 */
Viewport.prototype.getGameCoords = function(viewCoords) {
    return {
        x: (viewCoords.x / this._scale) - this._translation.x,
        y: -(viewCoords.y / this._scale) + this._translation.y
    };
};

module.exports = Viewport;
