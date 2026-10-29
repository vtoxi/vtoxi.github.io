// Interactive layer: progress bar, reveal, tilt cards, typed line, command menu, accents,
// product filter, AquaSync simulator. Everything degrades gracefully without JS.
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* scroll progress */
  var bar = $('#progress');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* reveal on scroll */
  var rev = $$('.section h2, .section .card, .vtoxi .card, .vtoxi h3.sub, .timeline > li, .stats > div, .playground, .tl3d, .filters');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    rev.forEach(function (el, i) { el.classList.add('reveal'); el.style.setProperty('--d', (i % 4) * 70 + 'ms'); io.observe(el); });
  }

  /* spotlight + tilt on cards */
  if (fine) {
    $$('.grid > .card, .stats > div, .venture, .sim').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty('--cx', x + 'px'); c.style.setProperty('--cy', y + 'px');
        if (!reduce && !c.classList.contains('sim')) {
          var rx = ((y / r.height) - 0.5) * -7, ry = ((x / r.width) - 0.5) * 9;
          c.style.transform = 'perspective(800px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-2px)';
        }
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
    var hero = $('.hero');
    if (hero) hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px'); hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* typed rotating line */
  var typed = $('#typed');
  if (typed && !reduce) {
    var phrases = ['enterprise .NET architecture', 'Azure cloud migrations', 'Angular front ends that scale', 'ESP32 and Raspberry Pi gadgets', 'turning ideas into products'];
    var pi = 0, ci = phrases[0].length, deleting = true;
    setTimeout(function tick() {
      if (deleting) {
        ci--;
        typed.textContent = phrases[pi].slice(0, Math.max(ci, 0)) || '\u200b';
        if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 250); return; }
        setTimeout(tick, 28);
      } else {
        ci++;
        typed.textContent = phrases[pi].slice(0, ci);
        if (ci >= phrases[pi].length) { deleting = true; setTimeout(tick, 1800); return; }
        setTimeout(tick, 55);
      }
    }, 2200);
  }

  /* avatar greeting */
  var av = $('.avatar');
  var toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(function () { toast.classList.remove('show'); }, 2200); }
  if (av) av.addEventListener('click', function () { av.classList.remove('burst'); void av.offsetWidth; av.classList.add('burst'); say('Hi, I\'m Faisal. Say hello through the Hire me button.'); });

  /* accent themes */
  var accents = {
    indigo: ['#6366f1', '#14b8a6'], sunset: ['#f97316', '#ec4899'], emerald: ['#10b981', '#22d3ee']
  };
  function setAccent(name, silent) {
    var a = accents[name] || accents.indigo, st = document.documentElement.style;
    st.setProperty('--accent', a[0]); st.setProperty('--accent2', a[1]);
    $$('.swatches button').forEach(function (b) { b.classList.toggle('on', b.dataset.accent === name); });
    try { localStorage.setItem('accent', name); } catch (e) {}
    if (!silent) say('Accent: ' + name);
  }
  $$('.swatches button').forEach(function (b) { b.addEventListener('click', function () { setAccent(b.dataset.accent); }); });
  try { var saved = localStorage.getItem('accent'); if (saved && accents[saved]) setAccent(saved, true); } catch (e) {}

  /* product filter */
  var fb = $$('.filters button');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      fb.forEach(function (x) { x.classList.toggle('on', x === b); });
      var f = b.dataset.f;
      $$('.products > .card').forEach(function (c) {
        var show = f === 'all' || (c.dataset.cat || '').split(' ').indexOf(f) > -1;
        c.classList.toggle('hide', !show);
      });
    });
  });

  /* command menu */
  var cmds = [
    { t: 'Go to About', k: 'section', run: function () { go('#about'); } },
    { t: 'Go to Experience', k: 'section', run: function () { go('#experience'); } },
    { t: 'Go to Case studies', k: 'section', run: function () { go('#work'); } },
    { t: 'Go to Skills', k: 'section', run: function () { go('#skills'); } },
    { t: 'Go to VTOXI', k: 'section', run: function () { go('#vtoxi'); } },
    { t: 'Go to IoT lab', k: 'section', run: function () { go('#iot'); } },
    { t: 'Go to Contact', k: 'section', run: function () { go('#contact'); } },
    { t: 'Hire me (send an email)', k: 'action', run: function () { location.href = 'mailto:faisalshafi69@gmail.com?subject=Project%20inquiry%20from%20your%20portfolio'; } },
    { t: 'Download resume (PDF)', k: 'action', run: function () { var a = document.createElement('a'); a.href = 'assets/Faisal-Shafi-Resume.pdf'; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); } },
    { t: 'Open GitHub profile', k: 'link', run: function () { open('https://github.com/vtoxi', '_blank', 'noopener'); } },
    { t: 'Open LinkedIn', k: 'link', run: function () { open('https://linkedin.com/in/faisalshafi11', '_blank', 'noopener'); } },
    { t: 'Buy me a coffee', k: 'link', run: function () { open('https://buymeacoffee.com/faisalshafi', '_blank', 'noopener'); } },
    { t: 'Replay the 3D timeline', k: 'action', run: function () { go('#experience'); setTimeout(function () { var b = $('.tl-controls [data-view="replay"]'); if (b) b.click(); }, 500); } },
    { t: 'Accent: Indigo and teal', k: 'theme', run: function () { setAccent('indigo'); } },
    { t: 'Accent: Sunset', k: 'theme', run: function () { setAccent('sunset'); } },
    { t: 'Accent: Emerald', k: 'theme', run: function () { setAccent('emerald'); } }
  ];
  function go(sel) { var el = $(sel); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  var pal = document.createElement('div');
  pal.className = 'palette'; pal.hidden = true; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Command menu');
  pal.innerHTML = '<div class="pal-box"><input type="text" placeholder="Type a command or section…" aria-label="Search commands" autocomplete="off"><ul role="listbox"></ul><p class="pal-hint"><kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>Enter</kbd> run <kbd>Esc</kbd> close</p></div>';
  document.body.appendChild(pal);
  var pin = $('input', pal), pul = $('ul', pal), sel = 0, shown = cmds, lastFocus = null;
  function render() {
    var q = pin.value.trim().toLowerCase();
    shown = cmds.filter(function (c) { return !q || c.t.toLowerCase().indexOf(q) > -1 || c.k.indexOf(q) > -1; });
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    pul.innerHTML = shown.map(function (c, i) { return '<li role="option" data-i="' + i + '"' + (i === sel ? ' class="sel" aria-selected="true"' : '') + '><span>' + c.t + '</span><em>' + c.k + '</em></li>'; }).join('') || '<li class="none">No match</li>';
  }
  function openPal() { lastFocus = document.activeElement; pal.hidden = false; pin.value = ''; sel = 0; render(); pin.focus(); }
  function closePal() { pal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function runSel() { var c = shown[sel]; if (c) { closePal(); setTimeout(c.run, 30); } }
  pin.addEventListener('input', function () { sel = 0; render(); });
  pul.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) { sel = +li.dataset.i; runSel(); } });
  pal.addEventListener('mousedown', function (e) { if (e.target === pal) closePal(); });
  pal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); closePal(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); runSel(); }
  });
  var ob = $('#open-palette'); if (ob) ob.addEventListener('click', openPal);
  addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''));
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.hidden ? openPal() : closePal(); }
    else if (e.key === '/' && !typing && pal.hidden) { e.preventDefault(); openPal(); }
  });

  /* AquaSync simulator (simplified model of the real firmware's logic) */
  var sim = $('#sim');
  if (sim) {
    var START = 30, STOP = 95, CUTOFF_S = 10;
    var level = 50, pumpOn = false, mode = 'auto', fault = false, runS = 0, lastPub = -1, logEl = $('#sim-log');
    var water = $('#sim-water'), pct = $('#sim-pct'), led = $('#sim-led'), pumpTxt = $('#sim-pump'), dry = $('#sim-dry'), spill = $('#sim-spill');
    var emergency = false, flooding = false, floodPx = 0, floodEls = null, panel = null;

    function log(topic, val, warn) {
      var li = document.createElement('li'); if (warn) li.className = 'warn';
      li.innerHTML = '<code>aquasync/' + topic + '</code> ' + val;
      logEl.insertBefore(li, logEl.firstChild);
      while (logEl.children.length > 6) logEl.removeChild(logEl.lastChild);
    }
    function setMode(m) {
      mode = m;
      $$('.seg button', sim).forEach(function (x) { x.classList.toggle('on', x.dataset.mode === m); });
    }
    function paint() {
      var y = 20 + 200 * (1 - level / 100);
      water.setAttribute('transform', 'translate(0,' + y.toFixed(1) + ')');
      pct.textContent = Math.round(level) + '%';
      led.className = 'led ' + (fault || flooding ? 'bad' : pumpOn ? 'on' : '');
      pumpTxt.textContent = flooding ? 'OVERFLOW' : fault ? 'FAULT' : pumpOn ? 'ON' : 'OFF';
      spill.setAttribute('opacity', flooding ? 1 : 0);
      sim.classList.toggle('overflowing', flooding);
    }
    function setPump(v) { if (pumpOn !== v) { pumpOn = v; runS = 0; log('motor', v ? 'ON' : 'OFF'); } }

    /* ---- flood: page-wide water, floating content, emergency stop ---- */
    var SINK = '.card, .stats > div, .section h2, .vtoxi h2, .btn:not(.btn-small), .soc, .playground, .tl3d, .sub, .eyebrow, .lead, .chips span, .logo';
    var capPx = 0, tNow = 0, scanN = 0, sunk = new Map(), looping = false, lastT = 0;
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

    function buildFlood() {
      if (floodEls) return;
      var f = document.createElement('div'); f.className = 'flood'; f.setAttribute('aria-hidden', 'true');
      var wave = '<svg class="wave-a" viewBox="0 0 1200 40" preserveAspectRatio="none"><path d="M0 20 Q150 0 300 20 T600 20 T900 20 T1200 20 V40 H0z"/></svg>' +
                 '<svg class="wave-b" viewBox="0 0 1200 40" preserveAspectRatio="none"><path d="M0 22 Q150 40 300 22 T600 22 T900 22 T1200 22 V40 H0z"/></svg>';
      var bubbles = ''; for (var i = 0; i < 22; i++) bubbles += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;animation-delay:' + (-Math.random() * 7).toFixed(2) + 's;animation-duration:' + (4 + Math.random() * 5).toFixed(1) + 's;width:' + (4 + Math.random() * 10).toFixed(0) + 'px;height:' + (4 + Math.random() * 10).toFixed(0) + 'px"></i>';
      // things that float on the surface and drift across
      var items = [
        '<span class="fl chip">.NET</span>', '<span class="fl chip">Angular</span>', '<span class="fl chip">Azure</span>', '<span class="fl chip">ESP32</span>', '<span class="fl chip">C#</span>', '<span class="fl chip">MQTT</span>',
        '<span class="fl duck">🦆</span>', '<span class="fl duck">🛶</span>',
        '<svg class="fl ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#fff" stroke-width="9"/><circle cx="20" cy="20" r="14" fill="none" stroke="#ef4444" stroke-width="9" stroke-dasharray="11 11"/></svg>',
        '<svg class="fl ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#fff" stroke-width="9"/><circle cx="20" cy="20" r="14" fill="none" stroke="#f59e0b" stroke-width="9" stroke-dasharray="11 11"/></svg>'
      ];
      var fl = '<div class="floaters">' + items.map(function (h, k) {
        var dur = 34 + Math.random() * 34, delay = -Math.random() * dur, dir = k % 3 === 0 ? 'reverse' : 'normal';
        return '<div class="drift" style="animation-duration:' + dur.toFixed(1) + 's;animation-delay:' + delay.toFixed(1) + 's;animation-direction:' + dir + '"><div class="bob" style="animation-delay:' + (-Math.random() * 4).toFixed(2) + 's;animation-duration:' + (2.4 + Math.random() * 2).toFixed(2) + 's">' + h + '</div></div>';
      }).join('') + '</div>';
      f.innerHTML = '<div class="flood-body">' + bubbles + '</div>' + wave + fl;
      var al = document.createElement('div'); al.className = 'alarm'; al.setAttribute('aria-hidden', 'true');
      panel = document.createElement('div'); panel.className = 'estop-panel'; panel.setAttribute('role', 'alert');
      panel.innerHTML = '<p><b>Tank overflow.</b> Water is spreading across the page.</p>' +
        '<button type="button" class="estop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 2h7.6L22 8.2v7.6L15.8 22H8.2L2 15.8V8.2z"/><path d="M8 8l8 8M16 8l-8 8"/></svg><span>EMERGENCY STOP</span></button>';
      document.body.appendChild(f); document.body.appendChild(al); document.body.appendChild(panel);
      floodEls = { f: f, al: al };
      $('.estop', panel).addEventListener('click', emergencyStop);
    }

    // buoyancy: each element under the waterline sinks by how submerged it is, then drifts, bobs and
    // sways on springs, so it eases in when the water rises and floats back up when it drains
    function scanTargets(top) {
      var els = $$(SINK), reads = [];
      els.forEach(function (el) {
        var st = sunk.get(el), r = el.getBoundingClientRect();
        var oy = st ? st.y : 0, h = r.height;
        if (!h || r.bottom < 0 || r.top > innerHeight || el.closest('.estop-panel') || el.closest('.palette')) { if (st) st.s = 0; return; }
        var below = (r.bottom - oy) - top;          // how far the element's natural bottom is under the surface
        var s = clamp(below / Math.max(24, h * 0.9), 0, 1);
        if (s > 0.1 && !st) {
          st = { x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, s: 0, f: 0, ph: Math.random() * 6.28, depth: 12 + Math.random() * 30, tilt: (Math.random() - .5) * 8, sway: 5 + Math.random() * 12, spd: .5 + Math.random() * .7 };
          sunk.set(el, st);
        }
        if (st) st.s = s > 0.1 ? s : 0;
      });
    }
    function stepSunk(dt) {
      sunk.forEach(function (st, el) {
        var live = st.s > 0;
        var tx = 0, ty = 0, tr = 0;
        if (live) {
          var bob = reduce ? 0 : Math.sin(tNow * (1.3 * st.spd) + st.ph) * (3 + 5 * (1 - st.s));
          tx = reduce ? 0 : Math.sin(tNow * st.spd * .55 + st.ph) * st.sway * (0.4 + st.s);
          ty = st.depth * st.s + bob;
          tr = st.tilt * st.s + (reduce ? 0 : Math.sin(tNow * st.spd * .9 + st.ph * 1.7) * 1.4);
        }
        // damped springs
        var k = live ? 38 : 26, c = live ? 5.5 : 8;
        st.vx += ((tx - st.x) * k - st.vx * c) * dt; st.x += st.vx * dt;
        st.vy += ((ty - st.y) * k - st.vy * c) * dt; st.y += st.vy * dt;
        st.vr += ((tr - st.r) * k - st.vr * c) * dt; st.r += st.vr * dt;
        if (!live && Math.abs(st.x) + Math.abs(st.y) + Math.abs(st.r) < 0.15 && Math.abs(st.vy) < 0.3) {
          el.style.translate = ''; el.style.rotate = ''; el.style.filter = ''; sunk.delete(el); return;
        }
        el.style.translate = st.x.toFixed(2) + 'px ' + st.y.toFixed(2) + 'px';
        el.style.rotate = st.r.toFixed(2) + 'deg';
        var nf = st.f + ((live ? st.s : 0) - st.f) * (1 - Math.exp(-dt * 4));
        if (Math.abs(nf - st.f) > 0.015 || (nf < 0.015 && st.f !== 0)) {
          st.f = nf < 0.015 ? 0 : nf;
          el.style.filter = st.f ? 'saturate(' + (1 - 0.25 * st.f).toFixed(2) + ') hue-rotate(' + (12 * st.f).toFixed(0) + 'deg) brightness(' + (1 - 0.1 * st.f).toFixed(2) + ')' : '';
        }
      });
    }

    function startEmergency() {
      emergency = true; buildFlood(); kick();
      window.dispatchEvent(new CustomEvent('pf:event', { detail: { name: 'sim_overflow' } }));
      log('fault', 'OVERFLOW: water on the floor!', true);
      say('Tank overflow! Press EMERGENCY STOP.');
    }
    function emergencyStop() {
      setMode('off'); setPump(false); emergency = false;
      window.dispatchEvent(new CustomEvent('pf:event', { detail: { name: 'sim_emergency_stop' } }));
      log('motor', 'EMERGENCY STOP engaged', true);
      say('Motor stopped. Draining the water.');
    }

    function floodFrame(ts) {
      var dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016); lastT = ts; tNow = ts / 1000;
      capPx = innerHeight * 0.64;
      // water level eases toward its target (rises steadily, drains with an ease-out)
      if (flooding) floodPx = Math.min(capPx, floodPx + innerHeight * (reduce ? 0.2 : 0.05) * dt);
      else floodPx += (0 - floodPx) * (1 - Math.exp(-dt * 2.2)) - (floodPx > 0 ? innerHeight * 0.02 * dt : 0);
      if (floodPx < 0.4) floodPx = 0;
      if (floodEls) {
        var hidden = capPx - floodPx;
        floodEls.f.style.height = capPx.toFixed(0) + 'px';
        floodEls.f.style.transform = 'translate3d(0,' + hidden.toFixed(1) + 'px,0)';
        floodEls.f.style.setProperty('--h', floodPx.toFixed(0) + 'px');
        floodEls.f.style.visibility = floodPx > 0 ? 'visible' : 'hidden';
        var on = floodPx > 0;
        document.body.classList.toggle('flooded', on);
        document.body.classList.toggle('emergency', emergency || flooding);
        panel.classList.toggle('show', emergency || (flooding && on));
        if ((scanN++ % 5) === 0) scanTargets(innerHeight - floodPx);
        stepSunk(dt);
      }
      if (!flooding && emergency && floodPx <= 0) emergency = false;
      if (floodPx > 0 || sunk.size || flooding) requestAnimationFrame(floodFrame); else looping = false;
    }
    function kick() { if (!looping) { looping = true; lastT = performance.now(); requestAnimationFrame(floodFrame); } }

    setInterval(function () {
      var dt = 0.25;
      if (!fault) {
        if (mode === 'auto') { if (level <= START) setPump(true); else if (level >= STOP) setPump(false); }
        else setPump(mode === 'on');
      } else setPump(false);
      if (pumpOn) {
        if (!dry.checked) level = Math.min(100, level + 4 * dt);
        runS += dt;
        if (runS > CUTOFF_S && level < STOP && mode === 'auto') { fault = true; setPump(false); log('fault', 'dry_run cutoff, manual reset needed', true); }
      }
      flooding = pumpOn && level >= 99.9;
      if (flooding && !emergency) startEmergency(); else if (flooding) kick();
      level = Math.max(0, level - (flooding ? 0 : 0.04));
      var r = Math.round(level / 5) * 5;
      if (r !== lastPub) { lastPub = r; log('level', r + '%'); }
      paint();
    }, 250);
    $$('.seg button', sim).forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.dataset.mode); log('mode', mode); });
    });
    $('#sim-use').addEventListener('click', function () { level = Math.max(0, level - 15); });
    $('#sim-reset').addEventListener('click', function () { if (fault) { fault = false; runS = 0; log('fault', 'cleared'); } });
    log('status', 'online'); paint();
  }
})();
