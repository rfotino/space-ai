// Level: Hostage Crisis
// Strategy: orbit outside the hostage ring while shooting nearby mines. A hit
// makes a mine chase the ship outward, away from the hostage.
function wrap(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function driveVelocity(dvx, dvy) {
  var p = pos(),
    v = vel(),
    ax = dvx - v.x,
    ay = dvy - v.y,
    angle = Math.atan2(ay, ax);
  var e = wrap(p.angular - angle),
    brake = (v.angular * v.angular) / 0.005;
  var power =
    Math.abs(e) < brake ? -v.angular / 0.005 : (v.angular - e) / 0.005;
  turn(Math.max(-1, Math.min(1, power)));
  thrust(
    Math.abs(e) < 0.1 ? Math.min(1, Math.sqrt(ax * ax + ay * ay) / 0.5) : 0
  );
}
function fly(q) {
  var p = pos(),
    dx = q.x - p.x,
    dy = q.y - p.y,
    d = Math.sqrt(dx * dx + dy * dy);
  var s = Math.min(2, Math.sqrt(d) * 0.35);
  driveVelocity((dx / (d || 1)) * s, (dy / (d || 1)) * s);
  return d < 18;
}
var p = pos(),
  mines = radar('mine'),
  nearest = null,
  best = 1e99;
for (var i = 0; i < mines.length; i++) {
  var dx = mines[i].pos.x - p.x,
    dy = mines[i].pos.y - p.y,
    d = dx * dx + dy * dy;
  if (d < best) {
    best = d;
    nearest = mines[i];
  }
}
if (nearest && Math.sqrt(best) < 420) {
  // Lead the nearest mine to compensate for its current velocity.
  var range = Math.sqrt(best);
  fire(
    nearest.pos.x + (nearest.vel.x * range) / 10 - p.x,
    nearest.pos.y + (nearest.vel.y * range) / 10 - p.y
  );
}
// A 32-sided path stays outside the hostage ring. Triggered mines always
// pursue outward, away from the one-hit-point friendly target.
var step = load('step', 0),
  count = 32,
  angle = Math.PI + (step * 2 * Math.PI) / count;
if (fly({ x: 500 + 450 * Math.cos(angle), y: 450 * Math.sin(angle) })) {
  step = (step + 1) % count;
  store('step', step);
}
