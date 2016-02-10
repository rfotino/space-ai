/**
 * Copyright (c) 2015 Robert Fotino.
 *
 * This defines a module for installing code, running/pausing code, loading
 * levels, restarting, and drawing the game.
 */

define(function(require, exports, module) {
    var $ = require('jquery');
    var ui = require('ui');
    var menubar = require('menubar');
    var Level = require('obj/Level');

    // Declare variables for DOM elements and handling state
    var canvas, ctx, worker = null, running = false,
        frameComplete = true, timerComplete = true,
        level = null, installedCode = null;

    // Begins executing the user's code for the next frame, and sets a timer
    // for the minimum length of a frame. If the game is over, this does nothing
    var execute = function() {
        if (null === level || level.complete()) {
            return;
        }
        var minFrameTime = 15;
        frameComplete = timerComplete = false;
        setTimeout(function() {
            timerComplete = true;
            if (frameComplete && running) {
                execute();
            }
        }, minFrameTime);
        worker.postMessage({ type: 'execute', world: level.getWorld() });
    }

    // Update the run/pause button in the menu to the correct state
    var updateMenu = function() {
        if (null === installedCode || null === level || level.complete()) {
            menubar.setState('waiting');
        } else if (running) {
            menubar.setState('running');
        } else {
            menubar.setState('paused');
        }
    }

    /**
     * install(code);
     * Installs the new user code and runs it.
     */
    exports.install = function(code) {
        // Make sure web workers are supported
        if (!window.Worker) {
            alert('Your browser must support web workers to play the game.');
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
        worker = new Worker('js/worker.js');
        worker.onmessage = function(e) {
            message = e.data;
            if (undefined === message.type) {
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
                    if (level.complete()) {
                        running = false;
                        updateMenu();
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
     * run();
     * Runs the currently installed user code, if it was paused.
     */
    exports.run = function() {
        // Start the game worker's execution, if it exists
        if (null === worker || null === level || level.complete()) {
            return;
        }
        running = true;
        updateMenu();
        if (frameComplete && timerComplete) {
            execute();
        }
    };

    /**
     * pause();
     * Pauses the currently running user code.
     */
    exports.pause = function() {
        // Pause the game worker's execution
        running = false;
        updateMenu();
    };

    /**
     * load(level);
     * Loads a game level from an object given in the required format.
     */
    exports.load = function(newLevel) {
        // Save the initial state and start the game
        level = newLevel;
        exports.restart();
    };

    /**
     * restart();
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
            level.init();
            exports.draw();
        }
        updateMenu();
    };

    /**
     * draw();
     * Redraws the game state on the canvas.
     */
    exports.draw = function() {
        // Redraws the game state on the canvas
        if (null === level) {
            return;
        }
        level.draw(ctx);
    };

    /**
     * init();
     * Binds DOM elements to variables and loads a blank level via jQuery ready() function.
     */
    exports.init = function() {
        $(document).ready(function() {
            canvas = document.getElementById('game-canvas');
            ctx = canvas.getContext('2d');
            exports.load(new Level('Select Level', function() { return {}; }));
        });
    };
});
