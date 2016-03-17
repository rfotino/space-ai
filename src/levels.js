/**
 * Copyright (c) 2015 Robert Fotino.
 *
 * A module that returns an array of game levels. New levels can either be
 * defined here or in separate files and included with a call to require.
 */

var Level = require('./obj/Level.js');
var Player = require('./obj/Player.js');
var Asteroid = require('./obj/Asteroid.js');
var ReachTarget = require('./obj/ReachTarget.js');
var EnemyTarget = require('./obj/EnemyTarget.js');
var LaserWeapon = require('./obj/LaserWeapon.js');
var RocketWeapon = require('./obj/RocketWeapon.js');
var SpaceMine = require('./obj/SpaceMine.js');
var EnemyShip = require('./obj/EnemyShip.js');
var HealthPowerup = require('./obj/HealthPowerup.js');
var WeaponPowerup = require('./obj/WeaponPowerup.js');

// An array of levels that can be loaded from the level selector
module.exports = [
    // A reach target straight ahead
    new Level({
        name: 'Thrust',
        help: 'Your objective is to get your ship into the Reach Target ' +
            'straight ahead. Hint: use the thrust() function - check the ' +
            'docs for details.',
        stateFunc: function() { return {
            objects: [
                new ReachTarget({
                    win: true,
                    pos: { x: 0, y: 250 }
                })
            ]
        }; }
    }),
    // A static destructible target straight ahead and equipped lasers
    new Level({
        name: 'Fire',
        stateFunc: function() { return {
            player: new Player({
                weapons: [ new LaserWeapon() ],
                equipped: 'laser'
            }),
            objects: [
                new EnemyTarget({
                    win: true,
                    pos: { x: 0, y: 250 },
                    health: 25
                })
            ]
        }; }
    }),
    // A static destructible target straight ahead and unequipped rockets
    new Level({
        name: 'Equip and Fire',
        stateFunc: function() { return {
            player: new Player({ weapons: [ new RocketWeapon({ ammo: 1 }) ] }),
            objects: [
                new EnemyTarget({
                    win: true,
                    pos: { x: 0, y: 250 },
                    health: 25
                })
            ]
        }; }
    }),
    // An asteroid straight ahead and a reach target to the left
    new Level({
        name: 'Turn',
        stateFunc: function() { return {
            objects: [
                new Asteroid({
                    pos: { x: 0, y: 250 },
                    radius: 150
                }),
                new ReachTarget({
                    win: true,
                    pos: { x: -250, y: 0 }
                })
            ]
        }; }
    }),
    // A reach target is randomly positioned around the player
    new Level({
        name: 'Turn Anywhere',
        stateFunc: function() {
            var angle = Math.random() * Math.PI * 2;
            var radius = 250;
            return {
                objects: [
                    new ReachTarget({
                        win: true,
                        pos: {
                            x: radius * Math.cos(angle),
                            y: radius * Math.sin(angle)
                        }
                    })
                ]
            };
        }
    }),
    // A destructible target is randomly positioned around the player
    new Level({
        name: 'Aim and Fire',
        stateFunc: function() {
            var angle = Math.random() * Math.PI * 2;
            var radius = 250;
            return {
                player: new Player({
                    weapons: [ new LaserWeapon() ],
                    equipped: 'laser'
                }),
                objects: [
                    new EnemyTarget({
                        win: true,
                        pos: {
                            x: radius * Math.cos(angle),
                            y: radius * Math.sin(angle)
                        },
                        health: 25
                    })
                ]
            };
        }
    }),
    // An asteroid in between the player and a reach target
    new Level({
        name: 'Flight Path',
        stateFunc: function() { return {
            player: new Player({ pos: { angular: 0 } }),
            objects: [
                new Asteroid({
                    pos: { x: 250, y: 0 },
                    radius: 150
                }),
                new ReachTarget({
                    win: true,
                    pos: { x: 500, y: 0 }
                })
            ]
        }; }
    }),
    // Testing some new types of objects
    new Level({
        name: 'Space Mines',
        stateFunc: function() { return {
            player: new Player({
                weapons: [ new LaserWeapon() ],
                equipped: 'laser'
            }),
            objects: [
                new SpaceMine({ pos: { x: 150, y: 0 }, win: true }),
                new SpaceMine({ pos: { x: -150, y: 0 }, win: true }),
                new SpaceMine({ pos: { x: -165, y: 100 }, win: true }),
                new SpaceMine({ pos: { x: 165, y: 100 }, win: true })
            ]
        }; }
    }),
    new Level({
        name: 'Ship Path',
        stateFunc: function() { return {
            player: new Player({
                weapons: [ new LaserWeapon(), new RocketWeapon({ ammo: 3 }) ],
                equipped: 'laser'
            }),
            objects: [
                new EnemyShip({
                    pos: { x: -600, y: 250 },
                    path: [
                        { x: 600, y: 250, speed: 5 },
                        { x: -600, y: 250, speed: 5 }
                    ],
                    win: true
                })
            ]
        }; }
    }),
    new Level({
        name: 'More Ships',
        stateFunc: function() { return {
            objects: [
                new EnemyShip({
                    pos: { x: -100, y: 500 },
                    win: true
                }),
                new EnemyShip({
                    pos: { x: 300, y: 300 },
                    path: [
                        { x: 300, y: -300 },
                        { x: 300, y: 300 }
                    ],
                    win: true
                })
            ]
        }; }
    }),
    new Level({
        name: 'Health Drops',
        stateFunc: function() { return {
            objects: [
                new HealthPowerup({ pos: { x: 0, y: 250 } })
            ]
        }; }
    }),
    new Level({
        name: 'Weapon Drops',
        stateFunc: function() { return {
            objects: [
                new WeaponPowerup({
                    weapon: new RocketWeapon({ ammo: 3 }),
                    pos: { x: 0, y: 150 }
                }),
                new WeaponPowerup({
                    pos: { x: 0, y: 300 }
                })
            ]
        }; }
    })
];
