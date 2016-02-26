/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for EnemyShip objects, which can
 * be either immobile or mobile, and can be equipped with weapons to fire
 * at the player.
 */

define(function(require, exports, module) {
    var GameObject = require('obj/GameObject');
    var EnemyTarget = require('obj/EnemyTarget');
    var LaserWeapon = require('obj/LaserWeapon');

    /**
     * A constructor for enemy ships.
     */
    var EnemyShip = function(props) {
        props.type = 'ship';
        props = props || {};
        EnemyTarget.prototype.constructor.call(this, props);
        this.range = props.range || 500;
        this.radius = props.radius || 50;
        this.weapon = props.weapon || new LaserWeapon();
        this.mobile = 'undefined' !== props.mobile ? props.mobile : false;
        this.zDepth = 60;
        // Used for spinning the ship's decorations
        this._spin = 0;
        this._spinVel = 0.02;
        this._numDecorations = 12;
    };

    // Extend GameObject
    EnemyShip.prototype = Object.create(EnemyTarget.prototype);
    EnemyShip.prototype.constructor = EnemyShip;

    /**
     * @override {GameObject}
     * @param {Object[]} objList
     */
    EnemyShip.prototype.update = function(objList) {
        // Update weapon, if equipped
        if (this.weapon) {
            this.weapon.update();
        }
        // If the player is in range, shoot at them
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
            dirVector.x += player.vel.x * dist / this.weapon.bulletSpeed;
            dirVector.y += player.vel.y * dist / this.weapon.bulletSpeed;
            if (dist <= this.range && this.weapon) {
                var bullet = this.weapon.getBullet(
                    { x: dirVector.x, y: dirVector.y },
                    { x: this.pos.x, y: this.pos.y },
                    'enemy');
                if (Array.isArray(bullet)) {
                    this.newObjects.push.apply(this.newObjects, bullet);
                } else if (null !== bullet) {
                    this.newObjects.push(bullet);
                }
            }
        }
        // Spin the ship's decorations
        this._spin += this._spinVel;
        // Call superclass's update function
        GameObject.prototype.update.call(this, objList);
    };

    /**
     * @override {Target}
     * @param {CanvasRenderingContext2D} ctx
     */
    EnemyShip.prototype.draw = function(ctx) {
        ctx.save();
        // Draw outer circle
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        // Draw cockpit
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius / 1.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(-0.1 * this.radius, 0.1 * this.radius,
                this.radius / 1.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius / 1.75, 0, Math.PI * 2);
        ctx.stroke();
        // Draw decorations
        var decRadius = this.radius / 10;
        var decPerimeter = this.radius - (2 * decRadius);
        for (var i = 0; i < this._numDecorations; i++) {
            var angle = this._spin + (i * Math.PI * 2 / this._numDecorations);
            ctx.fillStyle = '#f33';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(decPerimeter * Math.cos(angle),
                    decPerimeter * Math.sin(angle),
                    decRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    };

    module.exports = EnemyShip;
});
