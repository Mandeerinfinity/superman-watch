/* Nick's Superman Watch v3: live complications and daily extras.
   Weather (Open-Meteo, no key, cached, offline-safe) · activity rings (DeviceMotion steps) · Metropolis Harbor tide model ·
   Kryptonian vitals (ECG) · calendar · daily quotes · haptics · theme presets (save / load / share via URL hash). */
(function (SM) {
  'use strict';
  const { store, f, pad } = SM;
  const CX = SM.cx = {};
  const CXX = 300, CYY = 400;

  /* ---------------- haptics ---------------- */
  /* navigator.vibrate works on Android Chrome / Firefox. iOS Safari does not implement it, so this is a silent no-op there. */
  CX.hapticsSupported = typeof navigator.vibrate === 'function';
  SM.haptic = function (pattern) {
    if (!store.get('haptics', true) || !CX.hapticsSupported) return false;
    /* browsers reject (and log) vibrate() before the first user gesture */
    const ua = navigator.userActivation; if (ua ? !ua.hasBeenActive : !(SM.audio && SM.audio.ctx && SM.audio.ctx.state === 'running')) return false;
    try { return navigator.vibrate(pattern); } catch (e) { return false; }
  };
  SM.HAPTIC = { tick: 8, click: 12, crown: [6, 30, 6], pusher: 18, power: [20, 40, 40], alarm: [200, 100, 200, 100, 400], holo: [10, 30, 10, 30, 60], collect: 10, bad: [40, 30, 40] };

  /* ---------------- weather (Open-Meteo) ---------------- */
  const WX_CODES = {
    0: ['Clear', 'sun'], 1: ['Mostly clear', 'sun'], 2: ['Partly cloudy', 'part'], 3: ['Overcast', 'cloud'], 45: ['Fog', 'fog'], 48: ['Rime fog', 'fog'],
    51: ['Light drizzle', 'rain'], 53: ['Drizzle', 'rain'], 55: ['Heavy drizzle', 'rain'], 56: ['Freezing drizzle', 'rain'], 57: ['Freezing drizzle', 'rain'],
    61: ['Light rain', 'rain'], 63: ['Rain', 'rain'], 65: ['Heavy rain', 'rain'], 66: ['Freezing rain', 'rain'], 67: ['Freezing rain', 'rain'],
    71: ['Light snow', 'snow'], 73: ['Snow', 'snow'], 75: ['Heavy snow', 'snow'], 77: ['Snow grains', 'snow'], 80: ['Showers', 'rain'], 81: ['Showers', 'rain'], 82: ['Violent showers', 'rain'],
    85: ['Snow showers', 'snow'], 86: ['Snow showers', 'snow'], 95: ['Thunderstorm', 'storm'], 96: ['Storm + hail', 'storm'], 99: ['Storm + hail', 'storm']
  };
  CX.wxInfo = code => { const w = WX_CODES[code] || ['Weather', 'part']; return { label: w[0], icon: w[1] }; };
  const W = CX.weather = Object.assign({ status: 'idle', msg: '' }, store.get('wxCache', null) || {});
  if (W.temp !== undefined) W.status = 'cached';
  CX.units = () => store.get('units', 'f');
  CX.temp = c => c === undefined || c === null || isNaN(c) ? '--' : Math.round(CX.units() === 'f' ? c * 9 / 5 + 32 : c) + '°';
  CX.fetchWeather = async function (force) {
    const loc = (SM.app && SM.app.state.loc) || { lat: 41.88, lon: -87.63, name: 'Chicago' };
    const fresh = W.t && Date.now() - W.t < 30 * 60000 && W.lat === loc.lat && W.lon === loc.lon;
    if (fresh && !force) return W;
    if (navigator.onLine === false) { W.status = W.temp !== undefined ? 'cached' : 'offline'; W.msg = 'Offline: showing ' + (W.temp !== undefined ? 'last known weather' : 'no data yet'); SM.emit('weather', W); return W; }
    if (!/^https?:/.test(location.protocol)) { W.status = 'offline'; W.msg = 'Weather needs http(s)'; SM.emit('weather', W); return W; }
    W.status = 'loading'; SM.emit('weather', W);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&wind_speed_unit=mph&timezone=auto&forecast_days=1';
    try {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const to = setTimeout(() => ctl && ctl.abort(), 9000);
      const r = await fetch(url, ctl ? { signal: ctl.signal } : {}); clearTimeout(to);
      const j = await r.json().catch(() => ({ error: true, reason: 'Bad response' }));
      if (!r.ok || j.error || !j.current) throw new Error(j.reason || ('HTTP ' + r.status));
      const c = j.current, d = j.daily || {};
      Object.assign(W, {
        status: 'ok', msg: '', t: Date.now(), lat: loc.lat, lon: loc.lon, place: loc.name,
        temp: c.temperature_2m, feels: c.apparent_temperature, hum: c.relative_humidity_2m, wind: c.wind_speed_10m, code: c.weather_code, isDay: !!c.is_day,
        hi: d.temperature_2m_max && d.temperature_2m_max[0], lo: d.temperature_2m_min && d.temperature_2m_min[0], pop: d.precipitation_probability_max && d.precipitation_probability_max[0]
      });
      const { status, msg, ...keep } = W; store.set('wxCache', keep);
    } catch (e) {
      W.status = W.temp !== undefined ? 'cached' : 'error';
      W.msg = 'Weather unavailable (' + String(e && e.message || e).slice(0, 80) + ')' + (W.temp !== undefined ? ': showing last known' : '');
    }
    SM.emit('weather', W);
    return W;
  };
  addEventListener('online', () => CX.fetchWeather(true));
  /* weather glyph, drawn in a 20x20 box centred on 0,0 */
  CX.wxGlyph = function (icon, isDay, s) {
    s = s || 1;
    const sun = `<circle r="${5.2 * s}" fill="#ffd34a"/><g stroke="#ffd34a" stroke-width="${1.3 * s}" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return `<line x1="${f(Math.cos(r) * 7.4 * s)}" y1="${f(Math.sin(r) * 7.4 * s)}" x2="${f(Math.cos(r) * 9.6 * s)}" y2="${f(Math.sin(r) * 9.6 * s)}"/>`; }).join('')}</g>`;
    const moon = `<path d="M${2 * s} ${-6 * s} A${6.5 * s} ${6.5 * s} 0 1 0 ${6 * s} ${3 * s} A${5 * s} ${5 * s} 0 0 1 ${2 * s} ${-6 * s} Z" fill="#e8ecff"/>`;
    const cloud = (dx, dy, c) => `<path transform="translate(${dx * s} ${dy * s}) scale(${s})" d="M-8 4 Q-9.5 -1 -4.5 -1.5 Q-3 -6.5 2 -5 Q6.5 -6 7 -1.5 Q10 -.5 9 3 Q8.5 5 6 5 L-6 5 Q-9 5 -8 4 Z" fill="${c}"/>`;
    const drops = (c) => [-4, 0, 4].map((x, i) => `<line x1="${x * s}" y1="${(7 + (i % 2)) * s}" x2="${(x - 1.4) * s}" y2="${(10.5 + (i % 2)) * s}" stroke="${c}" stroke-width="${1.2 * s}" stroke-linecap="round"/>`).join('');
    switch (icon) {
      case 'sun': return isDay === false ? moon : sun;
      case 'part': return `<g transform="translate(${-3 * s} ${-3 * s}) scale(.8)">${isDay === false ? moon : sun}</g>${cloud(2, 2, '#e9eef6')}`;
      case 'cloud': return cloud(-3, -2, '#9aa6b8') + cloud(2, 1, '#e3e9f2');
      case 'fog': return cloud(0, -2, '#c9d1dc') + [4, 7, 10].map(y => `<line x1="${-8 * s}" y1="${y * s}" x2="${8 * s}" y2="${y * s}" stroke="#c9d1dc" stroke-width="${1.1 * s}" stroke-linecap="round"/>`).join('');
      case 'rain': return cloud(0, -2, '#cfd8e6') + drops('#5fb4ff');
      case 'snow': return cloud(0, -2, '#e9eef6') + [-4, 0, 4].map((x, i) => `<circle cx="${x * s}" cy="${(8.5 + (i % 2) * 1.5) * s}" r="${1.2 * s}" fill="#fff"/>`).join('');
      case 'storm': return cloud(0, -2, '#8d97a8') + `<path d="M${1 * s} ${4 * s} L${-2.5 * s} ${9 * s} L${.5 * s} ${9 * s} L${-1.5 * s} ${13 * s} L${4 * s} ${7 * s} L${1 * s} ${7 * s} Z" fill="#ffd34a"/>`;
    }
    return sun;
  };

  /* ---------------- activity (steps via DeviceMotion) ---------------- */
  const todayKey = d => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  const ACT = CX.activity = { steps: 0, goal: store.get('stepGoal', 8000), live: false, lastEvt: 0, src: 'none' };
  (function loadSteps() { const s = store.get('steps', null); if (s && s.date === todayKey(new Date())) ACT.steps = s.n; })();
  let lp = 9.81, lastPeak = 0, above = false, saveT = 0;
  function onMotion(e) {
    const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
    const now = performance.now(); ACT.lastEvt = now; if (!ACT.live) { ACT.live = true; ACT.src = 'motion'; SM.emit('activity', ACT); }
    const m = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    lp += (m - lp) * .08; /* running mean ~ gravity */
    const d = m - lp;
    /* simple peak detector: rising through +1.3 m/s2, at most one step per 280 ms, walking cadence 0.28-2 s */
    if (!above && d > 1.3 && now - lastPeak > 280) { above = true; if (now - lastPeak < 2000) addSteps(1); lastPeak = now; }
    else if (above && d < .35) above = false;
  }
  function addSteps(n) {
    const k = todayKey(new Date()), s = store.get('steps', null);
    if (!s || s.date !== k) ACT.steps = 0;
    ACT.steps += n;
    if (performance.now() - saveT > 3000) { saveT = performance.now(); store.set('steps', { date: k, n: ACT.steps }); }
    SM.emit('activity', ACT);
  }
  CX.addSteps = addSteps;
  addEventListener('devicemotion', onMotion);
  /* iOS 13+: motion + orientation need a user-gesture permission prompt. One button asks for both. */
  CX.enableMotion = async function () {
    const res = { motion: 'n/a', orientation: 'n/a' };
    try { if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') res.motion = await DeviceMotionEvent.requestPermission(); else res.motion = window.DeviceMotionEvent ? 'granted' : 'unsupported'; } catch (e) { res.motion = 'error'; }
    try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') res.orientation = await DeviceOrientationEvent.requestPermission(); else res.orientation = window.DeviceOrientationEvent ? 'granted' : 'unsupported'; } catch (e) { res.orientation = 'error'; }
    store.set('motionAsked', true);
    return res;
  };
  CX.rings = function () {
    const app = SM.app, st = app ? app.state : {};
    const fc = st.focusCount && st.focusCount.date === todayKey(new Date()) ? st.focusCount.n : 0;
    return {
      move: Math.min(1.5, ACT.steps / Math.max(1, ACT.goal)), focus: Math.min(1.5, fc / 4),
      solar: Math.min(1, ((app && app.solar ? app.solar.charge : 60) + (app ? app.solarBoost() : 0)) / 100), steps: ACT.steps, fc
    };
  };

  /* ---------------- Metropolis Harbor tide (harmonic model) ---------------- */
  /* Principal lunar M2 (12.4206 h) + solar S2 (12 h) + K1 diurnal, phased to a reference high water.
     It produces the real spring/neap rhythm (big tides near new & full moon) but it is a model, not a navigation table. */
  const EPOCH = Date.UTC(2026, 0, 3, 14, 2); /* reference high water (New York Harbor-like, approx.) */
  const M2 = 12.4206012, S2 = 12, K1 = 23.9344696, N2 = 12.65834751;
  function tideH(t) {
    const h = (t - EPOCH) / 3600000;
    return 2.2 * Math.cos(2 * Math.PI * h / M2) + .45 * Math.cos(2 * Math.PI * h / S2 - .35) + .5 * Math.cos(2 * Math.PI * h / N2 + .9) + .3 * Math.cos(2 * Math.PI * h / K1 + 1.1);
  }
  CX.tide = function (date) {
    const t = date.getTime(), h = tideH(t), rising = tideH(t + 60000) > h;
    let nextHigh = null, nextLow = null, prev = h, dir = rising;
    for (let k = 1; k < 15 * 60 && (!nextHigh || !nextLow); k++) {
      const tt = t + k * 60000, v = tideH(tt), up = v > prev;
      if (dir && !up && !nextHigh) nextHigh = { t: new Date(tt - 60000), h: prev };
      if (!dir && up && !nextLow) nextLow = { t: new Date(tt - 60000), h: prev };
      dir = up; prev = v;
    }
    const range = 3.45 * 2, level = (h + 3.45) / range;
    /* phase 0 = high water, .5 = low water (for the gauge hand) */
    let phase = 0;
    if (nextHigh && nextLow) {
      const toH = nextHigh.t - t, toL = nextLow.t - t, half = M2 * 3600000 / 2;
      phase = rising ? 1 - toH / (2 * half) : .5 - toL / (2 * half);
      phase = (phase % 1 + 1) % 1;
    }
    const mo = SM.astro ? SM.astro.moon(date) : { phase: 0 };
    const spring = Math.abs(Math.cos(2 * Math.PI * mo.phase));
    return { ft: h + 3.2, level: Math.max(0, Math.min(1, level)), rising, nextHigh, nextLow, phase, kind: spring > .7 ? 'Spring tide' : spring < .35 ? 'Neap tide' : 'Mid-cycle tide' };
  };

  /* ---------------- Kryptonian vitals ---------------- */
  const V = CX.vitals = { bpm: 52, phase: 0, last: 0, beats: 0 };
  CX.vitalsTarget = function () {
    const app = SM.app; let b = 52;
    if (app) {
      const act = SM.powers && SM.powers.active ? Object.keys(SM.powers.active).filter(k => SM.powers.active[k]).length : 0;
      b += act * 14; if (app.focus && app.focus.running) b += 4; if (document.body.classList.contains('ringing')) b += 40;
      if (SM.game && SM.game.running) b += 30; if (app.state.speedOffset) b += 50;
    }
    return b;
  };
  /* one heartbeat of an ECG trace, x in [0,1) */
  CX.ecg = function (x) {
    const g = (c, w, a) => a * Math.exp(-Math.pow((x - c) / w, 2));
    return g(.12, .025, .12) - g(.215, .008, .14) + g(.24, .01, 1) - g(.265, .01, .28) + g(.46, .045, .26);
  };
  CX.stepVitals = function (nowP) {
    const dt = Math.min(.1, V.last ? (nowP - V.last) / 1000 : 0); V.last = nowP;
    V.bpm += (CX.vitalsTarget() - V.bpm) * Math.min(1, dt * .6);
    const before = V.phase; V.phase += dt * V.bpm / 60;
    if (Math.floor(V.phase) !== Math.floor(before)) { V.beats++; SM.emit('beat', V); }
    return V;
  };
  CX.ecgPath = function (x0, y0, w, h, n) {
    let d = ''; const span = 2.2; /* beats shown across the window */
    for (let i = 0; i <= n; i++) {
      const u = i / n, ph = V.phase - span * (1 - u), x = ((ph % 1) + 1) % 1;
      d += (i ? 'L' : 'M') + f(x0 + u * w) + ' ' + f(y0 - CX.ecg(x) * h);
    }
    return d;
  };

  /* ---------------- quotes (original paraphrases, written for this watch) ---------------- */
  CX.QUOTES = [
    'Strength means the most when it is spent protecting someone else.',
    'Hope is not a feeling you wait for. It is a choice you make first thing in the morning.',
    'The cape is optional. Showing up for people is not.',
    'Being fast is useless if you never stop to listen.',
    'Kindness is the one power everybody on Earth was born with.',
    'You do not have to be invincible to be dependable.',
    'Look up. Somebody out there is counting on you to keep going.',
    'A hero is just a person who decides the problem in front of them is theirs to help with.',
    'The truth is easier to carry than any lie, no matter how heavy it seems.',
    'Smallville taught me the biggest things happen one ordinary day at a time.',
    'Fly high, but keep your feet pointed toward home.',
    'Every sunrise is a full recharge. Use it well.',
    'Courage is being afraid and deciding people matter more.',
    'The glasses do not hide who you are. The choices you make reveal it.',
    'Protect the small things. They are usually the important ones.',
    'You are stronger than the thing you are worried about today.',
    'Power without patience is just noise.',
    'Nobody saves the world alone. Call your friends.',
    'Stand for something, even when nobody is watching the sky.',
    'The S is a promise: things can get better, and you can help.',
    'Listen closely. Somebody always needs help, and it is rarely loud.',
    'Being gentle when you could be forceful is the real test of strength.',
    'Today, be the kind of person your dog already thinks you are.',
    'A deadline is just a villain with a clock. You have handled worse.',
    'Take off from where you are, not from where you wish you were.',
    'Doing the right thing is rarely the fastest way. Do it anyway.',
    'Even the Man of Steel needs a good breakfast and a nap.',
    'The world is bright because people keep choosing to light it.',
    'Balance the super with the human. Both are needed.',
    'Mistakes are gravity. Everyone feels it. Flying means lifting off again.',
    'Help first. Explain later.',
    'Keep a little Kansas in you: honest work, open skies, good neighbours.',
    'You can break a lot of things. Choose to build instead.',
    'Stay curious like a reporter and steady like a farmer.',
    'Whatever falls today, you can catch at least one thing.',
    'Hope travels faster than a speeding bullet when you share it.',
    'A promise kept is the strongest steel there is.',
    'Be the calm in the middle of the storm. It is contagious.',
    'The best disguise is simply being kind to everyone.',
    'Recharge in the sun, then go make someone\'s day easier.'
  ];
  CX.quote = function (date) {
    const d = date || new Date(), n = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
    return CX.QUOTES[((n * 7) % CX.QUOTES.length + CX.QUOTES.length) % CX.QUOTES.length];
  };

  /* ---------------- calendar markup (dial + panel) ---------------- */
  CX.monthMatrix = function (date) {
    const y = date.getFullYear(), m = date.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const cells = []; for (let i = 0; i < first; i++) cells.push(0); for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7) cells.push(0);
    return { y, m, cells, today: date.getDate() };
  };

  /* ---------------- dial complication live binding ---------------- */
  let els = null;
  CX.bind = function (root) {
    els = {
      ecg: SM.$$('[data-ecg]', root).map(e => ({ e, x: +e.dataset.x, y: +e.dataset.y, w: +e.dataset.w, h: +e.dataset.h })),
      bpm: SM.$$('[data-bind="bpm"]', root), rings: SM.$$('[data-ring]', root), wx: SM.$$('[data-wx]', root),
      tideFill: SM.$$('[data-tidefill]', root), beat: SM.$$('[data-beat]', root)
    };
    CX.second(new Date(), true);
  };
  /* ~30 Hz: ECG trace */
  CX.live = function (nowP) {
    CX.stepVitals(nowP);
    if (!els || !els.ecg.length) return;
    els.ecg.forEach(o => o.e.setAttribute('d', CX.ecgPath(o.x, o.y, o.w, o.h, 56)));
    const b = (V.phase % 1); els.beat.forEach(e => e.setAttribute('opacity', f(Math.max(.25, 1 - b * 2.2))));
  };
  /* 1 Hz: rings, weather text, tide */
  CX.second = function (now, force) {
    if (!els) return;
    els.bpm.forEach(e => { const t = String(Math.round(V.bpm)); if (e.textContent !== t) e.textContent = t; });
    if (els.rings.length) {
      const R = CX.rings();
      els.rings.forEach(e => {
        const k = e.dataset.ring, v = Math.min(.999, R[k] || 0), cx = +e.dataset.cx, cy = +e.dataset.cy, r = +e.dataset.r;
        e.setAttribute('d', v > .004 ? SM.arcPath(cx, cy, r, 0, v * 360) : '');
      });
    }
    if (els.wx.length && (force || CX._wxDirty)) {
      CX._wxDirty = false;
      els.wx.forEach(e => {
        const k = e.dataset.wx;
        if (k === 'icon') e.innerHTML = W.temp !== undefined ? CX.wxGlyph(CX.wxInfo(W.code).icon, W.isDay, +e.dataset.s || 1) : `<text y="3" font-size="8" fill="#9fb0c8" text-anchor="middle">…</text>`;
        else if (k === 'temp') e.textContent = CX.temp(W.temp);
        else if (k === 'hilo') e.textContent = W.hi !== undefined ? 'H' + CX.temp(W.hi) + ' L' + CX.temp(W.lo) : (W.status === 'loading' ? 'LOADING' : 'NO DATA');
        else if (k === 'label') e.textContent = W.temp !== undefined ? CX.wxInfo(W.code).label.toUpperCase() : (W.status === 'offline' ? 'OFFLINE' : 'WEATHER');
      });
    }
    if (els.tideFill.length && (force || now.getSeconds() % 10 === 0)) {
      const T = CX.tide(now);
      els.tideFill.forEach(e => { const cy = +e.dataset.cy, r = +e.dataset.r; e.setAttribute('transform', `translate(0 ${f(r - T.level * r * 1.7 - r * .15)})`); });
    }
  };
  SM.on('weather', () => { CX._wxDirty = true; });

  /* ---------------- presets ---------------- */
  const PRESET_KEYS = ['face', 'bg', 'strap', 'strapColor', 'finish', 'motion', 'tickMode', 'tourbillon', 'holoVariant', 'custom', 'fmt24'];
  CX.BUILTIN_PRESETS = [
    { name: 'Man of Steel Night', face: 'manofsteel', bg: 'metropolis', strap: 'rubber', strapColor: 'black', finish: 'black' },
    { name: 'Hologram Command', face: 'hologram', bg: 'fortress', strap: 'suit', strapColor: 'suit', finish: 'titanium', holoVariant: 'cyan' },
    { name: 'Clark at the Planet', face: 'clark', bg: 'rooftop', strap: 'leather', strapColor: 'brown', finish: 'gold' },
    { name: 'Harbor Watch', face: 'harbor', bg: 'harbor', strap: 'bracelet', strapColor: 'black', finish: 'steel' },
    { name: 'Tourbillon Gala', face: 'tourbillon', bg: 'space', strap: 'leather', strapColor: 'black', finish: 'rose', tourbillon: true },
    { name: 'Phantom Zone', face: 'phantom', bg: 'phantom', strap: 'rubber', strapColor: 'black', finish: 'black' }
  ];
  CX.capture = function (name) {
    const st = SM.app.state, p = { name: name || 'My preset', v: 3 };
    PRESET_KEYS.forEach(k => { if (st[k] !== undefined) p[k] = st[k]; });
    return p;
  };
  CX.apply = function (p) {
    const app = SM.app; if (!p || typeof p !== 'object') return false;
    if (p.custom && typeof p.custom === 'object') app.setCustom(p.custom, true);
    if (p.fmt24 !== undefined) { app.state.fmt24 = !!p.fmt24; store.set('fmt24', app.state.fmt24); }
    if (p.motion) { app.state.motion = p.motion; store.set('motion', p.motion); }
    if (p.tickMode) { app.state.tickMode = p.tickMode; store.set('tickMode', p.tickMode); }
    if (p.holoVariant) app.setHoloVariant(p.holoVariant, true);
    if (p.finish) { app.state.finish = p.finish; store.set('finish', p.finish); }
    if (p.strap || p.strapColor) { app.state.strap = p.strap || app.state.strap; app.state.strapColor = p.strapColor || app.state.strapColor; store.set('strap', app.state.strap); store.set('strapColor', app.state.strapColor); }
    if (p.face && SM.FACES.some(x => x.id === p.face)) app.setFace(p.face); else app.setFace(app.state.face);
    if (p.bg && SM.BACKGROUNDS.some(x => x.id === p.bg)) app.setBg(p.bg);
    if (p.tourbillon !== undefined) app.setTourbillon(!!p.tourbillon, true);
    SM.emit('preset', p); return true;
  };
  CX.list = () => store.get('presets', []);
  CX.save = function (name) {
    const list = CX.list().filter(p => p.name !== name); const p = CX.capture(name); list.unshift(p); store.set('presets', list.slice(0, 24)); return p;
  };
  CX.remove = function (name) { store.set('presets', CX.list().filter(p => p.name !== name)); };
  const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))));
  CX.encode = p => b64u(JSON.stringify(p));
  CX.decode = s => { try { const p = JSON.parse(unb64u(s)); return p && typeof p === 'object' ? p : null; } catch (e) { return null; } };
  CX.shareURL = function (p) { return location.href.split('#')[0] + '#preset=' + CX.encode(p || CX.capture('Shared by Nick')); };
  CX.share = async function (p) {
    const url = CX.shareURL(p);
    try { history.replaceState(null, '', url); } catch (e) { }
    if (navigator.share && matchMedia('(pointer:coarse)').matches) { try { await navigator.share({ title: 'Superman watch preset', url }); return { url, how: 'share' }; } catch (e) { /* cancelled */ } }
    try { await navigator.clipboard.writeText(url); return { url, how: 'clipboard' }; } catch (e) { return { url, how: 'manual' }; }
  };
  CX.fromHash = function () {
    const m = /#preset=([A-Za-z0-9_-]+)/.exec(location.hash); if (!m) return false;
    const p = CX.decode(m[1]); if (!p) { SM.toast('That preset link looks damaged'); return false; }
    CX.apply(p); SM.toast('Loaded preset: ' + (p.name || 'shared'), 3200); return true;
  };
  addEventListener('hashchange', () => { if (SM.app && SM.app.ready) CX.fromHash(); });
})(window.SM);
(function (SM) { SM.on('power', k => { if (!/-off$/.test(k)) SM.haptic(SM.HAPTIC.power); }); })(window.SM);
