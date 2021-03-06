/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for DestructibleTarget objects, which
 * are completed when their health is depleted.
 */

var $ = require('../../lib/jquery/jquery.js');
var Target = require('./Target.js');
var Explosion = require('./Explosion.js');

/**
 * A class for destructible targets.
 */
var DestructibleTarget = function(props) {
    props = props || {};
    Target.prototype.constructor.call(this, props);
    this.explosionLifespan = props.explosionLifespan || 0.5 * this.radius;
    this._health = props.health || 100;
};

// Extend Target
DestructibleTarget.prototype = Object.create(Target.prototype);
DestructibleTarget.prototype.constructor = DestructibleTarget;

/**
 * Explode when health drops to zero.
 */
Object.defineProperty(DestructibleTarget.prototype, 'health', {
    get: function health() {
        return this._health;
    },
    set: function health(h) {
        this._health = h;
        if (this._health <= 0) {
            this.newObjects.push(new Explosion({
                lifespan: this.explosionLifespan,
                pos: { x: this.pos.x, y: this.pos.y },
                vel: { x: this.vel.x, y: this.vel.y }
            }));
            this.alive = false;
        }
    }
});

/**
 * Destructible targets are complete after they have finished exploding.
 *
 * @override {Target}
 * @return {Boolean}
 */
DestructibleTarget.prototype.complete = function() {
    return !this.alive;
};

/**
 * @override {Target}
 * @return {Object}
 */
DestructibleTarget.prototype.getObj = function() {
    var obj = Target.prototype.getObj.call(this);
    return $.extend(obj, {
        health: this.health
    });
};

module.exports = DestructibleTarget;
