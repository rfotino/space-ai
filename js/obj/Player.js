/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for Player objects.
 */

define(function(require, exports, module) {
    var physics = require('physics');
    var graphics = require('graphics');
    var GameObject = require('obj/GameObject');

    /**
     * A constructor for the player.
     */
    var Player = function(props) {
        props = props || {};
        props.type = 'player';
        GameObject.prototype.constructor.call(this, props);
        this.owner = 'player';
        this.weapons = props.weapons || [];
        this.equipped = props.equipped || null;
        this.health = props.health || 100;
        this.thrust = props.thrust || 0;
        this.thrustPower = props.thrustPower || 0;
        this.turnPower = props.turnPower || 0;
        this.fired = props.fired || false;
        this._generateGeometry();
    };

    // Extend GameObject
    Player.prototype = Object.create(GameObject.prototype);
    Player.prototype.constructor = Player;

    /**
     * Generate the ship's geometry, used for rendering and collision
     * detection. Should only be called by the constructor.
     */
    Player.prototype._generateGeometry = function() {
        var halfOutline = graphics.getQuadTo({ x: 0, y: -50 },
                                             { x: 13, y: -40 },
                                             { x: 15, y: 0 },
                                             10).concat([ { x: 12, y: 7 },
                                                          { x: 12, y: 10 } ]);
        var reflectYFunc = function(p) { return { x: -p.x, y: p.y }; };
        var otherHalfOutline = halfOutline.map(reflectYFunc).reverse();
        this._outline = { points: halfOutline.concat(otherHalfOutline) };
        this._drawPolys = [
            {
                color: '#aaa', // upper hull
                points: this._outline.points
            },
            {
                color: '#999', // lower hull
                points: [
                    { x: -15, y: 0 },
                    { x: 15, y: 0 },
                    { x: 12, y: 7 },
                    { x: -12, y: 7 }
                ]
            },
            {
                color: '#ddd', // exhaust port
                points: [
                    { x: -12, y: 7 },
                    { x: 12, y: 7 },
                    { x: 12, y: 10 },
                    { x: -12, y: 10 }
                ]
            }
        ];
        // Add the cockpit separately
        var halfCockpit = graphics.getQuadTo({ x: 0, y: -40 },
                                             { x: 5, y: -35 },
                                             { x: 6, y: -16 },
                                             5);
        var otherHalfCockpit = halfCockpit.map(reflectYFunc).reverse();
        this._drawPolys.push({
            color: '#0f9',
            points: halfCockpit.concat(otherHalfCockpit)
        });
        // Set up geometry and constants for the thrust flame
        this._flamePoly = { points: [
            { x: -10, y: 0 },
            { x: 10, y: 0 },
            { x: 0, y: 15 }
        ] };
        var bounds = physics.getPolyBounds(this._outline);
        this._flamePosY = bounds.y + bounds.height;
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
        // Update the player's weapons
        for (var i = 0; i < this.weapons.length; i++) {
            var weapon = this.weapons[i];
            weapon.update();
        }
        // Fire the player's weapon if it was fired and there is a weapon equipped
        if (this.fired && this.equipped) {
            for (var i = 0; i < this.weapons.length; i++) {
                var weapon = this.weapons[i];
                if (this.equipped === weapon.name) {
                    var bullet = weapon.getBullet(
                        { x: this.fired.x, y: this.fired.y },
                        { x: this.pos.x, y: this.pos.y },
                        'player');
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
        this.accel.x = this.thrust * Math.sin(this.pos.angular);
        this.accel.y = this.thrust * -Math.cos(this.pos.angular);
        // Update the game object
        GameObject.prototype.update.call(this);
    };

    /**
     * @override {GameObject}
     * @param {CanvasRenderingContext2D} ctx
     */
    Player.prototype.draw = function(ctx) {
        // Draw the polygons
        for (var i = 0; i < this._drawPolys.length; i++) {
            var poly = this._drawPolys[i];
            graphics.fillPoly(ctx, poly, poly.color);
        }
        // Draw the exhaust
        this._flameFlicker = (this._flameFlicker + 1) % this._flameFlickerMax;
        if (this._flameFlicker < this._flameFlickerThreshold) {
            var flameScale = {
                x: 0.5 + (this.thrustPower / 2),
                y: this.thrustPower
            };
            var translateTransform = physics.getTranslate(0, this._flamePosY);
            var transform = physics.getScale(flameScale, translateTransform);
            var flamePoly = { points: this._flamePoly.points.map(transform) };
            graphics.fillPoly(ctx, flamePoly, 'orange');
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
});
