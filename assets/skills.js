// Interactive skills map: D3 force simulation with draggable bubbles grouped by category.
(function () {
  'use strict';
  var host = document.getElementById('skills-play');
  if (!host || !window.d3) return;
  var d3 = window.d3;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var svg = d3.select(host.querySelector('.pg-svg'));
  var legend = host.querySelector('.pg-legend');

  var groups = [
    { id: 'lead', name: 'Leadership', color: '#f472b6', items: ['Technical leadership', 'Mentoring', 'Hiring', 'Stakeholders', 'Delivery'] },
    { id: 'arch', name: 'Architecture', color: '#818cf8', items: ['Solution architecture', 'Microservices', 'Clean Architecture', 'API design', 'Distributed systems', 'Cloud migration'] },
    { id: 'cloud', name: 'Cloud & DevOps', color: '#38bdf8', items: ['Azure', 'AKS', 'Service Bus', 'Key Vault', 'Azure DevOps', 'Bicep', 'Docker', 'CI/CD'] },
    { id: 'back', name: 'Backend', color: '#a78bfa', items: ['C#', '.NET', 'ASP.NET Core', 'Web API', 'EF Core', 'SignalR', 'Functions'] },
    { id: 'front', name: 'Frontend', color: '#fbbf24', items: ['Angular', 'TypeScript', 'JavaScript', 'HTML & CSS', 'Blazor'] },
    { id: 'data', name: 'Data & process', color: '#2dd4bf', items: ['SQL Server', 'Azure SQL', 'Oracle', 'Git', 'Agile'] },
    { id: 'iot', name: 'IoT', color: '#4ade80', items: ['ESP32', 'Raspberry Pi', 'Arduino', 'MQTT', 'BLE', 'openHAB'] }
  ];
  var big = { '.NET': 1, 'Angular': 1, 'Azure': 1, 'C#': 1, 'Solution architecture': 1, 'Technical leadership': 1, 'ESP32': 1, 'TypeScript': 1, 'Microservices': 1 };

  var nodes = [];
  groups.forEach(function (g) {
    g.items.forEach(function (name) { nodes.push({ name: name, g: g, big: !!big[name] }); });
  });

  var active = null, sim = null, W = 0, H = 0, anchors = {};

  legend.innerHTML = '';
  groups.forEach(function (g) {
    var b = document.createElement('button');
    b.type = 'button'; b.dataset.id = g.id;
    b.innerHTML = '<i style="background:' + g.color + '"></i>' + g.name;
    b.addEventListener('click', function () { active = active === g.id ? null : g.id; paintFocus(); });
    legend.appendChild(b);
  });

  function radius(d, k) {
    var longest = Math.max.apply(null, d.name.split(' ').map(function (w) { return w.length; }));
    return Math.max(22, Math.min(46, 14 + longest * 3.3 + (d.big ? 7 : 0))) * k;
  }

  function layout() {
    var w = host.clientWidth || 900;
    W = w; H = w < 620 ? 780 : 430;
    var k = w < 620 ? 0.72 : 1;
    var pts = w < 620
      ? [[.26, .11], [.74, .11], [.26, .34], [.74, .34], [.26, .57], [.74, .57], [.5, .83]]
      : [[.14, .24], [.5, .2], [.86, .24], [.1, .74], [.37, .78], [.63, .78], [.9, .74]];
    anchors = {};
    groups.forEach(function (g, i) { anchors[g.id] = { x: pts[i][0] * W, y: pts[i][1] * H }; });

    svg.attr('viewBox', '0 0 ' + W + ' ' + H).attr('height', H);
    svg.selectAll('*').remove();

    nodes.forEach(function (d) {
      d.r = radius(d, k);
      var a = anchors[d.g.id];
      if (d.x == null) { d.x = a.x + (Math.random() - .5) * 40; d.y = a.y + (Math.random() - .5) * 40; }
    });

    var node = svg.append('g').selectAll('g').data(nodes).enter().append('g')
      .attr('class', 'pg-node').attr('tabindex', -1);
    node.append('circle').attr('r', function (d) { return d.r; })
      .attr('fill', function (d) { return d.g.color; }).attr('fill-opacity', 0.16)
      .attr('stroke', function (d) { return d.g.color; }).attr('stroke-width', 1.6);
    node.each(function (d) {
      var words = d.name.split(' '), el = d3.select(this).append('text').attr('text-anchor', 'middle')
        .attr('fill', '#e8ecfa').attr('font-size', d.big ? 13 : 11.5).attr('font-weight', 600).attr('pointer-events', 'none');
      var lines = words.length > 1 && d.name.length > 9 ? words : [d.name];
      lines.forEach(function (ln, i) { el.append('tspan').attr('x', 0).attr('dy', i === 0 ? (-(lines.length - 1) * 0.5 + 0.35) + 'em' : '1.1em').text(ln); });
    });

    function paint() { node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; }); }

    node.on('pointerenter', function (e, d) { d3.select(this).select('circle').attr('fill-opacity', 0.38); })
        .on('pointerleave', function () { d3.select(this).select('circle').attr('fill-opacity', active ? null : 0.16); paintFocus(); });

    var drag = d3.drag()
      .on('start', function (e, d) { if (sim && !reduce) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', function (e, d) {
        d.fx = Math.max(d.r, Math.min(W - d.r, e.x)); d.fy = Math.max(d.r, Math.min(H - d.r, e.y));
        if (reduce) { d.x = d.fx; d.y = d.fy; paint(); }
      })
      .on('end', function (e, d) { if (sim && !reduce) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    node.call(drag);

    if (sim) sim.stop();
    sim = d3.forceSimulation(nodes)
      .force('x', d3.forceX(function (d) { return anchors[d.g.id].x; }).strength(0.11))
      .force('y', d3.forceY(function (d) { return anchors[d.g.id].y; }).strength(0.11))
      .force('collide', d3.forceCollide(function (d) { return d.r + 3; }).strength(0.9))
      .force('charge', d3.forceManyBody().strength(-6))
      .on('tick', function () {
        nodes.forEach(function (d) { d.x = Math.max(d.r, Math.min(W - d.r, d.x)); d.y = Math.max(d.r, Math.min(H - d.r, d.y)); });
        paint();
      });
    if (reduce) { sim.stop(); for (var i = 0; i < 320; i++) sim.tick(); paint(); }
    paintFocus();
  }

  function paintFocus() {
    svg.selectAll('.pg-node').attr('opacity', function (d) { return !active || d.g.id === active ? 1 : 0.18; });
    Array.prototype.forEach.call(legend.children, function (b) { b.classList.toggle('on', b.dataset.id === active); });
  }

  layout();
  var t;
  new ResizeObserver(function () {
    clearTimeout(t);
    t = setTimeout(function () { if (Math.abs((host.clientWidth || 0) - W) > 24) layout(); }, 200);
  }).observe(host);
})();
