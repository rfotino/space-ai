/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for a LaserBullet class, which is a
 * subclass of Bullet, fired from a LaserWeapon.
 */

var Bullet = require('./Bullet.js');

/**
 * A constructor for a bullet fired from a LaserWeapon.
 */
var LaserBullet = function(props) {
    props = props || {};
    props.weapon = 'laser';
    props.lifespan = 180;
    Bullet.prototype.constructor.call(this, props);
    this.width = 2;
    this.height = 10;
};

// Extend Bullet
LaserBullet.prototype = Object.create(Bullet.prototype);
LaserBullet.prototype.constructor = LaserBullet;

/**
 * @override {GameObject}
 * @param {CanvasRenderingContext2D} ctx
 */
LaserBullet.prototype.draw = function(ctx) {
    ctx.fillStyle = 'red';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
};

module.exports = LaserBullet;
