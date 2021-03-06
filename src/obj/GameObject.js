/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that returns a constructor for a GameObject, which is a superclass
 * for in-game entities, including the player.
 */

var $ = require('../../lib/jquery/jquery.js');
var physics = require('../physics.js');
var objIdCounter = 0;

/**
 * A constructor for a GameObject.
 */
var GameObject = function(props) {
    props = props || {};
    // Every object gets a position, velocity, and acceleration
    this.pos = $.extend({ x: 0, y: 0, angular: 0 }, props.pos);
    this.vel = $.extend({ x: 0, y: 0, angular: 0 }, props.vel);
    this.accel = $.extend({ x: 0, y: 0, angular: 0 }, props.accel);
    // Every object gets a type
    this.type = props.type || '';
    // A flag that says whether this game object should continue to be
    // updated after the game has completed. Used for explosions, etc
    // that should continue to animate after completion
    this.updateOnGameOver = props.updateOnGameOver || false;
    // If the alive flag is set to false, the object is removed from the
    // list of game objects
    this.alive = true;
    // A bounds changed flag, true if the object's bounds have not changed
    // since the last frame - used for caching intersection data
    this.boundsChanged = false;
    // A list of new game objects to add to the scene, usually generated
    // in this.update() or this.collide()
    this.newObjects = [];
    // Every object gets a z-depth, used for determining drawing order
    this.zDepth = 0;
    // Each object can either be a target or not. If an object is a
    // target, it must define a complete() function for checking to see
    // if the objective has been completed.
    this.isTarget = props.isTarget || false;
    // Give each object a unique ID, so that similar objects can be
    // exclusively identified by the player across frames
    this.id = ++objIdCounter;
};

/**
 * Updates position and velocity.
 */
GameObject.prototype.update = function() {
    this.boundsChanged = false;
    this.vel.x += this.accel.x;
    this.vel.y += this.accel.y;
    this.vel.angular += this.accel.angular;
    if (this.vel.x || this.vel.y || this.vel.angular) {
        this.boundsChanged = true;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.pos.angular += this.vel.angular;
    }
};

/**
 * Defines a default collision function, called when this object intersects
 * with another object.
 *
 * @param {GameObject} other
 */
GameObject.prototype.collide = function(other) { };

/**
 * Defines a default drawing function, should be overridden by any
 * subclasses for visible objects. The rendering context is already
 * transformed for this object's position/rotation/scale.
 *
 * @param {CanvasRenderingContext2D} ctx
 */
GameObject.prototype.draw = function(ctx) { };

/**
 * The default bounds function, returns a bounding box that should contain
 * this object. Uses duck typing to detect circular and rectangular objects.
 *
 * @return {Rectangle}
 */
GameObject.prototype.bounds = function() {
    if (this.radius) {
        return {
            x: this.pos.x - this.radius,
            y: this.pos.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    } else if (this.width && this.height) {
        return {
            x: this.pos.x - (this.width / 2),
            y: this.pos.y - (this.height / 2),
            width: this.width,
            height: this.height
        }
    }
    return { x: Infinity, y: Infinity, width: -Infinity, height: -Infinity };
};

/**
 * The default outline function, returns a circle or polygon that is the
 * outline of this object, used for collision detection. Uses duck typing
 * to detect circular and rectangular objects.
 *
 * @return {Circle|Polygon}
 */
GameObject.prototype.outline = function () {
    if (this.radius) {
        return {
            x: this.pos.x,
            y: this.pos.y,
            radius: this.radius
        };
    } else if (this.width && this.height) {
        var p1 = { x: -this.width / 2, y: -this.height / 2 };
        var p2 = { x: this.width / 2, y: this.height / 2 };
        var points = [ p1, { x: p2.x, y: p1.y }, p2, { x: p1.x, y: p2.y } ];
        var transform = physics.getRotate(this.pos.angular,
                                          physics.getTranslate(this.pos.x,
                                                               this.pos.y));
        return { points: points.map(transform) };
    } else {
        return null;
    }
};

/**
 * Returns an object that contains attributes that should be visible to the
 * user. This function should be overridden for objects that wish to expose
 * further attributes.
 *
 * @return {Object}
 */
GameObject.prototype.getObj = function() {
    return {
        id: this.id,
        pos: $.extend({}, this.pos),
        vel: $.extend({}, this.vel),
        accel: $.extend({}, this.accel),
        type: this.type
    };
};

module.exports = GameObject;
