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
    restart: function() { }
};

// Wrap local variables in a function so that we hide implementation
// details and don't pollute the global scope.
(function() {
    var canvas, ctx, worker = null, running = false, executing = false;

    game.install = function(code) {
        // Make sure web workers are suppored
        if (!window.Worker) {
            alert('Your browser must support web workers to play the game.');
            return;
        }
        // Kill any currently running worker
        if (null !== worker) {
            worker.terminate();
            executing = false;
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
                ui.writeConsole(message.value, 'error');
                break;
            case 'complete':
                executing = false;
                if (running) {
                    worker.postMessage({ type: 'execute' });
                }
                break;
            }
        };
        worker.onerror = function(e) {
            ui.writeConsole(e.message, 'error');
        };
        worker.postMessage({ type: 'code', value: code });
        game.run();
    };
    game.run = function() {
        // Start the game worker's execution
        running = true;
        if (executing) {
            return;
        } else {
            executing = true;
        }
        worker.postMessage({ type: 'execute' });
    };
    game.pause = function() {
        // Pause the game worker's execution
        running = false;
    };
    game.load = function(level) {
        // TODO: Load the level format
    };
    game.restart = function() {
        // TODO: Reset the game to the level's initial conditions
    };

    $(document).ready(function() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');

        var gameResize = function() {
            var menuBar = $('#menubar');
            var width = $(window).width();
            var height = $(window).height() - $('#menubar').height();
            canvas.width = width;
            canvas.height = height;
        };
        gameResize();
        $(window).resize(gameResize());
    });
})();
