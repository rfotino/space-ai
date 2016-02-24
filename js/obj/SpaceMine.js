/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for SpaceMine objects, which accelerate
 * toward the player after they get within a certain proximity. They explode
 * on contact, damaging the player.
 */

define(function(require, exports, module) {
    var physics = require('physics');
    var graphics = require('graphics');
    var GameObject = require('obj/GameObject');
    var Explosion = require('obj/Explosion');

    /**
     * A constructor for space mines.
     */
    var SpaceMine = function(props) {
        props = props || {};
        props.type = 'mine';
        GameObject.prototype.constructor.call(this, props);
        this.radius = props.radius || 20;
        this.damage = props.damage || 25;
        this.proximity = props.proximity || 200;
        this._health = props.health || 1;
        this._blinkCounter = 0;
        this._blinkThreshold = 7;
        this._blinkCounterMax = 10 * this._blinkThreshold;
        this._numSpikes = 20;
    };

    // Extend GameObject
    SpaceMine.prototype = Object.create(GameObject.prototype);
    SpaceMine.prototype.constructor = SpaceMine;

    /**
     * Explode when health drops to zero.
     */
    Object.defineProperty(SpaceMine.prototype, 'health', {
        get: function health() {
            return this._health;
        },
        set: function health(h) {
            this._health = h;
            if (this._health <= 0) {
                this.newObjects.push(new Explosion({
                    pos: { x: this.pos.x, y: this.pos.y },
                    vel: { x: this.vel.x, y: this.vel.y }
                }));
                this.alive = false;
            }
        }
    });

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
        if (null !== player) {
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
                this._blinkCounterMax = 2 * this._blinkThreshold;
            } else {
                this._blinkCounterMax = 10 * this._blinkThreshold;
            }
        }
        this._blinkCounter++;
        if (this._blinkCounterMax < this._blinkCounter) {
            this._blinkCounter = 0;
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
            'mine' === other.type ||
            'asteroid' === other.type ||
            'target' === other.type) {
            this.health = 0;
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
        // Draw body
        ctx.fillStyle = '#666';
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Draw spikes
        ctx.fillStyle = '#999';
        var spikePoints = [
            { x: this.radius, y: -2 },
            { x: this.radius * 1.5, y: 0 },
            { x: this.radius, y: 2 }
        ];
        for (var i = 0; i < this._numSpikes; i++) {
            var angle = i * Math.PI * 2 / this._numSpikes;
            var rotateFunc = physics.getRotate(angle);
            graphics.drawShape(ctx, { points: spikePoints.map(rotateFunc) });
            ctx.fill();
        }
        //Maybe draw blinker
        if (this._blinkCounter < this._blinkThreshold) {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    };

    /**
     * @override {GameObject}
     * @return {Object}
     */
    SpaceMine.prototype.getObj = function() {
        var obj = GameObject.prototype.getObj.call(this);
        return $.extend(obj, {
            radius: this.radius,
            health: this.health,
            damage: this.damage,
            proximity: this.proximity
        });
    };

    module.exports = SpaceMine;
});
