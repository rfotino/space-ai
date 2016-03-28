/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for Asteroid objects. Asteroids make
 * good space obstacles.
 */

var $ = require('../../lib/jquery/jquery.js');
var physics = require('../physics.js');
var graphics = require('../graphics.js');
var GameObject = require('./GameObject.js');

// Create functions implementing a cache of geometry of prerendered
// asteroids of a given radius
var getCachedGeometries,
    getRandomGeometry,
    addCachedGeometry,
    maxCachedGeometries = 20;
(function() {
    var cachedGeometries = {};
    getNumCachedGeometries = function(radius) {
        var key = radius.toString();
        if (!cachedGeometries.hasOwnProperty(key)) {
            cachedGeometries[key] = { mostRecent: null, geoms: [] };
        }
        return cachedGeometries[key].geoms.length;
    };
    getRandomCachedGeometry = function(radius) {
        var key = radius.toString();
        if (!cachedGeometries.hasOwnProperty(key)) {
            return null;
        }
        var cacheObj = cachedGeometries[key];
        var index;
        do {
            index = Math.floor(cacheObj.geoms.length * Math.random());
        } while (index === cacheObj.mostRecent);
        cacheObj.mostRecent = index;
        return cacheObj.geoms[index];
    };
    addCachedGeometry = function(radius, geometry) {
        var key = radius.toString();
        if (!cachedGeometries.hasOwnProperty(key)) {
            cachedGeometries[key] = { mostRecent: null, geoms: [] };
        }
        cachedGeometries[key].geoms.push(geometry);
    };
})();

/**
 * A constructor for asteroids.
 */
var Asteroid = function(props) {
    props = props || {};
    props.type = 'asteroid';
    GameObject.prototype.constructor.call(this, props);
    this.radius = props.radius || 50;
    this.zDepth = 25;
    var cachedGeoms = getNumCachedGeometries(this.radius);
    if (cachedGeoms < maxCachedGeometries) {
        this._generateGeometry();
        this._renderGeometry();
        addCachedGeometry(this.radius,
                          { outline: this._outline, ctx: this._ctx });
    } else {
        var geom = getRandomCachedGeometry(this.radius);
        this._outline = geom.outline;
        this._ctx = geom.ctx;
    }
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
    this._outline = { points: [] };
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
    this._craters = [];
    var numCraters = (3 * Math.random()) + (0.25 * Math.sqrt(this.radius));
    for (var i = 0; i < numCraters; i++) {
        var crater = { points: [] };
        var craterAngle = Math.random() * Math.PI * 2;
        var craterDist = Math.random() * this.radius;
        var craterX = craterDist * Math.cos(craterAngle);
        var craterY = craterDist * Math.sin(craterAngle);
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
 * Creates an offscreen canvas and renders the geometry of the asteroid to
 * the canvas, where its cached contents can be used later. Shoud only be
 * called by the constructor.
 */
Asteroid.prototype._renderGeometry = function() {
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = this.radius * 2;
    this._ctx = canvas.getContext('2d');
    this._ctx.translate(this.radius, this.radius);
    // Draw main polygon
    this._ctx.fillStyle = '#553322';
    graphics.drawShape(this._ctx, this._outline);
    this._ctx.fill();
    // Save the non-clipped context and then clip it to the outer polygon
    this._ctx.save();
    this._ctx.clip();
    // Draw craters, clipped to the outer polygon
    for (var i = 0; i < this._craters.length; i++) {
        var crater = this._craters[i];
        // Shift context and draw shadow
        this._ctx.save();
        this._ctx.translate(crater.shadowOffset.radius
                      * Math.cos(crater.shadowOffset.angle),
                      crater.shadowOffset.radius
                      * Math.sin(crater.shadowOffset.angle));
        this._ctx.fillStyle = '#331700';
        graphics.drawShape(this._ctx, crater);
        this._ctx.fill();
        this._ctx.restore();
        // Draw the crater
        this._ctx.fillStyle = '#442211';
        graphics.drawShape(this._ctx, crater);
        this._ctx.fill();
    }
    // Restore the non-clipped context
    this._ctx.restore();
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
    ctx.drawImage(this._ctx.canvas, -this.radius, -this.radius);
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
