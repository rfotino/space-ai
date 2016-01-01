/**
 * Copyright (c) 2015 Robert Fotino.
 */

var menu = {
    /**
     * setState(state);
     * Sets the menu state to 'running', 'paused', or 'waiting'.
     */
    setState: function(state) { }
};

$(document).ready(function() {
    var state, installBtn = $('#install'),
        runBtn = $('#run'), restartBtn = $('#restart');

    menu.setState = function(newState) {
        state = newState;
        switch (state) {
        case 'running':
            runBtn.text('Pause');
            runBtn.removeClass('disabled');
            break;
        case 'paused':
            runBtn.text('Run');
            runBtn.removeClass('disabled');
            break;
        case 'waiting':
        default:
            runBtn.text('Run');
            runBtn.addClass('disabled');
            break;
        }
    };
    menu.setState('waiting');

    installBtn.on('click', function(e) {
        e.preventDefault();
        game.install(ui.getCode());
    });

    runBtn.on('click', function(e) {
        e.preventDefault();
        switch (state) {
        case 'running':
            game.pause();
            break;
        case 'paused':
            game.run();
            break;
        case 'waiting':
        default:
            // Do nothing
            break;
        }
    });

    restartBtn.on('click', function(e) {
        e.preventDefault();
        game.restart();
    });
});
