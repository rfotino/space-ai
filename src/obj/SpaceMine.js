/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for SpaceMine objects, which accelerate
 * toward the player after they get within a certain range. They explode
 * on contact, damaging the player.
 */

var $ = require('../../lib/jquery/jquery.js');
var physics = require('../physics.js');
var graphics = require('../graphics.js');
var DestructibleTarget = require('./DestructibleTarget.js');

// Create a function for getting an array of prerendered enemy ship
// images. If the same radius is requested more than once, a cached
// copy is returned
var getSpaceMineImages;
(function() {
    var spaceMineImages = {};
    getSpaceMineImages = function(radius) {
        var key = radius.toString();
        if (!spaceMineImages.hasOwnProperty(key)) {
            // Draw the image without blink
            var canvas1 = document.createElement('canvas');
            canvas1.width = canvas1.height = Math.ceil(3 * radius);
            var ctx1 = canvas1.getContext('2d');
            ctx1.translate(canvas1.width / 2, canvas1.height / 2);
            // Draw body
            ctx1.fillStyle = '#666';
            ctx1.strokeStyle = '#999';
            ctx1.lineWidth = 2;
            ctx1.beginPath();
            ctx1.arc(0, 0, radius, 0, Math.PI * 2);
            ctx1.fill();
            ctx1.stroke();
            // Draw spikes
            ctx1.fillStyle = '#999';
            var spikePoints = [
                { x: radius, y: -radius / 10 },
                { x: radius * 1.5, y: 0 },
                { x: radius, y: radius / 10 }
            ];
            var numSpikes = 20; 
            for (var i = 0; i < numSpikes; i++) {
                var angle = i * Math.PI * 2 / numSpikes;
                var rotateFunc = physics.getRotate(angle);
                graphics.drawShape(ctx1,
                                   { points: spikePoints.map(rotateFunc) });
                ctx1.fill();
            }
            // Draw the image with blink
            var canvas2 = document.createElement('canvas');
            canvas2.width = canvas2.height = canvas1.width;
            var ctx2 = canvas2.getContext('2d');
            ctx2.drawImage(canvas1, 0, 0);
            ctx2.translate(canvas2.width / 2, canvas2.height / 2);
            ctx2.fillStyle = 'red';
            ctx2.beginPath();
            ctx2.arc(0, 0, radius / 2, 0, Math.PI * 2);
            ctx2.fill();
            // Add the two images to the cache
            spaceMineImages[key] = {
                noBlinkImage: canvas1,
                blinkImage: canvas2
            };
        }
        return spaceMineImages[key];
    };
})();

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
};

// Extend DestructibleTarget
SpaceMine.prototype = Object.create(DestructibleTarget.prototype);
SpaceMine.prototype.constructor = SpaceMine;

/**
 * If they are near enough, space mines accelerate toward the player.
 *
 * @override {DestructibleTarget}
 * @param {Object} player
 */
SpaceMine.prototype.update = function(player) {
    if (player) {
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
    DestructibleTarget.prototype.update.call(this);
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
    var mineImageObj = getSpaceMineImages(this.radius);
    if (this._blinkCounter < this._blinkThreshold) {
        ctx.drawImage(mineImageObj.blinkImage,
                      -mineImageObj.blinkImage.width / 2,
                      -mineImageObj.blinkImage.height / 2);
    } else {
        ctx.drawImage(mineImageObj.noBlinkImage,
                      -mineImageObj.noBlinkImage.width / 2,
                      -mineImageObj.noBlinkImage.height / 2);
    }
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
