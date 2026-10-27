/* OpenEconomics Design System — menu delle sezioni (.oe-nav-sezioni)
   UI Block «Navigazione Analisi». Senza dipendenze, va anche da file://.

   - evidenzia la voce della sezione in vista (.is-active + aria-current);
   - porta la voce attiva dentro l'area visibile del menu quando scorre in orizzontale
     e segnala con .is-more-start / .is-more-end le voci nascoste oltre il bordo;
   - scrive l'altezza del menu in --oe-nav-sezioni-h, così le sezioni raggiunte
     dall'ancora non finiscono sotto il menu agganciato.

   Uso: <script src="ds-kit/oe-nav-sezioni.js" defer></script> */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(nav) {
    var list = nav.querySelector('.oe-nav-sezioni__list');
    var items = [].slice.call(nav.querySelectorAll('.oe-nav-sezioni__link[href^="#"]'))
      .map(function (a) { return { a: a, el: document.getElementById(decodeURIComponent(a.hash.slice(1))) }; })
      .filter(function (it) { return it.el; });
    if (!items.length) return;

    var current = null;
    var queued = false;

    function setHeight() {
      document.documentElement.style.setProperty('--oe-nav-sezioni-h', nav.offsetHeight + 'px');
    }

    function edges() {
      if (!list) return;
      var max = list.scrollWidth - list.clientWidth;
      list.classList.toggle('is-more-start', list.scrollLeft > 1);
      list.classList.toggle('is-more-end', list.scrollLeft < max - 1);
    }

    function reveal(a) {
      if (!list) return;
      var lr = list.getBoundingClientRect();
      var r = a.getBoundingClientRect();
      if (r.left >= lr.left && r.right <= lr.right) return;
      list.scrollBy({ left: r.left - lr.left - (lr.width - r.width) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }

    function update() {
      queued = false;
      // attiva l'ultima sezione il cui inizio ha superato il bordo basso del menu
      var line = nav.getBoundingClientRect().bottom + 8;
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
        reveal(current.a);
      }
    }

    function queue() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    setHeight();
    edges();
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', function () { setHeight(); edges(); queue(); });
    if (list) list.addEventListener('scroll', edges, { passive: true });
  }

  function start() {
    [].forEach.call(document.querySelectorAll('.oe-nav-sezioni'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
