// Get an array of all available weapons
var allWeapons = weapons();

// Try to get the 'rocket' weapon
var rockets = allWeapons.filter(function(w) { return w.name === 'rocket'; })[0];

// If we have no 'rocket' weapon or if it is out of ammo, send a warning
// to the console
if (!rockets || rockets.ammo === 0) {
    console.warn('No rockets!');
} else {
    // Equip the rockets. Equivalent to equip('rocket')
    equip(rockets);
    // Log the equipped weapon to the console
    console.log(equipped());
    // Fire the equipped weapon in the direction (0, 1), which is straight up
    fire(0, 1);
}

// An equivalent way of checking if we have rockets available is to try to
// equip() them, then check the value of equipped()
equip('rocket');
var rockets = equipped();
if (rockets && rockets.ammo) {
    // Do something here...
}
