/**
 * Copyright (c) 2015 Robert Fotino.
 *
 * This defines a module for installing code, running/pausing code, loading
 * levels, restarting, and drawing the game.
 */

var $ = require('../lib/jquery/jquery.js');
var ui = require('./ui.js');
var menubar = require('./menubar.js');
var modal = require('./modal.js');
var Level = require('./obj/Level.js');

// Declare variables for DOM elements and handling state
var canvas, ctx, worker = null, running = false,
    frameComplete = true, timerComplete = true,
    level = null, installedCode = null,
    mousePos = null, debugMode = false;

// Update the run/pause button in the menu to the correct state
var updateMenu = function() {
    if (null === installedCode || null === level || level.doneUpdating()) {
        menubar.setState('waiting');
    } else if (running) {
        menubar.setState('running');
    } else {
        menubar.setState('paused');
    }
}

// Begins executing the user's code for the next frame, and sets a timer
// for the minimum length of a frame. If the game is over, this does nothing
var execute = function() {
    if (null === level || level.doneUpdating()) {
        return;
    }
    var minFrameTime = 15;
    frameComplete = level.complete();
    timerComplete = false;
    setTimeout(function() {
        timerComplete = true;
        if (frameComplete && running) {
            execute();
        }
    }, minFrameTime);
    if (frameComplete) {
        level.update();
        level.draw(ctx);
        if (level.doneUpdating()) {
            running = false;
            updateMenu();
        }
    } else {
        worker.postMessage({ type: 'execute', world: level.getWorld() });
    }
}

/**
 * Installs the new user code and runs it.
 *
 * @param {String} code
 */
exports.install = function(code) {
    // Make sure web workers are supported
    if (!window.Worker) {
        modal.show('Your browser must support web workers to play the game.');
        return;
    }
    // Clear the console
    ui.clearConsole();
    // Kill any currently running worker
    if (null !== worker) {
        worker.terminate();
        frameComplete = timerComplete = true;
    }
    // Spawn a new worker and listen for messages
    worker = new Worker('src/worker.js');
    worker.onmessage = function(e) {
        message = e.data;
        if ('undefined' === typeof message.type) {
            return;
        }
        switch (message.type) {
        case 'console':
            ui.writeConsole(message.value, message.level);
            break;
        case 'error':
            // Write the error to the console and stop executing
            var errorMsg = message.value;
            if (message.lineNumber) {
                errorMsg = 'line ' + message.lineNumber + ', col ' +
                    message.columnNumber + ': ' + errorMsg;
            }
            ui.writeConsole(errorMsg, 'error');
            running = false;
            updateMenu();
            break;
        case 'complete':
            // Update the game objects, redraw the frame, and set it
            // to complete
            if (null !== level) {
                level.updateWorld(message.world);
                level.update();
                level.draw(ctx);
                if (level.doneUpdating()) {
                    running = false;
                    updateMenu();
                }
                if ('win' === level.complete()) {
                    menubar.addWonLevel(level.name);
                }
            }
            frameComplete = true;
            if (timerComplete && running) {
                execute();
            }
            break;
        }
    };
    worker.onerror = function(e) {
        ui.writeConsole(e.message, 'error');
    };
    worker.postMessage({ type: 'install', code: code });
    // Save the installed code so that we can restart
    installedCode = code;
    updateMenu();
};

/**
 * Runs the currently installed user code, if it was paused.
 */
exports.run = function() {
    // Start the game worker's execution, if it exists
    if (null === worker || null === level || level.doneUpdating()) {
        return;
    }
    running = true;
    updateMenu();
    if (frameComplete && timerComplete) {
        execute();
    }
};

/**
 * Pauses the currently running user code.
 */
exports.pause = function() {
    // Pause the game worker's execution
    running = false;
    updateMenu();
};

/**
 * Loads a game level from an object given in the required format.
 *
 * @param {Level} newLevel
 */
exports.load = (function() {
    var showHelp = true;
    try {
        if ('showHelp' in localStorage) {
            showHelp = JSON.parse(localStorage.getItem('showHelp'));
        }
    } catch (e) { }
    return function(newLevel) {
        // Save the initial state and start the game
        level = newLevel;
        level.viewport.reset();
        if (mousePos) {
            level.highlightObjAt(mousePos);
        }
        level.setDebugMode(debugMode);
        exports.restart();
        level.initBounds(ctx);
        exports.draw();
        // Show the help dialog if this level has help text
        if (newLevel.help && showHelp) {
            var helpTag = $('<p />')
                .text(newLevel.help)
                .css('padding-bottom', '5px');
            var divTag = $('<div />')
                .css('text-align', 'right');
            var labelTag = $('<label />');
            var checkboxTag = $('<input tabIndex="999" type="checkbox" />')
                .on('change', function() {
                    showHelp = !$(this).is(':checked');
                    try {
                        localStorage.setItem('showHelp',
                                             JSON.stringify(showHelp));
                    } catch (e) { }
                });
            labelTag.append(checkboxTag, ' Prevent showing help dialogs.');
            divTag.append(labelTag);
            modal.show($('<div />').append(helpTag, divTag));
        }
    };
})();

/**
 * Resets the game to the initial conditions for the currently
 * loaded level.
 */
exports.restart = function() {
    // Reset the game to the level's initial conditions and redraw
    if (null !== installedCode) {
        exports.install(installedCode);
        running = false;
    }
    if (null !== level) {
        var playerFocus = level.viewport.isFocused();
        level.init();
        if (playerFocus) {
            level.viewToPlayer();
        }
        exports.draw();
    }
    updateMenu();
};

/**
 * Redraws the game state on the canvas.
 */
exports.draw = function() {
    // Redraws the game state on the canvas
    if (null === level) {
        return;
    }
    level.draw(ctx);
};

// Used to display extra information when a highlighted object is clicked
var showClickedObj = function() {
    if (!level) {
        return;
    }
    if (!level.highlightedObj) {
        return;
    }
    // Draw object centered on a canvas by itself
    var container = $('<div />').addClass('game-obj-info');
    var canvasWidth = 500;
    var canvasHeight = 500;
    var infoCanvas = $('<canvas width="' + canvasWidth + '" ' +
                       'height="' + canvasHeight + '" />');
    var infoCtx = infoCanvas[0].getContext('2d');
    level.drawCenteredObject(infoCtx, level.highlightedObj);
    var infoDiv = $('<div />');
    var obj = level.highlightedObj.getObj();
    infoDiv.append($('<h2 />').text(obj.type));
    var indent = '  ';
    var getPrettyObj = function(o, prefix) {
        var str = '';
        if (Array.isArray(o)) {
            if (o.length) {
                str += prefix + '[\n';
                for (var i = 0; i < o.length; i++) {
                    str += prefix + indent +
                        getPrettyObj(o[i], prefix + indent) + '\n';
                }
                str += prefix + ']\n';
            } else {
                str += prefix + '[]\n';
            }
        } else if (o && 'object' === typeof(o)) {
            var propNames = [];
            for (propName in o) {
                propNames.push(propName);
            }
            var propOrder = [
                'id', 'type', 'name', 'objective', 'health', 'fired',
                'equipped', 'weapons', 'win', 'lose', 'radius', 'width',
                'height', 'bounds', 'pos', 'vel', 'accel', 'thrust',
                'thrustPower', 'turnPower'
            ];
            propNames.sort(function(a, b) {
                var aIndex = propOrder.indexOf(a),
                    bIndex = propOrder.indexOf(b);
                if (-1 === aIndex) {
                    aIndex = propOrder.length;
                }
                if (-1 === bIndex) {
                    bIndex = propOrder.length;
                }
                return aIndex - bIndex;
            });
            if (propNames.length) {
                str += prefix + '{\n';
                for (var i = 0; i < propNames.length; i++) {
                    var propName = propNames[i];
                    var prop  = o[propName];
                    str += prefix + indent + propName + ': ' +
                        getPrettyObj(prop, prefix + indent) + '\n';
                }
                str += prefix + '}\n';
            } else {
                str += prefix + '{}\n';
            }
        } else {
            str += prefix + o + '\n';
        }
        return str.trim();
    }
    infoDiv.append($('<pre />').text(getPrettyObj(obj, '')));
    container.append(infoCanvas, infoDiv);
    modal.show(container);
    $('#modal-window').css('width', '800px');
    exports.pause();
}

/**
 * Binds DOM elements to variables and loads a blank level via jQuery
 * ready() function.
 */
exports.init = function() {
    $(document).ready(function() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        exports.load(new Level({
            name: 'Select Level',
            bounds: 'player',
            stateFunc: function() { return {}; }
        }));
        exports.install('');
        var moved = true;
        $(canvas).on('mousedown touchstart', function(e) {
            moved = false;
        });
        $(canvas).on('mousemove touchmove touchleave touchcancel',
		     function() {
            moved = true;
        });
        $(canvas).on('mouseup touchend', function() {
            if (!moved) {
                showClickedObj();
            }
        });
    });
};

/**
 * Focuses the viewport on the player's ship.
 */
exports.viewToPlayer = function() {
    if (level) {
        playerFocus = true;
        level.viewToPlayer();
        exports.draw();
    }
};

/**
 * Sets the viewport to enclose the entire level within its bounds.
 */
exports.viewToBounds = function() {
    if (level) {
        level.viewToBounds(ctx.canvas.width, ctx.canvas.height);
        exports.draw();
    }
};

/**
 * Translates the viewport by a given number of pixels (in viewport
 * coordinates, not game coordinates).
 *
 * @param {Number} x
 * @param {Number} y
 */
exports.viewTranslate = function(x, y) {
    if (level) {
        level.viewport.focus(null);
        level.viewTranslate(x, y);
        exports.draw();
    }
};

/**
 * Scales the viewport by a given factor.
 *
 * @param {Number} factor
 */
exports.viewScale = function(factor) {
    if (level) {
        level.viewScale(factor, ctx.canvas.width, ctx.canvas.height);
        exports.draw();
    }
};

/**
 * Changes the mouse's current coordinates. Used for highlighting
 * hovered-over game objects.
 *
 * @param {Point} newMousePos
 */
exports.changeMousePos = function(newMousePos) {
    mousePos = { x: newMousePos.x, y: newMousePos.y };
    if (level) {
        level.highlightObjAt(mousePos, ctx);
    }
};

/**
 * Toggles debug mode and updates the level, possibly redrawing.
 */
exports.toggleDebugMode = function() {
    debugMode = !debugMode;
    if (level) {
        level.setDebugMode(debugMode);
        exports.draw();
    }
};
