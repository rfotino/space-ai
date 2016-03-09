/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a health powerup.
 */

var $ = require('../../lib/jquery/jquery.js');
var Powerup = require('./Powerup.js');

/**
 * A constructor for health powerups.
 */
var HealthPowerup = function(props) {
    props = props || {};
    props.type = 'health';
    Powerup.prototype.constructor.call(this, props);
    this.health = props.health || 25;
    this.radius = 15;
};

// Extend Powerup
HealthPowerup.prototype = Object.create(Powerup.prototype);
HealthPowerup.prototype.constructor = HealthPowerup;

/**
 * @override {Powerup}
 * @param {Player} player
 */
HealthPowerup.prototype.applyTo = function(player) {
    player.health += this.health;
};

/**
 * @override {Powerup}
 * @return {Object}
 */
HealthPowerup.prototype.getObj = function() {
    var obj = Powerup.prototype.getObj.call(this);
    return $.extend(obj, {
        health: this.health
    });
};

/**
 * @override {GameObject}
 * @param {CanvasRenderingContext2D} ctx
 */
HealthPowerup.prototype.draw = function(ctx) {
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'red';
    ctx.fillRect(-this.radius * 0.2, -this.radius * 0.75,
                 this.radius * 0.4, this.radius * 1.5);
    ctx.fillRect(-this.radius * 0.75, -this.radius * 0.2,
                 this.radius * 1.5, this.radius * 0.4);
    ctx.restore();
};

module.exports = HealthPowerup;
