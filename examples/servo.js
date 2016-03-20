/**
 * Turns your ship to the given angle. Returns true when it is within
 * epsilon radians of the target angle and the angular velocity is zero.
 *
 * @param {Number} angle
 * @param {Number} [epsilon] Defaults to 0.001
 * @return {Boolean} True if the operation is complete
 */
var servo = function(angle, epsilon) {
    // Set a default value for epsilon
    if (!epsilon) {
        epsilon = 0.001;
    }
    // Get the maximum angular acceleration
    var prevTurn = turn();
    turn(1);
    var maxAngularAccel = accel().angular;
    turn(prevTurn);
    // Get the smallest angle we need to move from our current angle
    // to reach the target angle
    var diff = (pos().angular - angle) % (Math.PI * 2);
    if (Math.abs(diff - (Math.PI * 2)) < Math.abs(diff)) {
        diff -= Math.PI * 2;
    } else if (Math.abs(diff + (Math.PI * 2)) < Math.abs(diff)) {
        diff += Math.PI * 2;
    }
    // Get the angular distance needed to travel and the angular
    // distance needed to decelerate from the current angular velocity
    var dist = Math.abs(diff);
    var decelDist = Math.pow(vel().angular, 2) / maxAngularAccel;
    // If we are within epsilon of the target angle and we no longer
    // have any angular velocity, we are done
    if (Math.max(dist, Math.abs(vel().angular)) < epsilon) {
        turn(0);
        return true;
    }
    // Calculate and set the new acceleration; if we don't have enough
    // distance to decelerate, slow down - otherwise speed up
    var a = 0;
    if (dist < decelDist) {
        a = -vel().angular;
    } else {
        a = vel().angular - diff;
    }
    turn(a / maxAngularAccel);
    return false;
}
