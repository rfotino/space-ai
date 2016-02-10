/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for a RocketBullet class, which is a
 * subclass of Bullet, fired from a RocketWeapon.
 */

define(function(require, exports, module) {
    var Bullet = require('obj/Bullet');

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
     * @override {GameObject}
     * @param {CanvasRenderingContext2D} ctx
     */
    RocketBullet.prototype.draw = function(ctx) {
        ctx.fillStyle = 'orange';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    };

    module.exports = RocketBullet;
});
