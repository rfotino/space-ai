/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a LaserWeapon class that extends Weapon. This is
 * the basic in-game weapon type.
 */

var Weapon = require('./Weapon.js');
var LaserBullet = require('./LaserBullet.js');

/**
 * A constructor for a basic laser weapon.
 */
var LaserWeapon = function() {
    Weapon.prototype.constructor.call(this, {
        name: 'laser',
        damage: 5,
        bulletSpeed: 5,
        cooldown: 20
    });
};

// Extend Weapon
LaserWeapon.prototype = Object.create(Weapon.prototype);
LaserWeapon.prototype.constructor = LaserWeapon;

/**
 * If the cooldown is at zero, the weapon can fire again and returns a
 * bullet in the given direction, in the given position, with the given
 * owner.
 *
 * @override {Weapon}
 * @param {Point} dir
 * @param {Point} pos
 * @param {String} owner
 */
LaserWeapon.prototype.getBullet = function(dir, pos, owner) {
    if (this.cooldownTimer <= 0) {
        if ({ x: 0, y: 0 } !== dir) {
            this.cooldownTimer = this.cooldown;
            return new LaserBullet({
                dir: dir,
                pos: pos,
                owner: owner,
                damage: this.damage,
                speed: this.bulletSpeed
            });
        }
    }
    return null;
};

module.exports = LaserWeapon;
