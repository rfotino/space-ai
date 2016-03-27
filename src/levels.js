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

/**
 * A function to generate a concentric square maze out of asteroids. Takes
 * in an array of numbers that each represent the length of one of the sides
 * of that square. Each concentric square layer has a gap of two asteroids
 * to allow passage into the next layer. Each layer also has an asteroid to
 * block the path somewhere along its route. All square layers are centered
 * around (0, 0).
 *
 * @param {Number[]} squareSizes
 * @return {Object} An object with a Vector property called 'playerPos' that
 * should be used as the starting position of the player's ship, and an
 * Asteroid array property that is the maze of asteroids itself.
 */
function getSquareMaze(squareSizes) {
    // Make sure the squareSizes are in decending order
    squareSizes.sort(function(a, b) { return a - b; }).reverse();
    // Define a function to add one square layer to the maze
    var asteroids = [];
    var addSquare = function(width, innerWidth, outerInfo) {
        var radius = 70; // Asteroid radius
        var diameter = radius * 2; // Asteroid diameter
        var count = Math.ceil(width / diameter); // Asteroids per side
        var top = [], right = [], bottom = [], left = []; // 4 asteroid lines
        // Generate all 4 sides of the square as coordinates
        for (var i = 0; i < count; i++) {
            var p = {
                x: (i - ((count - 1) / 2))
                    * ((width + diameter) / count),
                y: width / 2
            };
            top.push(p);
            bottom.push({ x: p.x, y: -p.y });
            if (i !== 0 && i !== count - 1) {
                left.push({ x: -p.y, y: p.x });
                right.push({ x: p.y, y: p.x });
            }
        }
        // Concatenate all 4 sides into a square such that the order of
        // coordinates is always clockwise
        var square = top.concat(right.reverse(),
                                bottom.reverse(), left);
        // Store data about the layer's gap and blocker asteroid in 'info'
        var info = {};
        while (true) {
            // Choose a random pair of adjacent asteroids to be the gap, and
            // do some math to figure out which side the gap is on
            var gap = Math.floor((square.length - 1) * Math.random());
            var info = { gap: {
                x: (square[gap].x + square[gap + 1].x) / 2,
                y: (square[gap].y + square[gap + 1].y) / 2
            } };
            var gapAngle = Math.atan2(info.gap.y, info.gap.x);
            var sideAngle = ((9 * Math.PI / 4) + gapAngle) % (2 * Math.PI);
            // 0, 1, 2, 3 = right, top, left, bottom
            info.gap.side = Math.floor(sideAngle * 2 / Math.PI);
            // If the gap is on the same side as the outer layer's blocker
            // asteroid, reset 'info' and try again
            if ((outerInfo && outerInfo.blocker
                 && info.gap.side === outerInfo.blocker.side)
                || (outerInfo && info.gap.side === outerInfo.gap.side)) {
                info = {};
            } else {
                // Add all the asteroids to the main array except the ones
                // that are part of the gap
                for (var i = 0; i < square.length; i++) {
                    if (i === gap || i === gap + 1) {
                        continue;
                    }
                    var p = square[i];
                    asteroids.push(new Asteroid({
                        pos: { x: p.x, y: p.y },
                        radius: radius + 5 // Increase radius to tighten gaps
                    }));
                }
                break;
            }                
        }
        // If there is no more inner layer, do not have a blocker asteroid for
        // this layer
        if (!innerWidth) {
            return info;
        }
        // Otherwise create a blocker asteroid for this layer and add it to the
        // overall list of asteroids; make sure it is not on the same side as
        // the gap
        info.blocker = {};
        do {
            info.blocker.side = Math.floor(4 * Math.random());
        } while (info.blocker.side === info.gap.side);
        var blockerRadius = ((width - innerWidth) / 4) - radius;
        var blockerRange = innerWidth - (2 * blockerRadius);
        var blockerPos = blockerRange * (Math.random() - 0.5);
        var p = { x: (width + innerWidth) / 4, y: blockerPos };
        switch (info.blocker.side) {
        case 0:
        default:
            info.blocker.pos = { x: p.x, y: p.y };
            break;
        case 1:
            info.blocker.pos = { x: p.y, y: p.x };
            break;
        case 2:
            info.blocker.pos = { x: -p.x, y: p.y };
            break;
        case 3:
            info.blocker.pos = { x: p.y, y: -p.x };
            break;
        }
        asteroids.push(new Asteroid({
            pos: {
                x: info.blocker.pos.x,
                y: info.blocker.pos.y
            },
            radius: blockerRadius
        }));
        return info;
    }; // End addSquare() helper function
    // Add all layers of squares given in squareSizes to the list of asteroids.
    var playerPos;
    for (var squareInfo, i = 0; i < squareSizes.length; i++) {
        var innerWidth = i + 1 < squareSizes.length ? squareSizes[i + 1] : 0;
        squareInfo = addSquare(squareSizes[i], innerWidth, squareInfo);
        // Place the player in the gap of the outermost layer, facing
        // the origin
        if (0 === i) {
            playerPos = {
                x: squareInfo.gap.x,
                y: squareInfo.gap.y,
                angular: Math.atan2(-squareInfo.gap.y, -squareInfo.gap.x)
            };
        }
    }
    return {
        asteroids: asteroids,
        playerPos: playerPos
    };
}


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
        bounds: { x: -320, y: -320, width: 640, height: 640 },
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
        bounds: { x: -320, y: -320, width: 640, height: 640 },
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
        bounds: { x: -50, y: -250, width: 600, height: 500 },
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
        bounds: { x: -50, y: -250, width: 700, height: 500 },
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
        bounds: { x: -50, y: -300, width: 1075, height: 600 },
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
        bounds: { x: -50, y: -250, width: 675, height: 500 },
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
        bounds: { x: -50, y: -670, width: 1350, height: 1340 },
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
                player: new Player({ health: 5 }),
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
        bounds: { x: -320, y: -220, width: 640, height: 690 },
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
    }),
    // A level with a randomly generated asteroid field and a reach
    // target on the other side
    new Level({
        name: 'Asteroid Field',
        help: 'Sir, the odds of successfully navigating an asteroid ' +
            'field are 3,720 to 1!',
        stateFunc: function() {
            var asteroids = [];
            for (var i = 0; i < 12; i++) {
                // Top wall of asteroids
                asteroids.push(new Asteroid({
                    pos: { x: (i - 1) * 150, y: 375 },
                    radius: 75
                }));
                // Bottom wall of asteroids
                asteroids.push(new Asteroid({
                    pos: { x: (i - 1) * 150, y: -375 },
                    radius: 75
                }));
                // Left wall of asteroids
                if (i < 4) {
                    asteroids.push(new Asteroid({
                        pos: { x: -150, y: (i - 1.5) * 150 },
                        radius: 75
                    }));
                }
                // Asteroid field
                if (i < 4) {
                    asteroids.push(new Asteroid({
                        pos: {
                            x: 250 + (400 * i),
                            y: 300 * (Math.random() - 0.5)
                        },
                        radius: 150
                    }));
                }
            }
            return {
                objects: [
                    new ReachTarget({ pos: { x: 1250, y: 0 }, win: true })
                ].concat(asteroids)
            };
        }
    }),
    // Navigate through a mine field to get to the reach target
    new Level({
        name: 'Mine Field',
        help: 'Don\'t touch any of those mines!',
        stateFunc: function() {
            var asteroids = [];
            for (var i = 0; i < 12; i++) {
                // Top wall of asteroids
                asteroids.push(new Asteroid({
                    pos: { x: (i - 1) * 150, y: 375 },
                    radius: 75
                }));
                // Bottom wall of asteroids
                asteroids.push(new Asteroid({
                    pos: { x: (i - 1) * 150, y: -375 },
                    radius: 75
                }));
                // Left wall of asteroids
                if (i < 4) {
                    asteroids.push(new Asteroid({
                        pos: { x: -150, y: (i - 1.5) * 150 },
                        radius: 75
                    }));
                }
            }
            var mines = [];
            var inTheWayIndex = Math.floor(10 * Math.random());
            for (var i = 0; i < 10; i++) {
                var y;
                if (i === inTheWayIndex) {
                    y = 0;
                } else {
                    y = -250 + (500 * Math.random());
                }
                mines.push(new SpaceMine({
                    pos: {
                        x: 200 + (130 * i),
                        y: y
                    }
                }));
            }
            return {
                player: new Player({ health: 25 }),
                objects: [
                    new ReachTarget({ pos: { x: 1500, y: 0 }, win: true })
                ].concat(asteroids, mines)
            };
        }
    }),
    // Enemy ships in a formation
    new Level({
        name: 'Formation',
        help: 'It might be best to pick off those enemy ships one at a time.',
        stateFunc: function() {
            var enemies = [];
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 3; j++) {
                    var p = { x: -195 + (i * 130), y: 500 + (j * 130) };
                    enemies.push(new EnemyShip({
                        health: 25,
                        pos: { x: p.x, y: p.y + 50 },
                        path: [
                            { x: p.x + 250, y: p.y + 50 },
                            { x: p.x + 250, y: p.y - 50 },
                            { x: p.x - 250, y: p.y - 50 },
                            { x: p.x - 250, y: p.y + 50}
                        ],
                        win: true
                    }));
                }
            }
            return {
                player: new Player({
                    pos: { angular: Math.PI / 2 },
                    weapons: [ new LaserWeapon({ range: 400 }) ],
                    equipped: 'laser'
                }),
                objects: [
                    new WeaponPowerup({
                        pos: { x: -550, y: 380 },
                        weapon: new RocketWeapon({ ammo: 6 })
                    }),
                    new HealthPowerup({
                        pos: { x: 550, y: 380 },
                        health: 50
                    }),
                    new WeaponPowerup({
                        pos: { x: 550, y: 880 },
                        weapon: new RocketWeapon({ ammo: 6 })
                    }),
                    new HealthPowerup({
                        pos: { x: -550, y: 880 },
                        health: 50
                    })
                ].concat(enemies)
            }
        }
    }),
    // A circular maze with a reach target in the middle
    new Level({
        name: 'Circular Maze',
        help: 'You will need to enter and navigate this maze to get to the ' +
            'reach target within.',
        stateFunc: function() {
            var asteroids = [];
            var addRing = function(radius, gap) {
                var count = Math.floor(2 * radius * Math.PI / 150);
                if ('undefined' === typeof gap) {
                    gap = Math.floor(count * Math.random());
                }
                for (var i = 0; i < count; i++) {
                    if (i === gap) {
                        continue;
                    }
                    var angle = 2 * Math.PI * i / count;
                    asteroids.push(new Asteroid({
                        pos: {
                            x: radius * Math.cos(angle),
                            y: radius * Math.sin(angle)
                        },
                        radius: 75
                    }));
                }
            };
            addRing(1000, 0);
            addRing(600);
            addRing(200);
            return {
                player: new Player({ pos: { x: 1000, angular: Math.PI } }),
                objects: [ new ReachTarget({ win: true }) ].concat(asteroids)
            };
        }
    }),
    // A square maze
    new Level({
        name: 'Square Maze',
        help: 'Solve this randomly-generated maze to get to the reach target.',
        stateFunc: function() {
            var maze = getSquareMaze([ 2000, 1250, 500 ]);
            return {
                player: new Player({ pos: maze.playerPos }),
                objects: [ new ReachTarget({ win: true }) ].concat(maze.asteroids)
            };
        }
    })
];
