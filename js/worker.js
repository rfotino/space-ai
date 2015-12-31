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
        self: undefined,
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
        thrust: function(power) {
            var player = world.player;
            if (undefined === power) {
                return player.thrustPower;
            } else if (1 < power) {
                power = 1;
            } else if (power < 0) {
                power = 0;
            }
            var maxThrust = 0.5;
            var thrust = maxThrust * power;
            player.thrustPower = power;
            player.thrust = maxThrust * player.thrustPower;
        },
        turn: function(power) {
            var player = world.player;
            if (undefined === power) {
                return player.turnPower;
            } else if (1 < power) {
                power = 1;
            } else if (power < -1) {
                power = -1;
            }
            var maxAngularAccel = 0.005;
            player.turnPower = power;
            player.accel.angular = maxAngularAccel * player.turnPower;
        },
        pos: function() {
            return JSON.parse(JSON.stringify(world.player.pos));
        },
        vel: function() {
            return JSON.parse(JSON.stringify(world.player.vel));
        },
        accel: function() {
            return JSON.parse(JSON.stringify(world.player.accel));
        },
        radar: function(type) {
            if (undefined === type) {
                // No filter, return everything
                return JSON.parse(JSON.stringify(world.objects));
            } else {
                // Filter by type
                var filteredObjects = world.objects.filter(function(obj) {
                    return obj.type === type;
                });
                return JSON.parse(JSON.stringify(filteredObjects));
            }
        },
        fire: function(x, y) {
            // TODO: implement fire(x, y) API function
        },
        equip: function(weapon) {
            // TODO: implement equip(weapon) API function
        },
        weapons: function() {
            // TODO: implement weapons() API function
        },
        // Persistent storage for user code
        storage: {}
    };
    // Create a sandbox for user code
    function install(userCode) {
        var params = [], args = [];
        for (var param in locals) {
            if (locals.hasOwnProperty(param)) {
                params.push(param);
                args.push(locals[param]);
            }
        }
        try {
            var that = {};
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
            // Install the new user code
            install(message.code);
            break;
        case 'execute':
            // Refresh the world and execute the user code again
            world = message.world;
            execute();
            break;
        }
    };
})();
