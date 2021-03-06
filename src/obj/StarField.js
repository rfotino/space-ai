/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for StarField objects. StarField objects
 * are responsible for creating, keeping track of, and drawing the field of
 * stars in the background.
 */

/**
 * A constructor for StarField objects.
 */
var StarField = function(density) {
    this._density = density || 0.000125;
    this._bounds = {
        x: 0,
        y: 0,
        width: window.innerWidth / 2,
        height: window.innerHeight / 2
    };
    this._stars = [];
    this._color = '#bbf';
    this._starRadius = 2;
    this._starOffset = 250;
    this._addStars(this._bounds.x, this._bounds.y,
                   this._bounds.width, this._bounds.height);
};

/**
 * A function for generating stars in the given rectangle at the set
 * star density. Should only be called by the constructor.
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
StarField.prototype._addStars = function(x, y, width, height) {
    var numStars = width * height * this._density;
    for (var i = 0; i < numStars; i++) {
        this._stars.push({
            x: x + (width * Math.random()),
            y: y + (height * Math.random())
        });
    }
};

/**
 * Draws the star field, at least covering the in-game bounds of the given
 * viewport.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Viewport} viewport
 */
StarField.prototype.draw = function(ctx, viewport) {
    // We need to make sure we cover the entire viewport bounds with stars
    var viewBounds = viewport.bounds(ctx.canvas.width, ctx.canvas.height);
    var viewBoundsRight = viewBounds.x + viewBounds.width;
    var viewBoundsTop = viewBounds.y + viewBounds.height;
    // Figure out the offset that we need to draw the first iteration of
    // the starfield at
    var minXIndex = Math.floor((viewBounds.x - this._bounds.x -
                                (this._starOffset / 2)) /
                               this._bounds.width);
    var minYIndex = Math.floor((viewBounds.y - this._bounds.y -
                                (this._starOffset / 2)) /
                               this._bounds.height);
    var minXCoord = this._bounds.x + (minXIndex * this._bounds.width);
    var minYCoord = this._bounds.y + (minYIndex * this._bounds.height);
    // Find out the offset for the last iteration of the starfield
    var maxXIndex = minXIndex +
        Math.ceil((viewBoundsRight - minXCoord + (this._starOffset / 2))
                  / this._bounds.width);
    var maxYIndex = minYIndex +
        Math.ceil((viewBoundsTop - minYCoord + (this._starOffset / 2))
                  / this._bounds.height);
    // We need a slight random offset for each star, depending on which
    // star field indices are being used. Define a RNG getter here
    var getRng = function(seed) {
        return function() {
            var x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
    };
    // Repeat the starfield from the minimum indices to the maximum indices,
    // which should completely cover the viewport
    ctx.fillStyle = this._color;
    var effectiveRadius = this._starRadius * viewport.getScale();
    var drawAsSquare = effectiveRadius < 1.5;
    var starDiameter = 2 * this._starRadius;
    for (var i = minXIndex; i < maxXIndex; i++) {
        for (var j = minYIndex; j < maxYIndex; j++) {
            // Define a new random number generator for this iteration of
            // the star field, seeded with a number dependent on the x and y
            // indices of this particular star field
            var rng = getRng(i + (j * 10000));
            for (var k = 0; k < this._stars.length; k++) {
                var star = this._stars[k];
                // Get the adjusted x and y coordinates. These are the
                // original coordinates plus the bounds coordinates plus
                // the offset for the position of the bounding box plus a
                // random offset depending on which bounds indices we are
                // drawing
                var adjX = star.x + this._bounds.x +
                    (i * this._bounds.width) +
                    ((rng() - 0.5) * this._starOffset);
                var adjY = star.y + this._bounds.y +
                    (j * this._bounds.height) +
                    ((rng() - 0.5) * this._starOffset);
                // Check if star is in view before drawing
                if (viewBounds.x <= adjX && adjX <= viewBoundsRight &&
                    viewBounds.y <= adjY && adjY <= viewBoundsTop) {
                    if (drawAsSquare) {
                        ctx.fillRect(adjX, adjY, starDiameter, starDiameter);
                    } else {
                        ctx.beginPath();
                        ctx.arc(adjX, adjY, this._starRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
    }
};

module.exports = StarField;
