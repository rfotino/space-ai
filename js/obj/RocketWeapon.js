/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a RocketWeapon class that extends Weapon. The
 * RocketWeapon has a limited amount of ammo, but more power than LaserWeapon.
 */

define(function(require, exports, module) {
    var Weapon = require('obj/Weapon');
    var RocketBullet = require('obj/RocketBullet');

    /**
     * A constructor for a rocket weapon.
     */
    var RocketWeapon = function(props) {
        props = props || {};
        Weapon.prototype.constructor.call(this, {
            name: 'rocket',
            ammo: props.ammo || 0,
            damage: 100,
            cooldown: 60
        });
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
     * @param {Point} pos
     * @param {String} owner
     */
    RocketWeapon.prototype.getBullet = function(dir, pos, owner) {
        if (this.cooldownTimer <= 0 && 0 < this.ammo) {
            if ({ x: 0, y: 0 } !== dir) {
                this.cooldownTimer = this.cooldown;
                this.ammo--;
                return new RocketBullet({
                    dir: dir,
                    pos: pos,
                    owner: owner,
                    damage: this.damage
                });
            }
        }
        return null;
    };

    module.exports = RocketWeapon;
});
