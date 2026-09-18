/* Flexnode prototype — shared behaviour */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- mobile drawer ---- */
  var burger = document.querySelector('[data-burger]');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.drawer a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) burger.click();
    });
  }

  /* ---- scroll reveal ---- */
  var rv = document.querySelectorAll('.rv');
  if (rv.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rv.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      rv.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---- accordions ---- */
  document.querySelectorAll('[data-acc]').forEach(function (root) {
    root.querySelectorAll('.acc-hd').forEach(function (hd) {
      hd.addEventListener('click', function () {
        var item = hd.closest('.acc-item');
        var open = item.getAttribute('data-open') === 'true';
        if (root.hasAttribute('data-acc-single')) {
          root.querySelectorAll('.acc-item').forEach(function (i) {
            i.setAttribute('data-open', 'false');
            i.querySelector('.acc-hd').setAttribute('aria-expanded', 'false');
          });
        }
        item.setAttribute('data-open', open ? 'false' : 'true');
        hd.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  });

  /* ---- generic toggle groups (image swap etc.) ---- */
  document.querySelectorAll('[data-swap]').forEach(function (group) {
    var targetSel = group.getAttribute('data-swap');
    var target = document.querySelector(targetSel);
    if (!target) return;
    group.querySelectorAll('[data-layer]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('[data-layer]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        var key = btn.getAttribute('data-layer');
        target.querySelectorAll('.stage-layer').forEach(function (l) {
          l.setAttribute('data-active', l.getAttribute('data-layer-id') === key ? 'true' : 'false');
        });
        var tag = target.querySelector('[data-stage-tag]');
        if (tag && btn.getAttribute('data-tag')) tag.textContent = btn.getAttribute('data-tag');
      });
    });
  });

  /* ---- count-up on reveal ---- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduced && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, to = parseFloat(el.getAttribute('data-count')),
            dec = (el.getAttribute('data-dec') || '0') | 0, t0 = null, dur = 1100;
        function tick(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = (to * e).toFixed(dec);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---- current year ---- */
  document.querySelectorAll('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
