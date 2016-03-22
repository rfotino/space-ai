// Load the previous value of 'i', or default to 0 if there is no previous value.
var i = load('i', 0);

// Accelerate for the first 10 frames
if (i < 10) {
    thrust(1);
} else {
    thrust(0);
}

// Increment the value of 'i'
store('i', i + 1);
