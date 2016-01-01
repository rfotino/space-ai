/**
 * Copyright (c) 2015 Robert Fotino.
 */

var game = {
    /**
     * install(code);
     * Installs the new user code and runs it.
     */
    install: function(code) { },
    /**
     * run();
     * Runs the currently installed user code, if it was paused.
     */
    run: function() { },
    /**
     * pause();
     * Pauses the currently running user code.
     */
    pause: function() { },
    /**
     * load(level);
     * Loads a game level from an object given in the required format.
     */
    load: function(level) { },
    /**
     * restart();
     * Resets the game to the initial conditions for the currently
     * loaded level.
     */
    restart: function() { },
    /**
     * draw();
     * Redraws the game state on the canvas.
     */
    draw: function() { }
};

// Wrap local variables in a function so that we hide implementation
// details and don't pollute the global scope.
(function() {
    var canvas, ctx, worker = null, running = false,
        frameComplete = true, timerComplete = true,
        level = null, installedCode = null;

    // Begins executing the user's code for the next frame, and sets a timer
    // for the minimum length of a frame. If the game is over, this does nothing
    function execute() {
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

    game.install = function(code) {
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
                break;
            case 'complete':
                // Update the game objects, redraw the frame, and set it
                // to complete
                if (null !== level) {
                    level.setWorld(message.world);
                    level.update();
                    level.draw(ctx);
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
    };
    game.run = function() {
        // Start the game worker's execution, if it exists
        if (null === worker) {
            return;
        }
        running = true;
        if (frameComplete && timerComplete) {
            execute();
        }
    };
    game.pause = function() {
        // Pause the game worker's execution
        running = false;
    };
    game.load = function(newLevel) {
        // Save the initial state and start the game
        level = newLevel;
        game.restart();
    };
    game.restart = function() {
        // Reset the game to the level's initial conditions and redraw
        if (null !== installedCode) {
            game.install(installedCode);
        }
        if (null !== level) {
            level.init();
            game.draw();
        }
    };
    game.draw = function() {
        // Redraws the game state on the canvas
        if (null === level) {
            return;
        }
        level.draw(ctx);
    };

    $(document).ready(function() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
    });
})();
