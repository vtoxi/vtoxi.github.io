(function () {
  var now = new Date();
  // Working since mid-2015 (July). Keep the count current without editing the page.
  var years = now.getFullYear() - 2015 - (now.getMonth() < 6 ? 1 : 0);
  if (years > 0) {
    document.querySelectorAll('[data-years]').forEach(function (el) { el.textContent = years; });
  }
  var y = document.getElementById('year');
  if (y) y.textContent = now.getFullYear();
})();
