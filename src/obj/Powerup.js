/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines an abstract powerup object that the user can pick up.
 */

var GameObject = require('./GameObject.js');

/**
 * A constructor for powerup objects.
 */
var Powerup = function(props) {
    props = props || {};
    props.type = props.type || 'powerup';
    GameObject.prototype.constructor.call(this, props);
};

// Extend GameObject
Powerup.prototype = Object.create(GameObject.prototype);
Powerup.prototype.constructor = Powerup;

/**
 * Function that is called when the user ship passes over this powerup.
 * Does nothing by default.
 *
 * @param {Player} player
 */
Powerup.prototype.applyTo = function(player) { };

/**
 * @override {GameObject}
 * @param {GameObject} other
 */
Powerup.prototype.collide = function(other) {
    if ('player' === other.type) {
        this.applyTo(other);
        this.alive = false;
    }
};

module.exports = Powerup;
