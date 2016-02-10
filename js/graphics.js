/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * The graphics module is used for common graphics routines that are used
 * by many different game objects.
 */

define(function(require, exports, module) {
    /**
     * Fills a polygon, optionally with a given color.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {Polygon} poly
     * @param {Color} color
     */
    exports.fillPoly = function(ctx, poly, color) {
        if (color) {
            ctx.fillStyle = color;
        }
        ctx.beginPath();
        for (var i = 0; i < poly.points.length; i++) {
            var p = poly.points[i];
            ctx.lineTo(p.x, p.y);
        }
        ctx.fill();
    };

    /**
     * Returns a polygonal approximation of the quadratic curve from p1 to p3
     * with control point p2.
     *
     * @param {Point} p1 The starting point.
     * @param {Point} p2 The control point.
     * @param {Point} p3 The ending point.
     * @param {Number} numPoints The number of points to use in the approximation.
     * @return {Point[]} A polygonal approximation of the quadratic curve.
     */
    exports.getQuadTo = function(p1, p2, p3, numPoints) {
        var points = [];
        if (numPoints < 2) {
            return points;
        }
        for (var i = 0; i < numPoints; i++) {
            var t = i / (numPoints - 1);
            points.push({
                x: ((1 - t) * (1 - t) * p1.x) +
                    (2 * (1 - t) * t * p2.x) +
                    (t * t * p3.x),
                y: ((1 - t) * (1 - t) * p1.y) +
                    (2 * (1 - t) * t * p2.y) +
                    (t * t * p3.y)
            });
        }
        return points;
    };
});
