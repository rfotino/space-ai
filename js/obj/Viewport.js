/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that returns a constructor for Viewport objects. Can be used for
 * view transformations, getting viewable bounds, etc.
 */

define(function(require, exports, module) {
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
     */
    Viewport.prototype.scale = function(scale) {
        this._scale *= scale;
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
     * Centers the viewport on the given game object, using its position.
     * Overrides existing translations.
     *
     * @param {GameObject} gameObj
     */
    Viewport.prototype.focus = function(gameObj) {
        this._focusObj = gameObj;
    };

    /**
     * Fixes the viewport to the given in-game bounds, given the pixel
     * dimensions of the view bounds.
     *
     * @param {Rectangle} bounds
     * @param {Number} viewWidth
     * @param {Number} viewHeight
     */
    Viewport.prototype.fixToBounds = function(bounds, viewWidth, viewHeight) {
        this._focusObj = null;
        var scaleX = viewWidth / bounds.width;
        var scaleY = viewHeight / bounds.height;
        var scale = Math.min(scaleX, scaleY);
        this.scale(scale);
        this.translate(-bounds.x + (((viewWidth / scale) - bounds.width) / 2),
                       -bounds.y + (((viewHeight / scale) - bounds.height) / 2));
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
            this._translation.x = -this._focusObj.pos.x + (ctx.canvas.width / 2);
            this._translation.y = -this._focusObj.pos.y + (ctx.canvas.height / 2);
        }
        ctx.scale(this._scale, this._scale);
        ctx.translate(this._translation.x, this._translation.y);
    };

    /**
     * Gets the in-game bounds that correspond to this viewport.
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    Viewport.prototype.bounds = function(ctx) {
        return {
            x: -this._translation.x,
            y: -this._translation.y,
            width: ctx.canvas.width / this._scale,
            height: ctx.canvas.height / this._scale
        };
    };

    module.exports = Viewport;
});
