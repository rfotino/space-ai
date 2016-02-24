/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for Target objects. A target is an
 * in-game object that usually carries with it a win or lose condition --
 * that is, if the target's 'win' attribute is set to true and it is completed,
 * the player wins. If the target's 'lose' attribute is set to true and it is
 * completed, the player loses.
 */

define(function(require, exports, module) {
    var GameObject = require('obj/GameObject');

    /**
     * A constructor for abstract Target objects.
     */
    var Target = function(props) {
        props = props || {};
        props.type = 'target';
        GameObject.prototype.constructor.call(this, props);
        this.name = props.name || '';
        this.objective = props.objective || null;
        this.radius = props.radius || 50;
        this.win = 'undefined' === typeof props.win ? false : props.win;
        this.lose = 'undefined' === typeof props.lose ? false : props.lose;
    };

    // Extend GameObject
    Target.prototype = Object.create(GameObject.prototype);
    Target.prototype.constructor = Target;

    /**
     * The default function for targets, takes in the player and returns
     * true if they have completed this target.
     *
     * @param {Player} player
     * @return {Boolean}
     */
    Target.prototype.complete = function(player) { return false; }

    /**
     * @override {GameObject}
     * @return {Object}
     */
    Target.prototype.getObj = function() {
        var obj = GameObject.prototype.getObj.call(this);
        return $.extend(obj, {
            objective: this.objective,
            radius: this.radius,
            win: this.win,
            lose: this.lose
        });
    };

    /**
     * @override {GameObject}
     * @param {CanvasRenderingContext2D} ctx
     */
    Target.prototype.draw = function(ctx) {
        // Draw the fill
        ctx.fillStyle = this._fillStyle;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        // Draw the outline
        ctx.strokeStyle = this._strokeStyle;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - (ctx.lineWidth / 2), 0, Math.PI * 2);
        ctx.stroke();
    };

    module.exports = Target;
});
