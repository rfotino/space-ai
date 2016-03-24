/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a constructor for EnemyShip objects, which can
 * be either immobile or mobile, and can be equipped with weapons to fire
 * at the player.
 */

var $ = require('../../lib/jquery/jquery.js');
var physics = require('../physics.js');
var GameObject = require('./GameObject.js');
var EnemyTarget = require('./EnemyTarget.js');
var LaserWeapon = require('./LaserWeapon.js');

/**
 * A constructor for enemy ships.
 */
var EnemyShip = function(props) {
    props = props || {};
    props.type = 'ship';
    EnemyTarget.prototype.constructor.call(this, props);
    this.path = props.path || [ { x: this.pos.x, y: this.pos.y } ];
    this.chaseRange = props.chaseRange || 400;
    this.shootRange = Math.min(props.shootRange || 300, this.chaseRange);
    this.hoverRange = Math.min(props.hoverRange || 150, this.shootRange);
    this.radius = props.radius || 50;
    this.weapon = props.weapon || new LaserWeapon();
    this.zDepth = 60;
    this._maxPathAccel = 0.1;
    this._maxChaseAccel = 1;
    this._maxAccel = this._maxPathAccel;
    this._accelList = [];
    this._state = 'idle';
    // Used for spinning the ship's decorations
    this._spin = 0;
    this._spinVel = 0.02;
    this._numDecorations = 12;
};

// Extend EnemyTarget
EnemyShip.prototype = Object.create(EnemyTarget.prototype);
EnemyShip.prototype.constructor = EnemyShip;

/**
 * Updates the ship's acceleration to move along a path.
 */
EnemyShip.prototype._updatePath = function() {
    if ('undefined' === typeof this._pathDestIndex) {
        this._pathDestIndex = 0;
        this._pathElapsedDuration = 0;
    }
    var dest = this.path[this._pathDestIndex];
    dest.speed = dest.speed || 5;
    if (0 === this._pathElapsedDuration) {
        var dist = physics.dist(dest, this.pos);
        if (0 === dist) {
            this.accel.x = this.accel.y = 0;
            this._endAccelFrame =
                this._endCoastFrame =
                this._endDecelFrame = 0;
        } else {
            var dir = physics.unit(physics.dif(dest, this.pos));
            var accelFrames = Math.ceil(dest.speed / this._maxAccel);
            var accelDist = 0.5 * this._maxAccel * Math.pow(accelFrames, 2);
            var coastFrames = Math.ceil((dist - (2 * accelDist)) / dest.speed);
            if (coastFrames < 0) {
                coastFrames = 0;
                accelFrames = Math.sqrt(dist / this._maxAccel);
            }
            this._endAccelFrame = accelFrames;
            this._endCoastFrame = accelFrames + coastFrames;
            this._endDecelFrame = (2 * accelFrames) + coastFrames;
            this._pathAccel = physics.mul(this._maxAccel, dir);
        }
    }
    if (this._pathElapsedDuration < this._endAccelFrame) {
        this.accel.x = this._pathAccel.x;
        this.accel.y = this._pathAccel.y;
    } else if (this._pathElapsedDuration < this._endCoastFrame) {
        this.accel.x = this.accel.y = 0;
    } else if (this._pathElapsedDuration < this._endDecelFrame) {
        this.accel.x = -this._pathAccel.x;
        this.accel.y = -this._pathAccel.y;
    }
    this._pathElapsedDuration++;
    if (this._endDecelFrame <= this._pathElapsedDuration) {
        this._pathDestIndex = (this._pathDestIndex + 1) % this.path.length;
        this._pathElapsedDuration = 0;
    }
};

/**
 * Shoot at the given object.
 *
 * @param {Object} obj
 */
EnemyShip.prototype._shootObj = function(obj) {
    var dirVector = physics.dif(obj.pos, this.pos);
    var dist = physics.dist(dirVector);
    dirVector.x += obj.vel.x * dist / this.weapon.bulletSpeed;
    dirVector.y += obj.vel.y * dist / this.weapon.bulletSpeed;
    if (0 === dirVector.x && 0 === dirVector.y) {
        dirVector.x = 1;
    }
    if (dist <= this.shootRange && this.weapon) {
        var bullet = this.weapon.getBullet(dirVector, this);
        if (Array.isArray(bullet)) {
            this.newObjects.push.apply(this.newObjects, bullet);
        } else if (null !== bullet) {
            this.newObjects.push(bullet);
        }
    }
};

/**
 * Chase the object to get a better shot.
 *
 * @param {GameObject} obj
 */
EnemyShip.prototype._chaseObj = function(obj) {
    var dist = physics.dist(obj.pos, this.pos);
    if (dist <= this.chaseRange) {
        // Project a vector from obj out toward the enemy ship at
        // a distance of this.hoverRange from obj. This is the point
        // at which we want to hover and fire.
        var hoverPos =
            physics.sum(
                obj.pos,
                physics.mul(this.hoverRange,
                            physics.unit(physics.dif(this.pos, obj.pos))));
        var distToHover = physics.dist(this.pos, hoverPos);
        var speed = physics.dist(this.vel);
        var decelDist = Math.pow(speed, 2) / this._maxAccel;
        if (distToHover < decelDist) {
            // We need to slow down!
            this._slowDown();
        } else {
            // We need to speed up!
            var prefVel = physics.dif(hoverPos, this.pos);
            var prefAccel = physics.dif(prefVel, this.vel);
            var prefAccelDir = physics.unit(prefAccel);
            var accelMag = Math.min(this._maxAccel, physics.dist(prefAccel));
            this.accel.x = accelMag * prefAccelDir.x;
            this.accel.y = accelMag * prefAccelDir.y;
        }
    }
};

/**
 * Attempts to bring the ship to a halt.
 */
EnemyShip.prototype._slowDown = function() {
    var accelDir = physics.unit(physics.mul(-1, this.vel));
    var accelMag = Math.min(this._maxAccel, physics.dist(this.vel));
    this.accel.x = accelMag * accelDir.x;
    this.accel.y = accelMag * accelDir.y;
};

/**
 * @override {GameObject}
 * @param {Object[]} objList
 */
EnemyShip.prototype.update = function(objList) {
    // Update weapon, if equipped
    if (this.weapon) {
        this.weapon.update();
    }
    // Get the closest Player or FriendlyTarget
    var objToAttack = null;
    var objDist = Infinity;
    for (var i = 0; i < objList.length; i++) {
        var obj = objList[i];
        if ('player' === obj.type ||
            ('target' === obj.type && 'defend' === obj.objective)) {
            var dist = physics.dist(obj.pos, this.pos);
            if (dist < objDist) {
                objToAttack = obj;
                objDist = dist;
            }
        }
    }
    // Decide what to do based on the state
    var objInRange =
        null !== objToAttack &&
        objDist <= Math.max(this.shootRange, this.chaseRange);
    switch (this._state) {
    case 'idle':
        this._maxAccel = this._maxPathAccel;
        if (objInRange) {
            this._state = 'attacking';
        } else {
            this._updatePath();
        }
        break;
    case 'attacking':
        this._maxAccel = this._maxChaseAccel;
        if (objInRange) {
            this._shootObj(objToAttack);
            this._chaseObj(objToAttack);
        } else {
            this._state = 'returning';
        }
        break;
    case 'returning':
        this._maxAccel = this._maxChaseAccel;
        if (objInRange) {
            this._state = 'attacking';
        } else if (0 === this.vel.x && 0 === this.vel.y) {
            this._pathElapsedDuration = 0;
            this.accel.x = this.accel.y = 0;
            this._state = 'idle';
        } else {
            this._slowDown();
        }
        break;
    }
    // Spin the ship's decorations
    this._spin += this._spinVel;
    // Call superclass's update function
    GameObject.prototype.update.call(this);
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

/**
 * @override {EnemyTarget}
 * @return {Object}
 */
EnemyShip.prototype.getObj = function() {
    var obj = EnemyTarget.prototype.getObj.call(this);
    return $.extend(obj, {
        chaseRange: this.chaseRange,
        shootRange: this.shootRange,
        hoverRange: this.hoverRange,
        weapon: this.weapon.getObj()
    });
};

module.exports = EnemyShip;
