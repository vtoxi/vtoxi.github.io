// Skills bubbles: a small physics playground on canvas.
// Soap-bubble look, elastic collisions, cursor repel, drag and throw, double-click to pop.
(function () {
  'use strict';
  var host = document.getElementById('skills-play');
  if (!host) return;
  var canvas = host.querySelector('.pg-canvas');
  var legend = host.querySelector('.pg-legend');
  var tip = host.querySelector('.pg-tip');
  var ctx = canvas.getContext('2d');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var groups = [
    { id: 'lead', name: 'Leadership', color: [244, 114, 182], items: ['Technical leadership', 'Mentoring', 'Hiring', 'Stakeholders', 'Delivery'] },
    { id: 'arch', name: 'Architecture', color: [129, 140, 248], items: ['Solution architecture', 'Microservices', 'Clean Architecture', 'API design', 'Distributed systems', 'Cloud migration'] },
    { id: 'cloud', name: 'Cloud & DevOps', color: [56, 189, 248], items: ['Azure', 'AKS', 'Service Bus', 'Key Vault', 'Azure DevOps', 'Bicep', 'Docker', 'CI/CD'] },
    { id: 'back', name: 'Backend', color: [167, 139, 250], items: ['C#', '.NET', 'ASP.NET Core', 'Web API', 'EF Core', 'SignalR', 'Functions'] },
    { id: 'front', name: 'Frontend', color: [251, 191, 36], items: ['Angular', 'TypeScript', 'JavaScript', 'HTML & CSS', 'Blazor'] },
    { id: 'data', name: 'Data & process', color: [45, 212, 191], items: ['SQL Server', 'Azure SQL', 'Oracle', 'Git', 'Agile'] },
    { id: 'iot', name: 'IoT', color: [74, 222, 128], items: ['ESP32', 'Raspberry Pi', 'Arduino', 'MQTT', 'BLE', 'openHAB'] }
  ];
  var big = { '.NET': 1, 'Angular': 1, 'Azure': 1, 'C#': 1, 'Solution architecture': 1, 'Technical leadership': 1, 'ESP32': 1, 'TypeScript': 1, 'Microservices': 1 };

  var W = 0, H = 0, K = 1, bubbles = [], parts = [], active = null;
  var mouse = { x: -999, y: -999, in: false }, held = null, hover = null, last = 0, raf = 0, visible = false;

  groups.forEach(function (g) {
    var b = document.createElement('button');
    b.type = 'button'; b.dataset.id = g.id;
    b.innerHTML = '<i style="background:rgb(' + g.color.join(',') + ')"></i>' + g.name;
    b.addEventListener('click', function () { active = active === g.id ? null : g.id; syncLegend(); });
    legend.appendChild(b);
  });
  function syncLegend() { Array.prototype.forEach.call(legend.children, function (b) { b.classList.toggle('on', b.dataset.id === active); }); }

  function radiusFor(name, isBig) {
    var longest = Math.max.apply(null, name.split(' ').map(function (w) { return w.length; }));
    return Math.max(24, Math.min(46, 15 + longest * 3.2 + (isBig ? 7 : 0)));
  }
  function anchorsFor(w, h) {
    var p = w < 620
      ? [[.26, .11], [.74, .11], [.26, .34], [.74, .34], [.26, .57], [.74, .57], [.5, .83]]
      : [[.14, .24], [.5, .2], [.86, .24], [.1, .74], [.37, .78], [.63, .78], [.9, .74]];
    return p.map(function (a) { return { x: a[0] * w, y: a[1] * h }; });
  }

  function build() {
    var w = Math.max(300, host.clientWidth - 28);
    var oldW = W, oldH = H;
    W = w; H = w < 620 ? 720 : 430; K = w < 620 ? 0.7 : 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var anc = anchorsFor(W, H);
    if (!bubbles.length) {
      groups.forEach(function (g, gi) {
        g.items.forEach(function (name) {
          var r = radiusFor(name, !!big[name]) * K;
          bubbles.push({
            name: name, g: g, gi: gi, r: r, m: r * r,
            x: anc[gi].x + (Math.random() - .5) * 90, y: anc[gi].y + (Math.random() - .5) * 90,
            vx: (Math.random() - .5) * 30, vy: (Math.random() - .5) * 30, born: 1, hov: 0, popT: 0, ph: Math.random() * 6.28
          });
        });
      });
    } else {
      bubbles.forEach(function (b) {
        b.r = radiusFor(b.name, !!big[b.name]) * K; b.m = b.r * b.r;
        b.x = Math.min(W - b.r, Math.max(b.r, b.x * W / oldW)); b.y = Math.min(H - b.r, Math.max(b.r, b.y * H / oldH));
      });
    }
    anchors = anc;
  }
  var anchors = [];

  function step(dt) {
    var n = bubbles.length, i, j, b, c;
    var cx = W / 2, cy = H / 2;
    for (i = 0; i < n; i++) {
      b = bubbles[i];
      if (b.popT > 0) { b.popT -= dt; if (b.popT <= 0) { b.born = 0; b.x = anchors[b.gi].x; b.y = anchors[b.gi].y; b.vx = b.vy = 0; } continue; }
      if (b.born < 1) b.born = Math.min(1, b.born + dt * 2.2);
      if (b === held) continue;
      // gentle drift (like air currents) and a weak pull toward the category cluster
      b.ph += dt * 0.6;
      var ax = Math.cos(b.ph * 1.3 + b.gi) * 9, ay = Math.sin(b.ph + b.gi * 2) * 9;
      var tgt = active ? (b.g.id === active ? { x: cx, y: cy } : anchors[b.gi]) : anchors[b.gi];
      var spring = active && b.g.id === active ? 2.2 : 0.55;
      ax += (tgt.x - b.x) * spring; ay += (tgt.y - b.y) * spring;
      // cursor swims through the bubbles: repel inside a radius
      if (mouse.in && !held) {
        var dx = b.x - mouse.x, dy = b.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy) || 1, reach = b.r + 70;
        if (d < reach) { var f = (1 - d / reach); f = f * f * 1400; ax += dx / d * f; ay += dy / d * f; }
      }
      b.vx += ax * dt; b.vy += ay * dt;
      var damp = Math.exp(-1.1 * dt); b.vx *= damp; b.vy *= damp;
      b.x += b.vx * dt; b.y += b.vy * dt;
    }
    // elastic collisions
    for (i = 0; i < n; i++) {
      var a = bubbles[i]; if (a.popT > 0) continue;
      for (j = i + 1; j < n; j++) {
        c = bubbles[j]; if (c.popT > 0) continue;
        var ddx = c.x - a.x, ddy = c.y - a.y, dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.01, min = a.r + c.r;
        if (dist < min) {
          var nx = ddx / dist, ny = ddy / dist, over = min - dist;
          var wa = a === held ? 0 : c === held ? 1 : c.m / (a.m + c.m), wc = c === held ? 0 : a === held ? 1 : a.m / (a.m + c.m);
          a.x -= nx * over * wa; a.y -= ny * over * wa; c.x += nx * over * wc; c.y += ny * over * wc;
          var rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rv < 0) {
            var imp = -(1 + 0.86) * rv / (1 / a.m + 1 / c.m);
            if (a !== held) { a.vx -= imp * nx / a.m; a.vy -= imp * ny / a.m; }
            if (c !== held) { c.vx += imp * nx / c.m; c.vy += imp * ny / c.m; }
          }
        }
      }
    }
    // walls
    for (i = 0; i < n; i++) {
      b = bubbles[i];
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.8; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.8; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.8; }
      if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.8; }
    }
    // pop droplets
    for (i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }

  function wrap(text) {
    var w = text.split(' ');
    return w.length > 1 && text.length > 9 ? w : [text];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var i, b;
    for (i = 0; i < bubbles.length; i++) {
      b = bubbles[i]; if (b.popT > 0) continue;
      var dim = active && b.g.id !== active ? 0.16 : 1;
      var grow = (1 + b.hov * 0.08) * (b.born < 1 ? 0.2 + 0.8 * easeOutBack(b.born) : 1);
      var r = b.r * grow, col = b.g.color, rgb = col.join(',');
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy), s = Math.min(0.1, sp * 0.0004), ang = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.globalAlpha = dim;
      ctx.translate(b.x, b.y); ctx.rotate(ang); ctx.scale(1 + s, 1 - s * 0.6); ctx.rotate(-ang);
      // soap-bubble body: clear middle, tinted rim
      var g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
      g.addColorStop(0, 'rgba(255,255,255,0.10)');
      g.addColorStop(0.55, 'rgba(' + rgb + ',0.10)');
      g.addColorStop(0.88, 'rgba(' + rgb + ',0.32)');
      g.addColorStop(1, 'rgba(' + rgb + ',0.62)');
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.65 + b.hov * 0.3) + ')'; ctx.stroke();
      // specular highlights
      ctx.save(); ctx.rotate(-0.7);
      ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.34, r * 0.13, 0, 0, 6.2832); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0.35, 1.05); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.stroke();
      if (b.hov > 0.05) { ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, 6.2832); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.35 * b.hov) + ')'; ctx.stroke(); }
      ctx.restore();
      // label (not squashed)
      ctx.save(); ctx.globalAlpha = dim; ctx.translate(b.x, b.y);
      var fs = (b.r > 34 ? 13 : 11.5) * Math.max(0.82, K) * (1 + b.hov * 0.04);
      ctx.font = '600 ' + fs + 'px system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f1f4ff';
      ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 4;
      var lines = wrap(b.name), lh = fs * 1.15;
      for (var l = 0; l < lines.length; l++) ctx.fillText(lines[l], 0, (l - (lines.length - 1) / 2) * lh);
      ctx.restore();
    }
    for (i = 0; i < parts.length; i++) {
      var p = parts[i]; ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = 'rgb(' + p.c + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function easeOutBack(t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
    if (held) { // spring the held bubble to the pointer so it can shove others around
      var kx = (mouse.x - held.x) * 24, ky = (mouse.y - held.y) * 24;
      held.vx = kx; held.vy = ky; held.x += kx * dt; held.y += ky * dt;
    }
    step(dt);
    var hb = held || pick(mouse.x, mouse.y);
    bubbles.forEach(function (b) { b.hov += ((b === hb && mouse.in ? 1 : 0) - b.hov) * 0.18; });
    if (hb !== hover) {
      hover = hb; canvas.style.cursor = hb ? (held ? 'grabbing' : 'grab') : '';
      if (hb) { tip.textContent = hb.g.name + ' · ' + hb.name; tip.hidden = false; } else tip.hidden = true;
    }
    if (hover && !tip.hidden) { tip.style.left = Math.min(W - 160, Math.max(0, mouse.x + 14)) + 'px'; tip.style.top = Math.max(0, mouse.y - 34) + 'px'; }
    draw();
  }

  function pick(x, y) {
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i]; if (b.popT > 0) continue;
      var dx = x - b.x, dy = y - b.y; if (dx * dx + dy * dy <= b.r * b.r) return b;
    }
    return null;
  }
  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; }

  canvas.addEventListener('pointermove', function (e) { var p = pos(e); mouse.x = p.x; mouse.y = p.y; mouse.in = true; });
  canvas.addEventListener('pointerleave', function () { mouse.in = false; mouse.x = mouse.y = -999; });
  canvas.addEventListener('pointerdown', function (e) {
    var p = pos(e); mouse.x = p.x; mouse.y = p.y; mouse.in = true;
    var b = pick(p.x, p.y);
    if (b) { held = b; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} canvas.style.cursor = 'grabbing'; }
  });
  function release() { held = null; }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('dblclick', function (e) {
    var p = pos(e), b = pick(p.x, p.y); if (!b) return;
    held = null; b.popT = 0.9; b.born = 0;
    for (var i = 0; i < 14; i++) { var a = Math.random() * 6.28, sp = 60 + Math.random() * 160; parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, r: 1.5 + Math.random() * 2.5, life: 0.6, max: 0.6, c: b.g.color.join(',') }); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { active = null; syncLegend(); } });

  build();
  if (reduce) { // settle once, then only redraw on interaction
    for (var s = 0; s < 240; s++) step(1 / 60);
    bubbles.forEach(function (b) { b.born = 1; });
    var redraw = function () { draw(); };
    draw();
    canvas.addEventListener('pointermove', function () { requestAnimationFrame(function () { step(1 / 60); draw(); }); });
    legend.addEventListener('click', function () { for (var s2 = 0; s2 < 120; s2++) step(1 / 60); draw(); });
  } else {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.05 }).observe(host);
  }
  var rt; new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(function () { if (Math.abs(host.clientWidth - 28 - W) > 20) { build(); if (reduce) draw(); } }, 150); }).observe(host);
})();
