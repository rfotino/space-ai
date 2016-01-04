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
}

// Initialize the state to start the level
Level.prototype.init = function() {
    // Deep copy the state from the initial level objects
    this._state = $.extend(true, {}, this._initial);
    // Make sure every object has the correct properties
    // Temporarily add the player to the object array
    this._state.player.type = 'player';
    this._state.objects.push(this._state.player);
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        var defaults = {
            pos: { x: 0, y: 0, angular: 0 },
            vel: { x: 0, y: 0, angular: 0 },
            accel: { x: 0, y: 0, angular: 0 },
            update: function() {
                this.vel.x += this.accel.x;
                this.vel.y += this.accel.y;
                this.vel.angular += this.accel.angular;
                this.pos.x += this.vel.x;
                this.pos.y += this.vel.y;
                this.pos.angular += this.vel.angular;
            },
            collide: function(other, result) { }
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
        case 'player':
            defaults.width = 20;
            defaults.height = 40;
            defaults.thrust = 0;
            defaults.thrustPower = 0;
            defaults.turnPower = 0;
            defaults.health = 100;
            defaults.weapons = [];
            defaults.equipped = null;
            defaults.fired = false;
            break;
        }
        $.extend(true, obj, $.extend(true, defaults, obj));
    }
    // Remove the temporarily added player from the object list
    this._state.objects.pop();
};

// Update all game objects, do collision detection, and check win conditions
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
    // Reset the player's fired flag
    player.fired = false;
    // Calculate the player's acceleration from thrust and rotation
    player.accel.x = player.thrust * Math.sin(player.pos.angular);
    player.accel.y = player.thrust * -Math.cos(player.pos.angular);
    // Update all game objects
    player.update();
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        obj.update();
    }
    // Collision detection - compare every pair of objects, including
    // the player
    this._state.objects.push(player);
    var objectsCopy = $.extend(true, [], this._state.objects);
    for (var i = 0; i < this._state.objects.length; i++) {
        var objA = this._state.objects[i];
        for (var j = 0; j < this._state.objects.length; j++) {
            // Make sure we don't compare the object with itself
            if (i === j) {
                continue;
            }
            var objB = this._state.objects[j];
            var objBCopy = objectsCopy[j];
            objA.collide(objB, objBCopy);
        }
    }
    this._state.objects = objectsCopy;
    this._state.player = player = this._state.objects.pop();
    // Check win conditions
    var gameWon = true, gameLost = false;
    if (player.health <= 0) {
        gameLost = true;
    }
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        if ('target' === obj.type) {
            if (obj.complete(player)) {
                if (obj.lose) {
                    gameLost = true;
                }
            } else {
                if (obj.win) {
                    gameWon = false;
                }
            }
        }
    }
    if (gameLost) {
        this._state.gameOver = 'lose';
    } else if (gameWon) {
        this._state.gameOver = 'win';
    }
};

// Draw the game objects on screen
Level.prototype.draw = function(ctx) {
    var player = this._state.player;
    // Clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Draw the game objects
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        ctx.save();
        ctx.translate(obj.pos.x - player.pos.x + (ctx.canvas.width / 2),
                      obj.pos.y - player.pos.y + (ctx.canvas.height / 2));
        ctx.rotate(obj.pos.angular);
        obj.draw(ctx);
        ctx.restore();
    }
    // Draw the player
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.rotate(player.pos.angular);
    ctx.fillStyle = 'green';
    ctx.fillRect(-player.width / 2, -player.height / 2,
                 player.width, player.height);
    ctx.restore();
    // Draw win/lose screen if necessary
    if (typeof this._state.gameOver !== 'undefined') {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'bevel';
        ctx.font = 'bold 72px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var text = '';
        if ('win' === this._state.gameOver) {
            ctx.fillStyle = '#0f0';
            text = 'YOU WIN';
        } else if ('lose' === this._state.gameOver) {
            ctx.fillStyle = '#f00';
            text = 'GAME OVER';
        }
        ctx.strokeText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
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

// Returns true if the game is over
Level.prototype.complete = function() {
    return typeof this._state !== 'undefined' &&
           typeof this._state.gameOver !== 'undefined';
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
            radius: 100,
            collide: function(other, result) {
                var distance = Math.sqrt(Math.pow(other.pos.x - this.pos.x, 2) +
                                         Math.pow(other.pos.y - this.pos.y, 2));
                if ('player' === other.type && distance < this.radius) {
                    result.health = 0;
                }
            },
            draw: function(ctx) {
                ctx.fillStyle = 'blue';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
            },
        },
        {
            type: 'target',
            name: 'target1',
            objective: 'reach',
            win: true,
            pos: { x: 0, y: -100 },
            complete: function(player) {
                var distance = Math.sqrt(Math.pow(player.pos.x - this.pos.x, 2) +
                                         Math.pow(player.pos.y - this.pos.y, 2));
                if (distance < this.radius) {
                    return true;
                }
            },
            draw: function(ctx) {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    ]
});
