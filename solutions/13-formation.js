// Level: Formation
// Strategy: use a powered spin to stay mobile, lock onto one ship at a time,
// and use predictive laser fire to break the formation.
function wrap(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
var motion = load('motion', 0),
  pp = pos(),
  vv0 = vel();
if (motion === 0) {
  // Build diagonal velocity before starting the spin.
  var ax = -3.5 - vv0.x,
    ay = -3.5 - vv0.y,
    ang = Math.atan2(ay, ax),
    de = wrap(pp.angular - ang),
    bd = (vv0.angular * vv0.angular) / 0.005,
    pw = Math.abs(de) < bd ? -vv0.angular / 0.005 : (vv0.angular - de) / 0.005;
  turn(Math.max(-1, Math.min(1, pw)));
  thrust(
    Math.abs(de) < 0.08 ? Math.min(1, Math.sqrt(ax * ax + ay * ay) / 0.5) : 0
  );
  if (Math.sqrt(ax * ax + ay * ay) < 0.12) {
    motion = 1;
    store('motion', motion);
  }
} else if (motion === 1) {
  var de = wrap(pp.angular + Math.PI / 2),
    bd = (vv0.angular * vv0.angular) / 0.005,
    pw = Math.abs(de) < bd ? -vv0.angular / 0.005 : (vv0.angular - de) / 0.005;
  turn(Math.max(-1, Math.min(1, pw)));
  thrust(0);
  if (Math.abs(de) < 0.01 && Math.abs(vv0.angular) < 0.01) {
    motion = 2;
    store('motion', motion);
  }
} else if (motion === 2) {
  turn(1);
  thrust(0);
  if (vel().angular >= 0.08) {
    motion = 3;
    store('motion', motion);
  }
} else {
  turn(0);
  thrust(1);
}
equip('laser');
var ships = radar('ship'),
  p = pos(),
  pv = vel(),
  locked = load('locked', null),
  t = null;
for (var i = 0; i < ships.length; i++) if (ships[i].id === locked) t = ships[i];
if (!t && ships.length) {
  ships.sort(function (a, b) {
    return a.pos.y - b.pos.y;
  });
  t = ships[0];
  store('locked', t.id);
}
if (t) {
  // Solve for laser interception time using relative motion.
  var rx = t.pos.x - p.x,
    ry = t.pos.y - p.y,
    rvx = t.vel.x - pv.x,
    rvy = t.vel.y - pv.y,
    A = rvx * rvx + rvy * rvy - 100,
    B = 2 * (rx * rvx + ry * rvy),
    C = rx * rx + ry * ry,
    D = B * B - 4 * A * C,
    time = 0;
  if (Math.abs(A) < 0.000001) time = -C / B;
  else if (D >= 0) {
    var a = (-B - Math.sqrt(D)) / (2 * A),
      b = (-B + Math.sqrt(D)) / (2 * A);
    if (a > 0 && b > 0) time = Math.min(a, b);
    else time = Math.max(a, b);
  }
  if (time > 0 && time < 75) fire(rx + rvx * time, ry + rvy * time);
  else store('locked', null);
} else store('locked', null);
