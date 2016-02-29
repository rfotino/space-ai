# Space AI Game

This is a programming game in which the user writes JavaScript code to control
a spaceship in order to complete some objective. The user gets an API with
certain inputs and outputs to sense and react to the environment. This API
includes functions for things like radar, checking ammo, checking objective
location, accelerating, turning, firing, etc. Documentation is available
to the player. The objective might be to get to a specified location, to
destroy all enemy ships or outposts, to defend your own ships or outposts,
etc. Each level can be specified as a JavaScript object in a simple format
with initial conditions and win conditions, so it is easy to create new
challenges.

Originally the idea was to have two or more players write some AI-like
scripts and their ships would battle each other in space with additional
obstacles like asteroids and planets. But for now the game is just a series
of single-player challenges to complete.

## Demo

A live demo of the latest version of the code is available at
https://spaceship.codes.

## Build

Building the code requires Browserify and UglifyJS for bundling the source
into one file and then compressing that file. You can install these
dependencies with:

```shell
npm install -g browserify
npm install -g uglify-js
```

Once you have these Browserify and UglifyJS installed, you can build the code
by running `make` (requires CMake). Other build commands include:

```shell
make bundle  # Only runs Browserify
make minify  # Only runs UglifyJS
make clean   # Removes already built files
```

The built files are `build/space-ai.js` and `build/space-ai.min.js`, which
are the bundled code and the bundled + minified code, respectively. There are
two HTML files that can be viewed in the browser to run the game:
`index-dev.html`, which uses the unminified version of the code; and
`index.html`, which uses the minified version.

## Todo

* [ ] Allow level to supply alternative win condition function
* [x] Add health() and bounds() diagnostic functions for the user
* [x] Explosion animations
* [x] Viewport interactions like pan/zoom/focus
* [x] Immobile enemy ships
* [x] Mobile enemy ships
* [x] Mines that follow the player if they are within a certain
      proximity and explode on impact.
* [x] Be able to hover over objects and see information about them
* [x] Togglable debug mode where you see a 100px grid, info on all game
      objects, etc.
* [ ] More and better levels
* [x] Packaging/minification of JavaScript files
* [ ] Help dialog, with keyboard shortcuts
* [ ] About page
* [ ] Extend the documentation
* [ ] Add unit tests for physics.js
* [x] Menu dropdown for changing the view
* [x] Loading/saving of user code using local storage
* [x] Z-index for controlling drawing order of game objects
* [x] Some way to give a level description via initial comments, or
      have some initial code the user has to modify.

## Wishlist

* [x] Improved menu/button graphics
* [ ] Mobile support
* [ ] Clicking on game objects pops up a dialog with more information
* [ ] Minimap
* [ ] Weapon drops, more weapon types
* [ ] Powerups like shields, health
* [ ] Parallax movement of stars
* [ ] Quad trees for efficient collision detection / scene rendering
* [ ] Planets with gravity mechanics
* [ ] Better styling for docs
* [ ] Multiplayer versus mode

## Copyright

Copyright (c) 2015 Robert Fotino.
