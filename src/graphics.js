/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * The graphics module is used for common graphics routines that are used
 * by many different game objects.
 */

/**
 * Draws a shape to the graphics context so that the caller can stroke
 * or fill as necessary.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Polygon|Circle} shape
 */
exports.drawShape = function(ctx, shape) {
    ctx.beginPath();
    if (shape.radius) {
        ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
    } else if (shape.points) {
        for (var i = 0; i < shape.points.length; i++) {
            var p = shape.points[i];
            ctx.lineTo(p.x, p.y);
        }
    }
    ctx.closePath();
};

/**
 * Draws a rounded rectangle that the caller can stroke or fill as
 * necessary.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Rectangle} rect
 * @param {Number} radius
 */
exports.drawRoundedRect = function(ctx, rect, radius) {
    // Radius can't be more than half the width or height
    radius = Math.min(rect.width / 2, rect.height / 2, radius);
    // Radius can't be less than zero
    radius = Math.max(0, radius);
    var midX = rect.x + (rect.width / 2);
    var midY = rect.y + (rect.height / 2);
    var straightWidth = (rect.width / 2) - radius;
    var straightHeight = (rect.height / 2) - radius;
    ctx.beginPath();
    ctx.moveTo(rect.x, midY + straightHeight);
    ctx.arcTo(rect.x, rect.y + rect.height,
              midX - straightWidth, rect.y + rect.height,
              radius);
    ctx.lineTo(midX + straightWidth, rect.y + rect.height);
    ctx.arcTo(rect.x + rect.width, rect.y + rect.height,
              rect.x + rect.width, midY + straightHeight,
              radius);
    ctx.lineTo(rect.x + rect.width, midY - straightHeight);
    ctx.arcTo(rect.x + rect.width, rect.y,
              midX + straightWidth, rect.y,
              radius);
    ctx.lineTo(midX - straightWidth, rect.y);
    ctx.arcTo(rect.x, rect.y,
              rect.x, midY - straightHeight,
              radius);
    ctx.closePath();
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
