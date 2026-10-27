/* OpenEconomics Design System — testata delle analisi (.oe-nav-analisi + .oe-nav-sezioni)
   UI Block «Navigazione Analisi». Senza dipendenze, va anche da file://.

   - evidenzia la voce della sezione in vista (.is-active + aria-current);
   - dopo i primi 24px di scorrimento dà filetto e ombra al pannello (.is-scrolled);
   - su mobile apre e chiude la lista dal pulsante hamburger (.is-open), la chiude
     dopo la scelta di una voce o con Esc, e scrive nel pulsante la sezione in vista;
   - misura il pannello sospeso: --oe-nav-analisi-h (altezza della barra bianca, il
     menu grigio si attacca sotto) e --oe-nav-sezioni-h (fondo del pannello chiuso +
     16px), così la hero gli lascia spazio e le ancore si fermano sotto.

   Uso: <script src="ds-kit/oe-nav-sezioni.js" defer></script> */
(function () {
  var root = document.documentElement;

  function init(nav) {
    var bar = document.querySelector('.oe-nav-analisi');
    var toggle = nav.querySelector('.oe-nav-sezioni__toggle');
    var label = nav.querySelector('.oe-nav-sezioni__current');
    var fallback = label ? label.textContent : '';
    var items = [].slice.call(nav.querySelectorAll('.oe-nav-sezioni__link[href^="#"]'))
      .map(function (a) { return { a: a, el: document.getElementById(decodeURIComponent(a.hash.slice(1))) }; })
      .filter(function (it) { return it.el; });

    var current = null;
    var queued = false;
    var bottom = 0;

    function measure() {
      if (bar) root.style.setProperty('--oe-nav-analisi-h', bar.querySelector('.oe-nav-analisi__inner').offsetHeight + 'px');
      if (nav.classList.contains('is-open')) return;
      bottom = nav.getBoundingClientRect().bottom;
      root.style.setProperty('--oe-nav-sezioni-h', Math.round(bottom + 16) + 'px');
    }

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function update() {
      queued = false;
      var scrolled = window.scrollY > 24;
      nav.classList.toggle('is-scrolled', scrolled);
      if (bar) bar.classList.toggle('is-scrolled', scrolled);
      // attiva l'ultima sezione il cui inizio ha superato il fondo del pannello
      var line = bottom + 24;
      var active = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.getBoundingClientRect().top <= line) active = items[i];
      }
      // in fondo alla pagina l'ultima sezione può non arrivare mai al pannello
      if (active && window.innerHeight + window.scrollY >= root.scrollHeight - 2) {
        var last = items[items.length - 1];
        if (last.el.getBoundingClientRect().top < window.innerHeight) active = last;
      }
      if (active === current) return;
      if (current) { current.a.classList.remove('is-active'); current.a.removeAttribute('aria-current'); }
      current = active;
      if (current) {
        current.a.classList.add('is-active');
        current.a.setAttribute('aria-current', 'location');
      }
      if (label) label.textContent = current ? current.a.textContent : fallback;
    }

    function queue() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    if (toggle) {
      toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
      items.forEach(function (it) { it.a.addEventListener('click', function () { setOpen(false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
      });
    }

    measure();
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', function () { measure(); queue(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); queue(); });
  }

  function start() {
    [].forEach.call(document.querySelectorAll('.oe-nav-sezioni'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
