/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * The graphics module is used for common graphics routines that are used
 * by many different game objects.
 */

var Graphics = Graphics || {};

/**
 * Fills a polygon, optionally with a given color.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Polygon} poly
 * @param {Color} color
 */
Graphics.fillPoly = function(ctx, poly, color) {
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
