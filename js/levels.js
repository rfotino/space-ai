/**
 * Copyright (c) 2015 Robert Fotino.
 */

function Level(initial) {
    this._initial = initial;
}

// Get all game objects in an array
Level.prototype._getObjects = function() {
    if (this._state) {
        return Array.prototype.concat([ this._state.player ],
                                      this._state.asteroids,
                                      this._state.targets);
    } else {
        return [ ];
    }
};

// Initialize the state to start the level
Level.prototype.init = function() {
    // Deep copy the state from the initial level objects
    this._state = $.extend(true, {}, this._initial);
    // Make sure every object has certain properties
    var objects = this._getObjects();
    for (var i = 0; i < objects.length; i++) {
        var defaults = {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            rotation: 0,
            angularVelocity: 0,
            angularAcceleration: 0
        };
        var obj = objects[i];
        $.extend(obj, $.extend(defaults, obj));
    }
    // Make sure the asteroids have certain properties
    for (var i = 0; i < this._state.asteroids.length; i++) {
        var defaults = {
            radius: 75
        };
        var asteroid = this._state.asteroids[i];
        $.extend(asteroid, $.extend(defaults, asteroid));
    }
    // Make sure the targets have certain properties
    for (var i = 0; i < this._state.targets.length; i++) {
        var defaults = {
            radius: 30
        };
        var target = this._state.targets[i];
        $.extend(target, $.extend(defaults, target));
    }
};

// Update the positions and velocities of game objects
Level.prototype.update = function() {
    var objects = this._getObjects();
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        obj.velocity.x += obj.acceleration.x;
        obj.velocity.y += obj.acceleration.y;
        obj.position.x += obj.velocity.x;
        obj.position.y += obj.velocity.y;
        obj.angularVelocity += obj.angularAcceleration;
        obj.rotation += obj.angularVelocity;
    }
};

// Draw the game objects on screen
Level.prototype.draw = function(ctx) {
    // Clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Make a function to easily draw rotated/scaled/translated objects
    var drawObj = function(cb, dx, dy, theta, scalex, scaley) {
        if (dx === undefined) { dx = 0; }
        if (dy === undefined) { dy = 0; }
        if (theta === undefined) { theta = 0; }
        if (scalex === undefined) { scalex = 1; }
        if (scaley === undefined) { scaley = 1; }
        ctx.save();
        ctx.translate(dx + (ctx.canvas.width / 2),
                      dy + (ctx.canvas.height / 2));
        ctx.rotate(theta);
        ctx.scale(scalex, scaley);
        cb();
        ctx.restore();
    };
    // Draw the asteroids
    for (var i = 0; i < this._state.asteroids.length; i++) {
        var asteroid = this._state.asteroids[i];
        drawObj(function() {
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(0, 0, asteroid.radius, 0, Math.PI * 2);
            ctx.fill();
        }, asteroid.position.x, asteroid.position.y);
    }
    // Draw the targets
    for (var i = 0; i < this._state.targets.length; i++) {
        var target = this._state.targets[i];
        drawObj(function() {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
            ctx.fill();
        }, target.position.x, target.position.y);
    }
    // Draw the player
    var player = this._state.player;
    drawObj(function() {
        ctx.fillStyle = 'green';
        ctx.fillRect(-10, -20, 20, 40);
    }, player.position.x, player.position.y, player.rotation);
};
