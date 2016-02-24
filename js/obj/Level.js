/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * A module that defines a Level object.
 */

define(function(require, exports, module) {
    var physics = require('physics');
    var graphics = require('graphics');
    var Player = require('obj/Player');
    var Target = require('obj/Target');
    var Viewport = require('obj/Viewport');
    var StarField = require('obj/StarField');

    /**
     * Creates a game level with a name and function for getting an initial
     * state.
     *
     * @param {String} name
     * @param {Function} stateFunc
     */
    function Level(name, stateFunc) {
        this.name = name;
        this._stateFunc = stateFunc;
        this._mousePos = null;
        this._highlightedObj = null;
        this._debugMode = false;
        this.viewport = new Viewport();
    };

    /**
     * Initialize the state to an initial value generated by the state function.
     */
    Level.prototype.init = function() {
        // Initialize the state from the state function
        this._state = this._stateFunc();
        // Make sure there are certain properties like a player,
        // object array, etc
        if ('undefined' === typeof this._state.player) {
            this._state.player = new Player();
        }
        if ('undefined' === typeof this._state.objects) {
            this._state.objects = [];
        }
        // Grab all of the targets out of the game objects array
        this._state.targets = this._state.objects.filter(function(obj) {
            return 'target' === obj.type;
        });
        // Set up the star field
        this._state.starField = new StarField();
    };

    /**
     * Updates the game state every frame.
     */
    Level.prototype.update = function() {
        this._updateGameObjects();
        if (!this.complete()) {
            this._checkWinConditions();
        }
    };

    /**
     * Update each game object and do collision detection.
     */
    Level.prototype._updateGameObjects = function() {
        var player = this._state.player;
        // Add the player to the beginning of the game object list
        // if necessary
        if (player.alive) {
            this._state.objects.unshift(player);
        }
        // Get a list of game objects that we can pass each individual
        // object's update function
        var prevObjList = [];
        for (var i = 0; i < this._state.objects.length; i++) {
            var obj = this._state.objects[i].getObj();
            if (obj && 'object' === typeof obj) {
                prevObjList.push(obj);
            }
        }
        // Update all game objects
        for (var i = 0; i < this._state.objects.length; i++) {
            var obj = this._state.objects[i];
            if (!this.complete() || obj.updateOnGameOver) {
                obj.update(prevObjList);
            }
        }
        // Do collision detection between all game objects
        for (var i = 0; i < this._state.objects.length; i++) {
            var objA = this._state.objects[i];
            for (var j = i + 1; j < this._state.objects.length; j++) {
                var objB = this._state.objects[j];
                // If the two objects intersect each other, call their collide
                // functions on each other
                if (physics.testIntersection(objA, objB)) {
                    objA.collide(objB);
                    objB.collide(objA);
                }
            }
        }
        // Add generated game objects and remove dead ones
        for (var i = this._state.objects.length - 1; 0 <= i; i--) {
            var obj = this._state.objects[i];
            var newTargets = obj.newObjects.filter(function(obj) {
                return 'target' === obj.type;
            });
            this._state.targets.push.apply(this._state.targets, newTargets);
            this._state.objects.push.apply(this._state.objects, obj.newObjects);
            obj.newObjects = [];
            if (!obj.alive) {
                this._state.objects.splice(i, 1);
            }
        }
        // Remove the player from the beginning of the game object list,
        // if it hasn't been removed already
        if (player.alive) {
            this._state.objects.shift();
        }
    };

    /**
     * Check the game state to see if the player won, lost, or neither.
     */
    Level.prototype._checkWinConditions = function() {
        var player = this._state.player;
        var targets = this._state.targets;
        var gameWon = true, gameLost = false;
        // Check if the player is dead
        if (!player.alive) {
            gameLost = true;
        }
        // If there are no win targets, the player should not win automatically
        if (0 === (targets.filter(function(t) { return t.win; })).length) {
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

    /**
     * Draw the game objects on screen.
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    Level.prototype.draw = function(ctx) {
        var player = this._state.player;
        // Clear the canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Update the graphics context transform for the viewport
        this.viewport.update(ctx);
        // Draw the stars
        this._state.starField.draw(ctx, this.viewport);
        // Draw debug grid
        if (this._debugMode) {
            this._drawGrid(ctx);
        }
        // Draw the game objects
        for (var i = 0; i < this._state.objects.length; i++) {
            var obj = this._state.objects[i];
            ctx.save();
            ctx.translate(obj.pos.x, obj.pos.y);
            ctx.rotate(obj.pos.angular);
            obj.draw(ctx);
            ctx.restore();
        }
        // Draw the player if necessary
        if (player.alive) {
            ctx.save();
            ctx.translate(player.pos.x, player.pos.y);
            ctx.rotate(player.pos.angular);
            player.draw(ctx);
            ctx.restore();
        }
        // Draw highlighted objects and tooltips
        if (this._debugMode) {
            this._state.objects.push(player);
            this._state.objects.forEach(function(obj) {
                if (obj.alive) {
                    this._drawHighlightedObj(ctx, obj);
                }
            }, this);
            this._state.objects.forEach(function(obj) {
                if (obj.alive) {
                    this._drawToolTip(ctx, obj);
                }
            }, this);
            this._state.objects.pop();
        } else {
            this._updateHighlightedObj();
            if (this._highlightedObj) {
                this._drawHighlightedObj(ctx, this._highlightedObj);
                this._drawToolTip(ctx, this._highlightedObj);
            }
        }
        // Draw win/lose screen if necessary
        if ('undefined' !== typeof this._state.gameOver) {
            ctx.save();
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
            ctx.restore();
        }
    };

    /**
     * Gets the state of the game world to pass to the worker thread.
     *
     * @return {Object}
     */
    Level.prototype.getWorld = function() {
        var getObj = function(obj) { return obj.getObj(); };
        var isObj = function(obj) { return obj && ('object' === typeof obj); };
        return {
            player: this._state.player.getObj(),
            objects: this._state.objects.map(getObj).filter(isObj)
        };
    };

    /**
     * Updates the state of the game world due to changes made in the worker
     * thread.
     *
     * @param {Object} world
     */
    Level.prototype.updateWorld = function(world) {
        var player = this._state.player;
        player.thrustPower = world.player.thrustPower;
        player.thrust = world.player.thrust;
        player.turnPower = world.player.turnPower;
        player.accel.angular = world.player.accel.angular;
        player.equipped = world.player.equipped;
        player.fired = world.player.fired;
    };

    /**
     * Returns true if the game is over.
     *
     * @return {Boolean}
     */
    Level.prototype.complete = function() {
        return 'undefined' !== typeof this._state &&
            'undefined' !== typeof this._state.gameOver;
    };

    /**
     * Returns true if the level is complete and nothing more is being
     * animated.
     *
     * @return {Boolean}
     */
    Level.prototype.doneUpdating = function() {
        return this.complete() &&
            0 === this._state.objects.filter(function(obj) {
                return obj.updateOnGameOver;
            }).length;
    };

    /**
     * Returns a bounding box containing the level objects.
     *
     * @return {Rectangle}
     */
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
     * Focuses the view on the player's ship.
     */
    Level.prototype.viewToPlayer = function() {
        if (this._state) {
            this.viewport.focus(this._state.player);
        }
    };

   /**
     * Sets the viewport to enclose the entire level within its bounds.
     *
     * @param {Number} viewWidth The width of the viewport, in pixels.
     * @param {Number} viewHeight The height of the viewport, in pixels.
     */
    Level.prototype.viewToBounds = function(viewWidth, viewHeight) {
        if (this._state) {
            this.viewport.fixToBounds(this.bounds(), viewWidth, viewHeight,
                                      true);
        }
    };

    /**
     * Translates the viewport by a given number of pixels (in viewport
     * coordinates, not game coordinates).
     *
     * @param {Number} x
     * @param {Number} y
     */
    Level.prototype.viewTranslate = function(x, y) {
        if (this._state) {
            var scale = this.viewport.getScale();
            this.viewport.translate(x / scale, y / scale);
        }
    };

    /**
     * Scales the viewport by a given factor.
     *
     * @param {Number} factor
     * @param {Number} viewWidth
     * @param {Number} viewHeight
     */
    Level.prototype.viewScale = function(factor, viewWidth, viewHeight) {
        if (this._state) {
            var translation = this.viewport.getTranslation();
            var viewBounds = this.viewport.bounds(viewWidth, viewHeight);
            var center = {
                x: translation.x + viewBounds.x + (viewBounds.width / 2),
                y: translation.y + viewBounds.y + (viewBounds.height / 2)
            };
            this.viewport.translate(-center.x, -center.y);
            var oldScale = this.viewport.getScale();
            this.viewport.scale(factor, true);
            var newScale = this.viewport.getScale();
            var realFactor = newScale / oldScale;
            this.viewport.translate(center.x / realFactor,
                                    center.y / realFactor);
        }
    };

    /**
     * Usese the current mouse position to update which object is highlighted
     * by being hovered over with the mouse.
     */
    Level.prototype._updateHighlightedObj = function() {
        if (!this._state || !this._mousePos) {
            return;
        }
        // Convert mouse position to in game coordinates
        var gameCoords = this.viewport.getGameCoords(this._mousePos);
        // Get the game object that is being hovered over, if any
        this._highlightedObj = null;
        this._state.objects.push(this._state.player);
        for (var i = this._state.objects.length - 1; 0 <= i; i--) {
            var obj = this._state.objects[i];
            if (obj.alive && physics.pointInObj(gameCoords, obj)) {
                this._highlightedObj = obj;
                break;
            }
        }
        this._state.objects.pop();
    };

    /**
     * Strokes the given object using its outline() function.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {GameObject} obj
     */
    Level.prototype._drawHighlightedObj = function(ctx, obj) {
        ctx.save();
        ctx.strokeStyle = 'rgb(150, 200, 255)';
        ctx.lineWidth = 3 / this.viewport.getScale();
        graphics.drawShape(ctx, obj.outline());
        ctx.stroke();
        ctx.restore();
    };

    /**
     * Shows extra information on screen about the given object's type,
     * health, position, radius, etc. This information goes above the
     * object, if there is room, or else is moved to fit within the viewport's
     * bounds.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {GameObject} obj
     */
    Level.prototype._drawToolTip = function(ctx, obj) {
        ctx.save();
        var infoArray = [];
        infoArray.push('type: ' + obj.type);
        if ('undefined' !== typeof obj.objective) {
            infoArray.push('objective: ' + obj.objective);
        }
        if ('undefined' !== typeof obj.damage) {
            infoArray.push('damage: ' + obj.damage);
        }
        if ('undefined' !== typeof obj.health) {
            infoArray.push('health: ' + obj.health);
        }
        if ('undefined' !== typeof obj.radius) {
            infoArray.push('radius: ' + obj.radius);
        }
        infoArray.push('position: (' + Math.round(obj.pos.x) + ', ' +
                       Math.round(obj.pos.y) + ')');
        var piMultiple = obj.pos.angular / Math.PI;
        var piSymbol = '\u03C0';
        infoArray.push('rotation: ' +
                       (Math.round(piMultiple * 100) / 100) + piSymbol);
        if (infoArray.length) {
            var lineHeight = 20;
            var margin = 10;
            var paddingLeft = 10;
            var paddingTop = 5;
            var infoHeight = lineHeight * infoArray.length;
            var infoWidth = 0;
            var fontSize = 16;
            ctx.font = fontSize + 'px sans-serif';
            for (var i = 0; i < infoArray.length; i++) {
                infoWidth = Math.max(infoWidth,
                                     ctx.measureText(infoArray[i]).width);
            }
            var objBounds = obj.bounds();
            var objGameCoords = {
                x: objBounds.x + (objBounds.width / 2),
                y: objBounds.y + objBounds.height
            };
            var objViewCoords = this.viewport.getViewCoords(objGameCoords);
            // Get the ideal bounds of the tooltip (horizontally centered,
            // above the highlighted object)
            var infoRect = {
                x: objViewCoords.x - (infoWidth / 2) - paddingLeft,
                y: objViewCoords.y - infoHeight - (paddingTop * 2) - margin,
                width: infoWidth + (paddingLeft * 2),
                height: infoHeight + (paddingTop * 2)
            };
            // If the tooltip is outside the viewport bounds, shift it into
            // the bounds
            infoRect.x = Math.min(infoRect.x,
                                  ctx.canvas.width - infoRect.width - margin);
            infoRect.x = Math.max(infoRect.x, margin);
            infoRect.y = Math.min(infoRect.y,
                                  ctx.canvas.height - infoRect.height - margin);
            infoRect.y = Math.max(infoRect.y, margin);
            // Draw tooltip
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            graphics.drawRoundedRect(ctx, infoRect,
                                     Math.min(paddingLeft, paddingTop));
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.textBaseline = 'top';
            for (var i = 0; i < infoArray.length; i++) {
                var infoStr = infoArray[i];
                var y = paddingTop + infoRect.y + (i * lineHeight);
                ctx.fillText(infoStr, paddingLeft + infoRect.x, y);
            }
        }
        ctx.restore();
    };

    /**
     * Draws a grid of green lines, used in debug mode.
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    Level.prototype._drawGrid = function(ctx) {
        ctx.save();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2 / this.viewport.getScale();
        var viewBounds = this.viewport.bounds(ctx.canvas.width,
                                              ctx.canvas.height);
        var interval = 100;
        // Draw vertical lines
        var startX = Math.floor(viewBounds.x / interval) * interval;
        var endX = viewBounds.x + viewBounds.width;
        for (var x = startX; x <= endX; x += interval) {
            ctx.beginPath();
            ctx.moveTo(x, -viewBounds.y);
            ctx.lineTo(x, -viewBounds.y - viewBounds.height);
            ctx.stroke();
        }
        // Draw horizontal lines
        var startY = Math.floor(viewBounds.y / interval) * interval;
        var endY = viewBounds.y + viewBounds.width;
        for (var y = startY; y <= endY; y += interval) {
            ctx.beginPath();
            ctx.moveTo(viewBounds.x, -y);
            ctx.lineTo(viewBounds.x + viewBounds.width, -y);
            ctx.stroke();
        }
        ctx.restore();
    };

    /**
     * Changes the current mouse position, which possibly changes which
     * game object is highlighted.
     *
     * @param {Point} mousePos
     * @param {CanvasRenderingContext2D} ctx
     */
    Level.prototype.highlightObjAt = function(mousePos, ctx) {
        var prevHighlightedObj = this._highlightedObj;
        this._mousePos = { x: mousePos.x, y: mousePos.y };
        this._updateHighlightedObj();
        if (ctx && this._highlightedObj !== prevHighlightedObj) {
            this.draw(ctx);
        }
    };

    /**
     * @param {Boolean} debugMode
     */
    Level.prototype.setDebugMode = function(debugMode) {
        this._debugMode = debugMode;
    }

    module.exports = Level;
});
