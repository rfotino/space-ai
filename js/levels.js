/**
 * Copyright (c) 2015 Robert Fotino.
 */

/**
 * Creates a game level from some initial state.
 */
function Level(name, image, initial) {
    switch (arguments.length) {
    case 3:
        this.name = arguments[0];
        this.image = arguments[1];
        this._stateFunc = arguments[2];
        break;
    case 2:
        this.name = arguments[0];
        this._stateFunc = arguments[1];
        break;
    case 1:
        this._stateFunc = arguments[0];
        break;
    default:
        throw 'Invalid number of arguments for Level().';
    }
}

// Initialize the state to start the level
Level.prototype.init = function() {
    // Initialize the state from the state function
    this._state = this._stateFunc();
    // Make sure there are certain properties like a player,
    // object array, etc
    if (typeof this._state.player === 'undefined') {
        this._state.player = new Player();
    }
    if (typeof this._state.objects === 'undefined') {
        this._state.objects = [];
    }
};

// Update all game objects, do collision detection, and check win conditions
Level.prototype.update = function() {
    var player = this._state.player;
    // Update all game objects
    player.update();
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        obj.update();
    }
    // Collision detection - compare every pair of objects, including
    // the player
    this._state.objects.push(player);
    for (var i = 0; i < this._state.objects.length; i++) {
        var objA = this._state.objects[i];
        for (var j = 0; j < this._state.objects.length; j++) {
            // Make sure we don't compare the object with itself
            if (i === j) {
                continue;
            }
            var objB = this._state.objects[j];
            objA.collide(objB);
        }
    }
    this._state.objects.pop();
    // Check win conditions
    var gameWon = true, gameLost = false;
    if (player.health <= 0) {
        gameLost = true;
    }
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        if (obj instanceof Target) {
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

// Updates the state of the game world
Level.prototype.updateWorld = function(world) {
    var player = this._state.player;
    player.thrustPower = world.player.thrustPower;
    player.thrust = world.player.thrust;
    player.turnPower = world.player.turnPower;
    player.accel.angular = world.player.accel.angular;
    player.equipped = world.player.equipped;
    player.fired = world.player.fired;
};

// Returns true if the game is over
Level.prototype.complete = function() {
    return typeof this._state !== 'undefined' &&
           typeof this._state.gameOver !== 'undefined';
};

/**
 * A superclass for all game objects, including the player.
 */
var GameObject = function(props) {
    props = props || {};
    this.pos = props.pos || { x: 0, y: 0, angular: 0 };
    this.vel = props.vel || { x: 0, y: 0, angular: 0 };
    this.accel = props.accel || { x: 0, y: 0, angular: 0 };
    return this;
};
GameObject.prototype.update = function() {
    this.vel.x += this.accel.x;
    this.vel.y += this.accel.y;
    this.vel.angular += this.accel.angular;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.pos.angular += this.vel.angular;
};
GameObject.prototype.collide = function(other, result) { };
GameObject.prototype.draw = function(ctx) { };

/**
 * A class for the player.
 */
var Player = function(props) {
    props = props || {};
    GameObject.prototype.constructor.call(this, props);
    this.weapons = props.weapons || [];
    this.equipped = props.equipped || null;
    this.health = props.health || 100;
    this.thrust = props.thrust || 0;
    this.thrustPower = props.thrustPower || 0;
    this.turnPower = props.turnPower || 0;
    this.fired = props.fired || false;
    this.width = 20;
    this.height = 40;
};
Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = Player;
Player.prototype.update = function() {
    // Fire the player's weapon if it was fired and there is a weapon equipped
    if (this.fired && this.equipped) {
        for (var i = 0; i < this.weapons.length; i++) {
            var weapon = this.weapons[i];
            if (this.equipped === weapon.name) {
                weapon.fire(this.fired.x, this.fired.y);
            }
        }
    }
    // Reset the player's fired flag
    this.fired = false;
    // Calculate the player's acceleration from thrust and rotation
    this.accel.x = this.thrust * Math.sin(this.pos.angular);
    this.accel.y = this.thrust * -Math.cos(this.pos.angular);
    // Update the game object
    GameObject.prototype.update.call(this);
};
Player.prototype.draw = function(ctx) {
    ctx.fillStyle = 'green';
    ctx.fillRect(-this.width / 2, -this.height / 2,
                 this.width, this.height);
};

/**
 * A class for asteroids.
 */
var Asteroid = function(props) {
    props = props || {};
    GameObject.prototype.constructor.call(this, props);
    this.radius = props.radius || 50;
};
Asteroid.prototype = Object.create(GameObject.prototype);
Asteroid.prototype.constructor = Asteroid;
Asteroid.prototype.collide = function(other, result) {
    var distance = Math.sqrt(Math.pow(other.pos.x - this.pos.x, 2) +
                             Math.pow(other.pos.y - this.pos.y, 2));
    if (other instanceof Player && distance < this.radius) {
        result.health = 0;
    }
};
Asteroid.prototype.draw = function(ctx) {
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
};

/**
 * An abstract class for targets.
 */
var Target = function(props) {
    props = props || {};
    GameObject.prototype.constructor.call(this, props);
    this.name = props.name || '';
    this.win = props.win || true;
};
Target.prototype = Object.create(GameObject.prototype);
Target.prototype.constructor = Target;
Target.prototype.complete = function(player) { return false; }
Target.prototype.draw = function(ctx) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
};

/**
 * A class for reach targets.
 */
var ReachTarget = function(props) {
    props = props || {};
    Target.prototype.constructor.call(this, props);
    this.radius = props.radius || 30;
};
ReachTarget.prototype = Object.create(Target.prototype);
ReachTarget.prototype.constructor = ReachTarget;
ReachTarget.prototype.complete = function(player) {
    var distance = Math.sqrt(Math.pow(player.pos.x - this.pos.x, 2) +
                             Math.pow(player.pos.y - this.pos.y, 2));
    return distance < this.radius;
};

/**
 * An abstract class for weapons.
 */
var Weapon = function(props) {
    props = props || {};
    this.name = props.name || '';
    this.damage = props.damage || 0;
    this.ammo = props.ammo || null;
};
Weapon.prototype.fire = function(x, y) { };

/**
 * A class for a basic laser weapon.
 */
var LaserWeapon = function() {
    Weapon.prototype.constructor.call(this, {
        name: 'laser',
        damage: 5
    });
};
LaserWeapon.prototype = Object.create(Weapon.prototype);
LaserWeapon.prototype.constructor = LaserWeapon;
LaserWeapon.prototype.fire = function(x, y) {
    // TODO: implement laser firing function
};

/**
 * A class for a rocket weapon.
 */
var RocketWeapon = function(props) {
    props = props || {};
    Weapon.prototype.constructor.call(this, {
        name: 'rocket',
        damage: 50,
        ammo: props.ammo || 0
    });
};
RocketWeapon.prototype = Object.create(Weapon.prototype);
RocketWeapon.prototype.constructor = RocketWeapon;
RocketWeapon.prototype.fire = function(x, y) {
    // TODO: implement rocket firing function
};

// An array of levels that can be loaded from the level selector
var levels = [
    new Level('Level 1', 'images/level1.jpg', function() {
        return {
            player: new Player({
                equipped: 'laser',
                weapons: [ new LaserWeapon(), new RocketWeapon({ ammo: 3 }) ]
            }),
            objects: [
                new Asteroid({ pos: { x: -300, y: -100 }, radius: 100 }),
                new ReachTarget({ name: 'target1', win: true, pos: { x: 0, y: -100 } })
            ]
        };
    }),
    new Level('Level 2', function() { return {}; }),
    new Level('Level 3', function() { return {}; }),
    new Level('Level 4', function() { return {}; }),
    new Level('Level 5', function() { return {}; }),
    new Level('Level 6', function() { return {}; }),
    new Level('Level 7', function() { return {}; }),
    new Level('Level 8', function() { return {}; }),
    new Level('Level 9', function() { return {}; }),
    new Level('Level 10', function() { return {}; }),
    new Level('Level 11', function() { return {}; }),
    new Level('Level 12', function() { return {}; }),
    new Level('Level 13', function() { return {}; }),
    new Level('Level 14', function() { return {}; }),
    new Level('Level 15', function() { return {}; }),
    new Level('Level 16', function() { return {}; }),
    new Level('Level 17', function() { return {}; }),
    new Level('Level 18', function() { return {}; }),
    new Level('Level 19', function() { return {}; }),
    new Level('Level 20', function() { return {}; })
];
