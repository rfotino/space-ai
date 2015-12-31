/**
 * Copyright (c) 2015 Robert Fotino.
 */

// Wrap this in a function so that nothing is accessible from
// a global context where user code is executed
(function() {
    var userFunc = null;
    var world = null;
    var storage = {};
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
        radar: function(filter) {
            switch (typeof filter) {
            case 'undefined':
                // No filter, return everything
                return JSON.parse(JSON.stringify(world.objects));
            case 'string':
                // Filter by type
                var filteredObjects = world.objects.filter(function(obj) {
                    return obj.type === filter;
                });
                return JSON.parse(JSON.stringify(filteredObjects));
            case 'object':
                // Filter by multiple attributes
                var filteredObjects = world.objects.filter(function(obj) {
                    for (var attr in filter) {
                        if (obj[attr] !== filter[attr]) {
                            return false;
                        }
                    }
                    return true;
                });
                return JSON.parse(JSON.stringify(filteredObjects));
            case 'function':
                // Filter by custom function
                var objectsCopy = JSON.parse(JSON.stringify(world.objects));
                return objectsCopy.filter(filter);
            }
        },
        fire: function(x, y) {
            // Save the location that was fired at for the main thread to use
            switch (arguments.length) {
            case 2:
                // Arguments in fire(x, y) format
                world.player.fired = { x: arguments[0], y: arguments[1] };
                break;
            case 1:
                // Arguments in fire(coord) format
                world.player.fired = { x: arguments[0].x, y: arguments[0].y };
                break;
            case 0:
            default:
                // No arguments or too many
                world.player.fired = false;
                break;
            }
        },
        equip: function(weapon) {
            if (!weapon) {
                // Unequip weapon
                world.player.equipped = null;
            } else {
                // Find the weapon to equip and equip it. The weapon can
                // be either a name or a weapon object
                for (var i = 0; i < world.player.weapons.length; i++) {
                    var w = world.player.weapons[i];
                    if (w.name === weapon.name || w.name === weapon) {
                        world.player.equipped = w.name;
                    }
                }
            }
        },
        equipped: function() {
            // Return the currently equipped weapon (useful for getting
            // ammo or other information)
            for (var i = 0; i < world.player.weapons.length; i++) {
                var weapon = world.player.weapons[i];
                if (world.player.equipped === weapon.name) {
                    return JSON.parse(JSON.stringify(weapon));
                }
            }
            return null;
        },
        weapons: function() {
            // Return a list of weapons available to equip
            return JSON.parse(JSON.stringify(world.player.weapons));
        },
        // Persistent storage for user code
        store: function(key, value) {
            storage[key] = value;
        },
        load: function(key, defaultValue) {
            if (storage.hasOwnProperty(key)) {
                return storage[key];
            } else {
                return defaultValue;
            }
        }
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
