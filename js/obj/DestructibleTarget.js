/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for DestructibleTarget objects, which
 * are completed when their health is depleted.
 */

define(function(require, exports, module) {
    var Target = require('obj/Target');

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
     * Destructible targets are complete when they run out of health.
     *
     * @override {Target}
     * @return {Boolean}
     */
    DestructibleTarget.prototype.complete = function() {
        return this.health <= 0;
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
        }
    };

    module.exports = DestructibleTarget;
});
