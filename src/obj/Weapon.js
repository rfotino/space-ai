/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for an abstract Weapon class, to
 * be wielded by the player, enemies or allies in-game.
 */

/**
 * An constructor for weapons.
 */
var Weapon = function(props) {
    props = props || {};
    this.name = props.name || '';
    this.damage = props.damage || 0;
    this.ammo = props.ammo || null;
    this.bulletSpeed = props.bulletSpeed || 0;
    this.range = props.range || 0;
    this.cooldown = props.cooldown || 0;
    this.cooldownTimer = 0;
};

/**
 * The default getBullet function, this should be overridden by subclasses
 * to provide a bullet in the given direction dir, fired from the given object
 * obj (used for position, velocity, preventing friendly fire, etc).
 *
 * @param {Point} dir
 * @param {GameObject} obj
 * @return {Bullet}
 */
Weapon.prototype.getBullet = function(dir, obj) { return null; };

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
        range: this.range,
        speed: this.bulletSpeed,
        cooldown: this.cooldown,
        cooldownTimer: this.cooldownTimer
    };
};

module.exports = Weapon;
