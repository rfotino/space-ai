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
        this._explosionComplete = false;
    };

    // Extend Target
    DestructibleTarget.prototype = Object.create(Target.prototype);
    DestructibleTarget.prototype.constructor = DestructibleTarget;

    /**
     * Destructible targets can't collide with anything if they have no health.
     *
     * @override {Target}
     * @return {Circle|Object}
     */
    DestructibleTarget.prototype.outline = function() {
        if (this.health <= 0) {
            return {};
        } else {
            return Target.prototype.outline.call(this);
        }
    };

    /**
     * Destructible targets are complete after they have finished exploding.
     *
     * @override {Target}
     * @return {Boolean}
     */
    DestructibleTarget.prototype.complete = function() {
        return this._explosionComplete;
    };

    /**
     * @override {Target}
     * @return {Object}
     */
    DestructibleTarget.prototype.getObj = function() {
        if (this.health <= 0) {
            return null;
        } else {
            var obj = Target.prototype.getObj.call(this);
            return $.extend(obj, {
                health: this.health
            });
        }
    };

    /**
     * Only draw destructible targets if they have health remaining.
     *
     * @override {Target}
     * @param {CanvasRenderingContext2D} ctx
     */
    DestructibleTarget.prototype.draw = function(ctx) {
        if (0 < this.health) {
            Target.prototype.draw.call(this, ctx);
        } else if (!this._explosionComplete) {
            if (undefined === this._explosion) {
                this._explosion = new Explosion();
            } else {
                this._explosion.update();
            }
            if (this._explosion.alive) {
                this._explosion.draw(ctx);
            } else {
                this._explosionComplete = true;
            }
        }
    };

    module.exports = DestructibleTarget;
});
