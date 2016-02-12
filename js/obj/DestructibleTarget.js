/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for DestructibleTarget objects, which
 * are completed when their health is depleted.
 */

define(function(require, exports, module) {
    var Target = require('obj/Target');
    var Explosion = require('obj/Explosion');

    /**
     * A class for destructible targets.
     */
    var DestructibleTarget = function(props) {
        props = props || {};
        Target.prototype.constructor.call(this, props);
        this.health = props.health || 100;
    };

    // Extend Target
    DestructibleTarget.prototype = Object.create(Target.prototype);
    DestructibleTarget.prototype.constructor = DestructibleTarget;

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

    /**
     * @override {Target}
     */
    DestructibleTarget.prototype.update = function() {
        if (this.health <= 0) {
            this.newObjects.push(new Explosion({
                lifespan: 0.5 * this.radius,
                pos: { x: this.pos.x, y: this.pos.y },
                vel: { x: this.vel.x, y: this.vel.y }
            }));
            this.alive = false;
        } else {
            Target.prototype.update.call(this);
        }
    };

    module.exports = DestructibleTarget;
});
