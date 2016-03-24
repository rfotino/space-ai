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
var FriendlyTarget = require('./obj/FriendlyTarget.js');
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
        help: 'Your objective is to get your ship into the reach target ' +
            'straight ahead. Hint: use the thrust() function - check the ' +
            'docs for details.',
        stateFunc: function() { return {
            player: new Player({ pos: { angular: Math.PI / 2 } }),
            objects: [
                new ReachTarget({
                    win: true,
                    pos: { x: 0, y: 250 }
                })
            ]
        }; }
    }),
    // An asteroid straight ahead and a reach target to the left
    new Level({
        name: 'Turn',
        help: 'If you run the same code as before, you will run straight ' +
            'into the asteroid! To avoid this, use the turn() function - ' +
            'check the docs for details.',
        stateFunc: function() { return {
            player: new Player({ pos: { angular: Math.PI / 2 } }),
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
    // A destructible target is randomly positioned around the player
    new Level({
        name: 'Destroy',
        help: 'To complete this level you will need to equip a weapon and ' +
            'fire at the enemy target.',
        stateFunc: function() {
            var angle = Math.random() * Math.PI * 2;
            var radius = 250;
            return {
                player: new Player({
                    pos: { angular: Math.PI / 2 },
                    weapons: [
                        new LaserWeapon(),
                        new RocketWeapon({ ammo: 3 })
                    ],
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
    // A reach target is randomly positioned around the player
    new Level({
        name: 'Adapt',
        help: 'You turned a quarter rotation counterclockwise before - ' +
            'how about turning an arbitrary amount? Hint: use the ' +
            'Math.atan2(y, x) function.',
        stateFunc: function() {
            var angle = Math.random() * Math.PI * 2;
            var radius = 250;
            return {
                player: new Player({ pos: { angular: Math.PI / 2 } }),
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
    // An asteroid in between the player and a reach target
    new Level({
        name: 'Obstacle',
        help: 'There is an obstacle in the way of the reach target! You ' +
            'will need a more sophisticated flight path to complete this ' +
            'level.',
        stateFunc: function() { return {
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
    // A level where you have to lure away space mines
    new Level({
        name: 'Lure',
        help: 'Be careful of the space mines! You will need to lure them ' +
            'away before charging in.',
        stateFunc: function() {
            var mines = [];
            var xPos = 500;
            for (var i = 0; i < 8; i++) {
                var r = 0 === i % 2 ? 100 : 110;
                mines.push(new SpaceMine({
                    pos: {
                        x: xPos + (r * Math.cos(i * Math.PI / 4)),
                        y: r * Math.sin(i * Math.PI / 4)
                    }
                }));
            }
            return {
                player: new Player({ health: 25 }),
                objects: [
                    new ReachTarget({
                        pos: { x: xPos, y: 0 },
                        win: true
                    })
                ].concat(mines)
            };
        }
    }),
    // A level where you have to grab some ammo before destroying enemy ships
    new Level({
        name: 'Grab Ammo',
        help: 'You might want to grab some ammunition before taking on ' +
            'those enemy ships!',
        stateFunc: function() {
            var theta = Math.PI / 4,
                r = 75,
                d = 500;
            return {
                player: new Player({ health: 5 }),
                objects: [
                    new WeaponPowerup({
                        pos: { x: 1000, y: 0 },
                        weapon: new RocketWeapon({ ammo: 5 })
                    }),
                    new EnemyShip({
                        pos: {
                            x: d + (r * Math.cos(theta)),
                            y: r * Math.sin(theta)
                        },
                        win: true
                    }),
                    new EnemyShip({
                        pos: {
                            x: d + (r * Math.cos(theta + (Math.PI * 2 / 3))),
                            y: r * Math.sin(theta + (Math.PI * 2 / 3))
                        },
                        win: true
                    }),
                    new EnemyShip({
                        pos: {
                            x: d + (r * Math.cos(theta + (Math.PI * 4 / 3))),
                            y: r * Math.sin(theta + (Math.PI * 4 / 3))
                        },
                        win: true
                    })
                ]
            };
        }
    }),
    // A friendly target is surrounded by space mines - pick them off
    // before they blow up your friend!
    new Level({
        name: 'Hostage Crisis',
        help: 'Those space mines are holding a friendly target hostage! ' +
            'Destroy the mines before they blow your friend to bits.',
        stateFunc: function() {
            var mines = [];
            for (var i = 0; i < 8; i++) {
                mines.push(new SpaceMine({
                    pos: {
                        x: 500 + (75 * Math.cos(i * Math.PI / 4)),
                        y: 75 * Math.sin(i * Math.PI / 4)
                    },
                    range: 400,
                    win: true
                }));
            }
            return {
                player: new Player({
                    health: 25,
                    weapons: [ new LaserWeapon({ range: 400 }) ],
                    equipped: 'laser'
                }),
                objects: [
                    new FriendlyTarget({
                        pos: { x: 500, y: 0 },
                        health: 1,
                        lose: true
                    })
                ].concat(mines)
            };
        }
    }),
    // Some enemy ships guard enemy targets - wait until you have an opening
    new Level({
        name: 'Sentries',
        help: 'Destroy the enemy targets, but don\'t let those ships see you!',
        stateFunc: function() {
            var targetPositions = [
                { x: 1000, y: 350 },
                { x: 1000, y: -350 }
            ];
            var r = 250;
            var enemies = [];
            for (var i = 0; i < targetPositions.length; i++) {
                var p = targetPositions[i];
                enemies.push(new EnemyTarget({ pos: { x: p.x, y: p.y } }));
                var path = [
                    { x: p.x - r, y: p.y + r },
                    { x: p.x + r, y: p.y + r },
                    { x: p.x + r, y: p.y - r },
                    { x: p.x - r, y: p.y - r }
                ];
                if (Math.random() < 0.5) {
                    path.reverse();
                }
                var n = Math.floor(Math.random() * 4);
                while (n--) {
                    path.unshift(path.pop());
                }
                enemies.push(new EnemyShip({
                    pos: { x: path[0].x, y: path[0].y },
                    path: path
                }));
            }
            return {
                player: new Player({
                    health: 5,
                    weapons: [ new LaserWeapon() ]
                }),
                objects: [
                    new WeaponPowerup({
                        pos: {
                            x: 500 + (Math.random() - 0.5) * 500,
                            y: (Math.random() - 0.5) * 500
                        },
                        weapon: new RocketWeapon({ ammo: 2 })
                    })
                ].concat(enemies)
            };
        }
    }),
    // You have three targets to defend, and enemy ships to destroy
    new Level({
        name: 'Aggro',
        help: 'Don\'t let the enemy ships destroy your targets!',
        stateFunc: function() {
            var friendlies = [];
            for (var i = 0; i < 3; i++) {
                friendlies.push(new FriendlyTarget({
                    pos: { x: -250 + (i * 250), y: -150 },
                    lose: true
                }));
            }
            var enemies = [];
            var numEnemies = 8;
            var distBetween = 400;
            for (var i = 0; i < numEnemies; i++) {
                var x = 500 * (Math.random() - 0.5);
                var y = distBetween * (i + 1);
                enemies.push(new EnemyShip({
                    health: 25,
                    pos: { x: x, y: y },
                    path: [
                        { x: x, y: 0 },
                        { x: x, y: distBetween * numEnemies }
                    ],
                    chaseRange: 500,
                    win: true
                }));
            }
            return {
                player: new Player({
                    pos: { angular: Math.PI / 2 },
                    weapons: [ new LaserWeapon() ],
                    equipped: 'laser'
                }),
                objects: friendlies.concat(enemies)
            };
        },
        gameOverFunc: function(state) {
            if (!state.player.alive) {
                return 'lose';
            }
            var allFriendlyTargetsDestroyed = true;
            var allEnemyShipsDestroyed = true;
            for (var i = 0; i < state.targets.length; i++) {
                var target = state.targets[i];
                if ('defend' === target.objective) {
                    if (!target.complete()) {
                        allFriendlyTargetsDestroyed = false;
                    }
                } else if ('ship' === target.type) {
                    if (!target.complete()) {
                        allEnemyShipsDestroyed = false;
                    }
                }
            }
            if (allFriendlyTargetsDestroyed) {
                return 'lose';
            } else if (allEnemyShipsDestroyed) {
                return 'win';
            }
        }
    })
];
