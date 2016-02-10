/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for an abstract Weapon class, to
 * be wielded by the player, enemies or allies in-game.
 */

define(function(require, exports, module) {
    /**
     * An constructor for weapons.
     */
    var Weapon = function(props) {
        props = props || {};
        this.name = props.name || '';
        this.damage = props.damage || 0;
        this.ammo = props.ammo || null;
        this.cooldown = props.cooldown || 0;
        this.cooldownTimer = 0;
    };

    /**
     * The default getBullet function, this should be overridden by subclasses
     * to provide a bullet in the given direction dir, starting at the given
     * position pos, with the given owner (the owner is used for preventing
     * friendly fire).
     *
     * @param {Point} dir
     * @param {Point} pos
     * @param {String} owner
     * @return {Bullet}
     */
    Weapon.prototype.getBullet = function(dir, pos, owner) { return null; };

    /**
     * The update function called once per frame, by default this just
     * decrements the weapon's cooldown timer which dictates how frequently
     * it can fire.
     */
    Weapon.prototype.update = function() {
        this.cooldownTimer = Math.max(this.cooldownTimer - 1, 0);
    };

    /**
     * Returns an object filled with attributes of the weapon that are exposed
     * to user code.
     *
     * @return {Object}
     */
    Weapon.prototype.getObj = function() {
        return {
            name: this.name,
            damage: this.damage,
            ammo: this.ammo,
            cooldown: this.cooldown,
            cooldownTimer: this.cooldownTimer
        };
    };

    module.exports = Weapon;
});
