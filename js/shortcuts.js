/**
 * Copyright (c) 2016 Robert Fotino.
 */

/**
 * Adds keyboard shortcut listeners.
 */
$(window).on('keydown', function(e) {
    // Different modes have different shortcuts available. When we are
    // selecting a level we are in 'levelselect' mode, when we have the code
    // window open we are in 'insert' mode, and when we are doing neither we
    // are in 'command' mode
    var mode;
    if (menu.isVisibleLevels()) {
        mode = 'levelselect';
    } else if (ui.isVisibleCode()) {
        mode = 'insert';
    } else {
        mode = 'command';
    }
    // Do nothing if any modifier keys are pressed
    if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) {
        return;
    }
    // Otherwise switch on the mode, then on the key pressed
    switch (mode) {
    case 'levelselect':
        switch (e.keyCode) {
        case 27: // escape
            menu.hideLevels();
            break;
        case 13: // enter
            menu.loadSelectedLevel();
            break;
        case 80: // p
            menu.selectPrevLevel();
            break;
        case 78: // n
            menu.selectNextLevel();
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
