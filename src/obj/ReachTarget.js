/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for ReachTarget objects, which are
 * completed when the player is within their bounds.
 */

var physics = require('../physics.js');
var Target = require('./Target.js');

/**
 * A constructor for reach targets.
 */
var ReachTarget = function(props) {
    props = props || {};
    props.objective = 'reach';
    Target.prototype.constructor.call(this, props);
    this.radius = props.radius || 50;
    this._fillStyle = 'rgba(50, 50, 255, 0.5)';
    this._strokeStyle = 'rgb(50, 50, 255)';
};

// Extend Target
ReachTarget.prototype = Object.create(Target.prototype);
ReachTarget.prototype.constructor = ReachTarget;

/**
 * @override {Target}
 * @param {Player} player
 * @return {Boolean}
 */
ReachTarget.prototype.complete = function(player) {
    return physics.testContainsCirclePoly(this.outline(), player.outline());
};

module.exports = ReachTarget;
