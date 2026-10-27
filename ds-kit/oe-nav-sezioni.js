/* OpenEconomics Design System — menu delle sezioni (.oe-nav-sezioni)
   UI Block «Navigazione Analisi». Senza dipendenze, va anche da file://.

   - evidenzia la voce della sezione in vista (.is-active + aria-current);
   - su mobile apre e chiude la lista dal pulsante hamburger (.is-open), la chiude
     dopo la scelta di una voce o con Esc, e scrive nel pulsante la sezione in vista;
   - scrive l'altezza del menu chiuso in --oe-nav-sezioni-h, così le sezioni raggiunte
     dall'ancora non finiscono sotto il menu agganciato.

   Uso: <script src="ds-kit/oe-nav-sezioni.js" defer></script> */
(function () {
  function init(nav) {
    var toggle = nav.querySelector('.oe-nav-sezioni__toggle');
    var label = nav.querySelector('.oe-nav-sezioni__current');
    var fallback = label ? label.textContent : '';
    var items = [].slice.call(nav.querySelectorAll('.oe-nav-sezioni__link[href^="#"]'))
      .map(function (a) { return { a: a, el: document.getElementById(decodeURIComponent(a.hash.slice(1))) }; })
      .filter(function (it) { return it.el; });
    if (!items.length) return;

    var current = null;
    var queued = false;

    function setHeight() {
      if (nav.classList.contains('is-open')) return;
      document.documentElement.style.setProperty('--oe-nav-sezioni-h', nav.offsetHeight + 'px');
    }

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      setHeight();
    }

    function update() {
      queued = false;
      // attiva l'ultima sezione il cui inizio ha superato il bordo basso del menu
      var line = nav.getBoundingClientRect().top + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--oe-nav-sezioni-h') || nav.offsetHeight) + 8;
      var active = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.getBoundingClientRect().top <= line) active = items[i];
      }
      // in fondo alla pagina l'ultima sezione può non arrivare mai al menu
      var doc = document.documentElement;
      if (active && window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
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

    setHeight();
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', function () { setHeight(); queue(); });
  }

  function start() {
    [].forEach.call(document.querySelectorAll('.oe-nav-sezioni'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
