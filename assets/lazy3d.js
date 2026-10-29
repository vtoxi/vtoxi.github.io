// Loads D3 and the Three.js timeline only when the 3D section is about to scroll into view,
// so the first paint of the page does not wait for ~1.5 MB of 3D code.
(function () {
  'use strict';
  var root = document.getElementById('tl3d');
  if (!root) return;
  var started = false;
  function fail() { root.classList.add('no-webgl'); }
  function load() {
    if (started) return; started = true;
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js';
    s.onload = function () { import('./timeline3d.js?v=20261029g').catch(fail); };
    s.onerror = fail;
    document.head.appendChild(s);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); load(); }
    }, { rootMargin: '700px 0px' });
    io.observe(root);
  } else {
    addEventListener('load', load);
  }
})();
