// Level: Mine Field
// Strategy: simulate the ship and moving mines to plan a safe outbound path,
// then evaluate short velocity trajectories repeatedly on the return trip.
// The first-frame beam search can take several seconds before movement begins.
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
function planOut(p, v, ac, ms, safe) {
  // Kinodynamic beam search. Each candidate simulates ship and mine movement
  // for seven frames before the next velocity choice.
  var A = [],
    xs = [5, 9, 13, 17];
  for (var i = 0; i < 4; i++)
    for (var y = -12; y <= 12; y += 4) A.push({ x: xs[i], y: y });
  var m = [];
  for (i = 0; i < ms.length; i++)
    m.push({
      x: ms[i].pos.x,
      y: ms[i].pos.y,
      vx: ms[i].vel.x,
      vy: ms[i].vel.y
    });
  var beam = [
      {
        x: p.x,
        y: p.y,
        vx: v.x,
        vy: v.y,
        a: p.angular,
        w: v.angular,
        ax: ac.x,
        ay: ac.y,
        m: m,
        path: [],
        c: 240
      }
    ],
    W = 360,
    N = 7;
  for (var dep = 0; dep < 42; dep++) {
    var next = [],
      win = null;
    for (var bi = 0; bi < beam.length; bi++)
      for (var ai = 0; ai < A.length; ai++) {
        var s = beam[bi],
          u = A[ai],
          px = s.x,
          py = s.y,
          pvx = s.vx,
          pvy = s.vy,
          pa = s.a,
          pw = s.w,
          pax = s.ax,
          pay = s.ay,
          mm = [],
          cl = s.c,
          bad = false;
        for (i = 0; i < s.m.length; i++)
          mm.push({ x: s.m[i].x, y: s.m[i].y, vx: s.m[i].vx, vy: s.m[i].vy });
        for (var t = 0; t < N; t++) {
          var dx = u.x - pvx,
            dy = u.y - pvy,
            z = Math.sqrt(dx * dx + dy * dy),
            tp = clamp(-20 * pw, -1, 1),
            pow = 0;
          if (z >= 0.015) {
            var e = wrap(Math.atan2(dy, dx) - pa);
            tp = clamp(3 * e - 20 * pw, -1, 1);
            if (Math.abs(e) < 0.18) pow = clamp(z / 0.5, 0, 1);
          }
          pvx += pax;
          pvy += pay;
          pw += 0.005 * tp;
          px += pvx;
          py += pvy;
          pa += pw;
          pax = 0.5 * pow * Math.cos(pa);
          pay = 0.5 * pow * Math.sin(pa);
          if (px < 1610 && Math.abs(py) > 245) {
            bad = true;
            break;
          }
          for (var j = 0; j < mm.length; j++) {
            var q = mm[j],
              mx = px - q.x,
              my = py - q.y,
              d = Math.sqrt(mx * mx + my * my);
            cl = Math.min(cl, d);
            if (d < safe) {
              bad = true;
              break;
            }
            if (d < 200) {
              q.vx = ((mx / (d || 1)) * 200) / d;
              q.vy = ((my / (d || 1)) * 200) / d;
            }
            q.x += q.vx;
            q.y += q.vy;
            mx = px - q.x;
            my = py - q.y;
            d = Math.sqrt(mx * mx + my * my);
            cl = Math.min(cl, d);
            if (d < safe) {
              bad = true;
              break;
            }
          }
          if (bad) break;
        }
        if (bad) continue;
        var n = {
          x: px,
          y: py,
          vx: pvx,
          vy: pvy,
          a: pa,
          w: pw,
          ax: pax,
          ay: pay,
          m: mm,
          path: s.path.concat([ai]),
          c: cl
        };
        n.sc =
          px * 20 +
          Math.min(cl, 180) * 3 -
          Math.abs(py) * 0.3 -
          Math.abs(pvy) * 2;
        if (px > 1650) {
          win = n;
          break;
        }
        next.push(n);
      }
    if (win) return win.path;
    if (!next.length) return null;
    // Keep safe, forward-moving states and deduplicate nearby states.
    next.sort(function (a, b) {
      return b.sc - a.sc;
    });
    var seen = {},
      fresh = [];
    for (i = 0; i < next.length && fresh.length < W; i++) {
      var n = next[i],
        k =
          Math.round(n.x / 35) +
          ',' +
          Math.round(n.y / 25) +
          ',' +
          Math.round(n.vx / 2) +
          ',' +
          Math.round(n.vy / 2) +
          ',' +
          Math.round(n.a / 0.35) +
          ',' +
          Math.round(n.w / 0.015);
      if (!seen[k]) {
        seen[k] = 1;
        fresh.push(n);
      }
    }
    beam = fresh;
  }
  return null;
}
function dock(vx, vy) {
  var p = pos(),
    v = vel(),
    ax = vx - v.x,
    ay = vy - v.y,
    m = Math.sqrt(ax * ax + ay * ay);
  if (m < 0.015) {
    turn(clamp(-10 * v.angular, -1, 1));
    thrust(0);
    return;
  }
  var e = wrap(Math.atan2(ay, ax) - p.angular);
  turn(clamp(0.8 * e - 10 * v.angular, -1, 1));
  thrust(Math.abs(e) < 0.22 ? clamp(m / 0.5, 0, 1) : 0);
}
var p = pos(),
  v = vel(),
  ac = accel(),
  ms = radar('mine'),
  best = null,
  bs = -1e99,
  H = 100,
  held = load('held', null),
  hold = load('hold', 0),
  ret = load('return', 0),
  planned = false,
  pl = load('plan', null),
  pf = load('pf', 0),
  A = [];
for (var zi = 0; zi < 4; zi++)
  for (var zy = -12; zy <= 12; zy += 4)
    A.push({ x: [5, 9, 13, 17][zi], y: zy });
if (!ret && !pl) {
  // Plan once on departure, relaxing the clearance only if necessary.
  pl = planOut(p, v, ac, ms, 56);
  if (!pl) pl = planOut(p, v, ac, ms, 52);
  if (pl) store('plan', pl);
}
if (!ret && pl && Math.floor(pf / 7) < pl.length) {
  best = A[pl[Math.floor(pf / 7)]];
  store('pf', pf + 1);
  planned = true;
}
if (ret || p.x > 1650) {
  // Replan the return leg against the mines' current displaced positions.
  if (!ret) {
    ret = 1;
    store('return', 1);
  }
  var rh = load('rheld', null),
    rn = load('rhold', 0),
    goal = radar({ objective: 'reach' })[0].pos;
  if (rn > 0 && rh) {
    best = rh;
    store('rhold', rn - 1);
  } else {
    var bh = false,
      bht = 3,
      ga = Math.atan2(goal.y - p.y, goal.x - p.x),
      gd = Math.sqrt(
        (goal.x - p.x) * (goal.x - p.x) + (goal.y - p.y) * (goal.y - p.y)
      ),
      speeds = gd < 180 ? [5, 7] : [5, 7, 9];
    for (var si = 0; si < speeds.length; si++)
      for (var ai = -5; ai <= 5; ai++) {
        var aa = ga + ai * 0.22,
          tx = speeds[si] * Math.cos(aa),
          ty = speeds[si] * Math.sin(aa),
          px = p.x,
          py = p.y,
          pvx = v.x,
          pvy = v.y,
          pa = p.angular,
          pw = v.angular,
          pax = ac.x,
          pay = ac.y,
          copy = [],
          clear = 1e9,
          bad = false,
          survive = 120,
          hit = false,
          ht = 120;
        for (var i = 0; i < ms.length; i++)
          copy.push({
            x: ms[i].pos.x,
            y: ms[i].pos.y,
            vx: ms[i].vel.x,
            vy: ms[i].vel.y
          });
        for (var t = 0; t < 120; t++) {
          var dx = tx - pvx,
            dy = ty - pvy,
            m = Math.sqrt(dx * dx + dy * dy),
            turnp = clamp(-20 * pw, -1, 1),
            power = 0;
          if (m >= 0.015) {
            var e = wrap(Math.atan2(dy, dx) - pa);
            turnp = clamp(3 * e - 20 * pw, -1, 1);
            if (Math.abs(e) < 0.18) power = clamp(m / 0.5, 0, 1);
          }
          pvx += pax;
          pvy += pay;
          pw += 0.005 * turnp;
          px += pvx;
          py += pvy;
          pa += pw;
          pax = 0.5 * power * Math.cos(pa);
          pay = 0.5 * power * Math.sin(pa);
          if (px < 1610 && Math.abs(py) > 250) {
            bad = true;
            survive = t;
            break;
          }
          if (px < 1450) {
            bad = true;
            survive = t;
            break;
          }
          for (var j = 0; j < copy.length; j++) {
            var q = copy[j],
              mx = px - q.x,
              my = py - q.y,
              d = Math.sqrt(mx * mx + my * my);
            clear = Math.min(clear, d);
            if (d < 60) {
              bad = true;
              survive = t;
              break;
            }
            if (d < 200) {
              q.vx = ((mx / (d || 1)) * 200) / d;
              q.vy = ((my / (d || 1)) * 200) / d;
            }
            q.x += q.vx;
            q.y += q.vy;
            mx = px - q.x;
            my = py - q.y;
            d = Math.sqrt(mx * mx + my * my);
            clear = Math.min(clear, d);
            if (d < 60) {
              bad = true;
              survive = t;
              break;
            }
          }
          if (bad) break;
          var tg = Math.sqrt(
            (goal.x - px) * (goal.x - px) + (goal.y - py) * (goal.y - py)
          );
          if (tg < 15) {
            hit = true;
            ht = t;
            break;
          }
        }
        var ed = Math.sqrt(
            (goal.x - px) * (goal.x - px) + (goal.y - py) * (goal.y - py)
          ),
          score = hit
            ? 1e10 - ht * 1e6 + Math.min(clear, 260) * 5
            : bad
              ? -1e9 + survive * 1e6 - ed * 10
              : -ed * 120 + Math.min(clear, 260) * 5 - Math.abs(ty) * 2;
        if (score > bs) {
          bs = score;
          best = { x: tx, y: ty };
          bh = hit;
          bht = ht;
        }
      }
    store('rheld', best);
    store('rhold', bh ? bht : 3);
  }
} else if (planned) {
} else if (hold > 0 && held) {
  best = held;
  store('hold', hold - 1);
} else
  for (var xi = 0; xi < 4; xi++)
    for (var yi = -6; yi <= 6; yi++) {
      var tx = [5, 9, 13, 17][xi],
        ty = yi * 2,
        px = p.x,
        py = p.y,
        pvx = v.x,
        pvy = v.y,
        pa = p.angular,
        pw = v.angular,
        pax = ac.x,
        pay = ac.y,
        copy = [],
        clear = 1e9,
        bad = false;
      for (var i = 0; i < ms.length; i++)
        copy.push({
          x: ms[i].pos.x,
          y: ms[i].pos.y,
          vx: ms[i].vel.x,
          vy: ms[i].vel.y
        });
      for (var t = 0; t < H; t++) {
        var ax = tx - pvx,
          ay = ty - pvy,
          m = Math.sqrt(ax * ax + ay * ay),
          turnp = clamp(-20 * pw, -1, 1),
          power = 0;
        if (m >= 0.015) {
          var e = wrap(Math.atan2(ay, ax) - pa);
          turnp = clamp(3 * e - 20 * pw, -1, 1);
          if (Math.abs(e) < 0.18) power = clamp(m / 0.5, 0, 1);
        }
        pvx += pax;
        pvy += pay;
        pw += 0.005 * turnp;
        px += pvx;
        py += pvy;
        pa += pw;
        pax = 0.5 * power * Math.cos(pa);
        pay = 0.5 * power * Math.sin(pa);
        if (Math.abs(py) > 250) {
          bad = true;
          break;
        }
        for (var j = 0; j < copy.length; j++) {
          var q = copy[j],
            dx = px - q.x,
            dy = py - q.y,
            d = Math.sqrt(dx * dx + dy * dy);
          clear = Math.min(clear, d);
          if (d < 55) {
            bad = true;
            break;
          }
          if (d < 200) {
            q.vx = ((dx / (d || 1)) * 200) / d;
            q.vy = ((dy / (d || 1)) * 200) / d;
          }
          q.x += q.vx;
          q.y += q.vy;
        }
        if (bad) break;
      }
      var score =
        (bad ? -1e8 : 0) +
        px * 25 +
        Math.min(clear, 220) * 3 -
        Math.abs(py) * 0.2 -
        Math.abs(ty) * 2;
      if (score > bs) {
        bs = score;
        best = { x: tx, y: ty };
      }
    }
if (!ret && !planned && hold <= 0) {
  store('held', best);
  store('hold', 6);
}
drive(best.x, best.y);
