// Level: Sentries
// Strategy: wait for gaps in the patrol, dash to the rocket pickup, then
// destroy each stationary target from a guarded firing position.
// Uses only the documented API and the corrected win condition in this repo.
function wrap(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
function drive(vx, vy) {
  var p = pos(),
    v = vel(),
    ax = vx - v.x,
    ay = vy - v.y,
    a = Math.atan2(ay, ax),
    e = wrap(p.angular - a),
    b = (v.angular * v.angular) / 0.005,
    w = Math.abs(e) < b ? -v.angular / 0.005 : (v.angular - e) / 0.005;
  turn(Math.max(-1, Math.min(1, w)));
  thrust(
    Math.abs(e) < 0.1 ? Math.min(1, Math.sqrt(ax * ax + ay * ay) / 0.5) : 0
  );
}
function sneak(q) {
  // Move toward q while treating nearby sentries as a repulsive field.
  var p = pos(),
    x = q.x - p.x,
    y = q.y - p.y,
    d = Math.sqrt(x * x + y * y),
    vx = (x / (d || 1)) * Math.min(3, Math.sqrt(d) * 0.35),
    vy = (y / (d || 1)) * Math.min(3, Math.sqrt(d) * 0.35),
    ss = radar('ship'),
    near = null,
    nd = 1e99;
  for (var i = 0; i < ss.length; i++) {
    var sx = p.x - ss[i].pos.x,
      sy = p.y - ss[i].pos.y,
      z = Math.sqrt(sx * sx + sy * sy);
    if (z < nd) {
      nd = z;
      near = { x: sx, y: sy };
    }
    if (z < 600) {
      var push = (600 - z) * 0.06;
      vx += (sx / (z || 1)) * push;
      vy += (sy / (z || 1)) * push;
    }
  }
  if (nd < 520) {
    vx = (near.x / (nd || 1)) * 10;
    vy = (near.y / (nd || 1)) * 10;
  }
  var m = Math.sqrt(vx * vx + vy * vy);
  if (m > 10) {
    vx *= 10 / m;
    vy *= 10 / m;
  }
  drive(vx, vy);
  return d < 25;
}
function aimStationary(t) {
  // Compensate for the player's velocity when firing at a fixed target.
  var p = pos(),
    v = vel(),
    x = t.pos.x - p.x,
    y = t.pos.y - p.y,
    A = v.x * v.x + v.y * v.y - 25,
    B = -2 * (x * v.x + y * v.y),
    C = x * x + y * y,
    D = B * B - 4 * A * C,
    q = 0;
  if (Math.abs(A) < 1e-6) q = -C / B;
  else if (D >= 0) {
    var u = (-B - Math.sqrt(D)) / (2 * A),
      z = (-B + Math.sqrt(D)) / (2 * A);
    q = u > 0 ? u : z;
  }
  if (!(q > 0 && q < 200)) q = Math.sqrt(C) / 5;
  fire(x - v.x * q, y - v.y * q);
}
var phase = load('phase', 0),
  ammo = radar('ammo')[0],
  p = pos(),
  v = vel();
if (phase === 0) {
  // Stage near the ammo lane, wait until both sentries are clear, then dash.
  if (ammo) {
    var st = { x: 150, y: ammo.pos.y },
      ready = load('ready', false),
      dash = load('dash', false);
    if (!ready) {
      if (sneak(st)) {
        ready = true;
        store('ready', true);
      }
    } else if (!dash) {
      sneak(st);
      var ss = radar('ship'),
        safe = true;
      for (var i = 0; i < ss.length; i++) {
        var x = ss[i].pos.x - ammo.pos.x,
          y = ss[i].pos.y - ammo.pos.y,
          d = Math.sqrt(x * x + y * y),
          dot = x * ss[i].vel.x + y * ss[i].vel.y;
        if (d < 520) safe = false;
      }
      if (safe) {
        dash = true;
        store('dash', true);
      }
    } else sneak(ammo.pos);
  } else {
    phase = 1;
    store('phase', phase);
  }
} else if (phase === 1) {
  // Select the nearest unshot target and wait for its guard to move away.
  var ts = radar({ type: 'target', objective: 'destroy' }),
    shot = load('shot', {}),
    t = null;
  ts.sort(function (a, b) {
    var ax = a.pos.x - p.x,
      ay = a.pos.y - p.y,
      bx = b.pos.x - p.x,
      by = b.pos.y - p.y;
    return ax * ax + ay * ay - bx * bx - by * by;
  });
  for (var i = 0; i < ts.length; i++)
    if (!shot[ts[i].id]) {
      t = ts[i];
      break;
    }
  if (t) {
    var st = { x: 300, y: t.pos.y };
    sneak(st);
    var x = p.x - st.x,
      y = p.y - st.y,
      d = Math.sqrt(x * x + y * y),
      ss = radar('ship'),
      g = null,
      gd = 1e99;
    for (var j = 0; j < ss.length; j++) {
      var qx = ss[j].pos.x - t.pos.x,
        qy = ss[j].pos.y - t.pos.y,
        z = qx * qx + qy * qy;
      if (z < gd) {
        gd = z;
        g = ss[j];
      }
    }
    if (d < 30 && g && g.pos.x > 1200 && Math.abs(g.pos.y - t.pos.y) < 100) {
      store('attack', { id: t.id, pos: t.pos });
      phase = 11;
      store('phase', phase);
    }
  }
} else if (phase === 11) {
  // Advance just far enough to fire one rocket, then retreat.
  var a = load('attack', null);
  if (a) {
    var q = { x: 450, y: a.pos.y };
    sneak(q);
    var x = p.x - q.x,
      y = p.y - q.y,
      d = Math.sqrt(x * x + y * y);
    if (p.x > 420 && Math.abs(p.y - a.pos.y) < 55) {
      equip('rocket');
      aimStationary({ pos: a.pos });
      var shot = load('shot', {});
      shot[a.id] = 1;
      store('shot', shot);
      phase = 12;
      store('phase', phase);
    }
  }
} else if (phase === 12) {
  var a = load('attack', null),
    q = { x: 300, y: a ? a.pos.y : 0 };
  if (sneak(q)) {
    phase = 1;
    store('phase', phase);
  }
}
