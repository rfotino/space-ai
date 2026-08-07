// Level: Obstacle
// Strategy: follow three safe waypoints around the obstacle, persisting the
// current waypoint between frames.
function wrap(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function goTo(q, stopRadius) {
  var p = pos(),
    v = vel();
  var dx = q.x - p.x,
    dy = q.y - p.y;
  var d = Math.sqrt(dx * dx + dy * dy);
  if (d < (stopRadius || 12)) {
    thrust(0);
    turn(0);
    return true;
  }
  var speed = Math.min(5, Math.sqrt(d) * 0.5);
  var ux = d ? dx / d : 0,
    uy = d ? dy / d : 0;
  var ax = ux * speed - v.x,
    ay = uy * speed - v.y;
  var angle = Math.atan2(ay, ax);
  var e = wrap(p.angular - angle);
  var brake = (v.angular * v.angular) / 0.005;
  var power =
    Math.abs(e) < brake ? -v.angular / 0.005 : (v.angular - e) / 0.005;
  turn(Math.max(-1, Math.min(1, power)));
  thrust(
    Math.abs(e) < 0.12 ? Math.min(1, Math.sqrt(ax * ax + ay * ay) / 0.5) : 0
  );
  return false;
}
var route = [
  { x: 0, y: -210 },
  { x: 500, y: -210 },
  { x: 500, y: 0 }
];
var step = load('step', 0);
if (
  goTo(route[step], step === route.length - 1 ? 25 : 40) &&
  step < route.length - 1
) {
  step++;
  store('step', step);
}
