/**
 * Copyright (c) 2016 Robert Fotino
 *
 * This is the main file that loads dependencies via RequireJS.
 */

requirejs.config({
    baseUrl: 'js',
    paths: {
        jquery: '../lib/jquery/jquery'
    },
    packages: [{
        name: 'codemirror',
        location: '../lib/codemirror',
        main: 'lib/codemirror'
    }]
});

requirejs(['game', 'ui', 'menubar', 'shortcuts'],
function   (game,   ui,   menubar,   shortcuts) {
    // Set up the jQuery listeners from these modules
    ui.init();
    menubar.init();
    shortcuts.init();
    game.init();
});
