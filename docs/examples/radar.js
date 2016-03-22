// Get an array of all game objects visible to the player
var allObjects = radar();

// Get an array of all asteroids visible to the player
var asteroids = radar('asteroid');
for (var i = 0; i < asteroids.length; i++) {
    var asteroid = asteroids[i];
    // Do something to avoid the asteroid
}

// Get all targets with an objective of 'reach'
var reachTargets = radar({ type: 'target', objective: 'reach' });

// Get all bullets that are within 500 units of the player. First define
// a distance function for convenience
function dist(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
var bullets = radar(function(obj) {
    return (obj.type === 'bullet') && (dist(obj.pos, pos()) <= 500);
});
