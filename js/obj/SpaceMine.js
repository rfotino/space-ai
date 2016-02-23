/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for SpaceMine objects, which accelerate
 * toward the player after they get within a certain proximity. They explode
 * on contact, damaging the player.
 */

define(function(require, exports, module) {
    var GameObject = require('obj/GameObject');
    var Explosion = require('obj/Explosion');

    /**
     * A constructor for space mines.
     */
    var SpaceMine = function(props) {
        props.type = 'mine';
        GameObject.prototype.constructor.call(this, props);
        this.radius = props.radius || 20;
        this.damage = props.damage || 25;
        this.proximity = props.proximity || 200;
    };

    // Extend GameObject
    SpaceMine.prototype = Object.create(GameObject.prototype);
    SpaceMine.prototype.constructor = SpaceMine;


    /**
     * If they are near enough, space mines accelerate toward the player.
     *
     * @override {GameObject}
     * @param {GameObject[]} objList
     */
    SpaceMine.prototype.update = function(objList) {
        var player = null;
        objList.forEach(function(obj) {
            if ('player' === obj.type) {
                player = obj;
            }
        });
        if (null === player) {
            return;
        }
        var dirVector = {
            x: player.pos.x - this.pos.x,
            y: player.pos.y - this.pos.y
        };
        var dist = Math.sqrt(Math.pow(dirVector.x, 2) +
                             Math.pow(dirVector.y, 2));
        if (0 === dist) {
            return;
        }
        var unitDirVector = {
            x: dirVector.x / dist,
            y: dirVector.y / dist
        };
        if (dist < this.proximity) {
            var speed = this.proximity / dist;
            this.vel.x = unitDirVector.x * speed;
            this.vel.y = unitDirVector.y * speed;
        }
        // Call parent update function
        GameObject.prototype.update.call(this, objList);
    };

    /**
     * Space mines explode on contact with the player.
     *
     * @override {GameObject}
     * @param {GameObject} other
     */
    SpaceMine.prototype.collide = function(other) {
        if ('player' === other.type ||
            'mine' === other.type) {
            this.newObjects.push(new Explosion({
                pos: { x: this.pos.x, y: this.pos.y },
                vel: { x: this.vel.x, y: this.vel.y }
            }));
            this.alive = false;
            if ('undefined' !== other.health) {
                other.health -= this.damage;
            }
        }
    };

    /**
     * @override {GameObject}
     * @param {CanvasRenderingContext2D} ctx
     */
    SpaceMine.prototype.draw = function(ctx) {
        ctx.save();
        ctx.fillStyle = '#666';
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    module.exports = SpaceMine;
});
