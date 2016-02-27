/**
 * Copyright (c) 2016 Robert Fotino
 *
 * This is the main file. The run() function is used as an entry point
 * to the application.
 */

var game = require('./game.js');
var ui = require('./ui.js');
var menubar = require('./menubar.js');
var shortcuts = require('./shortcuts.js');

// Set up the jQuery listeners from these modules
ui.init();
menubar.init();
shortcuts.init();
game.init();
