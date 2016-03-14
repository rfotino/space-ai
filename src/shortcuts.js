/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * This defines a module for adding keyboard shortcut listeners via jQuery.
 */

var $ = require('../lib/jquery/jquery.js');
var modal = require('./modal.js');
var ui = require('./ui.js');
var menubar = require('./menubar.js');
var game = require('./game.js');
var physics = require('./physics.js');

var addKeyDownListener = function() {
    $(window).on('keydown', function(e) {
        // Different modes have different shortcuts available. When we are
        // selecting a level we are in 'levelselect' mode, when we have the
        // code window open we are in 'insert' mode, and when we are doing
        // neither we are in 'command' mode
        var mode;
        if (modal.isShown()) {
            mode = 'modal';
        } else if (menubar.isVisibleLevels()) {
            mode = 'levelselect';
        } else if (ui.isVisibleCode()) {
            mode = 'insert';
        } else {
            mode = 'command';
        }
        // Function "macro" to test for modifier keys. The default
        // is optional shift, no alt, no ctrl, no meta
        function modKeys(keys) {
            if ('undefined' === typeof keys) {
                keys = { alt: false, ctrl: false, meta: false };
            }
            return ('undefined' === typeof keys.shift
                    || e.shiftKey === keys.shift)
                && ('undefined' === typeof keys.alt
                    || e.altKey === keys.alt)
                && ('undefined' === typeof keys.ctrl
                    || e.ctrlKey === keys.ctrl)
                && ('undefined' === typeof keys.meta
                    || e.metaKey === keys.meta);
        }
        // Check for file menu actions
        if (83 === e.keyCode
            && modKeys({ shift: false, alt: false,
                         ctrl: true, meta: false })) {
            // ctrl+s
            $('#file-save-btn').trigger('click');
        } else if (83 === e.keyCode
                   && modKeys({ shift: true, alt: false,
                                ctrl: true, meta: false })) {
            // shift+ctrl+s
            $('#file-save-as-btn').trigger('click');
        } else {
            // Otherwise switch on the mode, then on the key pressed
            switch (mode) {
            case 'levelselect':
                if (27 === e.keyCode && modKeys()) {
                    // escape
                    menubar.hideLevels();
                } else if (13 === e.keyCode && modKeys()) {
                    // enter
                    menubar.loadSelectedLevel();
                } else if (80 === e.keyCode && modKeys()) {
                    // p
                    menubar.selectPrevLevel();
                } else if (78 === e.keyCode && modKeys()) {
                    // n
                    menubar.selectNextLevel();
                } else {
                    return;
                }
                break;
            case 'insert':
                if (27 === e.keyCode && modKeys()) {
                    // escape
                    ui.hideCode();
                    mode = 'command';
                } else {
                    return;
                }
                break;
            case 'command':
                if (73 === e.keyCode && modKeys()) {
                    // i
                    ui.showCode();
                    mode = 'insert';
                } else if (67 === e.keyCode && modKeys()) {
                    // c
                    ui.toggleConsole();
                } else if (68 === e.keyCode && modKeys()) {
                    // d
                    window.open($('#docs').attr('href'), '_blank');
                } else if (65 === e.keyCode && modKeys()) {
                    // a
                    $('#about-btn').trigger('click');
                } else if (83 === e.keyCode && modKeys()) {
                    // s
                    $('#show-levels').trigger('click');
                } else if (32 === e.keyCode && modKeys()) {
                    // space
                    $('#run').trigger('click');
                } else if (82 === e.keyCode && modKeys()) {
                    // r
                    $('#restart').trigger('click');
                } else if (70 === e.keyCode && modKeys()) {
                    // f
                    $('#focus-player-btn').trigger('click');
                } else if (66 === e.keyCode && modKeys()) {
                    // b
                    $('#focus-bounds-btn').trigger('click');
                } else if (88 === e.keyCode && modKeys()) {
                    // x
                    $('#debug-mode-btn').trigger('click');
                } else if (189 === e.keyCode && modKeys()) {
                    // -
                    $('#zoom-out-btn').trigger('click');
                } else if (187 === e.keyCode && modKeys()) {
                    // =
                    $('#zoom-in-btn').trigger('click');
                } else if (37 === e.keyCode && modKeys()) {
                    // left arrow
                    $('#pan-left-btn').trigger('click');
                } else if (38 === e.keyCode && modKeys()) {
                    // up arrow
                    $('#pan-up-btn').trigger('click');
                } else if (39 === e.keyCode && modKeys()) {
                    // right arrow
                    $('#pan-right-btn').trigger('click');
                } else if (40 === e.keyCode && modKeys()) {
                    // down arrow
                    $('#pan-down-btn').trigger('click');
                } else if (84 === e.keyCode && modKeys()) {
                    // t
                    $('#themes-btn').trigger('click');
                } else {
                    return;
                }
                break;
            case 'modal':
                if (27 === e.keyCode && modKeys()) {
                    // Escape
                    modal.hide();
                }
            default:
                return;
            }
        }
        // Prevent the default action of the key pressed
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
};

// Listen for scroll wheel events on the canvas, and respond to them
// by increasing or decreasing the viewport's zoom
var addMouseWheelListener = function() {
    $('#game-canvas').on('mousewheel wheel DOMMouseScroll', function(e) {
        if (e.originalEvent.deltaY < 0) {
            $('#zoom-in-btn').trigger('click');
        } else {
            $('#zoom-out-btn').trigger('click');
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
};

// Listen to pinch events.also for zoom
var addPinchToZoomListener = function() {
    var pinching = false;
    var prevPinchDist = 0;
    $('#game-canvas').on('touchmove', function(e) {
        if (2 !== e.originalEvent.touches.length) {
            pinching = false;
            return;
        }
        var pinchDist =  physics.dist({
            x: e.originalEvent.touches[0].pageX,
            y: e.originalEvent.touches[0].pageY
        }, {
            x: e.originalEvent.touches[1].pageX,
            y: e.originalEvent.touches[1].pageY
        });
        if (pinching) {
            var ratio = pinchDist / prevPinchDist;
            game.viewScale(ratio);
        } else {
            pinching = true;
        }
        prevPinchDist = pinchDist;
    });
    $('#game-canvas').on('touchcancel touchend', function(e) {
        pinching = false;
    });
};

// Listen for mouse drag events on the canvas, and respond to them
// by translating the viewport (panning)
var addMouseDragListener = function() {
    $('#game-canvas').on('mousedown touchstart', function(e) {
        if (e.originalEvent.touches) {
            e.screenX = e.originalEvent.touches[0].screenX;
            e.screenY = e.originalEvent.touches[0].screenY;
        }
        var prevX = e.screenX;
        var prevY = e.screenY;
        var dragHandler = function(e) {
            e.preventDefault();
            if (e.originalEvent.touches) {
                if (1 !== e.originalEvent.touches.length) {
                    return;
                }
                e.screenX = e.originalEvent.touches[0].screenX;
                e.screenY = e.originalEvent.touches[0].screenY;
            }
            var dx = e.screenX - prevX;
            var dy = e.screenY - prevY;
            prevX = e.screenX;
            prevY = e.screenY;
            game.viewTranslate(dx, dy);
        };
        var mouseUpHandler = function(e) {
            $(window)
                .unbind('mousemove touchmove', dragHandler)
                .unbind('mouseup touchend touchcancel', mouseUpHandler);
        }
        $(window)
            .on('mousemove touchmove', dragHandler)
            .on('mouseup touchend touchcancel', mouseUpHandler);
    });
};

// Listen for mouse movements on the canvas, so that we can show info
// about game objects
var addMouseMoveListener = function() {
    $('#game-canvas').on('mousemove touchmove', function(e) {
        if (e.originalEvent.touches) {
            var touch = e.originalEvent.touches[0];
            var offset = $(e.target).offset();
            e.offsetX = touch.pageX - offset.left;
            e.offsetY = touch.pageY - offset.top;
        }
        game.changeMousePos({ x: e.offsetX, y: e.offsetY });
    });
};

/**
 * init();
 * Adds keyboard and mouse shortcut listeners.
 */
exports.init = function() {
    $(document).ready(function() {
        addKeyDownListener();
        addMouseWheelListener();
        addPinchToZoomListener();
        addMouseDragListener();
        addMouseMoveListener();
    });
};
