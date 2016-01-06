/**
 * Copyright (c) 2016 Robert Fotino.
 */

/**
 * Adds keyboard shortcut listeners.
 */
$(window).on('keydown', function(e) {
    var preventDefault = true;
    if (e.ctrlKey && 37 === e.keyCode) {
        // ctrl + left arrow, hide code window
        ui.hideCode();
    } else if (e.ctrlKey && 39 === e.keyCode) {
        // ctrl + right arrow, show code window
        ui.showCode();
    } else if (e.ctrlKey && 40 === e.keyCode) {
        // ctrl + down arrow, hide console window
        ui.hideConsole();
    } else if (e.ctrlKey && 38 === e.keyCode) {
        // ctrl + up arrow, show console window
        ui.showConsole();
    } else if (e.ctrlKey && 73 === e.keyCode) {
        // ctrl + I, install code
        $('#install').click();
    } else if (e.ctrlKey && 32 === e.keyCode) {
        // ctrl + Space, run/pause game
        $('#run').click();
    } else if (e.ctrlKey && 81 === e.keyCode) {
        // ctrl + Q, restart game
        $('#restart').click();
    } else {
        // No shortcut detected, do the default action
        preventDefault = false;
    }
    // If a shortcut was detected, prevent the default action
    if (preventDefault) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});
