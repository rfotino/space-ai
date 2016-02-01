/**
 * Copyright (c) 2016 Robert Fotino
 *
 * The physics module is used for testing if a point is inside an object, if
 * two objects intersect, or other sorts of common computations performed on
 * game objects.
 */

var Physics = Physics || {};

/**
 * Returns the slope of the line between two points.
 *
 * @param {Point} p1
 * @param {Point} p2
 * @return {Number}
 */
Physics.getSlope = function(p1, p2) {
    return (p1.y - p2.y) / (p1.x - p2.x);
};

/**
 * Tests if a point is inside a rectangle.
 *
 * @param {Point} p
 * @param {Rectangle} rect
 * @return {Boolean}
 */
Physics.pointInRect = function(p, rect) {
    return (rect.x <= p.x && p.x <= rect.x + rect.width &&
            rect.y <= p.y && p.y <= rect.y + rect.height);
};

/**
 * Tests if a point is inside a circle.
 *
 * @param {Point} p
 * @param {Circle} circle
 * @return {Boolean}
 */
Physics.pointInCircle = function(p, circle) {
    var distSq = Math.pow(p.x - circle.x, 2) + Math.pow(p.y - circle.y, 2);
    return distSq <= Math.pow(circle.radius, 2);
};

/**
 * Tests if a point is inside a polygon.
 *
 * @param {Point} p
 * @param {Polygon} poly
 * @return {Boolean}
 */
Physics.pointInPoly = function(p, poly) {
    // Check if a ray starting at the point p and headed in the positive
    // y direction intersects the outline an even or odd number of times
    var numIntersections = 0;
    for (var i = 0; i < poly.points.length; i++) {
        var a = poly.points[i];
        var b = poly.points[(i + 1) % poly.points.length];
        // Ignore vertical lines, avoid division by zero
        if (a.x === b.x) {
            continue;
        }
        // Ignore lines that the ray can't intersect with
        if (p.x < Math.min(a.x, b.x) || Math.max(a.x, b.x) < p.x) {
            continue;
        }
        // Get the exact location of intersection
        var m = Physics.getSlope(a, b);
        var intersection = (m * (p.x - a.x)) + a.y;
        // If it's greater than or equal to the point, the ray intersected
        if (p.y <= intersection) {
            numIntersections++;
        }
    }
    // If the ray intersected the outline an odd number of times, p is
    // contained within the outline
    return numIntersections % 2 === 1;
};

/**
 * Tests if a point is inside a game object.
 *
 * @param {Point} p
 * @param {GameObject} obj
 * @return {Boolean}
 */
Physics.pointInObj = function(p, obj) {
    // Check the bounding box first
    var bounds = obj.bounds();
    if (!Physics.pointInRect(p, obj.bounds())) {
        return false;
    }
    // Next check the outline shape, could be a circle or polygon
    var outline = obj.outline();
    if (outline.hasOwnProperty('radius')) {
        return Physics.pointInCircle(p, outline);
    } else if (outline.hasOwnProperty('points')) {
        return Physics.pointInPoly(p, outline);
    }
    return false;
};

/**
 * Gets a function for translating a point.
 *
 * @param {Number} x The distance to translate on the x-axis.
 * @param {Number} y The distance to translate on the y-axis.
 * @param {Function} transform An additional function to apply to the point.
 * @return {Function} A function that returns a transformed point.
 */
Physics.getTranslate = function(x, y, transform) {
    transform = transform || function(p) { return p; };
    return function(p) {
        return transform({
            x: p.x + x,
            y: p.y + y
        });
    };
};

/**
 * Gets a function for rotating a point.
 *
 * @param {Number} theta The amount of rotation to apply.
 * @param {Function} transform An additional function to apply to the point.
 * @return {Function} A function that returns a transformed point.
 */
Physics.getRotate = function(theta, transform) {
    transform = transform || function(p) { return p; };
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    return function(p) {
        return transform({
            x: (p.x * cosTheta) - (p.y * sinTheta),
            y: (p.y * cosTheta) + (p.x * sinTheta)
        });
    };
};

/**
 * Gets the bounding box for the given polygon.
 *
 * @param {Polygon} poly
 * @return {Rectangle}
 */
Physics.getPolyBounds = function(poly) {
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < poly.points.length; i++) {
        var p = poly.points[i];
        if (p.x < minX) {
            minX = p.x;
        }
        if (maxX < p.x) {
            maxX = p.x;
        }
        if (p.y < minY) {
            minY = p.y;
        }
        if (maxY < p.y) {
            maxY = p.y;
        }
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

/**
 * Tests if the line segment from p1 to p2 and the line segment from p3
 * to p4 intersect.
 *
 * @param {Point} p1
 * @param {Point} p2
 * @param {Point} p3
 * @param {Point} p4
 * @return {Boolean}
 */
Physics.testIntersectionLineSegments = function(p1, p2, p3, p4) {
    var intersection;
    var m1 = Physics.getSlope(p1, p2);
    var m2 = Physics.getSlope(p3, p4);
    if (p1.x === p2.x && p3.x === p4.x) {
        // Both lines are vertical, treat this as no intersection
        return false;
    } else if (p1.x === p2.x) {
        // The first line is vertical
        intersection = {
            x: p1.x,
            y: (m2 * (p1.x - p3.x)) + p3.y
        };
    } else if (p3.x === p4.x) {
        // The second line is vertical
        intersection = {
            x: p3.x,
            y: (m1 * (p3.x - p1.x)) + p1.y
        };
    } else {
        // Neither line is vertical; treat parallel lines as nonintersecting
        if (m1 === m2) {
            return false;
        }
        var x = (p1.y - p3.y + (m2 * p3.x) - (m1 * p1.x)) / (m2 - m1);
        intersection = {
            x: x,
            y: (m1 * (x - p1.x)) + p1.y
        };
    }
    // We have the intersection point, but we need to check if it lies on
    // both of the line segments
    return Math.min(p1.x, p2.x) <= intersection.x &&
        intersection.x <= Math.max(p1.x, p2.x) &&
        Math.min(p1.y, p2.y) <= intersection.y &&
        intersection.y <= Math.max(p1.y, p2.y) &&
        Math.min(p3.x, p4.x) <= intersection.x &&
        intersection.x <= Math.max(p3.x, p4.x) &&
        Math.min(p3.y, p4.y) <= intersection.y &&
        intersection.y <= Math.max(p3.y, p4.y);
};

/**
 * Tests if two rectangles intersect.
 *
 * @param {Rectangle} r1
 * @param {Rectangle} r2
 * @return {Boolean}
 */
Physics.testIntersectionRectRect = function(r1, r2) {
    return r1.x <= r2.x + r2.width && r2.x <= r1.x + r1.width &&
        r1.y <= r2.y + r2.height && r2.y <= r1.y + r1.height;
};

/**
 * Tests if two circles intersect.
 *
 * @param {Circle} c1
 * @param {Circle} c2
 * @return {Boolean}
 */
Physics.testIntersectionCircleCircle = function(c1, c2) {
    var distSq = Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2);
    var radiusSq = Math.pow(c1.radius + c2.radius, 2);
    return distSq <= radiusSq;
};

/**
 * Tests if a circle and a polygon intersect.
 *
 * @param {Circle} circle
 * @param {Polygon} poly
 * @return {Boolean}
 */
Physics.testIntersectionCirclePoly = function(circle, poly) {
    // If the polygon has no points, there can be no intersection
    if (0 === poly.points.length) {
        return false;
    }
    // For intersection, either the circle's center is inside the polygon,
    // all of the polygon's points are inside the circle, or at least one
    // edge of the polygon is secant to the circle.
    if (Physics.pointInPoly(circle, poly)) {
        return true;
    } else if (Physics.pointInCircle(poly.points[0], circle)) {
        return true;
    } else {
        // Check for secant lines by projecting the vector from p1 to the
        // circle's center onto the vector from p1 to p2. Then p1 plus the
        // projection is the closest point to the circle's center, so we
        // can check if it is inside the circle
        for (var i = 0; i < poly.points.length; i++) {
            var p1 = poly.points[i];
            var p2 = poly.points[(i + 1) % poly.points.length];
            var vec1 = { x: p2.x - p1.x, y: p2.y - p1.y };
            var vec2 = { x: circle.x - p1.x, y: circle.y - p1.y };
            var comp = ((vec1.x * vec2.x) + (vec1.y * vec2.y)) /
                ((vec1.x * vec1.x) + (vec1.y * vec1.y));
            var proj = { x: comp * vec1.x, y: comp * vec1.y };
            var closestPoint = { x: p1.x + proj.x, y: p1.y + proj.y };
            if (Physics.pointInCircle(closestPoint, circle)) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Tests if two polygons intersect.
 *
 * @param {Polygon} poly1
 * @param {Polygon} poly2
 * @return {Boolean}
 */
Physics.testIntersectionPolyPoly = function(poly1, poly2) {
    // Empty polygons can't intersect
    if (0 === poly1.points.length || 0 === poly2.points.length) {
        return false;
    }
    // Check if a point of poly1 is inside of poly2 and vice versa, indicating
    // intersection
    if (Physics.pointInPoly(poly1.points[0], poly2) ||
        Physics.pointInPoly(poly2.points[0], poly1)) {
         return true;
    }
    // Check if any of the edges of the two polygons intersect
    for (var i = 0; i < poly1.points.length; i++) {
        var p1 = poly1.points[i];
        var p2 = poly1.points[(i + 1) % poly1.points.length];
        for (var j = 0; j < poly2.points.length; j++) {
            var p3 = poly2.points[j];
            var p4 = poly2.points[(j + 1) % poly2.points.length];
            if (Physics.testIntersectionLineSegments(p1, p2, p3, p4)) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Tests if the two game objects intersect.
 *
 * @param {GameObject} objA
 * @param {GameObject} objB
 * @return {Boolean}
 */
Physics.testIntersection = function(objA, objB) {
    // First check if the bounding boxes intersect
    var boundsA = objA.bounds();
    var boundsB = objB.bounds();
    if (!Physics.testIntersectionRectRect(boundsA, boundsB)) {
        return false;
    }
    // Then check if the outlines intersect
    var outlineA = objA.outline();
    var outlineB = objB.outline();
    if (outlineA.hasOwnProperty('radius')) {
        if (outlineB.hasOwnProperty('radius')) {
            return Physics.testIntersectionCircleCircle(outlineA, outlineB);
        } else if (outlineB.hasOwnProperty('points')) {
            return Physics.testIntersectionCirclePoly(outlineA, outlineB);
        }
    } else if (outlineA.hasOwnProperty('points')) {
        if (outlineB.hasOwnProperty('radius')) {
            return Physics.testIntersectionCirclePoly(outlineB, outlineA);
        } else if (outlineB.hasOwnProperty('points')) {
            return Physics.testIntersectionPolyPoly(outlineA, outlineB);
        }
    }
    return false;
};

/**
 * Tests if the polygon is completely enclosed by the circle.
 *
 * @param {Circle} circle
 * @param {Polygon} poly
 * @return {Boolean}
 */
Physics.testContainsCirclePoly = function(circle, poly) {
    for (var i = 0; i < poly.points.length; i++) {
        if (!Physics.pointInCircle(poly.points[i], circle)) {
            return false;
        }
    }
    return true;
};
