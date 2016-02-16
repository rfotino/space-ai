/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * This defines a module for adding keyboard shortcut listeners via jQuery.
 */

define(function(require, exports, module) {
    var $ = require('jquery');
    var ui = require('ui');
    var menubar = require('menubar');
    var game = require('game');

    // Some constants for panning and zooming amounts
    var arrowPanDist = 25;
    var zoomFactor = 1.1;

    /**
     * init();
     * Adds keyboard and mouse shortcut listeners.
     */
    exports.init = function() {
        $(window).on('keydown', function(e) {
            // Different modes have different shortcuts available. When we are
            // selecting a level we are in 'levelselect' mode, when we have the
            // code window open we are in 'insert' mode, and when we are doing
            // neither we are in 'command' mode
            var mode;
            if (menubar.isVisibleLevels()) {
                mode = 'levelselect';
            } else if (ui.isVisibleCode()) {
                mode = 'insert';
            } else {
                mode = 'command';
            }
            // Do nothing if any modifier keys are pressed (besides shift,
            // shift is okay)
            if (e.altKey || e.ctrlKey || e.metaKey) {
                return;
            }
            // Otherwise switch on the mode, then on the key pressed
            switch (mode) {
            case 'levelselect':
                switch (e.keyCode) {
                case 27: // escape
                    menubar.hideLevels();
                    break;
                case 13: // enter
                    menubar.loadSelectedLevel();
                    break;
                case 80: // p
                    menubar.selectPrevLevel();
                    break;
                case 78: // n
                    menubar.selectNextLevel();
                    break;
                default:
                    return;
                }
                break;
            case 'insert':
                // If escape is pressed
                if (27 === e.keyCode) {
                    ui.hideCode();
                    mode = 'command';
                } else {
                    return;
                }
                break;
            case 'command':
            default:
                switch (e.keyCode) {
                case 73: // i
                    ui.showCode();
                    mode = 'insert';
                    break;
                case 67: // c
                    ui.toggleConsole();
                    break;
                case 68: // d
                    window.open($('#docs').attr('href'), '_blank');
                    break;
                case 83: // s
                    $('#show-levels').trigger('click');
                    break;
                case 32: // space
                    $('#run').trigger('click');
                    break;
                case 82: // r
                    $('#restart').trigger('click');
                    break;
                case 70: // f
                    game.viewToPlayer();
                    break;
                case 66: // b
                    game.viewToBounds();
                    break;
                case 37: // left arrow
                    game.viewTranslate(arrowPanDist, 0);
                    break;
                case 38: // up arrow
                    game.viewTranslate(0, arrowPanDist);
                    break;
                case 39: // right arrow
                    game.viewTranslate(-arrowPanDist, 0);
                    break;
                case 40: // down arrow
                    game.viewTranslate(0, -arrowPanDist);
                    break;
                case 189: // -
                    game.viewScale(1 / zoomFactor);
                    break;
                case 187: // =
                    game.viewScale(zoomFactor);
                    break;
                default:
                    return;
                }
                break;
            }
            // Prevent the default action of the key pressed
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // Listen for scroll wheel events on the canvas, and respond to them
        // by increasing or decreasing the viewport's zoom
        $('#game-canvas').on('mousewheel DOMMouseScroll', function(e) {
            if (0 < e.originalEvent.wheelDelta) {
                for (var i = 0; i < e.originalEvent.wheelDelta / 120; i++) {
                    game.viewScale(zoomFactor);
                }
            } else {
                for (var i = 0; i < -e.originalEvent.wheelDelta / 120; i++) {
                    game.viewScale(1 / zoomFactor);
                }
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // Listen for mouse drag events on the canvas, and respond to them
        // by translating the viewport (panning)
        $('#game-canvas').on('mousedown', function(e) {
            var prevX = e.screenX;
            var prevY = e.screenY;
            var dragHandler = function(e) {
                var dx = e.screenX - prevX;
                var dy = e.screenY - prevY;
                prevX = e.screenX;
                prevY = e.screenY;
                game.viewTranslate(dx, dy);
            };
            var mouseUpHandler = function() {
                $(window)
                    .unbind('mousemove', dragHandler)
                    .unbind('mouseup', mouseUpHandler);
            }
            $(window)
                .on('mousemove', dragHandler)
                .on('mouseup', mouseUpHandler);
        });

        // Listen for mouse movements on the canvas, so that we can show info
        // about game objects
        $('#game-canvas').on('mousemove', function(e) {
            game.changeMousePos({ x: e.offsetX, y: e.offsetY });
        });
    };
});
