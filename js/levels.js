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
    // Add the player to the beginning of the game object list
    this._state.objects.unshift(player);
    // Update all game objects
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        obj.update();
    }
    // Add generated game objects and remove dead ones
    for (var i = this._state.objects.length - 1; 0 <= i; i--) {
        var obj = this._state.objects[i];
        this._state.objects.push.apply(this._state.objects, obj.newObjects);
        obj.newObjects = [];
        if (!obj.alive) {
            this._state.objects.splice(i, 1);
        }
    }
    // Collision detection - compare every pair of objects, including
    // the player
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
    // Remove the player from the beginning of the game object list
    this._state.objects.shift();
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

// Gets the state of the game world to pass to the worker thread
Level.prototype.getWorld = function() {
    var getObj = function(obj) { return obj.getObj(); };
    var isObj = function(obj) { return 'object' === typeof obj; };
    return {
        player: this._state.player.getObj(),
        objects: this._state.objects.map(getObj).filter(isObj)
    };
};

// Updates the state of the game world due to changes made in the worker thread
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

// Returns a bounding box containing the level objects
Level.prototype.bounds = function() {
    var minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity,
        padding = 20;
    this._state.objects.push(this._state.player);
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        var bounds = obj.bounds();
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
    }
    this._state.objects.pop();
    return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + (padding * 2),
        height: maxY - minY + (padding * 2)
    };
};

/**
 * A superclass for all game objects, including the player.
 */
var GameObject = function(props) {
    props = props || {};
    // Every object gets a position, velocity, and acceleration
    this.pos = $.extend({ x: 0, y: 0, angular: 0 }, props.pos);
    this.vel = $.extend({ x: 0, y: 0, angular: 0 }, props.vel);
    this.accel = $.extend({ x: 0, y: 0, angular: 0 }, props.accel);
    // Every object gets a name and a type
    this.name = props.name || '';
    this.type = props.type || '';
    // If the alive flag is set to false, the object is removed from the
    // list of game objects
    this.alive = true;
    // A list of new game objects to add to the scene, usually generated
    // in this.update() or this.collide()
    this.newObjects = [];
};
GameObject.prototype.update = function() {
    this.vel.x += this.accel.x;
    this.vel.y += this.accel.y;
    this.vel.angular += this.accel.angular;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.pos.angular += this.vel.angular;
};
GameObject.prototype.collide = function(other) { };
GameObject.prototype.draw = function(ctx) { };
GameObject.prototype.bounds = function() {
    if (this.radius) {
        return {
            x: this.pos.x - this.radius,
            y: this.pos.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    } else if (this.width && this.height) {
        return {
            x: this.pos.x - (this.width / 2),
            y: this.pos.y - (this.height / 2),
            width: this.width,
            height: this.height
        }
    }
    return { x: Infinity, y: Infinity, width: -Infinity, height: -Infinity };
};
GameObject.prototype.getObj = function() {
    return {
        pos: $.extend({}, this.pos),
        vel: $.extend({}, this.vel),
        accel: $.extend({}, this.accel),
        name: this.name,
        type: this.type
    };
};

/**
 * A class for the player.
 */
var Player = function(props) {
    props = props || {};
    props.type = 'player';
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
    // Update the player's weapons
    for (var i = 0; i < this.weapons.length; i++) {
        var weapon = this.weapons[i];
        weapon.update();
    }
    // Fire the player's weapon if it was fired and there is a weapon equipped
    if (this.fired && this.equipped) {
        for (var i = 0; i < this.weapons.length; i++) {
            var weapon = this.weapons[i];
            if (this.equipped === weapon.name) {
                var bullet = weapon.getBullet(
                    { x: this.fired.x, y: this.fired.y },
                    { x: this.pos.x, y: this.pos.y });
                if (Array.isArray(bullet)) {
                    this.newObjects.push.apply(this.newObjects, bullet);
                } else if (null !== bullet) {
                    this.newObjects.push(bullet);
                }
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
Player.prototype.getObj = function() {
    var obj = GameObject.prototype.getObj.call(this);
    return $.extend(obj, {
        weapons: this.weapons.map(function(weap) { return weap.getObj(); }),
        equipped: this.equipped,
        health: this.health,
        thrust: this.thrust,
        thrustPower: this.thrustPower,
        turnPower: this.turnPower,
        fired: this.fired
    });
};

/**
 * A class for asteroids.
 */
var Asteroid = function(props) {
    props = props || {};
    props.type = 'asteroid';
    GameObject.prototype.constructor.call(this, props);
    this.radius = props.radius || 50;
    // Generate the polygons used for collision and drawing
    this._outerBounds = [];
    this._innerBounds = [];
    // The number of points in both the inner and outer polygons, must be
    // a minimum of 6
    var numBoundPoints = Math.max(6, props.radius / 10);
    // The maximum that a point in the outer polygon can vary from this.radius
    // or a point in the inner polygon can vary from the outer radius at the
    // same angle
    var maxVariance = 50;
    // The default factor to multiply by this.radius to get the outer variance,
    // if the result is greater than maxVariance use maxVariance instead
    var defOuterVarianceFact = 1 / 3;
    // The maximum that a point can vary from the previous point in either
    // the inner or outer polygons
    var maxPointVariance = 20;
    // The inner padding is the minimum difference between the outer and inner
    // polygons at the same angle. The default is a factor to multiply by the
    // value of the outer radius at the same angle
    var maxInnerPadding = 75;
    var defInnerPaddingFact = 0.75;
    // The range of values that can be subtracted from this.radius to get
    // the radius of a point in the outer polygon
    var outerRange = Math.min(maxVariance, this.radius * defOuterVarianceFact);
    // Used to determine the difference between the current and previous points
    var prevOuterRadius = 0;
    var prevInnerRadius = 0;
    for (var i = 0; i < numBoundPoints; i++) {
        var boundAngle = (Math.PI * 2) * (i / numBoundPoints);
        var outerRadius;
        do {
            outerRadius = this.radius - (outerRange * Math.random());
        } while (0 !== prevOuterRadius &&
                 maxPointVariance < Math.abs(prevOuterRadius - outerRadius));
        prevOuterRadius = outerRadius;
        var innerRadiusMax = Math.max(outerRadius - maxInnerPadding,
                                      outerRadius * defInnerPaddingFact);
        var innerRange = Math.min(maxVariance, outerRadius / 3);
        var innerRadius;
        do {
            innerRadius = innerRadiusMax - (innerRange * Math.random());
        } while (0 !== prevInnerRadius &&
                 maxPointVariance < Math.abs(prevInnerRadius - innerRadius));
        prevInnerRadius = innerRadius;
        this._outerBounds.push({
            x: outerRadius * Math.cos(boundAngle),
            y: outerRadius * Math.sin(boundAngle)
        });
        this._innerBounds.push({
            x: innerRadius * Math.cos(boundAngle),
            y: innerRadius * Math.sin(boundAngle)
        });
    }
};
Asteroid.prototype = Object.create(GameObject.prototype);
Asteroid.prototype.constructor = Asteroid;
Asteroid.prototype.collide = function(other) {
    var distance = Math.sqrt(Math.pow(other.pos.x - this.pos.x, 2) +
                             Math.pow(other.pos.y - this.pos.y, 2));
    if (other instanceof Player && distance < this.radius) {
        other.health = 0;
    }
};
Asteroid.prototype.draw = function(ctx) {
    // Draw outer bounds
    ctx.fillStyle = 'saddlebrown';
    ctx.beginPath();
    for (var i = 0; i < this._outerBounds.length; i++) {
        var boundPoint = this._outerBounds[i];
        ctx.lineTo(boundPoint.x, boundPoint.y);
    }
    ctx.fill();
    // Draw inner bounds
    ctx.fillStyle = 'sienna';
    ctx.beginPath();
    for (var i = 0; i < this._innerBounds.length; i++) {
        var boundPoint = this._innerBounds[i];
        ctx.lineTo(boundPoint.x, boundPoint.y);
    }
    ctx.fill();
};
Asteroid.prototype.getObj = function() {
    var obj = GameObject.prototype.getObj.call(this);
    return $.extend(obj, {
        radius: this.radius
    });
};

/**
 * An abstract class for targets.
 */
var Target = function(props) {
    props = props || {};
    props.type = 'target';
    GameObject.prototype.constructor.call(this, props);
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
Target.prototype.getObj = function() {
    var obj = GameObject.prototype.getObj.call(this);
    return $.extend(obj, {
        win: this.win
    });
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
ReachTarget.prototype.getObj = function() {
    var obj = Target.prototype.getObj.call(this);
    return $.extend(obj, {
        objective: 'reach',
        radius: this.radius
    });
};

/**
 * An abstract class for weapons.
 */
var Weapon = function(props) {
    props = props || {};
    this.name = props.name || '';
    this.damage = props.damage || 0;
    this.ammo = props.ammo || null;
    this.cooldown = props.cooldown || 0;
    this.cooldownTimer = 0;
};
Weapon.prototype.getBullet = function(dir, pos) { return null; };
Weapon.prototype.update = function() {
    this.cooldownTimer = Math.max(this.cooldownTimer - 1, 0);
};
Weapon.prototype.getObj = function() {
    return {
        name: this.name,
        damage: this.damage,
        ammo: this.ammo,
        cooldown: this.cooldown,
        cooldownTimer: this.cooldownTimer
    };
};

/**
 * A class for a basic laser weapon.
 */
var LaserWeapon = function() {
    Weapon.prototype.constructor.call(this, {
        name: 'laser',
        damage: 5,
        cooldown: 20
    });
};
LaserWeapon.prototype = Object.create(Weapon.prototype);
LaserWeapon.prototype.constructor = LaserWeapon;
LaserWeapon.prototype.getBullet = function(dir, pos) {
    if (this.cooldownTimer <= 0) {
        if ({ x: 0, y: 0 } !== dir) {
            this.cooldownTimer = this.cooldown;
            return new LaserBullet({ dir: dir, pos: pos });
        }
    }
    return null;
};

/**
 * A class for a rocket weapon.
 */
var RocketWeapon = function(props) {
    props = props || {};
    Weapon.prototype.constructor.call(this, {
        name: 'rocket',
        damage: 50,
        ammo: props.ammo || 0,
        cooldown: 60
    });
};
RocketWeapon.prototype = Object.create(Weapon.prototype);
RocketWeapon.prototype.constructor = RocketWeapon;
RocketWeapon.prototype.getBullet = function(dir, pos) {
    if (this.cooldownTimer <= 0 && 0 < this.ammo) {
        if ({ x: 0, y: 0 } !== dir) {
            this.cooldownTimer = this.cooldown;
            this.ammo--;
            return new RocketBullet({ dir: dir, pos: pos });
        }
    }
    return null;
};

/**
 * An abstract class for a bullet fired from a Weapon object.
 */
var Bullet = function(props) {
    props = props || {};
    props.type = 'bullet';
    // Get direction of bullet, if set
    var dir = props.dir || { x: 0, y: 0 };
    dir.x = dir.x || 0;
    dir.y = dir.y || 0;
    if ({ x: 0, y: 0 } !== dir) {
        // Turn the direction into a unit vector
        var magnitude = Math.sqrt(Math.pow(dir.x, 2) + Math.pow(dir.y, 2));
        dir.x /= magnitude;
        dir.y /= magnitude;
        // Multiply the direction by the speed to get the velocity
        var speed = props.speed || 0;
        var rotation = Math.atan2(dir.x, -dir.y);
        props.pos = props.pos || {};
        props.pos.angular = Math.atan2(dir.x, -dir.y);
        props.vel = props.vel || {};
        props.vel.x = speed * dir.x;
        props.vel.y = speed * dir.y;
    }
    GameObject.prototype.constructor.call(this, props);
    this.damage = props.damage || 0;
    this.weapon = props.weapon || '';
    this.lifespan = props.lifespan || 0;
};
Bullet.prototype = Object.create(GameObject.prototype);
Bullet.prototype.constructor = Bullet;
Bullet.prototype.collide = function(other) {
    // TODO: if this collides with other and other.health exists,
    // subtract this.damage from other.health
};
Bullet.prototype.update = function() {
    // If this bullet has been in the scene for too many ticks,
    // set its alive flag to false
    this.lifespan--;
    if (this.lifespan <= 0) {
        this.alive = false;
    }
    // Call parent update function
    GameObject.prototype.update.call(this);
};
Bullet.prototype.getObj = function() {
    var obj = GameObject.prototype.getObj.call(this);
    return $.extend(obj, {
        damage: this.damage,
        weapon: this.weapon
    });
};

/**
 * A class for a bullet fired from a LaserWeapon.
 */
var LaserBullet = function(props) {
    props = props || {};
    props.speed = 5;
    props.weapon = 'laser';
    props.lifespan = 180;
    Bullet.prototype.constructor.call(this, props);
    this.width = 2;
    this.height = 10;
};
LaserBullet.prototype = Object.create(Bullet.prototype);
LaserBullet.prototype.constructor = LaserBullet;
LaserBullet.prototype.draw = function(ctx) {
    ctx.fillStyle = 'red';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
};

/**
 * A class for a bullet fired from a RocketWeapon.
 */
var RocketBullet = function(props) {
    props = props || {};
    props.speed = 5;
    props.weapon = 'rocket';
    props.lifespan = 180;
    Bullet.prototype.constructor.call(this, props);
    this.width = 8;
    this.height = 20;
};
RocketBullet.prototype = Object.create(Bullet.prototype);
RocketBullet.prototype.constructor = RocketBullet;
RocketBullet.prototype.draw = function(ctx) {
    ctx.fillStyle = 'orange';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
};

// An array of levels that can be loaded from the level selector
var levels = [
    // A level with a reach target straight ahead
    new Level('Level 1', 'images/level1.jpg', function() { return {
        objects: [
            new ReachTarget({ name: 'target1', win: true, pos: { x: 0, y: -250 } })
        ]
    }; }),
    // A level with an asteroid straight ahead and a reach target to the left
    new Level('Level 2', 'images/level2.jpg', function() { return {
        objects: [
            new Asteroid({ pos: { x: 0, y: -250 }, radius: 100 }),
            new ReachTarget({ name: 'target1', win: true, pos: { x: -250, y: 0 } })
        ]
    }; }),
    // A level with an asteroid in between the player and a reach target
    new Level('Level 3', 'images/level3.jpg', function() { return {
        player: new Player({ pos: { angular: Math.PI / 2 } }),
        objects: [
            new Asteroid({ pos: { x: 250, y: 0 }, radius: 75 }),
            new ReachTarget({ name: 'target1', win: true, pos: { x: 500, y: 0 } })
        ]
    }; }),
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
