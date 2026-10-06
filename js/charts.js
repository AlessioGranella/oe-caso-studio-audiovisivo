/* Grafici interattivi — OpenEconomics.
   Nessuna dipendenza. Legge window.OE_DATA e monta ogni [data-oe-chart].
   Interazioni: tooltip al passaggio (e al tocco), evidenziazione della serie
   dalla legenda, controlli segmentati per cambiare vista. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var RAMP3 = ['#270065', '#5902EE', '#B991FF'];      // rampa ordinale: diretto → indotto
  var ACC = '#4400B3', DEEP = '#270065', SOFT = '#B991FF', COST = '#C300C3';
  var SEQ = ['#EFE5FF', '#D9C1FF', '#B991FF', '#8742FF', '#5902EE', '#4400B3', '#270065'];
  var INK = '#000', MUTED = '#6E6E6E', HAIR = '#E7E7E7';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmt(v, dec) {
    if (v === null || v === undefined) return '';
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0, useGrouping: 'always'
    }).format(v);
  }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, attrs) {
    var t = el('text', Object.assign({ x: x, y: y }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }
  function palette(n) { return n === 3 ? RAMP3 : n === 2 ? [ACC, SOFT] : [ACC]; }

  /* ---------- tooltip ---------- */
  var tip = null;
  function tipEl() {
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'oe-tip';
      tip.setAttribute('role', 'status');
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTip(html, x, y) {
    var t = tipEl();
    t.innerHTML = html;
    t.classList.add('is-on');
    var r = t.getBoundingClientRect();
    var left = Math.min(Math.max(8, x + 14), window.innerWidth - r.width - 8);
    var top = y - r.height - 14;
    if (top < 8) top = y + 18;
    t.style.transform = 'translate(' + Math.round(left) + 'px,' + Math.round(top) + 'px)';
  }
  function hideTip() { if (tip) tip.classList.remove('is-on'); }

  function tipHTML(title, sub, rowsArr) {
    var h = '<div class="oe-tip__t">' + esc(title) + '</div>';
    if (sub) h += '<div class="oe-tip__s">' + esc(sub) + '</div>';
    (rowsArr || []).forEach(function (r) {
      h += '<div class="oe-tip__r"><span class="oe-tip__k">' +
        (r[2] ? '<i style="background:' + r[2] + '"></i>' : '') + esc(r[0]) +
        '</span><b>' + esc(r[1]) + '</b></div>';
    });
    return h;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- barre orizzontali ---------- */
  function hbars(host, spec, viewKey) {
    var W = spec.width || 920;
    var v = spec.data ? spec.data[viewKey] : spec;
    var rows = v.rows, series = v.series || spec.series || ['Valore'];
    var unit = v.unit || spec.unit || '', dec = v.dec !== undefined ? v.dec : (spec.dec || 0);
    var pal = palette(series.length);
    var labelW = spec.labelW || 220, barH = 22, gap = 13, valW = 92;
    var y = 6, plotW = W - labelW - valW;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' 10', class: 'oe-chart', role: 'img' });
    svg.setAttribute('aria-label', spec.a11y || 'Grafico a barre');

    if (series.length > 1) {
      var lx = labelW, ly = y + 12;
      series.forEach(function (name, i) {
        var g = el('g', { class: 'oe-lg', 'data-series': i, tabindex: '0' }, svg);
        el('rect', { x: lx, y: ly - 10, width: 12, height: 12, fill: pal[i] }, g);
        var t = txt(g, lx + 18, ly, name, { 'font-size': 12.5, fill: MUTED });
        lx += 24 + name.length * 7.2;
        g.appendChild(t);
      });
      y = ly + 18;
    }
    var top = y;
    var max = 0;
    rows.forEach(function (r) { max = Math.max(max, r.values.reduce(function (a, b) { return a + (b || 0); }, 0)); });
    if (!max) max = 1;

    rows.forEach(function (r, i) {
      var by = top + i * (barH + gap);
      var total = r.values.reduce(function (a, b) { return a + (b || 0); }, 0);
      var g = el('g', { class: 'oe-row', tabindex: '0', role: 'listitem' }, svg);
      g.__tip = function () {
        var list = series.length > 1
          ? series.map(function (s, j) { return [s, fmt(r.values[j], dec) + (unit.indexOf('ETP') > -1 ? '' : ''), pal[j]]; })
          : [];
        (r.extra || []).forEach(function (e) {
          list.push([e[0], typeof e[1] === 'number' ? fmt(e[1], dec) : e[1]]);
        });
        list.push(['Totale', fmt(total, dec)]);
        return tipHTML(r.label, r.tip || unit, list);
      };
      txt(g, labelW - 14, by + barH * 0.72, r.label,
        { 'font-size': 13, 'text-anchor': 'end', fill: INK, class: 'oe-lab' });
      var x = labelW;
      r.values.forEach(function (val, j) {
        if (!val) return;
        var w = Math.max(1, val / max * plotW);
        var last = j === r.values.length - 1 || r.values.slice(j + 1).every(function (n) { return !n; });
        var rect = el('rect', {
          x: x, y: by, height: barH, fill: pal[j], 'data-series': j, class: 'oe-bar'
        }, g);
        rect.style.width = Math.max(1, w - (last ? 0 : 2)) + 'px';
        rect.setAttribute('width', Math.max(1, w - (last ? 0 : 2)));
        x += w;
      });
      txt(g, labelW + (total / max) * plotW + 10, by + barH * 0.75, fmt(total, dec),
        { 'font-size': 15, fill: INK, class: 'oe-val' });
    });

    y = top + rows.length * (barH + gap) + 2;
    if (unit) { txt(svg, labelW, y + 10, unit, { 'font-size': 11.5, fill: MUTED }); y += 20; }
    if (spec.source) {
      txt(svg, 0, y + 12, spec.source, { 'font-size': 10.5, fill: MUTED, class: 'oe-src' });
      y += 20;
    }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Math.round(y + 4));
    host.appendChild(svg);
    wire(svg);
  }

  /* ---------- confronto a colonne ---------- */
  function compare(host, spec) {
    var W = spec.width || 920;
    var items = spec.items, H = 200, top = 40, base = top + H;
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) * 1.18;
    var slot = (W - 60) / items.length, bw = Math.min(210, slot * 0.5);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + (base + 110), class: 'oe-chart', role: 'img' });
    items.forEach(function (it, i) {
      var x = 30 + i * slot + (slot - bw) / 2, h = it.value / max * H;
      var g = el('g', { class: 'oe-row', tabindex: '0' }, svg);
      g.__tip = function () {
        return tipHTML(it.label, it.note, [['Moltiplicatore', fmt(it.value, spec.dec)],
          ['', it.tip || '']].filter(function (r) { return r[1]; }));
      };
      var rect = el('rect', { x: x, width: bw, fill: it.highlight ? ACC : SOFT, class: 'oe-bar' }, g);
      rect.setAttribute('y', base - h); rect.setAttribute('height', h);
      txt(g, x + bw / 2, base - h - 14, fmt(it.value, spec.dec),
        { 'font-size': 34, 'text-anchor': 'middle', fill: INK, class: 'oe-val oe-val--display' });
      txt(g, x + bw / 2, base + 26, it.label, { 'font-size': 14, 'text-anchor': 'middle', fill: INK });
      if (it.note) txt(g, x + bw / 2, base + 46, it.note,
        { 'font-size': 12, 'text-anchor': 'middle', fill: MUTED });
    });
    el('line', { x1: 30, y1: base, x2: W - 30, y2: base, stroke: HAIR }, svg);
    var y = base + 70;
    if (spec.unit) { txt(svg, 30, y, spec.unit, { 'font-size': 11.5, fill: MUTED }); y += 18; }
    if (spec.source) txt(svg, 0, y + 6, spec.source, { 'font-size': 10.5, fill: MUTED, class: 'oe-src' });
    host.appendChild(svg);
    wire(svg);
  }

  /* ---------- waterfall ---------- */
  function waterfall(host, spec) {
    var W = spec.width || 920;
    var H = 220, top = 46, base = top + H, run = 0, items = [];
    spec.steps.forEach(function (s) {
      if (s.kind === 'total') items.push({ s: s, a: 0, b: s.value });
      else { var st = run; run += s.value; items.push({ s: s, a: st, b: run }); }
    });
    var max = 0;
    items.forEach(function (i) { max = Math.max(max, Math.abs(i.a), Math.abs(i.b)); });
    max *= 1.15;
    var slot = (W - 60) / items.length, bw = Math.min(200, slot * 0.52);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + (base + 90), class: 'oe-chart', role: 'img' });
    items.forEach(function (it, i) {
      var x = 30 + i * slot + (slot - bw) / 2;
      var lo = it.s.kind === 'total' ? 0 : Math.min(it.a, it.b);
      var hi = it.s.kind === 'total' ? it.b : Math.max(it.a, it.b);
      var yt = base - hi / max * H, yb = base - lo / max * H;
      var col = it.s.kind === 'total' ? DEEP : (it.b < it.a ? COST : ACC);
      var g = el('g', { class: 'oe-row', tabindex: '0' }, svg);
      g.__tip = function () {
        return tipHTML(it.s.label, it.s.tip, [['Valore', fmt(it.s.value, 2) + ' mld €']]);
      };
      var rect = el('rect', { x: x, width: bw, fill: col, class: 'oe-bar' }, g);
      rect.setAttribute('y', yt); rect.setAttribute('height', Math.max(3, yb - yt));
      txt(g, x + bw / 2, yt - 13, fmt(it.s.value, 2),
        { 'font-size': 30, 'text-anchor': 'middle', fill: INK, class: 'oe-val oe-val--display' });
      txt(g, x + bw / 2, base + 26, it.s.label, { 'font-size': 14, 'text-anchor': 'middle', fill: INK });
      if (i < items.length - 1)
        el('line', { x1: x + bw, y1: base - it.b / max * H, x2: x + slot, y2: base - it.b / max * H,
          stroke: HAIR, 'stroke-dasharray': '3 3' }, svg);
    });
    el('line', { x1: 30, y1: base, x2: W - 30, y2: base, stroke: HAIR }, svg);
    var y = base + 50;
    if (spec.unit) { txt(svg, 30, y, spec.unit, { 'font-size': 11.5, fill: MUTED }); y += 18; }
    if (spec.source) txt(svg, 0, y + 6, spec.source, { 'font-size': 10.5, fill: MUTED, class: 'oe-src' });
    host.appendChild(svg);
    wire(svg);
  }

  /* ---------- mappa + classifica ---------- */
  function map(host, spec, viewKey) {
    var v = spec.data[viewKey];
    var vals = v.regions.map(function (r) { return r.value; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    function col(x) {
      var t = Math.pow((x - lo) / (hi - lo || 1), 0.42);
      return SEQ[Math.min(SEQ.length - 1, Math.round(t * (SEQ.length - 1)))];
    }
    var wrap = document.createElement('div');
    wrap.className = 'oe-map';
    var svg = el('svg', { viewBox: spec.viewBox, class: 'oe-chart oe-map__svg', role: 'img' });
    svg.setAttribute('aria-label', 'Cartogramma delle regioni italiane');
    var list = document.createElement('ol');
    list.className = 'oe-rank';

    v.regions.forEach(function (r) {
      var p = el('path', {
        d: spec.paths[r.name], fill: col(r.value), stroke: '#fff', 'stroke-width': 0.9,
        class: 'oe-region', tabindex: '0', 'data-r': r.name
      }, svg);
      p.__tip = function () {
        var rowsArr = r.parts.map(function (q) { return [q[0], fmt(q[1], v.dec)]; });
        if (r.spesa) rowsArr.push(['Spesa localizzata', fmt(r.spesa, 1) + ' mln €']);
        rowsArr.push(['Totale', fmt(r.value, v.dec)]);
        return tipHTML(r.name, v.unit, rowsArr);
      };
      var li = document.createElement('li');
      li.className = 'oe-rank__i';
      li.dataset.r = r.name;
      li.innerHTML = '<i style="background:' + col(r.value) + '"></i><span>' + esc(r.name) +
        '</span><b class="oe-num">' + fmt(r.value, v.dec) + '</b>';
      list.appendChild(li);

      function on() {
        p.classList.add('is-on'); li.classList.add('is-on');
      }
      function off() { p.classList.remove('is-on'); li.classList.remove('is-on'); }
      p.addEventListener('pointerenter', on); p.addEventListener('pointerleave', off);
      p.addEventListener('focus', on); p.addEventListener('blur', off);
      li.addEventListener('pointerenter', function (e) {
        on(); showTip(p.__tip(), e.clientX, e.clientY);
      });
      li.addEventListener('pointermove', function (e) { showTip(p.__tip(), e.clientX, e.clientY); });
      li.addEventListener('pointerleave', function () { off(); hideTip(); });
    });

    var foot = document.createElement('p');
    foot.className = 'oe-chart__foot';
    foot.innerHTML = '<span>' + esc(v.unit) + '</span><span class="oe-src">' + esc(spec.source) + '</span>';

    wrap.appendChild(svg); wrap.appendChild(list);
    host.appendChild(wrap); host.appendChild(foot);
    wire(svg);
  }

  /* ---------- ciambella ---------- */
  function donut(host, spec, viewKey) {
    var v = spec.data ? spec.data[viewKey] : spec;
    var items = v.items, dec = v.dec !== undefined ? v.dec : 1;
    var unit = v.unit || spec.unit || '';
    var pal = items.length <= 3 ? RAMP3 : SEQ.slice(1).concat([ACC]);
    var W = spec.width || 920;
    var r = 120, ri = 72, cx = 180, cy = 24 + r;
    var tot = items.reduce(function (a, b) { return a + b.value; }, 0) || 1;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + Math.max(cy + r + 70, 30 + items.length * 26 + 70),
      class: 'oe-chart', role: 'img' });
    svg.setAttribute('aria-label', spec.a11y || 'Grafico ad anello');
    var ang = -Math.PI / 2;
    items.forEach(function (it, i) {
      var a2 = ang + 2 * Math.PI * it.value / tot, large = (a2 - ang) > Math.PI ? 1 : 0;
      var x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
      var x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      var x3 = cx + ri * Math.cos(a2), y3 = cy + ri * Math.sin(a2);
      var x4 = cx + ri * Math.cos(ang), y4 = cy + ri * Math.sin(ang);
      var g = el('g', { class: 'oe-row', tabindex: '0' }, svg);
      g.__tip = function () {
        return tipHTML(it.label, it.sub || unit, [
          ['Valore', fmt(it.value, dec) + (it.suffix || '')],
          ['Quota', fmt(it.value / tot * 100, 1) + '%']
        ]);
      };
      el('path', {
        d: 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' +
           x2.toFixed(1) + ' ' + y2.toFixed(1) + ' L' + x3.toFixed(1) + ' ' + y3.toFixed(1) +
           ' A' + ri + ' ' + ri + ' 0 ' + large + ' 0 ' + x4.toFixed(1) + ' ' + y4.toFixed(1) + ' Z',
        fill: pal[i % pal.length], stroke: '#fff', 'stroke-width': 2, class: 'oe-bar'
      }, g);
      ang = a2;
    });
    var ly = 34, lx = cx + r + 56;
    items.forEach(function (it, i) {
      el('rect', { x: lx, y: ly - 10, width: 11, height: 11, fill: pal[i % pal.length] }, svg);
      txt(svg, lx + 18, ly, it.label, { 'font-size': 13.5, fill: INK });
      txt(svg, W - 8, ly, fmt(it.value, dec) + (it.suffix || ''),
        { 'font-size': 14, 'text-anchor': 'end', fill: INK, class: 'oe-val' });
      ly += 26;
    });
    var y = Math.max(cy + r + 24, ly + 6);
    if (unit) { txt(svg, 0, y, unit, { 'font-size': 11.5, fill: MUTED }); y += 18; }
    if (spec.source) txt(svg, 0, y + 6, spec.source, { 'font-size': 10.5, fill: MUTED, class: 'oe-src' });
    host.appendChild(svg);
    wire(svg);
  }

  /* ---------- matrice a bolle (regione × settore) ---------- */
  function grid(host, spec, viewKey) {
    var v = spec.data[viewKey];
    var rows = v.rows, cols = v.cols, m = v.values, dec = v.dec || 0;
    var W = spec.width || 920, left = 150, top = 86, cw = (W - left - 10) / cols.length, ch = 24;
    var max = 0;
    m.forEach(function (r) { r.forEach(function (x) { if (x > max) max = x; }); });
    var H = top + rows.length * ch + 60;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'oe-chart', role: 'img' });
    svg.setAttribute('aria-label', 'Matrice regione per settore');
    cols.forEach(function (c, j) {
      var x = left + j * cw + cw / 2;
      var t = txt(svg, x, top - 12, c, { 'font-size': 10.5, fill: MUTED, 'text-anchor': 'start' });
      t.setAttribute('transform', 'rotate(-50 ' + x + ' ' + (top - 12) + ')');
    });
    rows.forEach(function (rname, i) {
      var y = top + i * ch;
      txt(svg, left - 10, y + ch * 0.68, rname, { 'font-size': 11.5, 'text-anchor': 'end', fill: INK });
      cols.forEach(function (c, j) {
        var val = m[i][j] || 0;
        if (!val) return;
        var rad = Math.max(1.6, Math.sqrt(val / max) * (Math.min(cw, ch) / 2 - 2));
        var g = el('g', { class: 'oe-row', tabindex: '0' }, svg);
        g.__tip = function () {
          return tipHTML(rname + ' · ' + c, v.unit, [['Valore', fmt(val, dec)]]);
        };
        el('circle', { cx: left + j * cw + cw / 2, cy: y + ch / 2, r: rad, fill: ACC,
          'fill-opacity': 0.85, class: 'oe-bar' }, g);
      });
    });
    var y = top + rows.length * ch + 22;
    if (v.unit) { txt(svg, 0, y, v.unit, { 'font-size': 11.5, fill: MUTED }); y += 18; }
    if (spec.source) txt(svg, 0, y + 6, spec.source, { 'font-size': 10.5, fill: MUTED, class: 'oe-src' });
    host.appendChild(svg);
    wire(svg);
  }

  /* ---------- treemap (squarified) ---------- */
  function squarify(items, x, y, w, h, out) {
    if (!items.length) return;
    if (items.length === 1) { out.push({ it: items[0], x: x, y: y, w: w, h: h }); return; }
    var total = items.reduce(function (a, b) { return a + b.value; }, 0);
    var acc = 0, i = 0, best = Infinity, split = 1;
    var horizontal = w >= h;
    for (i = 0; i < items.length; i++) {
      acc += items[i].value;
      var frac = acc / total;
      var side = horizontal ? w * frac : h * frac;
      var other = horizontal ? h : w;
      var worst = 0;
      for (var k = 0; k <= i; k++) {
        var seg = other * (items[k].value / acc);
        worst = Math.max(worst, Math.max(side / seg, seg / side));
      }
      if (worst > best) break;
      best = worst; split = i + 1;
    }
    var head = items.slice(0, split), tail = items.slice(split);
    var headSum = head.reduce(function (a, b) { return a + b.value; }, 0);
    var frac2 = headSum / total;
    if (horizontal) {
      var ww = w * frac2, yy = y;
      head.forEach(function (it) {
        var hh = h * (it.value / headSum);
        out.push({ it: it, x: x, y: yy, w: ww, h: hh }); yy += hh;
      });
      squarify(tail, x + ww, y, w - ww, h, out);
    } else {
      var hh2 = h * frac2, xx = x;
      head.forEach(function (it) {
        var ww2 = w * (it.value / headSum);
        out.push({ it: it, x: xx, y: y, w: ww2, h: hh2 }); xx += ww2;
      });
      squarify(tail, x, y + hh2, w, h - hh2, out);
    }
  }

  function treemap(host, spec) {
    var items = spec.items.slice().sort(function (a, b) { return b.value - a.value; });
    var W = spec.width || 920, H = spec.height || 520;
    var cells = [];
    squarify(items, 0, 0, W, H, cells);
    var max = items[0].value;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + (H + 56), class: 'oe-chart', role: 'img' });
    svg.setAttribute('aria-label', 'Treemap dei settori');
    function fit(s, w) {
      var maxc = Math.floor((w - 18) / 6.3);
      return s.length > maxc ? (maxc > 3 ? s.slice(0, maxc - 1) + '…' : '') : s;
    }
    cells.forEach(function (c) {
      var t = Math.pow(c.it.value / max, 0.45);
      var idx = Math.min(SEQ.length - 1, Math.round(1 + t * (SEQ.length - 2)));
      var fill = SEQ[idx];
      var g = el('g', { class: 'oe-row', tabindex: '0' }, svg);
      g.__tip = function () {
        var list = (c.it.parts || []).map(function (p) { return [p[0], fmt(p[1], 1)]; });
        list.push(['Totale', fmt(c.it.value, 1)]);
        return tipHTML(c.it.label, c.it.sub || spec.unit, list);
      };
      el('rect', { x: c.x + 1, y: c.y + 1, width: Math.max(0, c.w - 2), height: Math.max(0, c.h - 2),
        fill: fill, class: 'oe-bar' }, g);
      if (c.w > 74 && c.h > 30) {
        var dark = idx >= 4;
        var lab = fit(c.it.label, c.w);
        if (lab) txt(g, c.x + 9, c.y + 20, lab, { 'font-size': 12.5, fill: dark ? '#fff' : INK });
        if (c.h > 48)
          txt(g, c.x + 9, c.y + 38, fmt(c.it.value, 0), {
            'font-size': 13, fill: dark ? 'rgba(255,255,255,.88)' : '#2C2C2C', class: 'oe-val'
          });
      }
    });
    var y = H + 20;
    if (spec.unit) { txt(svg, 0, y, spec.unit, { 'font-size': 11.5, fill: MUTED }); y += 18; }
    if (spec.source) txt(svg, 0, y + 6, spec.source, { 'font-size': 10.5, fill: MUTED, class: 'oe-src' });
    host.appendChild(svg);
    wire(svg);
  }

  /* ---------- interazioni comuni ---------- */
  function wire(svg) {
    svg.addEventListener('pointermove', function (e) {
      var node = e.target.closest ? e.target.closest('.oe-row, .oe-region') : null;
      if (node && node.__tip) { showTip(node.__tip(), e.clientX, e.clientY); }
      else hideTip();
    });
    svg.addEventListener('pointerleave', hideTip);
    svg.addEventListener('focusin', function (e) {
      var node = e.target.closest('.oe-row, .oe-region');
      if (node && node.__tip) {
        var r = node.getBoundingClientRect();
        showTip(node.__tip(), r.left + r.width / 2, r.top + r.height / 2);
      }
    });
    svg.addEventListener('focusout', hideTip);
    // legenda: evidenzia la serie
    Array.prototype.forEach.call(svg.querySelectorAll('.oe-lg'), function (g) {
      var i = g.getAttribute('data-series');
      function on() { svg.setAttribute('data-focus', i); }
      function off() { svg.removeAttribute('data-focus'); }
      g.addEventListener('pointerenter', on); g.addEventListener('pointerleave', off);
      g.addEventListener('focus', on); g.addEventListener('blur', off);
    });
  }

  /* ---------- montaggio ---------- */
  function render(host, spec, key) {
    host.innerHTML = '';
    if (spec.type === 'hbars') hbars(host, spec, key);
    else if (spec.type === 'compare') compare(host, spec);
    else if (spec.type === 'waterfall') waterfall(host, spec);
    else if (spec.type === 'map') map(host, spec, key);
    else if (spec.type === 'donut') donut(host, spec, key);
    else if (spec.type === 'grid') grid(host, spec, key);
    else if (spec.type === 'treemap') treemap(host, spec);
    if (!reduce) { host.classList.remove('is-in'); void host.offsetWidth; host.classList.add('is-in'); }
  }

  function mount(root) {
    var data = window.OE_DATA || {};
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-oe-chart]'), function (host) {
      var spec = data[host.getAttribute('data-oe-chart')];
      if (!spec) return;
      var key = spec.views ? spec.views[0].key : null;
      if (spec.views) {
        var ctrl = document.createElement('div');
        ctrl.className = 'fig__ctrl';
        if (spec.controlLabel) {
          var lab = document.createElement('span');
          lab.className = 'fig__ctrl-label';
          lab.textContent = spec.controlLabel;
          ctrl.appendChild(lab);
        }
        var nav = document.createElement('div');
        nav.className = 'oe-segment';
        nav.setAttribute('role', 'tablist');
        ctrl.appendChild(nav);
        spec.views.forEach(function (view, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'oe-segment__btn' + (i === 0 ? ' is-active' : '');
          b.textContent = view.label;
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
          b.addEventListener('click', function () {
            Array.prototype.forEach.call(nav.querySelectorAll('.oe-segment__btn'), function (o) {
              o.classList.remove('is-active'); o.setAttribute('aria-selected', 'false');
            });
            b.classList.add('is-active'); b.setAttribute('aria-selected', 'true');
            render(host, spec, view.key);
          });
          nav.appendChild(b);
        });
        host.parentNode.insertBefore(ctrl, host);
      }
      render(host, spec, key);
    });
    window.addEventListener('scroll', hideTip, { passive: true });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { mount(document); });
  else mount(document);
})();
