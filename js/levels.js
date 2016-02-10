/**
 * Copyright (c) 2015 Robert Fotino.
 *
 * A module that returns an array of game levels. New levels can either be
 * defined here or in separate files and included with a call to require.
 */

define(function(require, exports, module) {
    var Level = require('obj/Level');
    var Player = require('obj/Player');
    var Asteroid = require('obj/Asteroid');
    var ReachTarget = require('obj/ReachTarget');
    var EnemyTarget = require('obj/EnemyTarget');
    var FriendlyTarget = require('obj/FriendlyTarget');
    var LaserWeapon = require('obj/LaserWeapon');
    var RocketWeapon = require('obj/RocketWeapon');

    // An array of levels that can be loaded from the level selector
    module.exports = [
        // A reach target straight ahead
        new Level('Thrust', function() { return {
            objects: [
                new ReachTarget({
                    name: 'target1',
                    win: true,
                    pos: { x: 0, y: -250 }
                })
            ]
        }; }),
        // A static destructible target straight ahead and equipped lasers
        new Level('Fire', function() { return {
            player: new Player({
                weapons: [ new LaserWeapon() ],
                equipped: 'laser'
            }),
            objects: [
                new EnemyTarget({
                    name: 'enemy1',
                    win: true,
                    pos: { x: 0, y: -250 },
                    health: 25
                })
            ]
        }; }),
        // A static destructible target straight ahead and unequipped rockets
        new Level('Equip and Fire', function() { return {
            player: new Player({ weapons: [ new RocketWeapon({ ammo: 1 }) ] }),
            objects: [
                new EnemyTarget({
                    name: 'enemy1',
                    win: true,
                    pos: { x: 0, y: -250 },
                    health: 25
                })
            ]
        }; }),
        // An asteroid straight ahead and a reach target to the left
        new Level('Turn', function() { return {
            objects: [
                new Asteroid({
                    pos: { x: 0, y: -250 },
                    radius: 150
                }),
                new ReachTarget({
                    name: 'target1',
                    win: true,
                    pos: { x: -250, y: 0 }
                })
            ]
        }; }),
        // A reach target is randomly positioned around the player
        new Level('Turn Anywhere', function() {
            var angle = Math.random() * Math.PI * 2;
            var radius = 250;
            return {
                objects: [
                    new ReachTarget({
                        name: 'target1',
                        win: true,
                        pos: {
                            x: radius * Math.cos(angle),
                            y: radius * Math.sin(angle)
                        }
                    })
                ]
            };
        }),
        // A destructible target is randomly positioned around the player
        new Level('Aim and Fire', function() {
            var angle = Math.random() * Math.PI * 2;
            var radius = 250;
            return {
                player: new Player({
                    weapons: [ new LaserWeapon() ],
                    equipped: 'laser'
                }),
                objects: [
                    new EnemyTarget({
                        name: 'enemy1',
                        win: true,
                        pos: {
                            x: radius * Math.cos(angle),
                            y: radius * Math.sin(angle)
                        },
                        health: 25
                    })
                ]
            };
        }),
        // An asteroid in between the player and a reach target
        new Level('Flight Path', function() { return {
            player: new Player({ pos: { angular: Math.PI / 2 } }),
            objects: [
                new Asteroid({
                    pos: { x: 250, y: 0 },
                    radius: 150
                }),
                new ReachTarget({
                    name: 'target1',
                    win: true,
                    pos: { x: 500, y: 0 }
                })
            ]
        }; })
    ];
});
