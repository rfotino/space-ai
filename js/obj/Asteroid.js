/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for Asteroid objects. Asteroids make
 * good space obstacles.
 */

define(function(require, exports, module) {
    var physics = require('physics');
    var graphics = require('graphics');
    var GameObject = require('obj/GameObject');
    var Player = require('obj/Player');

    /**
     * A constructor for asteroids.
     */
    var Asteroid = function(props) {
        props = props || {};
        props.type = 'asteroid';
        GameObject.prototype.constructor.call(this, props);
        this.radius = props.radius || 50;
        // Procedurally create the asteroid's graphics
        this._outline = { points: [] };
        this._craters = [];
        this._generateGeometry();
    };

    // Extend GameObject
    Asteroid.prototype = Object.create(GameObject.prototype);
    Asteroid.prototype.constructor = Asteroid;

    /**
     * Generate the asteroid's geometry, used for rendering and collision
     * detection. Should only be called by the constructor.
     */
    Asteroid.prototype._generateGeometry = function() {
        // Create the outer polygon
        var numOuterPoints = Math.max(6, Math.sqrt(this.radius) * 1.5);
        var outerRange = Math.sqrt(this.radius) * 2;
        for (var i = 0; i < numOuterPoints; i++) {
            var pointAngle = (Math.PI * 2) * (i / numOuterPoints);
            var pointRadius = this.radius - (outerRange * Math.random());
            this._outline.points.push({
                x: pointRadius * Math.cos(pointAngle),
                y: pointRadius * Math.sin(pointAngle)
            });
        }
        // Create some craters
        var numCraters = (3 * Math.random()) + (0.25 * Math.sqrt(this.radius));
        for (var i = 0; i < numCraters; i++) {
            var crater = { points: [] };
            var craterAngle = Math.random() * Math.PI * 2;
            var craterDist = Math.random() * this.radius;
            var craterX = craterDist * Math.cos(craterAngle);
            var craterY = craterDist * Math.sin(craterAngle);
            var craterMultiplier = (0.75 * Math.random()) + 0.25;
            var craterRadius = 5 * Math.sqrt(this.radius) *
                ((0.75 * Math.random()) + 0.25);
            var numCraterPoints = Math.max(6, Math.sqrt(craterRadius) * 1.5);
            var craterRange = Math.sqrt(craterRadius) * 2;
            for (var j = 0; j < numCraterPoints; j++) {
                var pointAngle = (Math.PI * 2) * (j / numCraterPoints);
                var pointRadius = craterRadius - (craterRange * Math.random());
                crater.points.push({
                    x: craterX + (pointRadius * Math.cos(pointAngle)),
                    y: craterY + (pointRadius * Math.sin(pointAngle))
                });
            }
            crater.shadowOffset = {
                angle: Math.random() * Math.PI * 2,
                radius: 1 + (Math.sqrt(craterRadius) / 2)
            };
            this._craters.push(crater);
        }
    };

    /**
     * Kill the player if their ship comes into contact with the asteroid.
     *
     * @override {GameObject}
     * @param {GameObject} other
     */
    Asteroid.prototype.collide = function(other) {
        if ('player' === other.type) {
            other.health = 0;
        }
    };

    /**
     * @override {GameObject}
     * @param {CanvasRenderingContext2D} ctx
     */
    Asteroid.prototype.draw = function(ctx) {
        // Draw main polygon
        graphics.fillPoly(ctx, this._outline, '#553322');
        // Save the non-clipped context and then clip it to the outer polygon
        ctx.save();
        ctx.clip();
        // Draw craters, clipped to the outer polygon
        for (var i = 0; i < this._craters.length; i++) {
            var crater = this._craters[i];
            // Shift context and draw shadow
            ctx.save();
            ctx.translate(crater.shadowOffset.radius
                          * Math.cos(crater.shadowOffset.angle),
                          crater.shadowOffset.radius
                          * Math.sin(crater.shadowOffset.angle));
            graphics.fillPoly(ctx, crater, '#331700');
            ctx.restore();
            // Draw the crater
            graphics.fillPoly(ctx, crater, '#442211');
        }
        // Restore the non-clipped context
        ctx.restore();
    };

    /**
     * @override {GameObject}
     * @return {Polygon}
     */
    Asteroid.prototype.outline = function() {
        var transform = physics.getRotate(this.pos.angular,
                                          physics.getTranslate(this.pos.x,
                                                               this.pos.y));
        return { points: this._outline.points.map(transform) };
    };

    /**
     * @override {GameObject}
     * @return {Object}
     */
    Asteroid.prototype.getObj = function() {
        var obj = GameObject.prototype.getObj.call(this);
        return $.extend(obj, {
            radius: this.radius
        });
    };

    module.exports = Asteroid;
});
