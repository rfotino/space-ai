/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for an abstract Bullet class.
 */

define(function(require, exports, module) {
    var GameObject = require('obj/GameObject');

    /**
     * A constructor for an abstract bullet fired from a Weapon object.
     */
    var Bullet = function(props) {
        props = props || {};
        props.type = 'bullet';
        // Get direction of bullet, if set
        var dir = props.dir || { x: 0, y: 0 };
        dir.x = dir.x || 0;
        dir.y = dir.y || 0;
        if ({ x: 0, y: 0 } !== dir) {
            // Turn the direction into a unit vector
            var magnitude = Math.sqrt(Math.pow(dir.x, 2) + Math.pow(dir.y, 2));
            dir.x /= magnitude;
            dir.y /= magnitude;
            // Multiply the direction by the speed to get the velocity
            var speed = props.speed || 0;
            var rotation = Math.atan2(dir.x, -dir.y);
            props.pos = props.pos || {};
            props.pos.angular = Math.atan2(dir.x, -dir.y);
            props.vel = props.vel || {};
            props.vel.x = speed * dir.x;
            props.vel.y = speed * dir.y;
        }
        GameObject.prototype.constructor.call(this, props);
        this.damage = props.damage || 0;
        this.weapon = props.weapon || '';
        this.lifespan = props.lifespan || 0;
        this.owner = props.owner || null;
    };

    // Extend GameObject
    Bullet.prototype = Object.create(GameObject.prototype);
    Bullet.prototype.constructor = Bullet;

    /**
     * If bullets hit objects that have health and a different owner, they
     * damage the health and disappear.
     *
     * @override {GameObject}
     * @param {GameObject} other
     */
    Bullet.prototype.collide = function(other) {
        if (other.owner !== this.owner && other.hasOwnProperty('health')) {
            other.health -= this.damage;
            this.alive = false;
        }
    };

    /**
     * To prevent bullets from hanging around too long and hogging memory,
     * they are removed after a certain lifespan.
     *
     * @override {GameObject}
     */
    Bullet.prototype.update = function() {
        // If this bullet has been in the scene for too many ticks,
        // set its alive flag to false
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.alive = false;
        }
        // Call parent update function
        GameObject.prototype.update.call(this);
    };

    /**
     * @override {GameObject}
     * @return {Object}
     */
    Bullet.prototype.getObj = function() {
        var obj = GameObject.prototype.getObj.call(this);
        return $.extend(obj, {
            damage: this.damage,
            weapon: this.weapon
        });
    };

    module.exports = Bullet;
});
