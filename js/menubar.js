/**
 * Copyright (c) 2015 Robert Fotino.
 */

$(document).ready(function() {
    $('#install').on('click', function(e) {
        e.preventDefault();
        game.install(ui.getCode());
    });

    $('#run').on('click', function(e) {
        e.preventDefault();
        game.run();
    });

    $('#pause').on('click', function(e) {
        e.preventDefault();
        game.pause();
    });

    $('#restart').on('click', function(e) {
        e.preventDefault();
        game.restart();
    });
});
