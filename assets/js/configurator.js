/* ============================================================
   FLEXNODE — DEPLOYMENT CONFIGURATOR
   All outputs are representative planning figures, not an
   engineered quote. Coefficients live in RULES and are the
   single place to update once engineering approves a basis.
   ============================================================ */
(function () {
  'use strict';

  var RULES = {
    models: {
      nx1: { id: 'nx1', name: 'NX-1', mw: 4.5, buildings: 1, racks: '~60', note: 'Single building' },
      nx2: { id: 'nx2', name: 'NX-2', mw: 9.0, buildings: 2, racks: '~120', note: 'Paired buildings' },
      nx3: { id: 'nx3', name: 'NX-3', mw: 13.5, buildings: 3, racks: '~180', note: 'Three-building block' },
      nx4: { id: 'nx4', name: 'NX-4', mw: 18.0, buildings: 4, racks: '~240', note: 'Campus scale' }
    },
    order: ['nx1', 'nx2', 'nx3', 'nx4'],
    /* acres per MW of critical IT, boundary = building + equipment yard
       + service clearance + internal access. Excludes substation and setbacks. */
    acrePerMW: { linear: 0.28, compressed: 0.21 },
    redundancyArea: { n1: 1.0, '2n': 1.18 },
    /* facility draw multiplier over critical IT load */
    facilityFactor: { air: 1.35, hybrid: 1.25, liquid: 1.18 },
    thermal: {
      air: { id: 'air', name: 'Air-assisted', density: '≤ 30 kW/rack', note: 'Mixed enterprise and CPU workloads' },
      hybrid: { id: 'hybrid', name: 'Hybrid liquid', density: '30 – 80 kW/rack', note: 'Inference and mixed GPU fleets' },
      liquid: { id: 'liquid', name: 'Direct liquid', density: '80 – 130+ kW/rack', note: 'Dense training and frontier inference' }
    },
    baseMonths: 8
  };

  var state = {
    start: 'site',        // site | plan | market
    power: 12,            // MW available or near-term
    model: 'nx2',
    thermal: 'hybrid',
    layout: 'linear',
    redundancy: 'n1',
    months: 12            // target operational window, months from commitment
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- derived ---------------- */
  function derive() {
    var m = RULES.models[state.model];
    var acres = m.mw * RULES.acrePerMW[state.layout] * RULES.redundancyArea[state.redundancy];
    var facility = m.mw * RULES.facilityFactor[state.thermal];
    var schedule = RULES.baseMonths;

    if (m.mw > 9) schedule += Math.ceil((m.mw - 9) / 4.5);
    if (state.redundancy === '2n') schedule += 1;
    if (state.start === 'plan') schedule += 1;
    if (state.start === 'market') schedule += 3;

    var powerOK = state.power >= facility;
    if (!powerOK) schedule += 3;

    var checks = [
      { k: 'Site control', ok: state.start === 'site', why: state.start === 'site' ? 'Parcel identified and controlled' : 'Site selection still open' },
      { k: 'Power sufficient', ok: powerOK, why: powerOK ? state.power.toFixed(1) + ' MW covers a ' + facility.toFixed(1) + ' MW facility draw' : 'Needs ' + facility.toFixed(1) + ' MW at the meter, ' + state.power.toFixed(1) + ' MW stated' },
      { k: 'Capacity in the fast band', ok: m.mw <= 10, why: m.mw <= 10 ? 'Inside the 5–10 MW eight-month basis' : 'Above the eight-month reference band' },
      { k: 'Thermal basis set', ok: true, why: RULES.thermal[state.thermal].name + ', ' + RULES.thermal[state.thermal].density },
      { k: 'Date achievable', ok: state.months >= schedule, why: state.months >= schedule ? state.months + ' month target clears a ' + schedule + ' month path' : state.months + ' month target is inside a ' + schedule + ' month path' }
    ];
    var score = checks.filter(function (c) { return c.ok; }).length;

    return {
      m: m, acres: acres, facility: facility, schedule: schedule,
      density: m.mw / acres, powerOK: powerOK, checks: checks, score: score,
      code: [m.name.replace('-', ''), state.layout === 'linear' ? 'L' : 'C',
             state.thermal.toUpperCase().slice(0, 3), state.redundancy.toUpperCase(),
             String(Math.round(state.power)) + 'MW'].join('-')
    };
  }

  /* ---------------- site plan SVG ---------------- */
  function plan(d) {
    var W = 1000, H = 600, pad = 54;
    var n = d.m.buildings, comp = state.layout === 'compressed';
    var o = [];

    o.push('<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Indicative site plan for ' + d.m.name + ', ' + state.layout + ' layout">');
    o.push('<rect width="' + W + '" height="' + H + '" fill="#fff"/>');

    // site boundary
    o.push('<rect x="' + pad + '" y="' + pad + '" width="' + (W - pad * 2) + '" height="' + (H - pad * 2) +
           '" fill="none" stroke="#B4B4B4" stroke-width="1" stroke-dasharray="7 5"/>');
    // access loop
    o.push('<rect x="' + (pad + 22) + '" y="' + (pad + 22) + '" width="' + (W - pad * 2 - 44) + '" height="' + (H - pad * 2 - 44) +
           '" rx="42" fill="none" stroke="#E3E3E3" stroke-width="12"/>');

    var ix = pad + 52, iy = pad + 52, iw = W - (pad + 52) * 2, ih = H - (pad + 52) * 2;

    // building + yard geometry
    var cols = comp ? Math.min(2, n) : n;
    var rows = Math.ceil(n / cols);
    var gapX = 20, gapY = 26;
    var bandH = comp ? ih * 0.52 : ih * 0.44;
    var cellW = (iw - gapX * (cols - 1)) / cols;
    var bH = (bandH - gapY * (rows - 1)) / rows;

    for (var i = 0; i < n; i++) {
      var r = Math.floor(i / cols), c = i % cols;
      var x = ix + c * (cellW + gapX);
      var y = iy + r * (bH + gapY);
      o.push('<g>');
      o.push('<rect x="' + x + '" y="' + y + '" width="' + cellW + '" height="' + bH + '" rx="9" fill="#fff" stroke="#000" stroke-width="1.6"/>');
      // panel joints
      for (var j = 1; j < 5; j++) {
        var jx = x + (cellW / 5) * j;
        o.push('<line x1="' + jx + '" y1="' + (y + 7) + '" x2="' + jx + '" y2="' + (y + bH - 7) + '" stroke="#EFEFEF" stroke-width="1"/>');
      }
      // entry
      o.push('<rect x="' + (x + 11) + '" y="' + (y + bH / 2 - 11) + '" width="7" height="22" fill="#000"/>');
      o.push('<text x="' + (x + cellW / 2) + '" y="' + (y + bH / 2 + 5) + '" font-family="IBM Plex Mono,monospace" font-size="15" letter-spacing="2.4" text-anchor="middle" fill="#000">' + d.m.name + '.' + (i + 1) + '</text>');
      o.push('</g>');
    }

    // equipment yard: cooling + power rows scaled to MW
    var yTop = iy + bandH + 40;
    var yH = ih - bandH - 40;
    var units = Math.max(6, Math.round(d.m.mw * 1.6));
    var perRow = Math.ceil(units / 2);
    var uW = (iw - (perRow - 1) * 6) / perRow;
    var uH = Math.min(26, (yH - 46) / 2);
    for (var k = 0; k < units; k++) {
      var rr = Math.floor(k / perRow), cc = k % perRow;
      var ux = ix + cc * (uW + 6);
      var uy = yTop + rr * (uH + 9);
      var isPower = rr === 1;
      o.push('<rect x="' + ux + '" y="' + uy + '" width="' + uW + '" height="' + uH + '" rx="2" fill="' + (isPower ? '#000' : '#fff') + '" stroke="#000" stroke-width="1"/>');
    }
    o.push('<text x="' + ix + '" y="' + (yTop - 14) + '" font-family="IBM Plex Mono,monospace" font-size="11" letter-spacing="2" fill="#8A8A8A">HEAT REJECTION</text>');
    o.push('<text x="' + ix + '" y="' + (yTop + uH + 9 + uH + 20) + '" font-family="IBM Plex Mono,monospace" font-size="11" letter-spacing="2" fill="#8A8A8A">POWER + SWITCHGEAR</text>');

    // scale annotation
    o.push('<line x1="' + pad + '" y1="' + (H - 26) + '" x2="' + (pad + 150) + '" y2="' + (H - 26) + '" stroke="#000" stroke-width="1"/>');
    o.push('<line x1="' + pad + '" y1="' + (H - 31) + '" x2="' + pad + '" y2="' + (H - 21) + '" stroke="#000" stroke-width="1"/>');
    o.push('<line x1="' + (pad + 150) + '" y1="' + (H - 31) + '" x2="' + (pad + 150) + '" y2="' + (H - 21) + '" stroke="#000" stroke-width="1"/>');
    o.push('<text x="' + (pad + 158) + '" y="' + (H - 22) + '" font-family="IBM Plex Mono,monospace" font-size="11" letter-spacing="1.6" fill="#8A8A8A">INDICATIVE BOUNDARY ' + d.acres.toFixed(2) + ' ACRES</text>');
    // north
    o.push('<g transform="translate(' + (W - pad - 16) + ',' + (H - 34) + ')"><path d="M0,-14 L5,6 L0,1 L-5,6 Z" fill="#000"/><text x="0" y="19" font-family="IBM Plex Mono,monospace" font-size="10" text-anchor="middle" fill="#8A8A8A">N</text></g>');
    o.push('</svg>');
    return o.join('');
  }

  /* ---------------- render ---------------- */
  var lastAcres = 0, lastDens = 0;

  var anims = new WeakMap();

  function animateNum(el, to, dec) {
    // cancel any in-flight animation on this element so overlapping
    // renders cannot race each other to the last write
    var prev = anims.get(el);
    if (prev) cancelAnimationFrame(prev.raf);

    var from = prev ? prev.current : parseFloat(el.textContent) || 0;
    if (Math.abs(from - to) < 0.005) {
      anims.delete(el);
      el.textContent = to.toFixed(dec);
      return;
    }
    var t0 = null, dur = 480, rec = { current: from, raf: 0 };
    anims.set(el, rec);

    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      rec.current = from + (to - from) * e;
      el.textContent = rec.current.toFixed(dec);
      if (p < 1) { rec.raf = requestAnimationFrame(tick); }
      else { anims.delete(el); }
    }
    rec.raf = requestAnimationFrame(tick);
  }

  function render() {
    var d = derive();

    // stage
    $('#plan-svg').innerHTML = plan(d);
    $('#stage-model').textContent = d.m.name;
    $('#stage-layout').textContent = state.layout === 'linear' ? 'Linear' : 'Compressed';

    // hero render swap
    $$('#ref-stage .stage-layer').forEach(function (l) {
      l.setAttribute('data-active', l.getAttribute('data-layer-id') === state.model ? 'true' : 'false');
    });

    // readout
    animateNum($('#ro-mw'), d.m.mw, 1);
    animateNum($('#ro-acres'), d.acres, 2);
    animateNum($('#ro-dens'), d.density, 2);
    $('#ro-months').textContent = d.schedule;
    $('#ro-months-sub').textContent = state.months >= d.schedule ? 'Clears your ' + state.months + '-month target' : 'Target is ' + (d.schedule - state.months) + ' months short';
    $('#ro-mw-sub').textContent = d.facility.toFixed(1) + ' MW facility draw';
    $('#ro-acres-sub').textContent = state.layout === 'linear' ? 'Linear layout' : 'Compressed layout';

    // step value summaries
    $('#v-start').textContent = { site: 'Power + site', plan: 'Power, no plan', market: 'Target market' }[state.start];
    $('#v-power').textContent = state.power.toFixed(1) + ' MW';
    $('#v-model').textContent = d.m.name + ' · ' + d.m.mw.toFixed(1) + ' MW';
    $('#v-thermal').textContent = RULES.thermal[state.thermal].name;
    $('#v-layout').textContent = (state.layout === 'linear' ? 'Linear' : 'Compressed') + ' · ' + (state.redundancy === 'n1' ? 'N+1' : '2N');
    $('#v-months').textContent = state.months + ' months';

    // power slider label
    $('#power-big').textContent = state.power.toFixed(1);
    $('#months-big').textContent = state.months;

    // recommendation hint under power
    var rec = RULES.order.filter(function (id) {
      return RULES.models[id].mw * RULES.facilityFactor[state.thermal] <= state.power;
    }).pop();
    $('#power-hint').textContent = rec
      ? 'Largest configuration this power supports: ' + RULES.models[rec].name + ' at ' + RULES.models[rec].mw.toFixed(1) + ' MW critical IT.'
      : 'Below the NX-1 facility draw. We would look at a phased service or a shared interconnect.';

    // summary
    $('#sum-model').textContent = d.m.name;
    $('#sum-mw').textContent = d.m.mw.toFixed(1) + ' MW IT';
    $('#sum-area').textContent = d.acres.toFixed(2) + ' acres';
    $('#sum-thermal').textContent = RULES.thermal[state.thermal].name;
    $('#sum-red').textContent = state.redundancy === 'n1' ? 'N+1' : '2N';
    $('#sum-sched').textContent = d.schedule + ' months';
    $('#sum-code').textContent = d.code;

    // fit meter
    $$('#meter .meter-seg').forEach(function (s, i) { s.setAttribute('data-on', i < d.score ? 'true' : 'false'); });
    $('#meter-score').textContent = d.score + ' / 5';
    $('#meter-label').textContent = ['Not yet viable', 'Early', 'Developing', 'Workable', 'Strong', 'Ready'][d.score];

    // checks
    $('#checks').innerHTML = d.checks.map(function (c) {
      return '<div class="chk" data-ok="' + c.ok + '"><span class="chk-ico" aria-hidden="true"></span>' +
             '<span><b>' + c.k + '</b><i>' + c.why + '</i></span></div>';
    }).join('');

    // progress
    var touched = parseInt(document.body.getAttribute('data-touched') || '0', 10);
    $('#prog-fill').style.width = Math.min(100, (touched / 6) * 100) + '%';
    $('#prog-lbl').textContent = Math.min(6, touched) + ' / 6 set';

    // carry to project fit
    var q = '?model=' + state.model + '&mw=' + d.m.mw + '&power=' + state.power + '&code=' + encodeURIComponent(d.code);
    $$('[data-carry]').forEach(function (a) { a.setAttribute('href', 'project-fit.html' + q); });
  }

  var touchedSet = {};
  function touch(step) {
    if (touchedSet[step]) return;
    touchedSet[step] = 1;
    document.body.setAttribute('data-touched', String(Object.keys(touchedSet).length));
  }

  /* ---------------- wiring ---------------- */
  function init() {
    if (!$('#plan-svg')) return;

    // steps open/close, non-linear
    $$('.step').forEach(function (st) {
      $('.step-hd', st).addEventListener('click', function () {
        var open = st.getAttribute('data-open') === 'true';
        $$('.step').forEach(function (o) {
          o.setAttribute('data-open', 'false');
          $('.step-hd', o).setAttribute('aria-expanded', 'false');
        });
        st.setAttribute('data-open', open ? 'false' : 'true');
        $('.step-hd', st).setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });

    // option groups
    $$('[data-group]').forEach(function (g) {
      var key = g.getAttribute('data-group');
      g.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-val]');
        if (!btn) return;
        state[key] = btn.getAttribute('data-val');
        if (key === 'model') state.model = btn.getAttribute('data-val');
        $$('[data-val]', g).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        touch(key);
        render();
      });
    });

    // sliders
    var ps = $('#power-slider');
    ps.addEventListener('input', function () {
      state.power = parseFloat(ps.value);
      touch('power');
      render();
    });
    var ms = $('#months-slider');
    ms.addEventListener('input', function () {
      state.months = parseInt(ms.value, 10);
      touch('months');
      render();
    });

    // auto-select model from power
    $('#power-auto').addEventListener('click', function () {
      var rec = RULES.order.filter(function (id) {
        return RULES.models[id].mw * RULES.facilityFactor[state.thermal] <= state.power;
      }).pop() || 'nx1';
      state.model = rec;
      $$('[data-group="model"] [data-val]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-val') === rec ? 'true' : 'false');
      });
      touch('model');
      render();
    });

    // deep link ?model=nx3
    var qm = new URLSearchParams(location.search).get('model');
    if (qm && RULES.models[qm]) {
      state.model = qm;
      state.power = Math.ceil(RULES.models[qm].mw * 1.25);
      ps.value = state.power;
      touch('model');
    }

    // reflect initial state in controls
    $$('[data-group]').forEach(function (g) {
      var key = g.getAttribute('data-group');
      $$('[data-val]', g).forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-val') === state[key] ? 'true' : 'false');
      });
    });
    ps.value = state.power;
    ms.value = state.months;

    // copy build code
    $('#copy-code').addEventListener('click', function () {
      var t = $('#sum-code').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      var b = $('#copy-code');
      b.textContent = 'Copied';
      setTimeout(function () { b.textContent = 'Copy'; }, 1600);
    });

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
