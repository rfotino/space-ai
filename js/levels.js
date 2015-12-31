/**
 * Copyright (c) 2015 Robert Fotino.
 */

/**
 * Creates a game level from some initial state.
 */
function Level(initial) {
    this._initial = initial;
    // Make sure there are certain properties like a player object,
    // an object array, a win condition, etc.
    if (typeof this._initial.player === 'undefined') {
        this._initial.player = {};
    }
    if (typeof this._initial.objects === 'undefined') {
        this._initial.objects = [];
    }
    if (typeof this._initial.win === 'undefined') {
        this._initial.win = '';
    }
}

// Initialize the state to start the level
Level.prototype.init = function() {
    // Deep copy the state from the initial level objects
    this._state = $.extend(true, {}, this._initial);
    // Make sure every object has certain properties
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        var defaults = {
            pos: { x: 0, y: 0, angular: 0 },
            vel: { x: 0, y: 0, angular: 0 },
            accel: { x: 0, y: 0, angular: 0 }
        };
        // Give specific properties based on object type
        switch (obj.type) {
        case 'asteroid':
            defaults.radius = 75;
            break;
        case 'target':
            defaults.radius = 30;
            defaults.objective = 'reach';
            break;
        }
        $.extend(true, obj, $.extend(true, defaults, obj));
    }
    // Make sure the player has certain properties
    var defaults = {
        width: 20,
        height: 40,
        pos: { x: 0, y: 0, angular: 0 },
        vel: { x: 0, y: 0, angular: 0 },
        accel: { x: 0, y: 0, angular: 0 },
        thrust: 0,
        thrustPower: 0,
        turnPower: 0,
        weapons: [],
        equipped: null,
        fired: false
    };
    var player = this._state.player;
    $.extend(true, player, $.extend(true, defaults, player));
};

// Update the positions and velocities of game objects
Level.prototype.update = function() {
    var player = this._state.player;
    // Fire the player's weapon if it was fired and there is a weapon equipped
    if (player.fired && player.equipped) {
        for (var i = 0; i < player.weapons.length; i++) {
            var weapon = player.weapons[i];
            if (player.equipped === weapon.name) {
                weapon.fire(player.fired.x, player.fired.y);
            }
        }
    }
    player.fired = false;
    // Calculate the player's acceleration from thrust and rotation
    player.accel.x = player.thrust * Math.sin(player.pos.angular);
    player.accel.y = player.thrust * -Math.cos(player.pos.angular);
    // A function to update an object's velocity and position
    function updateObj(obj) {
        obj.vel.x += obj.accel.x;
        obj.vel.y += obj.accel.y;
        obj.vel.angular += obj.accel.angular;
        obj.pos.x += obj.vel.x;
        obj.pos.y += obj.vel.y;
        obj.pos.angular += obj.vel.angular;
    }
    // Update the velocity/position of all game objects
    updateObj(player);
    for (var i = 0; i < this._state.objects.length; i++) {
        updateObj(this._state.objects[i]);
    }
    // TODO: collision detection + checking win conditions
};

// Draw the game objects on screen
Level.prototype.draw = function(ctx) {
    var player = this._state.player;
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
        ctx.translate(dx - player.pos.x + (ctx.canvas.width / 2),
                      dy - player.pos.y + (ctx.canvas.height / 2));
        ctx.rotate(theta);
        ctx.scale(scalex, scaley);
        cb();
        ctx.restore();
    };
    // Draw the game objects
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        var drawFunc;
        switch (obj.type) {
        case 'asteroid':
            drawFunc = function() {
                ctx.fillStyle = 'blue';
                ctx.beginPath();
                ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
                ctx.fill();
            };
            break;
        case 'target':
            drawFunc = function() {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
                ctx.fill();
            };
            break;
        }
        drawObj(drawFunc, obj.pos.x, obj.pos.y, obj.pos.angular);
    }
    // Draw the player
    drawObj(function() {
        ctx.fillStyle = 'green';
        ctx.fillRect(-player.width / 2, -player.height / 2,
                     player.width, player.height);
    }, player.pos.x, player.pos.y, player.pos.angular);
};

// Gets the state of the game world
Level.prototype.getWorld = function() {
    // Strip functions by doing a deep copy to and from JSON. We can't
    // do worker.postMessage() on an object with functions
    return JSON.parse(JSON.stringify(this._state));
};

// Sets the state of the game world
Level.prototype.setWorld = function(world) {
    // Anything changed in the world should be reflected in the game state,
    // but we don't want to clear out functions, so we extend.
    $.extend(true, this._state, world);
};

// A sample level, can be loaded with game.load(level1)
var level1 = new Level({
    player: {
        equipped: 'laser',
        weapons: [
            {
                name: 'laser',
                damage: 5,
                fire: function(x, y) {
                    // TODO: implement laser firing function
                }
            },
            {
                name: 'rocket',
                ammo: 3,
                damage: 50,
                fire: function(x, y) {
                    // TODO: implement rocket firing function
                }
            }
        ]
    },
    objects: [
        {
            type: 'asteroid',
            pos: { x: -300, y: -100 },
            radius: 100
        },
        {
            type: 'target',
            name: 'target1',
            objective: 'reach',
            pos: { x: 0, y: -100 }
        }
    ]
});
