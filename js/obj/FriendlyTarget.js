/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for FriendlyTarget objects, which
 * should be defended by the player.
 */

define(function(require, exports, module) {
    var DestructibleTarget = require('obj/DestructibleTarget');

    /**
     * A constructor for friendly targets.
     */
    var FriendlyTarget = function(props) {
        props = props || {};
        props.objective = 'defend';
        DestructibleTarget.prototype.constructor.call(this, props);
        this.owner = 'player';
        this._fillStyle = 'rgba(0, 255, 0, 0.5)';
        this._strokeStyle = 'rgb(0, 255, 0)';
    };

    // Extend DestructibleTarget
    FriendlyTarget.prototype = Object.create(DestructibleTarget.prototype);
    FriendlyTarget.prototype.constructor = FriendlyTarget;

    module.exports = FriendlyTarget;
});
