/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A game object that represents an explosion, using particles. Dies after
 * a timeout.
 */

define(function(require, exports, module) {
    var GameObject = require('obj/GameObject');

    /**
     * A constructor for explosion objects.
     */
    var Explosion = function(props) {
        props = props || {};
        props.updateOnGameOver = true;
        GameObject.prototype.constructor.call(this, props);
        this.numParticles = props.numParticles || 20;
        this.lifespan = props.lifespan || 20;
        this.blastRadius = props.blastRadius || 75;
        this._lifespanRemaining = this.lifespan;
        this._maxRadius = 25;
        this._maxVel = (this.blastRadius / this.lifespan) / 0.75;
        this._particles = [];
        for (var i = 0; i < this.numParticles; i++) {
            var angle = Math.random() * Math.PI * 2;
            var vel = (0.5 + (0.5 * Math.random())) * this._maxVel;
            var radius = (0.5 + (0.5 * Math.random())) * this._maxRadius;
            this._particles.push({
                pos: { x: 0, y: 0 },
                vel: { x: vel * Math.cos(angle), y: vel * Math.sin(angle) },
                radius: radius
            });
        }
    };

    // Extend GameObject
    Explosion.prototype = Object.create(GameObject.prototype);
    Explosion.prototype.constructor = Explosion;

    /**
     * @override {GameObject}
     * @return {Rectangle}
     */
    Explosion.bounds = function() {
        return { x: this.pos.x, y: this.pos.y, width: 1, height: 1 };
    };

    /**
     * Expands the explosion, setting alive to false if the animation has
     * ended so this object can be cleaned up.
     *
     * @override {GameObject}
     */
    Explosion.prototype.update = function() {
        for (var i = 0; i < this._particles.length; i++) {
            var particle = this._particles[i];
            particle.pos.x += particle.vel.x;
            particle.pos.y += particle.vel.y;
        }
        GameObject.prototype.update.call(this);
        this._lifespanRemaining--;
        if (this._lifespanRemaining <= 0) {
            this.alive = false;
        }
    };

    /**
     * @override {GameObject}
     * @param {CanvasRenderingContext2D} ctx
     */
    Explosion.prototype.draw = function(ctx) {
        var scale = this._lifespanRemaining / this.lifespan;
        for (var i = 0; i < this._particles.length; i++) {
            var particle = this._particles[i];
            var scaledRadius = particle.radius * scale;
            var grad = ctx.createRadialGradient(particle.pos.x,
                                                particle.pos.y,
                                                0,
                                                particle.pos.x,
                                                particle.pos.y,
                                                scaledRadius);
            grad.addColorStop(0.75 * scale, 'rgba(255, 255, 0, 1)');
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(particle.pos.x - scaledRadius,
                         particle.pos.y - scaledRadius,
                         scaledRadius * 2, scaledRadius * 2);
        }
    };

    module.exports = Explosion;
});
