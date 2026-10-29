// Google Analytics 4, loaded only after a visitor accepts. No request goes to Google before consent.
(function () {
  'use strict';
  var GA_ID = 'G-WJ0S9JGWBY';
  var KEY = 'analytics-consent';
  var gpc = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadGA() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }
  function track(name, params) { if (window.gtag) window.gtag('event', name, params || {}); }

  // light-touch event tracking (only fires once consent is given and GA is loaded)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/Resume\.pdf$/i.test(href)) track('resume_download');
    else if (href.indexOf('mailto:') === 0) track('contact_click', { link_text: (a.textContent || '').trim().slice(0, 40) });
    else if (href.indexOf('buymeacoffee') > -1) track('coffee_click');
    else if (/^https?:/.test(href) && a.hostname !== location.hostname) track('outbound_click', { link_url: href });
  });
  window.addEventListener('pf:event', function (e) { track(e.detail.name, e.detail.params); });

  var banner;
  function hide() { if (banner) { banner.classList.remove('show'); setTimeout(function () { if (banner) banner.hidden = true; }, 400); } }
  function show() {
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'consent'; banner.setAttribute('role', 'dialog'); banner.setAttribute('aria-label', 'Analytics consent');
      banner.innerHTML = '<p><b>Anonymous visit stats?</b> I use Google Analytics to see how many people visit and which sections they read. No ads, no profiles, and nothing loads unless you accept.</p>' +
        '<div class="consent-btns"><button type="button" class="btn btn-small" data-c="yes">Accept</button><button type="button" class="btn btn-small btn-ghost" data-c="no">Decline</button></div>';
      document.body.appendChild(banner);
      banner.addEventListener('click', function (e) {
        var c = e.target.getAttribute && e.target.getAttribute('data-c');
        if (!c) return;
        write(c); hide();
        if (c === 'yes') loadGA();
      });
    }
    banner.hidden = false; requestAnimationFrame(function () { banner.classList.add('show'); });
  }

  var saved = read();
  if (saved === 'yes' && !gpc) loadGA();
  else if (!saved && !gpc) setTimeout(show, 1800);

  var link = document.getElementById('cookie-settings');
  if (link) link.addEventListener('click', function () { show(); });
})();
