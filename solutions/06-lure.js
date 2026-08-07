// Level: Lure
// Strategy: approach below the mine field, orbit its center to pull the mines
// out of position, then sprint to the reach target.
function wrap(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}
function drive(vx, vy) {
  // Closed-loop controller for a requested world-space velocity.
  var p = pos(),
    v = vel(),
    ax = vx - v.x,
    ay = vy - v.y,
    m = Math.sqrt(ax * ax + ay * ay);
  if (m < 0.015) {
    turn(clamp(-20 * v.angular, -1, 1));
    thrust(0);
    return;
  }
  var e = wrap(Math.atan2(ay, ax) - p.angular);
  turn(clamp(3 * e - 20 * v.angular, -1, 1));
  thrust(Math.abs(e) < 0.18 ? clamp(m / 0.5, 0, 1) : 0);
}
function fly(q, s) {
  var p = pos(),
    x = q.x - p.x,
    y = q.y - p.y,
    d = Math.sqrt(x * x + y * y),
    v = Math.min(s, Math.sqrt(d) * 0.35);
  drive((x / (d || 1)) * v, (y / (d || 1)) * v);
  return d < 25;
}
var phase = load('phase', 0),
  p = pos();
if (phase === 0) {
  // Approach the field from below.
  if (fly({ x: 190, y: -230 }, 3)) {
    phase = 1;
    store('phase', phase);
    store('tick', 0);
  }
} else if (phase === 1) {
  // Orbit while the pursuing mines follow the ship out of the path.
  var t = load('tick', 0) + 1;
  store('tick', t);
  var x = p.x - 500,
    y = p.y,
    r = Math.sqrt(x * x + y * y),
    rad = (280 - r) * 0.08;
  drive(
    (-y / (r || 1)) * 5 + (x / (r || 1)) * rad,
    (x / (r || 1)) * 5 + (y / (r || 1)) * rad
  );
  if (t > 440 || !radar('mine').length) {
    phase = 2;
    store('phase', phase);
  }
} else fly(radar({ objective: 'reach' })[0].pos, 7);
