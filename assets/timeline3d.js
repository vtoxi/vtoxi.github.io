// 3D career timeline: Three.js scene, D3 scales/ticks. Overlapping roles sit in separate lanes
// and are joined by a glowing slab. Falls back to the card list below if WebGL is unavailable.
import * as THREE from 'three';

const root = document.getElementById('tl3d');
if (root) start();

function start() {
  const canvas = root.querySelector('canvas');
  const labelsEl = root.querySelector('.tl-labels');
  const tip = root.querySelector('.tl-tip');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const d3 = window.d3;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    root.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const now = new Date();
  const nowY = now.getFullYear() + now.getMonth() / 12;
  // Decimal years. lane 0 = main role, lane 1 = concurrent role. approx = year-level dates.
  const roles = [
    { id: 'rock', label: 'Rockville', title: 'Software Developer', org: 'Rockville Technologies Pakistan', s: 2015.5, e: 2017.0, lane: 0, c: 0x6366f1, range: '2015 to 2017', approx: true },
    { id: 'gov', label: 'Govt. of Pakistan', title: 'Information Technology Officer', org: 'Government of Pakistan', s: 2017.0, e: 2020.0, lane: 0, c: 0x14b8a6, range: '2017 to 2020', approx: true },
    { id: 'syn', label: 'Synergy-IT', title: 'Senior Software Engineer', org: 'Synergy-IT Pakistan', s: 2020.0, e: 2022.6, lane: 0, c: 0xf59e0b, range: '2020 to 2022', approx: true },
    { id: 'sdc', label: 'Systems Ltd · AP', title: 'Senior Development Consultant', org: 'Systems Limited, for Associated Press', s: 2022.667, e: 2024.167, lane: 0, c: 0x38bdf8, range: 'Sep 2022 to Mar 2024' },
    { id: 'moj', label: 'Ministry of Justice', title: 'Full Stack Engineer (Contract)', org: 'Ministry of Justice, Saudi Arabia', s: 2023.75, e: 2024.167, lane: 1, c: 0xf472b6, range: 'Oct 2023 to Feb 2024' },
    { id: 'pc', label: 'Systems Ltd · AP', title: 'Principal Consultant', org: 'Systems Limited, for Associated Press', s: 2024.167, e: 2025.25, lane: 0, c: 0x60a5fa, range: 'Mar 2024 to Mar 2025' },
    { id: 'sid', label: 'Sideline', title: 'Senior Software Engineer / Solution Architecture', org: 'Sideline Technologies (Netherlands)', s: 2025.083, e: nowY, lane: 1, c: 0xa78bfa, range: 'Feb 2025 to present' }
  ];

  // overlaps between roles in different lanes
  const overlaps = [];
  roles.forEach((a, i) => roles.forEach((b, j) => {
    if (j <= i || a.lane === b.lane) return;
    const s = Math.max(a.s, b.s), e = Math.min(a.e, b.e);
    if (e - s > 0.05) overlaps.push({ a, b, s, e, months: Math.max(1, Math.round((e - s) * 12)) });
  }));

  // layout (D3 scale: year -> world x)
  const W = 25;
  const x = d3.scaleLinear().domain([2015.1, nowY + 0.9]).range([-W / 2, W / 2]);
  const laneZ = [0, 1.7];
  const H = 0.9, D = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  const world = new THREE.Group();
  scene.add(world);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(6, 12, 9);
  scene.add(key);
  const rim = new THREE.PointLight(0x14b8a6, 0.9, 60);
  rim.position.set(-12, 5, 6);
  scene.add(rim);

  // floor + year grid
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W + 3.5, 6.4),
    new THREE.MeshBasicMaterial({ color: 0x0f1733, transparent: true, opacity: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.01, 0.85);
  world.add(floor);

  const gridPts = [];
  const years = d3.range(2016, Math.floor(nowY) + 1);
  years.forEach((y) => { gridPts.push(x(y), 0, -2.3, x(y), 0, 4.0); });
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
  world.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: 0x27325f, transparent: true, opacity: 0.8 })));

  // bars
  const bars = [];
  roles.forEach((r, i) => {
    const w = Math.max(0.25, x(r.e) - x(r.s));
    const geo = new THREE.BoxGeometry(w, H, D);
    const mat = new THREE.MeshStandardMaterial({ color: r.c, roughness: 0.35, metalness: 0.2, emissive: r.c, emissiveIntensity: 0.14 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set((x(r.s) + x(r.e)) / 2, 0, laneZ[r.lane]);
    m.scale.y = reduce ? 1 : 0.001;
    m.userData = { role: r, w, delay: 250 + i * 170, grow: reduce ? 1 : 0, hover: 0 };
    world.add(m);
    bars.push(m);
    // soft edge outline
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }));
    m.add(edges);
  });

  // overlap slabs
  const slabs = overlaps.map((o) => {
    const w = x(o.e) - x(o.s);
    const depth = laneZ[1] - laneZ[0] + D + 0.7;
    const geo = new THREE.BoxGeometry(w, 2.6, depth);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.2, depthWrite: false });
    const m = new THREE.Mesh(geo, mat);
    m.position.set((x(o.s) + x(o.e)) / 2, 1.3, (laneZ[0] + laneZ[1]) / 2);
    const ed = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9 }));
    m.add(ed);
    m.userData = { o, mat, ed, scaleY: reduce ? 1 : 0 };
    m.scale.y = reduce ? 1 : 0.001;
    world.add(m);
    return m;
  });

  // DOM labels, projected each frame
  const labelDefs = [];
  function addLabel(html, cls, anchor, dx, dy) {
    const el = document.createElement('div');
    el.className = 'tl-label ' + (cls || '');
    el.innerHTML = html;
    labelsEl.appendChild(el);
    labelDefs.push({ el, anchor, dx: dx || 0, dy: dy || 0 });
  }
  bars.forEach((b) => {
    const r = b.userData.role;
    const top = r.lane === 0;
    const anchor = new THREE.Vector3(b.position.x, top ? H + 0.1 : 0, laneZ[r.lane] + (top ? 0 : D / 2));
    const dy = r.id === 'pc' ? -68 : (top ? -30 : 6);
    const dx = r.id === 'pc' ? 14 : (r.id === 'sdc' ? -34 : 0);
    addLabel(`${r.label}<small>${r.range}</small>`, 'tl-role', anchor, dx, dy);
  });
  overlaps.forEach((o, i) => {
    const mid = (o.s + o.e) / 2;
    addLabel(`${o.months}-month overlap`, 'tl-over', new THREE.Vector3(x(mid), 2.7, 0.85), i === 0 ? -48 : 64, i === 0 ? -24 : -50);
  });
  const narrow = root.getBoundingClientRect().width < 560;
  years.forEach((y) => { if (narrow && y % 2) return; addLabel(String(y), 'tl-year', new THREE.Vector3(x(y), 0, 4.15), 0, 4); });

  // sizing + camera (elevation angle can be animated by the view buttons)
  let width = 1, height = 1, camR = 20, camEl = 0.53, camElT = 0.53;
  const EL = { angled: 0.53, front: 0.16, top: 1.3 };
  function placeCamera() {
    camera.position.set(0, camR * Math.sin(camEl), camR * Math.cos(camEl));
    camera.lookAt(0, 0.4, 0.9);
  }
  function resize() {
    const r = root.getBoundingClientRect();
    width = Math.max(300, r.width); height = Math.max(240, r.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // widen the distance on narrow screens so the whole timeline stays in view
    const dist = Math.max(22.5, 52 / Math.min(camera.aspect, 2.6));
    camR = dist * 0.905;
    placeCamera();
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(root);

  // interaction: hover tilt, drag to rotate, click to pin details
  const pointer = new THREE.Vector2(9, 9);
  let tx = 0, ty = 0, hovered = null, selected = null;
  let rotY = 0, rotX = 0, dragging = false, moved = 0, lastX = 0, lastY = 0;
  const detail = root.querySelector('.tl-detail');
  const ray = new THREE.Raycaster();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function local(ev) {
    const r = root.getBoundingClientRect();
    return { r, px: (ev.clientX - r.left) / r.width, py: (ev.clientY - r.top) / r.height };
  }
  function onMove(ev) {
    const { r, px, py } = local(ev);
    pointer.set(px * 2 - 1, -(py * 2 - 1));
    if (dragging) {
      const dx = ev.clientX - lastX, dy = ev.clientY - lastY;
      lastX = ev.clientX; lastY = ev.clientY; moved += Math.abs(dx) + Math.abs(dy);
      rotY = clamp(rotY + dx * 0.0035, -0.8, 0.8);
      rotX = clamp(rotX + dy * 0.003, -0.15, 0.4);
    } else { tx = (px - 0.5) * 0.16; ty = (py - 0.5) * 0.06; }
    tip.style.left = Math.min(r.width - 270, Math.max(8, ev.clientX - r.left + 14)) + 'px';
    tip.style.top = Math.max(8, ev.clientY - r.top + 14) + 'px';
  }
  root.addEventListener('pointerdown', (ev) => {
    if (ev.target.closest('.tl-controls')) return;
    dragging = true; moved = 0; lastX = ev.clientX; lastY = ev.clientY;
    root.classList.add('dragging');
    try { root.setPointerCapture(ev.pointerId); } catch (e) {}
    onMove(ev);
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false; root.classList.remove('dragging');
    if (moved < 6) { selected = hovered ? hovered.userData.role : null; showDetail(selected); }
  }
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', () => { dragging = false; root.classList.remove('dragging'); });
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', () => { if (!dragging) { pointer.set(9, 9); tx = 0; ty = 0; } });

  function showDetail(role) {
    if (!role) { detail.hidden = true; return; }
    const ov = overlaps.filter((o) => o.a === role || o.b === role).map((o) => {
      const other = o.a === role ? o.b : o.a;
      return `Overlaps <b>${other.title}</b> for ${o.months} month${o.months > 1 ? 's' : ''}`;
    });
    detail.innerHTML = `<b>${role.title}</b> · ${role.org} · ${role.range}${ov.length ? '<br><span>' + ov.join('<br>') + '</span>' : ''}`;
    detail.hidden = false;
  }

  // view buttons
  let replayAt = null;
  root.querySelectorAll('.tl-controls button').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const v = btn.dataset.view;
      if (v === 'replay') { replayAt = performance.now(); return; }
      camElT = EL[v]; rotY = 0; rotX = 0;
      root.querySelectorAll('.tl-controls button[data-view]').forEach((b) => b.classList.toggle('on', b === btn));
      root.querySelectorAll('.tl-controls [data-view="replay"]').forEach((b) => b.classList.remove('on'));
    });
  });

  function showTip(role) {
    if (!role) { tip.hidden = true; return; }
    const ov = overlaps.filter((o) => o.a === role || o.b === role).map((o) => {
      const other = o.a === role ? o.b : o.a;
      return `Overlaps ${other.title} (${o.months} mo)`;
    });
    tip.innerHTML = `<b>${role.title}</b><span>${role.org}</span><span>${role.range}${role.approx ? ' (approx.)' : ''}</span>` + ov.map((t) => `<em>${t}</em>`).join('');
    tip.hidden = false;
  }

  // animation loop (runs only while visible)
  let visible = false, raf = 0, t0 = performance.now(), started = false, startT = 0;
  const v = new THREE.Vector3();
  const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

  function frame(tNow) {
    raf = requestAnimationFrame(frame);
    const t = (tNow - t0) / 1000;
    if (!started) { started = true; startT = tNow; }
    const el = Math.max(0, tNow - startT);

    // gentle idle sway + pointer tilt
    if (replayAt) { startT = replayAt; replayAt = null; }
    const sway = reduce || dragging ? 0 : Math.sin(t * 0.5) * 0.05;
    world.rotation.y += ((rotY + tx + sway) - world.rotation.y) * 0.1;
    world.rotation.x += ((rotX + ty) - world.rotation.x) * 0.1;
    if (Math.abs(camElT - camEl) > 0.001) { camEl += (camElT - camEl) * 0.1; placeCamera(); }

    // hover
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(bars, false)[0];
    const hb = hit ? hit.object : null;
    if (hb !== hovered) {
      hovered = hb;
      showTip(hb ? hb.userData.role : null);
      canvas.style.cursor = hb ? 'pointer' : '';
    }

    bars.forEach((b) => {
      const u = b.userData;
      const g = reduce ? 1 : ease((el - u.delay) / 900);
      u.hover += (((b === hovered || u.role === selected) ? 1 : 0) - u.hover) * 0.15;
      const sy = Math.max(0.001, g * (1 + 0.18 * u.hover));
      b.scale.y = sy;
      b.position.y = (H * sy) / 2;
      b.material.emissiveIntensity = 0.14 + 0.5 * u.hover;
    });
    slabs.forEach((s, i) => {
      const g = reduce ? 1 : ease((el - 1500 - i * 300) / 900);
      s.scale.y = Math.max(0.001, g);
      s.position.y = 1.3 * Math.max(0.001, g);
      const pulse = reduce ? 0.2 : 0.17 + 0.09 * Math.sin(t * 2.2 + i);
      s.userData.mat.opacity = pulse * g;
      s.userData.ed.material.opacity = 0.35 + 0.55 * g;
    });

    renderer.render(scene, camera);

    // project DOM labels
    labelDefs.forEach((l) => {
      v.copy(l.anchor).applyMatrix4(world.matrixWorld).project(camera);
      const px = (v.x * 0.5 + 0.5) * width + l.dx;
      const py = (-v.y * 0.5 + 0.5) * height + l.dy;
      l.el.style.transform = `translate(${px}px, ${py}px) translate(-50%, 0)`;
      l.el.style.opacity = v.z < 1 ? '1' : '0';
    });
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !raf && !document.hidden) { t0 = performance.now(); raf = requestAnimationFrame(frame); }
    if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0.15 }).observe(root);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (!document.hidden && visible && !raf) raf = requestAnimationFrame(frame);
  });
}
