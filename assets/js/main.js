/* Exploidus — shared behaviour: theme, nav, reveal, copy, dialog, filters, tabs */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    root.classList.add('rv-on');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    $$('.rv').forEach(function (el) { io.observe(el); });
    // safety net: never leave content hidden
    setTimeout(function () { $$('.rv:not(.in)').forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('in'); }); }, 1200);
  }

  /* ---------- theme ---------- */
  var themeBtn = $('#themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('exploidus-theme', next); } catch (e) {}
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = $('#menuBtn'), mnav = $('#mnav');
  function setMenu(open) {
    if (!menuBtn || !mnav) return;
    if (open) { var nb = $('.nav').getBoundingClientRect().bottom; mnav.style.top = Math.max(nb, 0) + 'px'; }
    mnav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    d.body.style.overflow = open ? 'hidden' : '';
  }
  if (menuBtn && mnav) {
    menuBtn.addEventListener('click', function () { setMenu(!mnav.classList.contains('open')); });
    $$('a, button', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    addEventListener('resize', function () { if (innerWidth > 1100) setMenu(false); });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- copy buttons ---------- */
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) {
      try { var ta = d.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; d.body.appendChild(ta); ta.select(); d.execCommand('copy'); ta.remove(); res(); } catch (e) { rej(e); }
    });
  }
  $$('[data-copy], [data-copy-from]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy');
      if (text == null) { var src = $(b.getAttribute('data-copy-from')); text = src ? src.textContent : ''; }
      var old = b.textContent;
      copyText(text).then(function () {
        b.textContent = 'Copied'; b.classList.add('done');
        setTimeout(function () { b.textContent = old; b.classList.remove('done'); }, 1600);
      }).catch(function () { b.textContent = 'Press Ctrl+C'; setTimeout(function () { b.textContent = old; }, 1600); });
    });
  });

  /* ---------- pilot dialog ---------- */
  var dlg = $('#pilot');
  if (dlg) {
    var sel = $('#pilotDivision');
    $$('[data-pilot]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (sel) sel.value = b.getAttribute('data-pilot') || 'custom';
        if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      });
    });
    var close = function () { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); };
    $('#pilotClose').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    $('#pilotForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return $(id).value; };
      var name = v('#pilotName'), org = v('#pilotOrg');
      var subject = encodeURIComponent('[Exploidus Enterprise Pilot] - ' + org + ' (' + name + ')');
      var body = encodeURIComponent('Name: ' + name + '\nOrganization: ' + org + '\nEmail: ' + v('#pilotEmail') + '\nDomain: ' + v('#pilotDivision') + '\n\nObjectives:\n' + v('#pilotMsg'));
      location.href = 'mailto:rahadbhuiya2021@gmail.com?subject=' + subject + '&body=' + body;
      close();
    });
  }

  /* ---------- filter chips (platforms + case studies) ---------- */
  var chips = $$('.chip[data-f]');
  if (chips.length) {
    var items = $$('[data-g]');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-f');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        items.forEach(function (it) {
          var show = f === 'all' || it.getAttribute('data-g') === f;
          if (it.matches('a')) it.classList.toggle('hide', !show); else it.hidden = !show;
        });
      });
    });
  }

  /* ---------- architecture tabs ---------- */
  var stages = $$('.stage[role="tab"]'), panel = $('#archPanel');
  if (stages.length && panel) {
    var specs = [
      ['Tier 01', 'XDP-Guard driver hook', [
        ['Hook location', 'XDP_DRV (Direct Network Interface Card DMA buffer)'],
        ['Action', 'Evaluates SYN cookies, ACK flood patterns, and reflection signatures via eBPF LRU hash maps.'],
        ['Return', 'Emits XDP_DROP instantly (<100 ns), preventing Linux sk_buff memory allocations under volumetric attack.']]],
      ['Tier 02', 'HuddleCluster thermal equilibrium', [
        ['Core engine', 'Bio-mimetic thermodynamic redistribution (Zenodo DOI: 10.5281/zenodo.20348019 | figshare: 10.6084/m9.figshare.32397180)'],
        ['Action', 'Monitors per-node CPU thermals and request queues. Automatically redistributes ingress flow from core to periphery.'],
        ['Fault tolerance', 'Zero single point of failure (SPOF) with instant peer gossip reconciliation.']]],
      ['Tier 03', 'scx_intent preemptive Linux kernel BPF', [
        ['Architecture', '5 Dedicated In-Kernel Dispatch Queues (DSQ 0 to 4)'],
        ['Action', 'Separates Audit (0), Interactive (1), IO (2), Network (3), and Compute (4) into isolated priority classes.'],
        ['Starvation protection', 'Enforces strict time slices and auto-boosts starving compute threads during interactive bursts.']]],
      ['Tier 04', 'Aegis-Filter deterministic GNC loop', [
        ['Execution bound', '4.07 ns scalar cycle latency (16 CPU cycles at 4.0GHz)'],
        ['Guarantees', 'Pure #![no_std] zero-allocation memory constraints with Joseph-stabilized covariance symmetry.'],
        ['Aerospace integration', 'NASA F Prime architecture compatible with real-time FDIR sensor divergence isolation.']]]
    ];
    var el = function (tag, txt, cls) { var n = d.createElement(tag); if (txt) n.textContent = txt; if (cls) n.className = cls; return n; };
    var select = function (i, focus) {
      stages.forEach(function (s, j) { s.setAttribute('aria-selected', String(i === j)); s.tabIndex = i === j ? 0 : -1; });
      panel.setAttribute('aria-labelledby', 'arch-' + i);
      var sp = specs[i], head = el('div'), dl = el('dl');
      head.appendChild(el('span', 'Specification // ' + sp[0], 'lbl')); head.appendChild(el('h4', sp[1]));
      sp[2].forEach(function (r) { dl.appendChild(el('dt', r[0])); dl.appendChild(el('dd', r[1])); });
      panel.textContent = ''; panel.appendChild(head); panel.appendChild(dl);
      if (focus) stages[i].focus();
    };
    stages.forEach(function (s, i) {
      s.addEventListener('click', function () { select(i); });
      s.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % 4 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i + 3) % 4 : -1;
        if (n > -1) { e.preventDefault(); select(n, true); }
      });
    });
  }
})();
