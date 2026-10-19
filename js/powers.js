/* Superman powers: Heat Vision, Fly, X-Ray, Freeze Breath, Super Speed, Lume */
(function (SM) {
  'use strict';
  const P = SM.powers = { active: {}, parts: [], app: null };
  let fx, fctx, W = 0, H = 0;

  P.init = function (app) {
    P.app = app; fx = SM.$('#fx'); fctx = fx.getContext('2d'); P.resize();
    addEventListener('resize', P.resize);
  };
  P.resize = function () {
    if (!fx) return; const r = Math.min(SM.Q ? Math.min(1.5, SM.Q.p().bgScale) : 1.5, devicePixelRatio || 1);
    W = fx.clientWidth; H = fx.clientHeight; fx.width = Math.round(W * r); fx.height = Math.round(H * r); fctx.setTransform(r, 0, 0, r, 0, 0);
  };
  /* glass centre + radius in fx-canvas coords */
  function glass() {
    const w = P.app.el.watch.getBoundingClientRect(), s = fx.getBoundingClientRect();
    const k = w.width / 600;
    return { x: w.left - s.left + 300 * k, y: w.top - s.top + 400 * k, r: 158 * k, k };
  }
  const busy = () => SM.reducedMotion();
  P.isBusy = name => !!P.active[name];

  /* ---------- HEAT VISION ---------- */
  P.heat = function (dur) {
    if (P.active.heat) return; dur = dur || 3.2;
    const st = { t0: performance.now(), dur: dur * 1000 };
    P.active.heat = st; SM.audio.heat(dur);
    P.app.el.watch.classList.add('p-heat');
    SM.emit('power', 'heat');
  };
  function drawHeat(now) {
    const st = P.active.heat, e = (now - st.t0) / st.dur;
    const g = glass(), heatEl = P.app.el.watch.querySelector('#gl-heat');
    if (e >= 1) {
      delete P.active.heat; P.app.el.watch.classList.remove('p-heat');
      if (heatEl) { heatEl.style.transition = 'opacity 2.2s'; heatEl.setAttribute('opacity', '0'); }
      return;
    }
    const ramp = Math.min(1, e * 6) * Math.min(1, (1 - e) * 8);
    if (heatEl) { heatEl.style.transition = 'none'; heatEl.setAttribute('opacity', (Math.min(1, e * 2.2) * .9).toFixed(2)); }
    const tx = g.x + Math.sin(now / 160) * g.r * .18, ty = g.y + Math.cos(now / 210) * g.r * .12;
    const eyes = [[W * .5 - 34, -40], [W * .5 + 34, -40]];
    fctx.save(); fctx.globalCompositeOperation = 'lighter';
    eyes.forEach(([ex, ey]) => {
      const wob = Math.sin(now / 40 + ex) * 1.5;
      [[26, 'rgba(255,40,0,', .18], [12, 'rgba(255,80,20,', .45], [5, 'rgba(255,200,80,', .9], [1.8, 'rgba(255,255,230,', 1]].forEach(([w, c, a]) => {
        fctx.strokeStyle = c + (a * ramp).toFixed(3) + ')'; fctx.lineWidth = w * g.k * 1.4 + wob; fctx.lineCap = 'round';
        fctx.beginPath(); fctx.moveTo(ex, ey); fctx.lineTo(tx, ty); fctx.stroke();
      });
    });
    const hg = fctx.createRadialGradient(tx, ty, 0, tx, ty, 60 * g.k * 2);
    hg.addColorStop(0, `rgba(255,255,220,${ramp})`); hg.addColorStop(.2, `rgba(255,150,40,${.7 * ramp})`); hg.addColorStop(1, 'rgba(255,40,0,0)');
    fctx.fillStyle = hg; fctx.beginPath(); fctx.arc(tx, ty, 120 * g.k, 0, 6.283); fctx.fill();
    fctx.restore();
    for (let i = 0; i < 5 * ramp; i++) {
      const a = Math.random() * 6.283, v = 2 + Math.random() * 6;
      P.parts.push({ k: 'spark', x: tx, y: ty, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, dec: .02 + Math.random() * .03 });
    }
    if (Math.random() < .3 * ramp) P.parts.push({ k: 'smoke', x: tx, y: ty, vx: (Math.random() - .5), vy: -1 - Math.random(), life: 1, dec: .012, s: 10 + Math.random() * 20 });
  }

  /* ---------- FLY ---------- */
  P.fly = function () {
    if (P.active.fly) return;
    P.active.fly = { t0: performance.now(), dur: 3200 };
    SM.audio.whoosh(1.4, true); setTimeout(() => SM.audio.whoosh(1.2, false), 2000);
    P.app.el.rig.classList.remove('p-fly'); void P.app.el.rig.offsetWidth; P.app.el.rig.classList.add('p-fly');
    SM.emit('power', 'fly');
  };
  function drawFly(now) {
    const st = P.active.fly, e = (now - st.t0) / st.dur;
    if (e >= 1) { delete P.active.fly; P.app.el.rig.classList.remove('p-fly'); return; }
    const intensity = Math.sin(Math.min(1, e) * Math.PI);
    if (Math.random() < .5 * intensity + .1) P.parts.push({ k: 'cloud', x: Math.random() * W, y: -80, vx: (Math.random() - .5) * 2, vy: 10 + Math.random() * 14, life: 1, dec: .006, s: 60 + Math.random() * 120 });
    for (let i = 0; i < 3 * intensity; i++) P.parts.push({ k: 'streak', x: Math.random() * W, y: -40, vx: 0, vy: 30 + Math.random() * 25, life: 1, dec: .05, s: 40 + Math.random() * 80 });
  }

  /* ---------- X-RAY ---------- */
  P.xray = function (force) {
    const on = force === undefined ? !P.active.xray : force;
    if (on === !!P.active.xray) return;
    if (on) P.active.xray = { t0: performance.now() }; else delete P.active.xray;
    P.app.el.watch.classList.toggle('p-xray', on);
    SM.audio.xray(on); SM.emit('power', on ? 'xray' : 'xray-off');
  };

  /* ---------- FREEZE BREATH ---------- */
  let frost, frx, branches = [];
  P.freeze = function () {
    if (P.active.freeze) return;
    frost = P.app.el.watch.querySelector('.frost'); if (!frost) return;
    frx = frost.getContext('2d');
    const S = 640; frost.width = frost.height = S; frx.clearRect(0, 0, S, S);
    frost.style.transition = 'none'; frost.style.opacity = '1';
    branches = [];
    for (let i = 0; i < 34; i++) { const a = Math.random() * 6.283; branches.push({ x: S / 2 + Math.cos(a) * S * .49, y: S / 2 + Math.sin(a) * S * .49, a: a + Math.PI + (Math.random() - .5) * .9, w: 1.6, gen: 0, len: 0 }); }
    P.active.freeze = { t0: performance.now(), dur: 6500, melt: false };
    SM.audio.freeze(); P.app.el.watch.classList.add('p-freeze');
    SM.emit('power', 'freeze');
  };
  function growFrost(e) {
    const S = frost.width, next = [];
    frx.lineCap = 'round';
    for (const b of branches) {
      const step = 3 + Math.random() * 3, nx = b.x + Math.cos(b.a) * step, ny = b.y + Math.sin(b.a) * step;
      frx.strokeStyle = `rgba(240,250,255,${(.35 + Math.random() * .35) * (1 - b.gen * .15)})`; frx.lineWidth = b.w;
      frx.beginPath(); frx.moveTo(b.x, b.y); frx.lineTo(nx, ny); frx.stroke();
      b.x = nx; b.y = ny; b.len += step; b.a += (Math.random() - .5) * .08;
      const dc = Math.hypot(nx - S / 2, ny - S / 2);
      if (dc < S * .5 && b.len < (b.gen ? 70 / b.gen : 240)) next.push(b);
      if (b.gen < 3 && Math.random() < (b.gen ? .16 : .3)) {
        const side = Math.random() < .5 ? 1 : -1;
        next.push({ x: nx, y: ny, a: b.a + side * 1.047, w: Math.max(.45, b.w * .62), gen: b.gen + 1, len: 0 });
      }
    }
    branches = next.slice(0, 900);
    /* frosted haze creeping in from the rim */
    const k = Math.min(1, e / .5), g = frx.createRadialGradient(S / 2, S / 2, S * (.5 - .32 * k), S / 2, S / 2, S * .5);
    g.addColorStop(0, 'rgba(225,242,255,0)'); g.addColorStop(1, 'rgba(225,242,255,.014)');
    frx.fillStyle = g; frx.beginPath(); frx.arc(S / 2, S / 2, S * .5, 0, 6.283); frx.fill();
    for (let i = 0; i < 6; i++) { const a = Math.random() * 6.283, d = S * (.5 - Math.random() * .3 * k), x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d; frx.fillStyle = 'rgba(255,255,255,.5)'; frx.fillRect(x, y, 1.2, 1.2); }
  }
  function drawFreeze(now) {
    const st = P.active.freeze, e = (now - st.t0) / st.dur;
    if (e < .6) { growFrost(e); growFrost(e); growFrost(e); }
    if (e < .35) {
      const g = glass();
      for (let i = 0; i < 4; i++) P.parts.push({ k: 'mist', x: W * .5 + (Math.random() - .5) * 60, y: -30, vx: (g.x - W * .5) / 40 + (Math.random() - .5) * 3, vy: (g.y + 30) / 40 + Math.random() * 2, life: 1, dec: .016, s: 20 + Math.random() * 40 });
    }
    if (e > .62 && !st.melt) { st.melt = true; frost.style.transition = 'opacity 2.4s ease'; frost.style.opacity = '0'; P.app.el.watch.classList.remove('p-freeze'); }
    if (e >= 1) delete P.active.freeze;
  }

  /* ---------- SUPER SPEED ---------- */
  P.speed = function () {
    if (P.active.speed) return;
    P.active.speed = { t0: performance.now(), dur: 2600 };
    SM.audio.speed(2.6); P.app.el.watch.classList.add('p-speed');
    SM.emit('power', 'speed');
  };
  function drawSpeed(now) {
    const st = P.active.speed, e = Math.min(1, (now - st.t0) / st.dur);
    P.app.state.speedOffset = SM.ease(e) * 12 * 3600000;
    const g = glass();
    for (let i = 0; i < 3; i++) { const a = Math.random() * 6.283, r0 = g.r * (1.25 + Math.random() * .8); P.parts.push({ k: 'orbit', a, r: r0, cx: g.x, cy: g.y, va: .18 + Math.random() * .1, life: 1, dec: .04 }); }
    if (e >= 1) { P.app.state.speedOffset = 0; delete P.active.speed; P.app.el.watch.classList.remove('p-speed'); }
  }

  /* ---------- LUME ---------- */
  P.lume = function (force) {
    const on = force === undefined ? !P.active.lume : force;
    if (on) P.active.lume = true; else delete P.active.lume;
    document.body.classList.toggle('p-lume', on);
    if (on) SM.audio.lume();
    SM.emit('power', on ? 'lume' : 'lume-off');
  };

  P.stopAll = function () {
    ['heat', 'fly', 'freeze', 'speed'].forEach(k => delete P.active[k]);
    P.xray(false); P.lume(false); P.parts = [];
    P.app.el.watch.classList.remove('p-heat', 'p-freeze', 'p-speed'); P.app.el.rig.classList.remove('p-fly');
    P.app.state.speedOffset = 0;
  };

  /* ---------- frame ---------- */
  P.update = function (now) {
    if (!fctx) return;
    const any = P.active.heat || P.active.fly || P.active.freeze || P.active.speed || P.parts.length;
    if (!any && !P._dirty) return;
    fctx.clearRect(0, 0, W, H); P._dirty = !!any;
    if (P.active.heat) drawHeat(now);
    if (P.active.fly) drawFly(now);
    if (P.active.freeze) drawFreeze(now);
    if (P.active.speed) drawSpeed(now);
    const out = [];
    for (const p of P.parts) {
      p.life -= p.dec; if (p.life <= 0) continue;
      if (p.k === 'orbit') { p.a += p.va; const x = p.cx + Math.cos(p.a) * p.r, y = p.cy + Math.sin(p.a) * p.r * .98; fctx.strokeStyle = `rgba(255,220,120,${(p.life * .7).toFixed(2)})`; fctx.lineWidth = 2; fctx.beginPath(); fctx.arc(p.cx, p.cy, p.r, p.a - .5, p.a); fctx.stroke(); out.push(p); continue; }
      p.x += p.vx; p.y += p.vy;
      if (p.k === 'spark') { p.vy += .25; fctx.fillStyle = `rgba(255,${160 + (p.life * 90 | 0)},60,${p.life.toFixed(2)})`; fctx.fillRect(p.x, p.y, 2.4, 2.4); }
      else if (p.k === 'smoke') { p.s += .6; fctx.fillStyle = `rgba(60,50,50,${(p.life * .18).toFixed(3)})`; fctx.beginPath(); fctx.arc(p.x, p.y, p.s, 0, 6.283); fctx.fill(); }
      else if (p.k === 'cloud') { const g = fctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); g.addColorStop(0, `rgba(255,255,255,${(p.life * .55).toFixed(2)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); fctx.fillStyle = g; fctx.beginPath(); fctx.arc(p.x, p.y, p.s, 0, 6.283); fctx.fill(); if (p.y > H + p.s) continue; }
      else if (p.k === 'streak') { fctx.strokeStyle = `rgba(255,255,255,${(p.life * .5).toFixed(2)})`; fctx.lineWidth = 1.5; fctx.beginPath(); fctx.moveTo(p.x, p.y); fctx.lineTo(p.x, p.y - p.s); fctx.stroke(); }
      else if (p.k === 'mist') { p.s += 1.2; const g = fctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); g.addColorStop(0, `rgba(210,240,255,${(p.life * .35).toFixed(2)})`); g.addColorStop(1, 'rgba(210,240,255,0)'); fctx.fillStyle = g; fctx.beginPath(); fctx.arc(p.x, p.y, p.s, 0, 6.283); fctx.fill(); }
      out.push(p);
    }
    const cap = Math.round(900 * (SM.Q ? SM.Q.p().particles : 1));
    P.parts = out.length > cap ? out.slice(-cap) : out;
  };
})(window.SM);
