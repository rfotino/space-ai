/**
 * Copyright (c) 2015 Robert Fotino.
 */

// Wrap this in a function so that nothing is accessible from
// a global context where user code is executed
(function() {
    var userFunc = null;
    var world = null;
    var locals = {
        // Don't allow sending/receiving of messages by user code
        onmessage: undefined,
        postMessage: undefined,
        // Change console context in user code
        console: {
            log: function(str) {
                postMessage({ type: 'console', level: 'log', value: str });
            },
            warn: function(str) {
                postMessage({ type: 'console', level: 'warn', value: str });
            },
            error: function(str) {
                postMessage({ type: 'console', level: 'error', value: str });
            }
        },
        // API functions accessible from user code
        // TODO: complete this list of API functions
        thrust: function(power) {
            if (undefined === power) {
                return world.player.thrustPower;
            } else if (1 < power) {
                power = 1;
            } else if (power < -1) {
                power = -1;
            }
            var maxThrust = 0.5;
            world.player.thrustPower = power;
            world.player.thrust = maxThrust * world.player.thrustPower;
        },
        turn: function(power) {
            if (undefined === power) {
                return world.player.turnPower;
            } else if (1 < power) {
                power = 1;
            } else if (power < -1) {
                power = -1;
            }
            var maxAngularAcceleration = 0.005;
            world.player.turnPower = power;
            world.player.angularAcceleration =
                maxAngularAcceleration * world.player.turnPower;
        }
    };
    function install(userCode) {
        // Create a sandbox for user code
        var params = [], args = [];
        for (var param in locals) {
            if (locals.hasOwnProperty(param)) {
                params.push(param);
                args.push(locals[param]);
            }
        }
        try {
            var that = { };
            var context1 = Array.prototype.concat.call(that, params, userCode);
            var sandbox = new (Function.prototype.bind.apply(Function, context1));
            var context2 = Array.prototype.concat.call(that, args);
            userFunc = Function.prototype.bind.apply(sandbox, context2);
        } catch (e) {
            postMessage({ type: 'error',
                          value: e.message,
                          lineNumber: e.lineNumber,
                          columnNumber: e.columnNumber });
        }
    };
    function execute() {
        // Make sure there is user code to execute
        if (null === userFunc) {
            return;
        }
        // Try to execute user code
        try {
            userFunc();
        } catch (e) {
            postMessage({ type: 'error',
                          value: e.message,
                          lineNumber: e.lineNumber,
                          columnNumber: e.columnNumber });
        }
        // Let the main thread know that we have finished execution
        postMessage({ type: 'complete', world: world });
    };
    // Handle messages from the main thread
    onmessage = function(e) {
        var message = e.data;
        switch (message.type) {
        case 'install':
            install(message.code);
            break;
        case 'execute':
            world = message.world;
            execute();
            break;
        default:
            return;
        }
    };
})();
