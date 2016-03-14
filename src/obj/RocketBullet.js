/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for a RocketBullet class, which is a
 * subclass of Bullet, fired from a RocketWeapon.
 */

var graphics = require('../graphics.js');
var physics = require('../physics.js');
var Bullet = require('./Bullet.js');
var Explosion = require('./Explosion.js');

/**
 * A constructor for a bullet fired from a RocketWeapon.
 */
var RocketBullet = function(props) {
    props = props || {};
    props.weapon = 'rocket';
    Bullet.prototype.constructor.call(this, props);
    this.width = 20;
    this.height = 8;
    this._generateGeometry();
};

// Extend Bullet
RocketBullet.prototype = Object.create(Bullet.prototype);
RocketBullet.prototype.constructor = RocketBullet;

/**
 * Generate the rocket's geometry, used for rendering and collision
 * detection. Should only be called by the constructor.
 */
RocketBullet.prototype._generateGeometry = function() {
    this._outline = { points: [].concat(
        [ { x: -this.width / 2, y: this.height / 2 } ],
        graphics.getQuadTo(
            { x: this.width / 2, y: this.height / 2 },
            { x: this.width * 0.85, y: 0 },
            { x: this.width / 2, y: -this.height / 2 },
            5
        ),
        [ { x: -this.width / 2, y: -this.height / 2 } ]
    ) };
    this._flameOutline = { points: [
        { x: -this.width / 2, y: -this.height * 2 / 5 },
        { x: -this.width / 2, y: this.height * 2 / 5 },
        { x: -this.width * 0.7, y: 0 }
    ] };
};

/**
 * Explode on impact.
 *
 * @override {Bullet}
 * @param {GameObject} other
 */
RocketBullet.prototype.collide = function(other) {
    Bullet.prototype.collide.call(this, other);
    if (!this.alive) {
        this.newObjects.push(new Explosion({
            lifespan: 20,
            blastRadius: 25,
            pos: { x: this.pos.x, y: this.pos.y },
            vel: { x: this.vel.x, y: this.vel.y }
        }));
    }
};

/**
 * @override {GameObject}
 * @param {CanvasRenderingContext2D} ctx
 */
RocketBullet.prototype.draw = function(ctx) {
    ctx.save();
    ctx.fillStyle = '#ccc';
    graphics.drawShape(ctx, this._outline);
    ctx.fill();
    ctx.fillStyle = '#999';
    ctx.fillRect(-this.width / 2, -this.height / 2, 2, this.height);
    ctx.fillStyle = 'orange';
    graphics.drawShape(ctx, this._flameOutline);
    ctx.fill();
    ctx.restore();
};

/**
 * @override {GameObject}
 * @return {Rectangle}
 */
RocketBullet.prototype.bounds = function() {
    return physics.getPolyBounds(this.outline());
};

/**
 * @override {GameObject}
 * @return {Polygon}
 */
RocketBullet.prototype.outline = function() {
    var transform = physics.getRotate(this.pos.angular,
                                      physics.getTranslate(this.pos.x,
                                                           this.pos.y));
    return { points: this._outline.points.map(transform) };
};

module.exports = RocketBullet;
