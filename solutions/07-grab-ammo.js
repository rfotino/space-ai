// Level: Grab Ammo
// Strategy: take the low route to the rocket pickup, return to a safe firing
// position, and destroy each ship with a velocity-leading rocket shot.
function wrap(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}
function drive(vx, vy) {
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
  turn(clamp(3 * e - 30 * v.angular, -1, 1));
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
function aim(t, s) {
  // Solve the projectile interception quadratic for a moving target.
  var p = pos(),
    v = vel(),
    x = t.pos.x - p.x,
    y = t.pos.y - p.y,
    rx = t.vel.x - v.x,
    ry = t.vel.y - v.y,
    A = rx * rx + ry * ry - s * s,
    B = 2 * (x * rx + y * ry),
    C = x * x + y * y,
    D = B * B - 4 * A * C,
    q = 0;
  if (Math.abs(A) < 1e-6) q = -C / B;
  else if (D >= 0) {
    var u = (-B - Math.sqrt(D)) / (2 * A),
      z = (-B + Math.sqrt(D)) / (2 * A);
    q = u > 0 ? u : z;
  }
  if (!(q > 0)) q = Math.sqrt(C) / s;
  fire(x + rx * q, y + ry * q);
}
var phase = load('phase', 0),
  tick = load('tick', 0) + 1;
store('tick', tick);
var ws = weapons(),
  rocket = null;
for (var i = 0; i < ws.length; i++) if (ws[i].name === 'rocket') rocket = ws[i];
if (phase === 0) {
  // The first three phases travel around the enemies to collect rockets.
  if (fly({ x: 0, y: -500 }, 8)) {
    phase = 1;
    store('phase', phase);
  }
} else if (phase === 1) {
  if (fly({ x: 1000, y: -500 }, 9)) {
    phase = 2;
    store('phase', phase);
  }
} else if (phase === 2) {
  fly({ x: 1000, y: 0 }, 8);
  if (rocket) {
    phase = 3;
    store('phase', phase);
  }
} else if (phase === 3) {
  if (fly({ x: 1000, y: -500 }, 9)) {
    phase = 4;
    store('phase', phase);
  }
} else {
  // Stop in the firing lane and engage one ship at a time.
  drive(0, 0);
  var ships = radar('ship');
  if (ships.length) {
    ships.sort(function (a, b) {
      return a.pos.x - b.pos.x;
    });
    var shot = load('shot', {}),
      target = null;
    for (var j = 0; j < ships.length; j++)
      if (!shot[ships[j].id] || tick - shot[ships[j].id] > 210) {
        target = ships[j];
        break;
      }
    if (target && rocket && rocket.ammo > 0 && rocket.cooldownTimer === 0) {
      equip('rocket');
      aim(target, 5);
      shot[target.id] = tick;
      store('shot', shot);
    }
  }
}
