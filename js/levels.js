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
    this.viewport = new Viewport();
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
    // Set up the star field
    this._state.starField = new StarField();
    // Reset the viewport and focus it on the player
    this.viewport.reset();
    this.viewport.focus(this._state.player);
};

// Updates the game state every frame
Level.prototype.update = function() {
    this._updateGameObjects();
    this._checkWinConditions();
};
// Update each game object and do collision detection
Level.prototype._updateGameObjects = function() {
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
        for (var j = i + 1; j < this._state.objects.length; j++) {
            var objB = this._state.objects[j];
            // If the two objects intersect each other, call their collide
            // functions on each other
            if (Physics.testIntersection(objA, objB)) {
                objA.collide(objB);
                objB.collide(objA);
            }
        }
    }
    // Remove the player from the beginning of the game object list
    this._state.objects.shift();
};
// Check the game state to see if the player won, lost, or neither
Level.prototype._checkWinConditions = function() {
    var player = this._state.player;
    var gameWon = true, gameLost = false;
    // Check if the player is dead
    if (player.health <= 0) {
        gameLost = true;
    }
    // Get all of the game objects that are "targets", which can
    // be check for win conditions
    var targets = this._state.objects.filter(function(obj) {
        return obj instanceof Target;
    });
    // If there are no targets, the player should not win automatically
    if (0 === targets.length) {
        gameWon = false;
    }
    // Iterate over the targets, checking if they have been completed
    // and whether that signifies a win or lose condition
    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        if (target.complete(player)) {
            if (target.lose) {
                gameLost = true;
            }
        } else {
            if (target.win) {
                gameWon = false;
            }
        }
    }
    // If the player won or lost, update the gameOver variable to
    // indicate this and show the game over screen
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Update the graphics context transform for the viewport
    this.viewport.update(ctx);
    // Draw the stars
    this._state.starField.draw(ctx, this.viewport);
    // Draw the game objects
    for (var i = 0; i < this._state.objects.length; i++) {
        var obj = this._state.objects[i];
        ctx.save();
        ctx.translate(obj.pos.x, obj.pos.y);
        ctx.rotate(obj.pos.angular);
        obj.draw(ctx);
        ctx.restore();
    }
    // Draw the player
    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);
    ctx.rotate(player.pos.angular);
    player.draw(ctx);
    ctx.restore();
    // Draw win/lose screen if necessary
    if (typeof this._state.gameOver !== 'undefined') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'bevel';
        ctx.font = 'bold 72px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var text = '';
        if ('win' === this._state.gameOver) {
            ctx.fillStyle = '#0f0';
            text = 'YOU WIN!';
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
 * A class for doing viewport transformations, getting viewport bounds, etc.
 */
var Viewport = function() {
    this.reset();
};
Viewport.prototype.scale = function(scale) {
    this._scale *= scale;
};
Viewport.prototype.translate = function(x, y) {
    this._translation.x += x;
    this._translation.y += y;
};
Viewport.prototype.focus = function(gameObj) {
    this._focusObj = gameObj;
};
Viewport.prototype.fixToBounds = function(bounds, viewWidth, viewHeight) {
    this._focusObj = null;
    var scaleX = viewWidth / bounds.width;
    var scaleY = viewHeight / bounds.height;
    var scale = Math.min(scaleX, scaleY);
    this.scale(scale);
    this.translate(-bounds.x + (((viewWidth / scale) - bounds.width) / 2),
                   -bounds.y + (((viewHeight / scale) - bounds.height) / 2));
};
Viewport.prototype.reset = function() {
    this._scale = 1;
    this._translation = { x: 0, y: 0 };
    this._focusObj = null;
};
Viewport.prototype.update = function(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this._focusObj) {
        this._translation.x = -this._focusObj.pos.x + (ctx.canvas.width / 2);
        this._translation.y = -this._focusObj.pos.y + (ctx.canvas.height / 2);
    }
    ctx.scale(this._scale, this._scale);
    ctx.translate(this._translation.x, this._translation.y);
};
Viewport.prototype.bounds = function(ctx) {
    return {
        x: -this._translation.x,
        y: -this._translation.y,
        width: ctx.canvas.width / this._scale,
        height: ctx.canvas.height / this._scale
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
GameObject.prototype.outline = function () {
    if (this.radius) {
        return {
            x: this.pos.x,
            y: this.pos.y,
            radius: this.radius
        };
    } else if (this.width && this.height) {
        var p1 = { x: -this.width / 2, y: -this.height / 2 };
        var p2 = { x: this.width / 2, y: this.height / 2 };
        var points = [ p1, { x: p2.x, y: p1.y }, p2, { x: p1.x, y: p2.y } ];
        var transform = Physics.getRotate(this.pos.angular,
                                          Physics.getTranslate(this.pos.x,
                                                               this.pos.y));
        return { points: points.map(transform) };
    } else {
        return null;
    }
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
    this._generateGeometry();
};
Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = Player;
Player.prototype._generateGeometry = function() {
    var halfOutline = Graphics.getQuadTo({ x: 0, y: -50 },
                                         { x: 13, y: -40 },
                                         { x: 15, y: 0 },
                                         10).concat([ { x: 12, y: 7 },
                                                      { x: 12, y: 10 } ]);
    var reflectYFunc = function(p) { return { x: -p.x, y: p.y }; };
    var otherHalfOutline = halfOutline.map(reflectYFunc).reverse();
    this._outline = { points: halfOutline.concat(otherHalfOutline) };
    this._drawPolys = [
        {
            color: '#aaa', // upper hull
            points: this._outline.points
        },
        {
            color: '#999', // lower hull
            points: [
                { x: -15, y: 0 },
                { x: 15, y: 0 },
                { x: 12, y: 7 },
                { x: -12, y: 7 }
            ]
        },
        {
            color: '#ddd', // exhaust port
            points: [
                { x: -12, y: 7 },
                { x: 12, y: 7 },
                { x: 12, y: 10 },
                { x: -12, y: 10 }
            ]
        }
    ];
    // Add the cockpit separately
    var halfCockpit = Graphics.getQuadTo({ x: 0, y: -40 },
                                         { x: 5, y: -35 },
                                         { x: 6, y: -16 },
                                         5);
    var otherHalfCockpit = halfCockpit.map(reflectYFunc).reverse();
    this._drawPolys.push({
        color: '#0f9',
        points: halfCockpit.concat(otherHalfCockpit)
    });
    // Set up geometry and constants for the thrust flame
    this._flamePoly = { points: [
        { x: -10, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 15 }
    ] };
    var bounds = Physics.getPolyBounds(this._outline);
    this._flamePosY = bounds.y + bounds.height;
    this._flameFlicker = 0;
    this._flameFlickerThreshold = 6;
    this._flameFlickerMax = 8;
};
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
                    { x: this.pos.x, y: this.pos.y },
                    this);
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
    // Draw the polygons
    for (var i = 0; i < this._drawPolys.length; i++) {
        var poly = this._drawPolys[i];
        Graphics.fillPoly(ctx, poly, poly.color);
    }
    // Draw the exhaust
    this._flameFlicker = (this._flameFlicker + 1) % this._flameFlickerMax;
    if (this._flameFlicker < this._flameFlickerThreshold) {
        var flameScale = {
            x: 0.5 + (this.thrustPower / 2),
            y: this.thrustPower
        };
        var translateTransform = Physics.getTranslate(0, this._flamePosY);
        var transform = Physics.getScale(flameScale, translateTransform);
        var flamePoly = { points: this._flamePoly.points.map(transform) };
        Graphics.fillPoly(ctx, flamePoly, 'orange');
    }
};
Player.prototype.bounds = function() {
    return Physics.getPolyBounds(this.outline());
};
Player.prototype.outline = function() {
    var transform = Physics.getRotate(this.pos.angular,
                                      Physics.getTranslate(this.pos.x,
                                                           this.pos.y));
    return { points: this._outline.points.map(transform) };
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
        fired: this.fired,
        bounds: this.bounds()
    });
};

/**
 * A class for creating, keeping track of, and drawing the field of
 * stars in the background.
 */
var StarField = function(density) {
    this._density = density || 0.005;
    this._bounds = { x: 0, y: 0, width: 0, height: 0 };
    this._stars = [];
    this._color = '#bbf';
    this._minRadius = 0.25;
    this._maxRadius = 1.5;
};
StarField.prototype._addStars = function(x, y, width, height) {
    var numStars = width * height * this._density;
    for (var i = 0; i < numStars; i++) {
        this._stars.push({
            x: x + (width * Math.random()),
            y: y + (height * Math.random()),
            radius: this._minRadius +
                ((this._maxRadius - this._minRadius) * Math.pow(Math.random(), 3))
        });
    }
};
StarField.prototype.draw = function(ctx, viewport) {
    // We need to make sure the star field's bounds include the viewport's
    // bounds. If not, expand the star field's bounds by adding more stars
    var viewBounds = viewport.bounds(ctx);
    // Expand the star field to the left if necessary
    if (viewBounds.x < this._bounds.x) {
        this._addStars(viewBounds.x, this._bounds.y,
                       this._bounds.x - viewBounds.x,
                       this._bounds.height);
        this._bounds.width += this._bounds.x - viewBounds.x;
        this._bounds.x = viewBounds.x;
    }
    // Expand the star field up if necessary
    if (viewBounds.y < this._bounds.y) {
        this._addStars(this._bounds.x, viewBounds.y,
                       this._bounds.width,
                       this._bounds.y - viewBounds.y);
        this._bounds.height += this._bounds.y - viewBounds.y;
        this._bounds.y = viewBounds.y;
    }
    // Expand the star field to the right if necessary
    var starBoundsRight = this._bounds.x + this._bounds.width;
    var viewBoundsRight = viewBounds.x + viewBounds.width;
    if (starBoundsRight < viewBoundsRight) {
        this._addStars(starBoundsRight,
                       this._bounds.y,
                       viewBoundsRight - starBoundsRight,
                       this._bounds.height);
        this._bounds.width += viewBoundsRight - starBoundsRight;
    }
    // Expand the star field downward if necessary
    var starBoundsBottom = this._bounds.y + this._bounds.height;
    var viewBoundsBottom = viewBounds.y + viewBounds.height;
    if (starBoundsBottom < viewBoundsBottom) {
        this._addStars(this._bounds.x,
                       starBoundsBottom,
                       this._bounds.width,
                       viewBoundsBottom - starBoundsBottom);
        this._bounds.height += viewBoundsBottom - starBoundsBottom;
    }
    // Draw all the stars
    ctx.fillStyle = this._color;
    for (var i = 0; i < this._stars.length; i++) {
        var star = this._stars[i];
        // Check if star is in view before drawing
        if (viewBounds.x <= star.x && star.x <= viewBoundsRight &&
            viewBounds.y <= star.y && star.y <= viewBoundsBottom) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

/**
 * A class for asteroids.
 */
var Asteroid = function(props) {
    props = props || {};
    props.type = 'asteroid';
    GameObject.prototype.constructor.call(this, props);
    this.radius = props.radius || 50;
    // Procedurally create the asteroid's graphics
    this._outline = { points: [] };
    this._craters = [];
    this._generateGeometry();
};
Asteroid.prototype = Object.create(GameObject.prototype);
Asteroid.prototype.constructor = Asteroid;
Asteroid.prototype._generateGeometry = function() {
    // Create the outer polygon
    var numOuterPoints = Math.max(6, Math.sqrt(this.radius) * 1.5);
    var outerRange = Math.sqrt(this.radius) * 2;
    for (var i = 0; i < numOuterPoints; i++) {
        var pointAngle = (Math.PI * 2) * (i / numOuterPoints);
        var pointRadius = this.radius - (outerRange * Math.random());
        this._outline.points.push({
            x: pointRadius * Math.cos(pointAngle),
            y: pointRadius * Math.sin(pointAngle)
        });
    }
    // Create some craters
    var numCraters = (3 * Math.random()) + (0.25 * Math.sqrt(this.radius));
    for (var i = 0; i < numCraters; i++) {
        var crater = { points: [] };
        var craterAngle = Math.random() * Math.PI * 2;
        var craterDist = Math.random() * this.radius;
        var craterX = craterDist * Math.cos(craterAngle);
        var craterY = craterDist * Math.sin(craterAngle);
        var craterMultiplier = (0.75 * Math.random()) + 0.25;
        var craterRadius = 5 * Math.sqrt(this.radius) *
            ((0.75 * Math.random()) + 0.25);
        var numCraterPoints = Math.max(6, Math.sqrt(craterRadius) * 1.5);
        var craterRange = Math.sqrt(craterRadius) * 2;
        for (var j = 0; j < numCraterPoints; j++) {
            var pointAngle = (Math.PI * 2) * (j / numCraterPoints);
            var pointRadius = craterRadius - (craterRange * Math.random());
            crater.points.push({
                x: craterX + (pointRadius * Math.cos(pointAngle)),
                y: craterY + (pointRadius * Math.sin(pointAngle))
            });
        }
        crater.shadowOffset = {
            angle: Math.random() * Math.PI * 2,
            radius: 1 + (Math.sqrt(craterRadius) / 2)
        };
        this._craters.push(crater);
    }
};
Asteroid.prototype.collide = function(other) {
    if (other instanceof Player) {
        other.health = 0;
    }
};
Asteroid.prototype.draw = function(ctx) {
    // Draw main polygon
    Graphics.fillPoly(ctx, this._outline, '#553322');
    // Save the non-clipped context and then clip it to the outer polygon
    ctx.save();
    ctx.clip();
    // Draw craters, clipped to the outer polygon
    for (var i = 0; i < this._craters.length; i++) {
        var crater = this._craters[i];
        // Shift context and draw shadow
        ctx.save();
        ctx.translate(crater.shadowOffset.radius
                      * Math.cos(crater.shadowOffset.angle),
                      crater.shadowOffset.radius
                      * Math.sin(crater.shadowOffset.angle));
        Graphics.fillPoly(ctx, crater, '#331700');
        ctx.restore();
        // Draw the crater
        Graphics.fillPoly(ctx, crater, '#442211');
    }
    // Restore the non-clipped context
    ctx.restore();
};
Asteroid.prototype.outline = function() {
    var transform = Physics.getRotate(this.pos.angular,
                                      Physics.getTranslate(this.pos.x,
                                                           this.pos.y));
    return { points: this._outline.points.map(transform) };
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
    ctx.fillStyle = 'rgba(50, 50, 255, 0.6)';
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
    this.radius = props.radius || 50;
};
ReachTarget.prototype = Object.create(Target.prototype);
ReachTarget.prototype.constructor = ReachTarget;
ReachTarget.prototype.complete = function(player) {
    return Physics.testContainsCirclePoly(this.outline(), player.outline());
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
LaserWeapon.prototype.getBullet = function(dir, pos, owner) {
    if (this.cooldownTimer <= 0) {
        if ({ x: 0, y: 0 } !== dir) {
            this.cooldownTimer = this.cooldown;
            return new LaserBullet({ dir: dir, pos: pos, owner: owner });
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
RocketWeapon.prototype.getBullet = function(dir, pos, owner) {
    if (this.cooldownTimer <= 0 && 0 < this.ammo) {
        if ({ x: 0, y: 0 } !== dir) {
            this.cooldownTimer = this.cooldown;
            this.ammo--;
            return new RocketBullet({ dir: dir, pos: pos, owner: owner });
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
    this.owner = props.owner || null;
};
Bullet.prototype = Object.create(GameObject.prototype);
Bullet.prototype.constructor = Bullet;
Bullet.prototype.collide = function(other) {
    if (other !== this.owner && other.hasOwnProperty('health')) {
        other.health -= this.damage;
        this.alive = false;
    }
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
    props.damage = 10;
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
    props.damage = 100;
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
            new Asteroid({ pos: { x: 0, y: -250 }, radius: 150 }),
            new ReachTarget({ name: 'target1', win: true, pos: { x: -250, y: 0 } })
        ]
    }; }),
    // A level with an asteroid in between the player and a reach target
    new Level('Level 3', 'images/level3.jpg', function() { return {
        player: new Player({ pos: { angular: Math.PI / 2 } }),
        objects: [
            new Asteroid({ pos: { x: 250, y: 0 }, radius: 150 }),
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
