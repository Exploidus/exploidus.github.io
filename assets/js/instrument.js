/* Exploidus — hero instrument: three small illustrative simulations.
   Not live engine output; the Aegis pane runs a real 1-D constant-velocity Kalman filter
   (Joseph-form update, 3-sigma innovation gate) on synthetic data. */
(function () {
  'use strict';
  var inst = document.getElementById('inst');
  if (!inst) return;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var C = { ink: '#EDE9DE', mute: '#9D998C', acc: '#FF6B3D', ok: '#6EE7A0', line: 'rgba(237,233,222,.16)' };
  var rnd = Math.random;
  function gauss() { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function pad(n, l) { return String(n).padStart(l, '0'); }

  /* ----- canvas helper (hi-dpi, re-fit on resize) ----- */
  function Cv(id) {
    var el = $(id), ctx = el.getContext('2d'), o = { el: el, ctx: ctx, w: 0, h: 0 };
    o.fit = function () {
      var r = el.getBoundingClientRect(); if (!r.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(r.width * dpr); el.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); o.w = r.width; o.h = r.height;
    };
    if ('ResizeObserver' in window) new ResizeObserver(o.fit).observe(el); else addEventListener('resize', o.fit);
    o.fit(); return o;
  }

  /* ----- trace log ----- */
  function trace(id, left, right, cls, hot) {
    var box = $(id), row = document.createElement('div');
    var a = document.createElement('span'), b = document.createElement('span');
    a.textContent = left; b.textContent = right; b.className = cls || 'ok';
    if (hot) row.className = 'hot' + (cls === 'ok' ? ' g' : '');
    row.appendChild(a); row.appendChild(b); box.appendChild(row);
    while (box.children.length > 6) box.removeChild(box.firstChild);
  }

  /* =================== AEGIS: Kalman filter =================== */
  var N = 150;
  var aegis = (function () {
    var cv = Cv('cv-aegis'), nisEl = $('aegis-nis');
    var t = 0, acc = 0, step = 0.075, spoof = false;
    var meas = [], est = [], sd = [], gated = [];
    var x = [0, 0], P = [[100, 0], [0, 10]], R = 36, q = 0.5;
    function truth(k) { return 42 * Math.sin(k * 0.045) + 16 * Math.sin(k * 0.11); }
    function tick() {
      t++;
      var tr = truth(t), z = tr + gauss() * Math.sqrt(R), forced = false;
      if (spoof) { z = tr - Math.sign(tr || 1) * (62 + rnd() * 10); spoof = false; forced = true; }
      // predict (dt = 1)
      var px = x[0] + x[1], pv = x[1];
      var p00 = P[0][0] + P[0][1] + P[1][0] + P[1][1] + q / 4, p01 = P[0][1] + P[1][1] + q / 2, p10 = P[1][0] + P[1][1] + q / 2, p11 = P[1][1] + q;
      var y = z - px, S = p00 + R, nis = Math.abs(y) / Math.sqrt(S), rej = nis > 3;
      if (!rej) { // Joseph-form update
        var k0 = p00 / S, k1 = p10 / S;
        x = [px + k0 * y, pv + k1 * y];
        var a00 = 1 - k0, a10 = -k1; // A = I - K H = [[a00,0],[a10,1]]
        var m00 = a00 * p00, m01 = a00 * p01, m10 = a10 * p00 + p10, m11 = a10 * p01 + p11; // A*P
        P = [[m00 * a00 + R * k0 * k0, m00 * a10 + m01 + R * k0 * k1], [m10 * a00 + R * k1 * k0, m10 * a10 + m11 + R * k1 * k1]];
      } else { x = [px, pv]; P = [[p00, p01], [p10, p11]]; }
      meas.push(z); est.push(x[0]); sd.push(Math.sqrt(Math.max(P[0][0], 0))); gated.push(rej ? 1 : 0);
      if (meas.length > N) { meas.shift(); est.shift(); sd.shift(); gated.shift(); }
      nisEl.textContent = nis.toFixed(1) + ' σ'; nisEl.className = rej ? 'r' : '';
      if (rej) trace('trace-aegis', '[SPOOF DETECTED] Δy=' + (y >= 0 ? '+' : '') + y.toFixed(1) + ' m (' + nis.toFixed(0) + 'σ)', 'GATED_FAIL_CLOSED', 'bad', true);
      else if (t % 3 === 0) trace('trace-aegis', '[GNC #' + pad(t, 5) + '] Q_var: ' + (0.0012 + rnd() * 0.0004).toFixed(6) + ' | P_cov: ' + (P[0][0] / 1e5).toFixed(6), 'JOSEPH_OK', 'ok');
    }
    for (var i = 0; i < N; i++) tick();
    return {
      cv: cv, inject: function () { spoof = true; },
      update: function (dt) { acc += dt; while (acc >= step) { acc -= step; tick(); } },
      draw: function () {
        var c = cv.ctx, w = cv.w, h = cv.h; if (!w) return; c.clearRect(0, 0, w, h);
        var R_ = 130, X = function (i) { return 8 + (i / (N - 1)) * (w - 16); }, Y = function (v) { return h / 2 - (v / R_) * (h / 2) * 0.94; };
        c.strokeStyle = C.line; c.lineWidth = 1; c.beginPath(); c.moveTo(0, h / 2 + .5); c.lineTo(w, h / 2 + .5); c.stroke();
        c.beginPath(); for (var i = 0; i < est.length; i++) c.lineTo(X(i), Y(est[i] + 2 * sd[i]));
        for (i = est.length - 1; i >= 0; i--) c.lineTo(X(i), Y(est[i] - 2 * sd[i]));
        c.closePath(); c.fillStyle = 'rgba(237,233,222,.11)'; c.fill();
        for (i = 0; i < meas.length; i++) if (!gated[i]) { c.beginPath(); c.arc(X(i), Y(meas[i]), 2, 0, 6.283); c.fillStyle = 'rgba(255,107,61,.8)'; c.fill(); }
        c.beginPath(); for (i = 0; i < est.length; i++) c[i ? 'lineTo' : 'moveTo'](X(i), Y(est[i]));
        c.strokeStyle = C.ink; c.lineWidth = 1.8; c.lineJoin = 'round'; c.stroke();
        for (i = 0; i < meas.length; i++) if (gated[i]) {
          var gx = X(i), gy = Y(meas[i]); c.strokeStyle = C.acc; c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(gx - 5, gy - 5); c.lineTo(gx + 5, gy + 5); c.moveTo(gx + 5, gy - 5); c.lineTo(gx - 5, gy + 5); c.stroke();
          c.beginPath(); c.arc(gx, gy, 10, 0, 6.283); c.lineWidth = 1; c.stroke();
          c.fillStyle = C.acc; c.font = '500 10px "Geist Mono", monospace'; c.fillText('REJECTED', Math.min(Math.max(gx - 25, 4), w - 62), gy - 17);
        }
        var lx = X(est.length - 1), ly = Y(est[est.length - 1]); c.beginPath(); c.arc(lx, ly, 4, 0, 6.283); c.fillStyle = C.ink; c.fill();
      }
    };
  })();

  /* =================== XDP: pass / drop bars =================== */
  var xdp = (function () {
    var cv = Cv('cv-xdp'), ppsEl = $('xdp-pps'), B = 56;
    var pass = [], drop = [], acc = 0, step = 0.1, atk = 0, tk = 0;
    function tick() {
      tk++; var total = 78 + rnd() * 8, frac = 0.04 + rnd() * 0.04;
      if (atk > 0) { total = 83.5 + rnd() * 1.3; frac = 0.78 + rnd() * 0.12; atk--; }
      pass.push(total * (1 - frac)); drop.push(total * frac); if (pass.length > B) { pass.shift(); drop.shift(); }
      ppsEl.textContent = total.toFixed(1) + ' Mpps';
      if (atk > 0) trace('trace-xdp', '[100G SYN FLOOD] ' + total.toFixed(1) + ' Mpps', 'XDP_DROP (WIRE-SPEED ' + (68 + Math.floor(rnd() * 8)) + 'ns)', 'bad', true);
      else if (tk % 3 === 0) trace('trace-xdp', '[NIC drv] Ingress SYN-Flood :' + Math.floor(1024 + rnd() * 60000) + ' → 0xDEAD', 'XDP_DROP (' + (76 + Math.floor(rnd() * 5)) + 'ns)', 'bad');
    }
    for (var i = 0; i < B; i++) tick();
    return {
      cv: cv, inject: function () { atk = 14; },
      update: function (dt) { acc += dt; while (acc >= step) { acc -= step; tick(); } },
      draw: function () {
        var c = cv.ctx, w = cv.w, h = cv.h; if (!w) return; c.clearRect(0, 0, w, h);
        var bw = (w - 16) / B, top = 100, Y = function (v) { return (v / top) * (h - 14); };
        for (var i = 0; i < pass.length; i++) {
          var x = 8 + i * bw, hp = Y(pass[i]), hd = Y(drop[i]);
          c.fillStyle = 'rgba(237,233,222,.72)'; c.fillRect(x + .5, h - hp, bw - 1.5, hp);
          c.fillStyle = C.acc; c.fillRect(x + .5, h - hp - hd, bw - 1.5, hd);
        }
      }
    };
  })();

  /* =================== SCX: five dispatch queues =================== */
  var scx = (function () {
    var cv = Cv('cv-scx'), names = ['AUDIT', 'INTERACTIVE', 'IO', 'NETWORK', 'COMPUTE'];
    var rate = [0.5, 1.4, 1.5, 1.6, 2.6], speed = [1.1, 0.8, 0.6, 0.6, 0.34];
    var tasks = [], flash = [0, 0, 0, 0, 0], pre = 0, ring = 0, tk = 0, pid = 1000, wake = false, now = 0;
    function spawn(l, extra) { tasks.push({ l: l, p: 0, a: 0, b: false, s: extra || 0 }); }
    for (var l = 0; l < 5; l++) for (var k = 0; k < 4; k++) tasks.push({ l: l, p: rnd() * 0.9, a: 0, b: false, s: 0 });
    return {
      cv: cv, inject: function () { wake = true; },
      update: function (dt) {
        dt = Math.min(dt, 1); now += dt;
        if (wake) { wake = false; spawn(1, 1); pre = 0.55; ring = 1; trace('trace-scx', '[AUDIO_WAKE] PID_9941 Priority Event', 'SCX_KICK_PREEMPT (0 JITTER)', 'ok', true); }
        for (var i = 0; i < 5; i++) if (rnd() < rate[i] * dt * 0.55) spawn(i);
        if (pre > 0) pre -= dt; if (ring > 0) ring -= dt * 1.4;
        for (i = tasks.length - 1; i >= 0; i--) {
          var T = tasks[i]; T.a += dt;
          var sp = speed[T.l] * (T.s ? 3.4 : 1) * (T.b ? 2.4 : 1);
          if (T.l === 4 && !T.b && T.a > 3.4) { T.b = true; trace('trace-scx', '[WATCHDOG] pid_' + (pid + i) + ' starving → boost', 'SLICE: 5ms', 'ok'); }
          if (!(pre > 0 && T.l === 4)) T.p += sp * dt;
          if (T.p >= 1) { flash[T.l] = 1; tasks.splice(i, 1); tk++;
            if (tk % 4 === 0) trace('trace-scx', '[BPF_DISPATCH] Task pid_' + (pid + tk) + ' → DSQ_' + names[T.l], 'SLICE: 5ms', 'ok'); }
        }
        for (i = 0; i < 5; i++) flash[i] = Math.max(0, flash[i] - dt * 3);
        if (tasks.length > 90) tasks.splice(0, tasks.length - 90);
      },
      draw: function () {
        var c = cv.ctx, w = cv.w, h = cv.h; if (!w) return; c.clearRect(0, 0, w, h);
        var lab = w < 480 ? 0 : 96, x0 = 10 + lab, x1 = w - 64, top = 26, lh = (h - top - 6) / 5;
        c.font = '500 10px "Geist Mono", monospace'; c.textBaseline = 'middle';
        for (var i = 0; i < 5; i++) {
          var cy = top + lh * i + lh / 2;
          if (lab) { c.fillStyle = i === 1 && pre > 0 ? C.acc : C.mute; c.fillText('DSQ' + i + ' ' + names[i].slice(0, 5), 10, cy); }
          c.strokeStyle = C.line; c.lineWidth = 1; c.setLineDash([2, 4]); c.beginPath(); c.moveTo(x0, cy + .5); c.lineTo(x1, cy + .5); c.stroke(); c.setLineDash([]);
          c.fillStyle = 'rgba(255,107,61,' + (0.12 + flash[i] * 0.7) + ')'; c.fillRect(x1 + 6, cy - lh / 2 + 5, w - x1 - 14, lh - 10);
        }
                for (i = 0; i < tasks.length; i++) {
          var T = tasks[i], tx = x0 + T.p * (x1 - x0), ty = top + lh * T.l + lh / 2;
          if (T.s) { c.fillStyle = C.acc; c.beginPath(); c.arc(tx, ty, 6, 0, 6.283); c.fill(); c.strokeStyle = C.acc; c.beginPath(); c.arc(tx, ty, 11, 0, 6.283); c.stroke(); }
          else { c.fillStyle = T.b ? C.ok : T.l === 4 ? 'rgba(237,233,222,.45)' : C.ink; c.fillRect(tx - 3.5, ty - 3.5, 7, 7); }
        }
        if (ring > 0) { c.strokeStyle = 'rgba(255,107,61,' + ring + ')'; c.lineWidth = 2; c.beginPath(); c.arc(x1 + (w - x1) / 2, top + (h - top) / 2, 10 + (1 - ring) * 34, 0, 6.283); c.stroke(); }
      }
    };
  })();

  /* =================== tabs, loop, inject =================== */
  var sims = { aegis: aegis, xdp: xdp, scx: scx };
  var copy = {
    aegis: ['Inject sensor anomaly', 'Rejected by 3σ gate · covariance intact'],
    xdp: ['Launch 100G SYN flood', 'Quarantined · zero socket memory allocated'],
    scx: ['Wake audio thread', 'Compute preempted · audio underrun prevented']
  };
  var DEF_HINT = 'Illustrative simulation, not live engine output';
  var active = 'aegis', tabs = Array.prototype.slice.call(inst.querySelectorAll('.inst-tab'));
  var btn = $('injectBtn'), lbl = $('injectLbl'), hint = $('injectHint');

  function show(name, focus) {
    active = name;
    tabs.forEach(function (t) { var on = t.getAttribute('data-tab') === name; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    ['aegis', 'xdp', 'scx'].forEach(function (n) { $('pane-' + n).hidden = n !== name; });
    lbl.textContent = copy[name][0]; hint.textContent = DEF_HINT;
    sims[name].cv.fit(); sims[name].draw();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.getAttribute('data-tab')); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? (i + 1) % 3 : e.key === 'ArrowLeft' ? (i + 2) % 3 : -1;
      if (n > -1) { e.preventDefault(); show(tabs[n].getAttribute('data-tab'), true); }
    });
  });

  var cooling = false;
  btn.addEventListener('click', function () {
    if (cooling) return; cooling = true; btn.disabled = true;
    sims[active].inject(); hint.textContent = copy[active][1]; lbl.textContent = 'Running…';
    if (reduce) { sims[active].update(1.2); sims[active].draw(); }
    setTimeout(function () { cooling = false; btn.disabled = false; lbl.textContent = copy[active][0]; hint.textContent = DEF_HINT; }, 2600);
  });

  var visible = true, last = performance.now(), slow = 0;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(inst);
  function frame(ts) {
    var dt = Math.min((ts - last) / 1000, 0.25); last = ts;
    if (visible && !document.hidden) {
      var s = sims[active];
      if (reduce) { slow += dt; if (slow >= 0.9) { slow = 0; s.update(0.9); s.draw(); } }
      else { s.update(dt); s.draw(); }
    }
    requestAnimationFrame(frame);
  }
  show('aegis'); requestAnimationFrame(frame);
})();
