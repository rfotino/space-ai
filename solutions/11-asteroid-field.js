// Level: Asteroid Field
// Strategy: run A* on a padded grid, smooth the path with line-of-sight checks,
// then follow the remaining waypoints with closed-loop control.
function dist(a, b) {
  var x = a.x - b.x,
    y = a.y - b.y;
  return Math.sqrt(x * x + y * y);
}
function clearLine(a, b, rocks) {
  // Reject segments that enter an asteroid's radius plus a safety margin.
  var vx = b.x - a.x,
    vy = b.y - a.y,
    ll = vx * vx + vy * vy;
  for (var i = 0; i < rocks.length; i++) {
    var o = rocks[i],
      t = ll ? ((o.pos.x - a.x) * vx + (o.pos.y - a.y) * vy) / ll : 0;
    t = Math.max(0, Math.min(1, t));
    var x = a.x + t * vx - o.pos.x,
      y = a.y + t * vy - o.pos.y;
    if (x * x + y * y < (o.radius + 50) * (o.radius + 50)) return false;
  }
  return true;
}
function plan(start, goal, rocks) {
  // Search an eight-connected, 25-unit grid around all relevant objects.
  var cell = 25,
    minX = Math.min(start.x, goal.x),
    maxX = Math.max(start.x, goal.x);
  var minY = Math.min(start.y, goal.y),
    maxY = Math.max(start.y, goal.y);
  for (var i = 0; i < rocks.length; i++) {
    minX = Math.min(minX, rocks[i].pos.x - rocks[i].radius);
    maxX = Math.max(maxX, rocks[i].pos.x + rocks[i].radius);
    minY = Math.min(minY, rocks[i].pos.y - rocks[i].radius);
    maxY = Math.max(maxY, rocks[i].pos.y + rocks[i].radius);
  }
  var loX = Math.floor((minX - 100) / cell),
    hiX = Math.ceil((maxX + 100) / cell);
  var loY = Math.floor((minY - 100) / cell),
    hiY = Math.ceil((maxY + 100) / cell);
  function pt(ix, iy) {
    return { x: ix * cell, y: iy * cell };
  }
  function blocked(p) {
    for (var j = 0; j < rocks.length; j++)
      if (dist(p, rocks[j].pos) < rocks[j].radius + 50) return true;
    return false;
  }
  function nearest(p) {
    var bx = Math.round(p.x / cell),
      by = Math.round(p.y / cell),
      best = null,
      bd = 1e99;
    for (var r = 0; r < 7; r++)
      for (var x = bx - r; x <= bx + r; x++)
        for (var y = by - r; y <= by + r; y++) {
          if (x < loX || x > hiX || y < loY || y > hiY) continue;
          var q = pt(x, y),
            dd = dist(p, q);
          if (!blocked(q) && clearLine(p, q, rocks) && dd < bd) {
            best = { x: x, y: y };
            bd = dd;
          }
        }
    return best;
  }
  var s = nearest(start),
    g = nearest(goal),
    open = [],
    score = {},
    from = {},
    closed = {};
  function key(n) {
    return n.x + ',' + n.y;
  }
  function push(n, f) {
    open.push({ n: n, f: f });
    var k = open.length - 1;
    while (k) {
      var p = (k - 1) >> 1;
      if (open[p].f <= f) break;
      open[k] = open[p];
      k = p;
    }
    open[k] = { n: n, f: f };
  }
  function pop() {
    var top = open[0],
      last = open.pop();
    if (open.length) {
      var k = 0;
      open[0] = last;
      while (true) {
        var l = k * 2 + 1,
          r = l + 1,
          m = k;
        if (l < open.length && open[l].f < open[m].f) m = l;
        if (r < open.length && open[r].f < open[m].f) m = r;
        if (m === k) break;
        var z = open[k];
        open[k] = open[m];
        open[m] = z;
        k = m;
      }
    }
    return top.n;
  }
  score[key(s)] = 0;
  push(s, dist(pt(s.x, s.y), pt(g.x, g.y)));
  var dirs = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1]
  ];
  while (open.length) {
    var cur = pop(),
      ck = key(cur);
    if (closed[ck]) continue;
    closed[ck] = 1;
    if (ck === key(g)) break;
    var cp = pt(cur.x, cur.y);
    for (var d = 0; d < dirs.length; d++) {
      var nx = cur.x + dirs[d][0],
        ny = cur.y + dirs[d][1];
      if (nx < loX || nx > hiX || ny < loY || ny > hiY) continue;
      var np = pt(nx, ny),
        nn = { x: nx, y: ny },
        nk = key(nn);
      if (blocked(np) || !clearLine(cp, np, rocks)) continue;
      var ng = score[ck] + dist(cp, np);
      if (score[nk] === undefined || ng < score[nk]) {
        score[nk] = ng;
        from[nk] = cur;
        push(nn, ng + dist(np, pt(g.x, g.y)));
      }
    }
  }
  // Reconstruct the grid route, then remove waypoints that can be skipped.
  var raw = [goal],
    c = g,
    guard = 0;
  if (!from[key(c)] && key(c) !== key(s)) return [goal];
  while (key(c) !== key(s) && guard++ < 10000) {
    raw.unshift(pt(c.x, c.y));
    c = from[key(c)];
  }
  raw.unshift(pt(s.x, s.y));
  var smooth = [],
    anchor = start,
    index = 0;
  while (index < raw.length) {
    var far = index;
    for (var j = index; j < raw.length; j++)
      if (clearLine(anchor, raw[j], rocks)) far = j;
      else break;
    smooth.push(raw[far]);
    anchor = raw[far];
    index = far + 1;
  }
  return smooth;
}
function wrap(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function fly(q, last) {
  var p = pos(),
    v = vel(),
    dx = q.x - p.x,
    dy = q.y - p.y,
    d = Math.sqrt(dx * dx + dy * dy);
  var speed = Math.min(1.5, Math.sqrt(d) * 0.35),
    ax = (dx / (d || 1)) * speed - v.x,
    ay = (dy / (d || 1)) * speed - v.y;
  var angle = Math.atan2(ay, ax),
    e = wrap(angle - p.angular);
  turn(Math.max(-1, Math.min(1, 2 * e - 30 * v.angular)));
  thrust(
    Math.abs(e) < 0.18 ? Math.min(1, Math.sqrt(ax * ax + ay * ay) / 0.5) : 0
  );
  return d < (last ? 12 : 30);
}
var route = load('route', null),
  step = load('step', 0);
if (!route) {
  var target = radar({ objective: 'reach' })[0];
  route = plan(pos(), target.pos, radar('asteroid'));
  store('route', route);
}
if (step < route.length && fly(route[step], step === route.length - 1)) {
  step++;
  store('step', step);
}
