/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for a RocketBullet class, which is a
 * subclass of Bullet, fired from a RocketWeapon.
 */

define(function(require, exports, module) {
    var Bullet = require('obj/Bullet');
    var Explosion = require('obj/Explosion');

    /**
     * A constructor for a bullet fired from a RocketWeapon.
     */
    var RocketBullet = function(props) {
        props = props || {};
        props.speed = 5;
        props.weapon = 'rocket';
        props.lifespan = 180;
        Bullet.prototype.constructor.call(this, props);
        this.width = 8;
        this.height = 20;
    };

    // Extend Bullet
    RocketBullet.prototype = Object.create(Bullet.prototype);
    RocketBullet.prototype.constructor = RocketBullet;

    /**
     * Explode on impact.
     *
     * @override {Bullet}
     * @param {GameObject} other
     */
    RocketBullet.prototype.collide = function(other) {
        Bullet.prototype.collide.call(this, other);
        if (!this.alive) {
            this.newObjects.push(new Explosion({
                lifespan: 20,
                blastRadius: 25,
                pos: { x: this.pos.x, y: this.pos.y },
                vel: { x: this.vel.x, y: this.vel.y }
            }));
        }
    };

    /**
     * @override {GameObject}
     * @param {CanvasRenderingContext2D} ctx
     */
    RocketBullet.prototype.draw = function(ctx) {
        ctx.fillStyle = 'orange';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    };

    module.exports = RocketBullet;
});
