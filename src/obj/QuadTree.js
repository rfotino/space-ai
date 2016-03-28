/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * Implements a QuadTree data structure for spatial indexing of GameObjects.
 */

var physics = require('../physics.js');

var DEFAULT_MAX_OBJECTS = 5;
var DEFAULT_MAX_DEPTH = 10;

/**
 * A constructor for QuadTree objects.
 *
 * @param {Rectangle} bounds
 * @param {GameObject[]} objects
 * @param {Number} maxObjects
 * @param {Number} maxDepth
 * @param {Number} depth
 */
var QuadTree = function(bounds, objects, maxObjects, maxDepth, depth) {
    if (!maxObjects) {
        maxObjects = DEFAULT_MAX_OBJECTS;
    }
    if (!maxDepth) {
        maxDepth = DEFAULT_MAX_DEPTH;
    }
    if (!depth) {
        depth = 0;
    }
    this.bounds = bounds;
    this.objects = [];
    if (0 === depth) {
        this.objects = objects;
    } else {
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (physics.testIntersectionRectRect(bounds, obj.bounds())) {
                this.objects.push(obj);
            }
        }
    }
    if (depth !== maxDepth && maxObjects < this.objects.length) {
        var halfWidth = bounds.width / 2;
        var halfHeight = bounds.height / 2;
        var nextDepth = depth + 1;
        this.quads = [
            new QuadTree({
                x: bounds.x + halfWidth,
                y: bounds.y + halfHeight,
                width: halfWidth,
                height: halfHeight
            }, this.objects, maxObjects, maxDepth, nextDepth),
            new QuadTree({
                x: bounds.x,
                y: bounds.y + halfHeight,
                width: halfWidth,
                height: halfHeight
            }, this.objects, maxObjects, maxDepth, nextDepth),
            new QuadTree({
                x: bounds.x,
                y: bounds.y,
                width: halfWidth,
                height: halfHeight
            }, this.objects, maxObjects, maxDepth, nextDepth),
            new QuadTree({
                x: bounds.x + halfWidth,
                y: bounds.y,
                width: halfWidth,
                height: halfHeight
            }, this.objects, maxObjects, maxDepth, nextDepth)
        ];
    }
};

/**
 * Recursively tests collision on the game objects contained in the QuadTree.
 * If two objects intersect, their collide() functions are called on each
 * other.
 */
QuadTree.prototype.doCollision = function() {
    if (this.quads) {
        for (var i = 0; i < this.quads.length; i++) {
            this.quads[i].doCollision();
        }
    } else {
        for (var i = 0; i < this.objects.length; i++) {
            var objA = this.objects[i];
            if (!objA.alive) {
                continue;
            }
            for (var j = i + 1; j < this.objects.length; j++) {
                var objB = this.objects[j];
                if (!objB.alive) {
                    continue;
                }
                if (physics.testIntersection(objA, objB)) {
                    objA.collide(objB);
                    objB.collide(objA);
                    if (!objA.alive) {
                        break;
                    }
                }
            }
        }
    }
};

module.exports = QuadTree;
