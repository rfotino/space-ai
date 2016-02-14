# Space AI Game

This is a programming game in which the user writes JavaScript code to control
a spaceship in order to complete some objective. The user gets an API with
certain inputs and outputs to sense and react to the environment. This API
includes functions for things like radar, checking ammo, checking objective
location, accelerating, turning, firing, etc. Documentation is available
to the player. The objective might be to get to a specified location, to
destroy all enemy ships or outposts, to defend your own ships or outposts,
etc. Each level can be specified as a JavaScript object in a simple format
the initial conditions and win conditions, so it is easy to create new
challenges.

Originally the idea was to have two or more players write some AI-like
scripts and their ships would battle each other in space with additional
obstacles like asteroids and planets. But for now the game is just a series
of single-player challenges to complete.

## Demo

A live demo of the latest version of the code is available at
https://spaceship.codes.

## Todo

* [ ] Allow level to supply alternative win condition function
* [x] Add health() and bounds() diagnostic functions for the user
* [x] Explosion animations
* [ ] Viewport interactions like pan/zoom/focus
* [ ] Immobile enemy ships
* [ ] Mobile enemy ships
* [ ] Health bar, other status information
* [ ] More and better levels
* [ ] Packaging/minification of JavaScript files
* [ ] Help dialog, with keyboard shortcuts
* [ ] About page
* [ ] Extend the documentation

## Wishlist

* [ ] Improved menu/button graphics
* [ ] Minimap
* [ ] Weapon drops, more weapon types
* [ ] Powerups like shields, health
* [ ] Parallax movement of stars
* [ ] Loading/saving of user code using local storage
* [ ] Quad trees for efficient collision detection / scene rendering
* [ ] Planets with gravity mechanics
* [ ] Better styling for docs
* [ ] Multiplayer versus mode

## Copyright

Copyright (c) 2015 Robert Fotino.
