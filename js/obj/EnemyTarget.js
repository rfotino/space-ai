/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for EnemyTarget objects, which
 * are completed when they are destroyed by the player.
 */

define(function(require, exports, module) {
    var DestructibleTarget = require('obj/DestructibleTarget');

    /**
     * A constructor for enemy targets.
     */
    var EnemyTarget = function(props) {
        props = props || {};
        props.objective = 'destroy';
        DestructibleTarget.prototype.constructor.call(this, props);
        this.owner = 'enemy';
        this._fillStyle = 'rgba(255, 0, 0, 0.5)';
        this._strokeStyle = 'rgb(255, 0, 0)';
    };

    // Extend DestructibleTarget
    EnemyTarget.prototype = Object.create(DestructibleTarget.prototype);
    EnemyTarget.prototype.constructor = EnemyTarget;

    module.exports = EnemyTarget;
});
