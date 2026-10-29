// Case study accordions and the contact form.
(function () {
  'use strict';
  /* case studies */
  Array.prototype.forEach.call(document.querySelectorAll('[data-case]'), function (c) {
    var btn = c.querySelector('.case-head');
    btn.addEventListener('click', function () {
      var open = !c.classList.contains('open');
      c.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) window.dispatchEvent(new CustomEvent('pf:event', { detail: { name: 'case_study_open', params: { case: c.querySelector('.case-title b').textContent } } }));
    });
  });

  /* contact form (FormSubmit AJAX endpoint, with a mailto fallback) */
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = form.querySelector('.cf-status'), btn = form.querySelector('button[type="submit"]');
  var TO = 'faisalshafi69@gmail.com';
  function say(msg, kind) { status.textContent = msg; status.className = 'cf-status ' + (kind || ''); }
  function mailtoFallback(d) {
    return 'mailto:' + TO + '?subject=' + encodeURIComponent('Portfolio message from ' + d.name) + '&body=' + encodeURIComponent(d.message + '\n\n' + d.name + ' (' + d.email + ')');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form), d = { name: (f.get('name') || '').trim(), email: (f.get('email') || '').trim(), topic: f.get('topic'), message: (f.get('message') || '').trim() };
    if (f.get('_honey')) { say('Thanks!', 'ok'); return; }           // bots fill the hidden field
    if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email) || d.message.length < 10) { say('Please add your name, a valid email and a short message.', 'err'); return; }
    btn.disabled = true; form.classList.add('sending'); say('Sending…');
    fetch('https://formsubmit.co/ajax/' + TO, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name: d.name, email: d.email, topic: d.topic, message: d.message, _subject: 'Portfolio message: ' + d.topic, _template: 'table', _captcha: 'false' })
    }).then(function (r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
      .then(function (j) {
        if (j && (j.success === 'true' || j.success === true)) {
          form.reset(); form.classList.remove('sending'); form.classList.add('sent');
          say('Message sent. Thank you, I will reply soon.', 'ok');
          window.dispatchEvent(new CustomEvent('pf:event', { detail: { name: 'contact_form_submit', params: { topic: d.topic } } }));
        } else throw new Error('not accepted');
      })
      .catch(function () {
        form.classList.remove('sending');
        status.className = 'cf-status err';
        status.innerHTML = 'Could not send from here. <a href="' + mailtoFallback(d) + '">Open it in your email app</a> instead.';
      })
      .then(function () { btn.disabled = false; });
  });
  form.addEventListener('input', function () { form.classList.remove('sent'); });
})();
