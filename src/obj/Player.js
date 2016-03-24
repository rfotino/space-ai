/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for Player objects.
 */

var $ = require('../../lib/jquery/jquery.js');
var physics = require('../physics.js');
var graphics = require('../graphics.js');
var GameObject = require('./GameObject.js');
var Explosion = require('./Explosion.js');

/**
 * A constructor for the player.
 */
var Player = function(props) {
    props = props || {};
    props.type = 'player';
    GameObject.prototype.constructor.call(this, props);
    this.owner = 'player';
    this.zDepth = 75;
    this.weapons = props.weapons || [];
    this.equipped = props.equipped || null;
    this._health = props.health || 100;
    this.thrust = props.thrust || 0;
    this.thrustPower = props.thrustPower || 0;
    this.turnPower = props.turnPower || 0;
    this.fired = props.fired || false;
    this._generateGeometry();
};

// Extend GameObject
Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = Player

/**
 * Explode when health drops to zero.
 */
Object.defineProperty(Player.prototype, 'health', {
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
 * Generate the ship's geometry, used for rendering and collision
 * detection. Should only be called by the constructor.
 */
Player.prototype._generateGeometry = function() {
    var reflectXFunc = function(p) { return { x: p.x, y: -p.y }; };
    var halfOutline = graphics.getQuadTo({ x: 30, y: 0 },
                                         { x: 25, y: 8 },
                                         { x: 15, y: 10 },
                                         7).concat([ { x: -25, y: 10 } ]);
    var otherHalfOutline = halfOutline.map(reflectXFunc).reverse();
    this._outline = { points: halfOutline.concat(otherHalfOutline) };
    var leftFin = [
        { x: -8, y: 9 },
        { x: -20, y: 15 },
        { x: -30, y: 15 },
        { x: -25, y: 10 }
    ];
    var middleFin = [
        { x: -10, y: 1 },
        { x: -30, y: 1 },
        { x: -30, y: -1 },
        { x: -10, y: -1 }
    ];
    var detailColor = '#06f';
    this._drawPolys = [ {
            color: detailColor, // left fin
            points: leftFin
        }, {
            color: detailColor, // right fin
            points: leftFin.map(reflectXFunc)
        }, {
            color: '#ccc', // upper hull
            points: this._outline.points
        }, {
            color: detailColor, // middle fin
            points: middleFin
        }, {
            color: detailColor, // cockpit
            x: 15,
            y: 0,
            radius: 5
        }
    ];
    // Set up geometry and constants for the thrust flame
    this._flamePoly = { points: [
        { x: 0, y: -9 },
        { x: 0, y: 9 },
        { x: -15, y: 0 }
    ] };
    this._flamePosX = -24;
    this._flameFlicker = 0;
    this._flameFlickerThreshold = 6;
    this._flameFlickerMax = 8;
};

/**
 * Updates the player by firing weapons, setting acceleration based on
 * thrust, etc.
 *
 * @override {GameObject}
 */
Player.prototype.update = function() {
    // Update the game object
    GameObject.prototype.update.call(this);
    // Update the player's weapons
    for (var i = 0; i < this.weapons.length; i++) {
        var weapon = this.weapons[i];
        weapon.update();
    }
    // Fire the player's weapon if it was fired and there is a weapon
    // equipped
    if (this.fired && this.equipped) {
        for (var i = 0; i < this.weapons.length; i++) {
            var weapon = this.weapons[i];
            if (this.equipped === weapon.name) {
                var bullet = weapon.getBullet(
                    { x: this.fired.x, y: this.fired.y },
                    this);
                if (Array.isArray(bullet)) {
                    this.newObjects.push.apply(this.newObjects, bullet);
                } else if (null !== bullet) {
                    this.newObjects.push(bullet);
                }
            }
        }
    }
    // Reset the player's fired flag
    this.fired = false;
    // Calculate the player's acceleration from thrust and rotation
    this.accel.x = this.thrust * Math.cos(this.pos.angular);
    this.accel.y = this.thrust * Math.sin(this.pos.angular);
    // Update the exhaust flicker counter
    this._flameFlicker = (this._flameFlicker + 1) % this._flameFlickerMax;
};

/**
 * @override {GameObject}
 * @param {CanvasRenderingContext2D} ctx
 */
Player.prototype.draw = function(ctx) {
    // Draw the exhaust
    if (this._flameFlicker < this._flameFlickerThreshold && this.thrustPower) {
        var flameScale = {
            x: 0.25 + (0.75 * this.thrustPower),
            y: 0.5 + (0.5 * this.thrustPower)
        };
        var translateTransform = physics.getTranslate(this._flamePosX, 0);
        var transform = physics.getScale(flameScale, translateTransform);
        var flamePoly = { points: this._flamePoly.points.map(transform) };
        ctx.fillStyle = 'orange';
        graphics.drawShape(ctx, flamePoly);
        ctx.fill();
    }
    // Draw the polygons
    for (var i = 0; i < this._drawPolys.length; i++) {
        var poly = this._drawPolys[i];
        ctx.fillStyle = poly.color;
        graphics.drawShape(ctx, poly);
        ctx.fill();
    }
};

/**
 * @override {GameObject}
 * @return {Rectangle}
 */
Player.prototype.bounds = function() {
    return physics.getPolyBounds(this.outline());
};

/**
 * @override {GameObject}
 * @return {Polygon}
 */
Player.prototype.outline = function() {
    var transform = physics.getRotate(this.pos.angular,
                                      physics.getTranslate(this.pos.x,
                                                           this.pos.y));
    return { points: this._outline.points.map(transform) };
};

/**
 * @override {GameObject}
 * @return {Object}
 */
Player.prototype.getObj = function() {
    var obj = GameObject.prototype.getObj.call(this);
    return $.extend(obj, {
        weapons: this.weapons.map(function(weap) { return weap.getObj(); }),
        equipped: this.equipped,
        health: this.health,
        thrust: this.thrust,
        thrustPower: this.thrustPower,
        turnPower: this.turnPower,
        fired: this.fired,
        bounds: this.bounds()
    });
};

module.exports = Player;
