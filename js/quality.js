/* Nick's Superman Watch v3: quality settings + automatic frame-time governor.
   Tiers: 0 = ultra, 1 = high, 2 = balanced, 3 = battery. "Auto" starts at the best tier the device is likely to
   hold and steps down when frames drop (and back up after a long run of headroom). */
(function (SM) {
  'use strict';
  const Q = SM.Q = {
    mode: SM.store.get('quality', 'auto'), tier: 0, hz: 60, target: 1000 / 60,
    samples: [], lastChange: 0, goodSince: 0, log: [], listeners: []
  };
  const coarse = matchMedia('(pointer:coarse)').matches;
  Q.isPhone = coarse && Math.min(screen.width, screen.height) < 600;
  /* per-tier knobs used across the app */
  Q.P = [
    { name: 'Ultra', bgHz: 60, bgScale: 1.5, particles: 1, holoPR: 2, texRes: 1, glassHz: 60, capHz: 0, frost: 1 },
    { name: 'High', bgHz: 45, bgScale: 1.25, particles: .75, holoPR: 1.6, texRes: 1, glassHz: 45, capHz: 0, frost: 1 },
    { name: 'Balanced', bgHz: 30, bgScale: 1, particles: .5, holoPR: 1.3, texRes: .75, glassHz: 30, capHz: 60, frost: .75 },
    { name: 'Battery saver', bgHz: 15, bgScale: .75, particles: .3, holoPR: 1, texRes: .5, glassHz: 20, capHz: 30, frost: .5 }
  ];
  Q.p = () => Q.P[Q.tier];
  Q.onChange = fn => Q.listeners.push(fn);
  function setTier(t, why) {
    t = Math.max(0, Math.min(3, t));
    if (t === Q.tier) return;
    const old = Q.tier; Q.tier = t; Q.lastChange = performance.now(); Q.samples = []; Q.goodSince = 0;
    Q.log.push({ t: Math.round(performance.now()), from: old, to: t, why });
    document.documentElement.dataset.q = t;
    Q.listeners.forEach(fn => { try { fn(t, old); } catch (e) { console.error(e); } });
  }
  Q.setTier = setTier;
  Q.setMode = function (m) {
    Q.mode = m; SM.store.set('quality', m);
    if (m === 'high') setTier(0, 'manual'); else if (m === 'battery') setTier(3, 'manual');
    else setTier(Q.isPhone ? 1 : 0, 'auto reset');
  };
  Q.init = function () {
    Q.tier = Q.mode === 'battery' ? 3 : Q.mode === 'high' ? 0 : (Q.isPhone ? 1 : 0);
    document.documentElement.dataset.q = Q.tier;
  };
  /* called once per rAF with the real frame interval */
  /* ignore frame times while known one-off work runs (texture upgrades, hologram shader compile) */
  let holdUntil = 0;
  Q.hold = ms => { holdUntil = Math.max(holdUntil, performance.now() + ms); Q.samples = []; };
  Q.sample = function (dt, now) {
    if (now < holdUntil) return;
    if (dt <= 0 || dt > 250) return; /* tab switch, debugger, etc. */
    Q.samples.push(dt);
    if (Q.samples.length < 90) return;
    const s = Q.samples.slice().sort((a, b) => a - b), med = s[s.length >> 1], p90 = s[Math.floor(s.length * .9)];
    /* refresh-rate detection: 120 Hz ProMotion reports ~8.3 ms intervals when idle-free */
    const hz = med < 10 ? 120 : med < 14 ? 90 : 60;
    if (hz > Q.hz || now - Q.lastChange > 8000) Q.hz = Math.max(60, hz);
    Q.target = 1000 / Q.hz;
    Q.stats = { med, p90, fps: 1000 / med, hz: Q.hz };
    Q.samples = [];
    if (Q.mode !== 'auto') return;
    const cap = Q.p().capHz, budget = cap ? 1000 / cap : Q.target;
    /* too slow: median frame > 1.45x budget or p90 > 2.2x budget => step down */
    if ((med > budget * 1.45 || p90 > budget * 2.2) && now - Q.lastChange > 2500 && Q.tier < 3) { setTier(Q.tier + 1, `slow frames (median ${med.toFixed(1)} ms, p90 ${p90.toFixed(1)} ms)`); return; }
    /* lots of headroom for 20 s => try one tier up */
    if (med < budget * 1.08 && p90 < budget * 1.5) { if (!Q.goodSince) Q.goodSince = now; else if (now - Q.goodSince > 20000 && Q.tier > (Q.isPhone ? 1 : 0)) setTier(Q.tier - 1, 'headroom'); }
    else Q.goodSince = 0;
  };
  /* frame gate: returns true when this rAF should do visual work (Battery / Balanced cap the rate) */
  let lastWork = 0;
  Q.gate = function (now) {
    const cap = Q.p().capHz; if (!cap) { lastWork = now; return true; }
    if (now - lastWork >= 1000 / cap - 2) { lastWork = now; return true; }
    return false;
  };
  /* throttle helper: true at most `hz` times per second per key */
  const last = {};
  Q.every = function (key, hz, now) { if (!last[key] || now - last[key] >= 1000 / hz - 1) { last[key] = now; return true; } return false; };
})(window.SM);
