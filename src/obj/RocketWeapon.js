/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a RocketWeapon class that extends Weapon. The
 * RocketWeapon has a limited amount of ammo, but more power than LaserWeapon.
 */

var Weapon = require('./Weapon.js');
var RocketBullet = require('./RocketBullet.js');

/**
 * A constructor for a rocket weapon.
 */
var RocketWeapon = function(props) {
    props = props || {};
    props.name = 'rocket';
    props.damage = props.damage || 100;
    props.bulletSpeed = props.bulletSpeed || 5;
    props.range = props.range || 1000;
    props.cooldown = props.cooldown || 60;
    Weapon.prototype.constructor.call(this, props);
};

// Extend Weapon
RocketWeapon.prototype = Object.create(Weapon.prototype);
RocketWeapon.prototype.constructor = RocketWeapon;

/**
 * If the cooldown is at zero, the weapon can fire again and returns a
 * bullet in the given direction, in the given position, with the given
 * owner.
 *
 * @override {Weapon}
 * @param {Point} dir
 * @param {GameObject} obj
 */
RocketWeapon.prototype.getBullet = function(dir, obj) {
    if (this.cooldownTimer <= 0 && 0 < this.ammo) {
        if ({ x: 0, y: 0 } !== dir) {
            this.cooldownTimer = this.cooldown;
            this.ammo--;
            var bulletLifespan = 0;
            if (this.bulletSpeed) {
                bulletLifespan = this.range / this.bulletSpeed;
            }
            var bullet =  new RocketBullet({
                dir: dir,
                pos: { x: obj.pos.x, y: obj.pos.y },
                lifespan: bulletLifespan,
                owner: obj.owner,
                damage: this.damage,
                speed: this.bulletSpeed
            });
            bullet.vel.x += obj.vel.x;
            bullet.vel.y += obj.vel.y;
            return bullet;
        }
    }
    return null;
};

module.exports = RocketWeapon;
