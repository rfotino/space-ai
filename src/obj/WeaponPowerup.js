/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A modules that defines a weapon powerup that the user can pick up.
 */

var $ = require('../../lib/jquery/jquery.js');
var physics = require('../physics.js');
var LaserWeapon = require('./LaserWeapon.js');
var Powerup = require('./Powerup.js');

/**
 * A constructor for weapon powerup objects.
 */
var WeaponPowerup = function(props) {
    props = props || {};
    props.type = 'ammo';
    Powerup.prototype.constructor.call(this, props);
    this.weapon = props.weapon || new LaserWeapon();
    this.radius = props.radius || 20;
    // Get a bullet to draw without losing any ammo in this.weapon. A bit of
    // a hack, should probably be replaced at some point to improve portability
    // between weapon types
    var ammo = this.weapon.ammo;
    var cooldownTimer = this.weapon.cooldownTimer;
    this._bullet = this.weapon.getBullet({ x: 1, y: 2 }, this);
    this.weapon.cooldownTimer = cooldownTimer;
    this.weapon.ammo = ammo;
    
};

// Extend Powerup
WeaponPowerup.prototype = Object.create(Powerup.prototype);
WeaponPowerup.prototype.constructor = WeaponPowerup;

/**
 * @override {Powerup}
 * @param {Player} player
 */
WeaponPowerup.prototype.applyTo = function(player) {
    for (var i = 0; i < player.weapons.length; i++) {
        var playerWeapon = player.weapons[i];
        if (playerWeapon.name === this.weapon.name) {
            if (null !== playerWeapon.ammo) {
                playerWeapon.ammo += this.weapon.ammo;
            }
            return;
        }
    }
    player.weapons.push(this.weapon);
};

/**
 * @override {Powerup}
 * @return {Object}
 */
WeaponPowerup.prototype.getObj = function() {
    var obj = Powerup.prototype.getObj.call(this);
    return $.extend(obj, {
        weapon: this.weapon.getObj()
    });
};

/**
 * @override {GameObject}
 * @param {CanvasRenderingContext2D} ctx
 */
WeaponPowerup.prototype.draw = function(ctx) {
    ctx.save();
    ctx.fillStyle = '#666';
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = this.radius / 15;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - (ctx.lineWidth / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Get the scale at which to draw the bullet
    var bulletBounds = this._bullet.bounds();
    var bulletDiameter = physics.dist(bulletBounds,
                                      physics.sum(bulletBounds,
                                                  { x: bulletBounds.width,
                                                    y: bulletBounds.height }));
    var padding = this.radius / 5;
    var scale = ((this.radius - ctx.lineWidth - padding) * 2) / bulletDiameter;
    ctx.scale(scale, scale);
    ctx.rotate(this._bullet.pos.angular);
    this._bullet.draw(ctx);
    ctx.restore();
};

module.exports = WeaponPowerup;
