/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for SpaceMine objects, which accelerate
 * toward the player after they get within a certain range. They explode
 * on contact, damaging the player.
 */

define(function(require, exports, module) {
    var physics = require('physics');
    var graphics = require('graphics');
    var DestructibleTarget = require('obj/DestructibleTarget');
    var Explosion = require('obj/Explosion');

    /**
     * A constructor for space mines.
     */
    var SpaceMine = function(props) {
        props = props || {};
        props.type = 'mine';
        props.health = props.health || 1;
        props.radius = props.radius || 20;
        props.explosionLifespan = 20;
        props.objective = 'evade';
        DestructibleTarget.prototype.constructor.call(this, props);
        this.damage = props.damage || 25;
        this.range = props.range || 200;
        // Variables/constants used for decoration
        this._blinkCounter = 0;
        this._blinkThreshold = 7;
        this._blinkCounterMax = 10 * this._blinkThreshold;
        this._numSpikes = 20;
    };

    // Extend DestructibleTarget
    SpaceMine.prototype = Object.create(DestructibleTarget.prototype);
    SpaceMine.prototype.constructor = SpaceMine;

    /**
     * If they are near enough, space mines accelerate toward the player.
     *
     * @override {DestructibleTarget}
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
            if (dist < this.range) {
                var speed = this.range / dist;
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
        DestructibleTarget.prototype.update.call(this, objList);
    };

    /**
     * Space mines explode on contact with the player.
     *
     * @override {DestructibleTarget}
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
     * @override {DestructibleTarget}
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
     * @override {DestructibleTarget}
     * @return {Object}
     */
    SpaceMine.prototype.getObj = function() {
        var obj = DestructibleTarget.prototype.getObj.call(this);
        return $.extend(obj, {
            damage: this.damage,
            range: this.range
        });
    };

    module.exports = SpaceMine;
});
