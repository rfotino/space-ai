// Load the current state, or if not set initialize it to 'spin'
var state = load('state', 'spin');

switch (state) {
    // If we are in state 'spin', turn counterclockwise at half power until
    // the angular velocity is above a certain threshold. Then switch to
    // state 'accelerate'
    case 'spin':
        turn(0.5);
        if (vel().angular >= 0.1) {
            state = 'accelerate';
        }
        break;
    // If we are in state 'accelerate', stop turning and set thrust to full
    // power for 100 frames. Then switch to state 'float'
    case 'accelerate':
        turn(0);
        var i = load('i', 0);
        if (i < 100) {
            thrust(1);
        } else {
            state = 'float';
        }
        store('i', i + 1);
        break;
    // If we are in state 'float', turn off the engines and float through space
    case 'float':
    default:
        thrust(0);
        break;
}

// Store the state for the next frame
store('state', state);
