/* Nick's Superman Watch v3: application core (single rAF loop, quality governor, lazy 3D hologram) */
(function (SM) {
  'use strict';
  const { $, $$, f, pad, clamp, store } = SM;
  const CX = 300, CY = 400;
  const A = SM.audio;

  const CITIES = SM.CITIES = [
    { name: 'Chicago', label: 'CHI', tz: 'America/Chicago', lat: 41.88, lon: -87.63, home: true },
    { name: 'Metropolis (New York)', label: 'MET', tz: 'America/New_York', lat: 40.71, lon: -74.01 },
    { name: 'Smallville, Kansas', label: 'SMV', tz: 'America/Chicago', lat: 38.5, lon: -98.0 },
    { name: 'Los Angeles', label: 'LAX', tz: 'America/Los_Angeles', lat: 34.05, lon: -118.24 },
    { name: 'Denver', label: 'DEN', tz: 'America/Denver', lat: 39.74, lon: -104.99 },
    { name: 'Anchorage', label: 'ANC', tz: 'America/Anchorage', lat: 61.22, lon: -149.9 },
    { name: 'Honolulu', label: 'HNL', tz: 'Pacific/Honolulu', lat: 21.31, lon: -157.86 },
    { name: 'Mexico City', label: 'MEX', tz: 'America/Mexico_City', lat: 19.43, lon: -99.13 },
    { name: 'São Paulo', label: 'SAO', tz: 'America/Sao_Paulo', lat: -23.55, lon: -46.63 },
    { name: 'Reykjavík', label: 'REK', tz: 'Atlantic/Reykjavik', lat: 64.15, lon: -21.94 },
    { name: 'London', label: 'LON', tz: 'Europe/London', lat: 51.51, lon: -0.13 },
    { name: 'Paris', label: 'PAR', tz: 'Europe/Paris', lat: 48.86, lon: 2.35 },
    { name: 'Berlin', label: 'BER', tz: 'Europe/Berlin', lat: 52.52, lon: 13.4 },
    { name: 'Cairo', label: 'CAI', tz: 'Africa/Cairo', lat: 30.04, lon: 31.24 },
    { name: 'Nairobi', label: 'NBO', tz: 'Africa/Nairobi', lat: -1.29, lon: 36.82 },
    { name: 'Moscow', label: 'MOW', tz: 'Europe/Moscow', lat: 55.76, lon: 37.62 },
    { name: 'Dubai', label: 'DXB', tz: 'Asia/Dubai', lat: 25.2, lon: 55.27 },
    { name: 'Mumbai', label: 'BOM', tz: 'Asia/Kolkata', lat: 19.08, lon: 72.88 },
    { name: 'Bangkok', label: 'BKK', tz: 'Asia/Bangkok', lat: 13.76, lon: 100.5 },
    { name: 'Singapore', label: 'SIN', tz: 'Asia/Singapore', lat: 1.35, lon: 103.82 },
    { name: 'Hong Kong', label: 'HKG', tz: 'Asia/Hong_Kong', lat: 22.32, lon: 114.17 },
    { name: 'Tokyo', label: 'TYO', tz: 'Asia/Tokyo', lat: 35.68, lon: 139.69 },
    { name: 'Sydney', label: 'SYD', tz: 'Australia/Sydney', lat: -33.87, lon: 151.21 },
    { name: 'Auckland', label: 'AKL', tz: 'Pacific/Auckland', lat: -36.85, lon: 174.76 }
  ];
  const fmtCache = {};
  SM.cityTime = function (city, date, fmt24) {
    const k = city.tz + fmt24;
    if (!fmtCache[k]) fmtCache[k] = new Intl.DateTimeFormat('en-US', { timeZone: city.tz, hour: 'numeric', minute: '2-digit', hour12: !fmt24, weekday: 'short', day: 'numeric', month: 'short' });
    const parts = {}; fmtCache[k].formatToParts(date).forEach(p => parts[p.type] = p.value);
    return parts;
  };
  const offCache = {};
  SM.cityOffset = function (city, date) { /* minutes relative to UTC */
    if (!offCache[city.tz]) offCache[city.tz] = new Intl.DateTimeFormat('en-US', { timeZone: city.tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    const p = {}; offCache[city.tz].formatToParts(date).forEach(x => p[x.type] = +x.value || x.value);
    const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute);
    return Math.round((asUTC - Math.floor(date.getTime() / 60000) * 60000) / 60000);
  };

  /* ---------------- state ---------------- */
  const st = {
    face: store.get('face', 'classic'), bg: store.get('bg', 'suit'), strap: store.get('strap', 'leather'), strapColor: store.get('strapColor', 'black'),
    finish: store.get('finish', 'auto'), fmt24: store.get('fmt24', false), motion: store.get('motion', 'mech'), tickMode: store.get('tickMode', 'ticktock'),
    intro: store.get('intro', true), world: store.get('world', 'London'), loc: store.get('loc', { name: 'Chicago', lat: 41.88, lon: -87.63 }),
    bezel: store.get('bezel', 0), alarms: store.get('alarms', [{ id: 'a1', time: '07:00', label: 'Save the world', days: [1, 2, 3, 4, 5], on: false }]),
    focusCount: store.get('focusCount', { date: '', n: 0 }), speedOffset: 0,
    tourbillon: store.get('tourbillon', false), holoVariant: store.get('holoVariant', 'cyan'), custom: store.get('custom', null)
  };
  const chrono = { running: false, start: 0, acc: 0, splits: [], hold: null, holdUntil: 0 };
  const timer = { dur: store.get('timerDur', 300000), left: store.get('timerDur', 300000), endAt: 0, running: false };
  const FOCUS_DUR = { focus: 25 * 60000, short: 5 * 60000, long: 15 * 60000 };
  const focus = { mode: 'focus', left: FOCUS_DUR.focus, endAt: 0, running: false, cycle: 0 };
  const app = SM.app = { state: st, chrono, timer, focus, el: {}, face: null, bgObj: null, CITIES };

  chrono.elapsed = () => chrono.acc + (chrono.running ? performance.now() - chrono.start : 0);
  timer.remaining = () => timer.running ? Math.max(0, timer.endAt - Date.now()) : timer.left;
  focus.remaining = () => focus.running ? Math.max(0, focus.endAt - Date.now()) : focus.left;

  /* ---------------- id scoping for clones / thumbnails ---------------- */
  SM.scopeIds = function (markup, sfx) {
    const ids = new Set(); markup.replace(/\sid="([^"]+)"/g, (m, id) => ids.add(id));
    if (!ids.size) return markup;
    return markup.replace(/(\sid="|url\(#|href="#)([^")]+)/g, (m, pre, id) => ids.has(id) ? pre + id + '-' + sfx : m);
  };

  /* ---------------- watch DOM ---------------- */
  const LAYERS = ['shadow', 'strap', 'case', 'dial', 'tourb', 'move', 'lume', 'hands', 'frost', 'glass', 'hit'];
  function buildWatch() {
    const w = app.el.watch = $('#watch'); app.el.rig = $('#rig'); app.el.stage = $('#stage');
    w.innerHTML = LAYERS.map(l => l === 'dial' || l === 'shadow' ? `<div class="ly ly-${l}"></div>` : l === 'frost' ? `<canvas class="ly frost"></canvas>` : `<svg class="ly ly-${l}" viewBox="0 0 600 800" aria-hidden="true"></svg>`).join('');
    LAYERS.forEach(l => app.el[l] = w.querySelector('.ly-' + l) || w.querySelector('.' + l));
    app.el.shadow.style.backgroundImage = `url(${shadowImage()})`;
    app.el.glass.innerHTML = SM.glassMarkup();
    app.el.hit.innerHTML = SM.hitMarkup();
    app.el.move.innerHTML = SM.movementMarkup() + `<g clip-path="url(#mv-clip)"><rect class="xscan" x="150" y="250" width="300" height="26" fill="url(#xscanG)"/></g><defs><linearGradient id="xscanG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ff" stop-opacity="0"/><stop offset=".5" stop-color="#9ff" stop-opacity=".35"/><stop offset="1" stop-color="#7ff" stop-opacity="0"/></linearGradient></defs>`;
    app.el.brushPat = document.getElementById('p-brushR');
  }
  function shadowImage() {
    const c = document.createElement('canvas'), k = .5; c.width = 600 * k; c.height = 800 * k;
    const x = c.getContext('2d'); x.scale(k, k); x.filter = 'blur(' + (16 * k * 2) + 'px)';
    x.fillStyle = 'rgba(0,0,0,.43)'; x.beginPath(); x.roundRect ? x.roundRect(214, 20, 172, 760, 20) : x.rect(214, 20, 172, 760); x.fill();
    x.fillStyle = 'rgba(0,0,0,.62)'; x.beginPath(); x.arc(300, 400, 205, 0, 6.283); x.fill(); x.fillRect(505, 372, 48, 56);
    return c.toDataURL();
  }
  function finishKey() { return st.finish === 'auto' ? (app.face.finish || 'steel') : st.finish; }
  function buildCase() { app.el.case.innerHTML = SM.caseMarkup(app.face, finishKey()); app.el.bezelG = app.el.case.querySelector('#bezel'); applyBezel(); }
  function buildStrap() { const c = SM.STRAP_COLORS.find(x => x.id === st.strapColor) || SM.STRAP_COLORS[0]; app.el.strap.innerHTML = SM.strapMarkup(st.strap, c.c, finishKey()); }
  function buildDial() {
    const face = app.face, d = SM.dialMarkup(face);
    app.subs = d.subs;
    const anim = (d.anim || []).map(a => `<div class="dial-anim ${a.cls || ''}" style="animation-duration:${a.dur || 30}s"><svg viewBox="0 0 600 800">${a.markup}</svg></div>`).join('');
    app.el.dial.innerHTML = `<svg class="dial-svg" viewBox="0 0 600 800">${d.markup}</svg>${face.canvas ? '<canvas class="solar" width="360" height="360"></canvas>' : ''}${anim}${d.overlay ? `<svg class="dial-over" viewBox="0 0 600 800">${d.overlay}</svg>` : ''}`;
    app.el.solar = app.el.dial.querySelector('canvas.solar');
    app.el.hands.innerHTML = SM.handsMarkup(face, d.subs);
    const h = app.el.hands, q = id => h.querySelector('#' + id);
    app.hq = {
      hour: q('h-hour'), hourSh: q('h-hour-sh'), hourSh2: q('h-hour-sh2'), min: q('h-min'), minSh: q('h-min-sh'), minSh2: q('h-min-sh2'),
      sec: q('h-sec'), secSh: q('h-sec-sh'), chrono: q('h-chrono'), split: q('h-split'), arc: q('h-arc'), alarm: q('h-alarm'), ghosts: q('h-ghosts'),
      subs: d.subs.map((s, i) => ({ s, g: q('sd-' + i), sh: q('sd-' + i + '-sh') }))
    };
    app.binds = $$('[data-bind]', app.el.dial);
    app.moons = $$('path[data-moon]', app.el.dial);
    app.el.lume.innerHTML = ''; app.lumeBuilt = false;
    app.lastSecond = -1; app.lastMinute = -1;
    document.documentElement.style.setProperty('--lume', face.lume || '#9dffb0');
    if (SM.cx) SM.cx.bind(app.el.dial);
    app.hasEcg = !!app.el.dial.querySelector('[data-ecg]');
    app.dialDate = new Date().getDate();
    buildTourbillon();
  }
  function buildTourbillon() {
    const on = st.tourbillon || app.face.tourbillon;
    app.el.tourb.innerHTML = on ? SM.tourbillonMarkup(finishKey()) : '';
    app.el.tourb._tb = null; app.tbOn = on;
    app.el.watch.classList.toggle('has-tourb', !!on);
  }
  app.setTourbillon = function (on, silent) {
    st.tourbillon = on === undefined ? !st.tourbillon : !!on; store.set('tourbillon', st.tourbillon); buildTourbillon();
    if (!silent) { SM.toast(st.tourbillon ? 'Tourbillon engaged: 1 rpm cage, 4 Hz balance' : 'Tourbillon off'); A.crown(); SM.haptic(SM.HAPTIC.crown); }
    SM.emit('tourbillon', st.tourbillon);
  };
  app.setCustom = function (cfg, silent) {
    st.custom = Object.assign({}, SM.CUSTOM_DEFAULT, cfg || {}); store.set('custom', st.custom);
    SM.faceById('custom').configure(st.custom);
    if (!silent && st.face === 'custom') setFace('custom', { noSweep: true, noGhost: true });
    SM.emit('custom', st.custom);
  };
  /* extra solar charge earned in the Solar Recharge game (today only) */
  app.solarBoost = function () { const b = store.get('solarBoost', null); return b && b.date === todayKey(new Date()) ? b.v : 0; };
  app.addSolarBoost = function (v) { const k = todayKey(new Date()), b = store.get('solarBoost', null), cur = b && b.date === k ? b.v : 0; store.set('solarBoost', { date: k, v: Math.min(100, cur + v) }); minuteWork(new Date()); };
  app.buildLume = function () {
    if (app.lumeBuilt) return; app.lumeBuilt = true;
    const root = app.el.lume, rm = root.getScreenCTM(); if (!rm) return;
    const inv = rm.inverse(); let s = `<circle cx="300" cy="400" r="158" fill="#02040a" opacity=".86"/>`;
    const col = app.face.lume || '#9dffb0';
    $$('.lume', app.el.dial).forEach(e => {
      const m = inv.multiply(e.getScreenCTM());
      const c = e.cloneNode(true); c.removeAttribute('class'); c.removeAttribute('opacity');
      c.setAttribute('fill', col); c.setAttribute('stroke', 'none');
      s += `<g transform="matrix(${f(m.a)} ${f(m.b)} ${f(m.c)} ${f(m.d)} ${f(m.e)} ${f(m.f)})" filter="url(#f-lume)">${c.outerHTML}</g>`;
    });
    root.innerHTML = s;
  };

  let sweep = null;
  function setFace(id, opts = {}) {
    const face = SM.faceById(id); const first = !app.face;
    if (!first && app.el.dial.innerHTML && !opts.noGhost) {
      const ghost = document.createElement('div'); ghost.className = 'ly ly-dial ghost';
      ghost.innerHTML = SM.scopeIds(app.el.dial.innerHTML + `<svg class="dial-svg" viewBox="0 0 600 800">${app.el.hands.innerHTML}</svg>`, 'g' + Date.now().toString(36));
      const oc = app.el.solar; if (oc) { const nc = ghost.querySelector('canvas.solar'); if (nc) nc.getContext('2d').drawImage(oc, 0, 0); }
      app.el.dial.after(ghost);
      requestAnimationFrame(() => requestAnimationFrame(() => ghost.classList.add('out')));
      setTimeout(() => ghost.remove(), 800);
    }
    app.face = face; st.face = face.id; store.set('face', face.id);
    buildCase(); buildStrap(); buildDial();
    app.el.watch.dataset.face = face.id;
    $('#cap-name').textContent = face.name; $('#cap-desc').textContent = face.desc;
    if (!first && !opts.noSweep) sweep = { t0: performance.now(), dur: 900 };
    if (app.lumeOn) requestAnimationFrame(() => app.buildLume());
    if (face.holo) app.openHolo('face');
    else if (app.holo && app.holo.state.mode === 'face') app.closeHolo();
    SM.emit('face', face);
  }
  app.setFace = setFace;
  app.nextFace = function (dir) {
    const i = SM.FACES.findIndex(x => x.id === st.face);
    setFace(SM.FACES[(i + (dir || 1) + SM.FACES.length) % SM.FACES.length].id);
  };
  app.setStrap = function (mat, color) {
    if (mat) st.strap = mat; if (color) st.strapColor = color;
    store.set('strap', st.strap); store.set('strapColor', st.strapColor); buildStrap(); SM.emit('strap');
  };
  app.setFinish = function (k) { st.finish = k; store.set('finish', k); buildCase(); buildStrap(); SM.emit('strap'); };
  app.setBg = function (id) {
    const def = SM.bgById(id); st.bg = def.id; store.set('bg', def.id);
    const host = $('#bg'), old = host.querySelector('.bg-scene');
    if (app.bgObj && app.bgObj.destroy) app.bgObj.destroy();
    const sc = document.createElement('div'); sc.className = 'bg-scene entering'; sc.dataset.bg = def.id; host.appendChild(sc);
    const obj = Object.create(def); obj.build(sc); app.bgObj = obj; app.bgEl = sc;
    requestAnimationFrame(() => requestAnimationFrame(() => sc.classList.remove('entering')));
    if (old) { old.classList.add('leaving'); setTimeout(() => old.remove(), 900); }
    document.body.dataset.bg = def.id;
    SM.emit('bg', def);
  };

  /* ---------------- bezel ---------------- */
  function applyBezel() { if (app.el.bezelG) app.el.bezelG.setAttribute('transform', `rotate(${f(st.bezel)} ${CX} ${CY})`); }
  app.turnBezel = function (steps) {
    st.bezel = ((st.bezel + steps * 6) % 360 + 360) % 360; applyBezel(); store.set('bezel', st.bezel);
    for (let i = 0; i < Math.min(6, Math.abs(steps)); i++) setTimeout(() => A.bezel(), i * 28);
    SM.haptic(SM.HAPTIC.tick);
  };
  function angleAt(e) {
    const r = app.el.watch.getBoundingClientRect(), k = r.width / 600;
    return Math.atan2(e.clientY - (r.top + CY * k), e.clientX - (r.left + CX * k)) * 180 / Math.PI;
  }

  /* ---------------- chrono / timer / focus ---------------- */
  app.chronoStartStop = function () {
    if (chrono.running) { chrono.acc = chrono.elapsed(); chrono.running = false; SM.toast('Chronograph stopped · ' + SM.fmtDur(chrono.acc, true)); }
    else { chrono.start = performance.now(); chrono.running = true; }
    SM.emit('chrono');
  };
  app.chronoSplitReset = function () {
    if (chrono.running) {
      const tot = chrono.elapsed(), prev = chrono.splits.length ? chrono.splits[chrono.splits.length - 1].total : 0;
      chrono.splits.push({ n: chrono.splits.length + 1, total: tot, lap: tot - prev });
      chrono.hold = tot; chrono.holdUntil = performance.now() + 4000;
      SM.toast('Split ' + chrono.splits.length + ' · ' + SM.fmtDur(tot, true));
    } else { chrono.acc = 0; chrono.splits = []; chrono.hold = null; }
    SM.emit('chrono');
  };
  function pressPusher(which) {
    const g = app.el.case.querySelector(`#pusher-${which} .pusher-g`);
    if (g) { g.classList.add('pressed'); setTimeout(() => { g.classList.remove('pressed'); A.pusher(true); }, 140); }
    A.pusher(false); SM.haptic(SM.HAPTIC.pusher);
    if (which === 'top') app.chronoStartStop(); else app.chronoSplitReset();
  }
  app.pressPusher = pressPusher;
  app.pressCrown = function () {
    const c = app.el.case.querySelector('#crown-g'); if (c) { c.classList.remove('pushed'); void c.getBoundingClientRect(); c.classList.add('pushed'); }
    A.crown(); SM.haptic(SM.HAPTIC.crown); app.nextFace(1);
  };

  app.timerStart = function () {
    if (timer.running) { timer.left = timer.remaining(); timer.running = false; }
    else { if (timer.left <= 0) timer.left = timer.dur; timer.endAt = Date.now() + timer.left; timer.running = true; }
    SM.emit('timer');
  };
  app.timerReset = function () { timer.running = false; timer.left = timer.dur; SM.emit('timer'); };
  app.timerSet = function (ms) { timer.dur = Math.max(1000, ms); timer.left = timer.dur; timer.running = false; store.set('timerDur', timer.dur); SM.emit('timer'); };

  app.focusStart = function () {
    if (focus.running) { focus.left = focus.remaining(); focus.running = false; }
    else { if (focus.left <= 0) focus.left = FOCUS_DUR[focus.mode]; focus.endAt = Date.now() + focus.left; focus.running = true; }
    SM.emit('focus');
  };
  app.focusMode = function (m) { focus.mode = m; focus.running = false; focus.left = FOCUS_DUR[m]; SM.emit('focus'); };
  app.focusReset = function () { focus.running = false; focus.left = FOCUS_DUR[focus.mode]; SM.emit('focus'); };
  app.FOCUS_DUR = FOCUS_DUR;
  function todayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function focusDone() {
    focus.running = false;
    if (focus.mode === 'focus') {
      const k = todayKey(new Date()); if (st.focusCount.date !== k) st.focusCount = { date: k, n: 0 };
      st.focusCount.n++; store.set('focusCount', st.focusCount); focus.cycle++;
      A.chime('break'); SM.toast('Focus session complete, Nick! Time for a ' + (focus.cycle % 4 === 0 ? 'long' : 'short') + ' break.', 4000);
      app.focusMode(focus.cycle % 4 === 0 ? 'long' : 'short');
    } else { A.chime('focus'); SM.toast('Break over. Back to saving the world!', 4000); app.focusMode('focus'); }
  }

  /* ---------------- alarms ---------------- */
  app.saveAlarms = () => store.set('alarms', st.alarms);
  let ringing = null;
  app.ring = function (title, label, alarm) {
    if (ringing) return;
    ringing = { alarm, n: 0 };
    const m = $('#modal');
    m.innerHTML = `<div class="modal-card ring"><div class="ring-shield">${SM.shieldSVG('classic')}</div><h2>${SM.esc(title)}</h2><p>${SM.esc(label || '')}</p><div class="big-time" data-live="clock"></div>
      <div class="row">${alarm ? '<button class="btn" data-act="snooze">Snooze 5 min</button>' : ''}<button class="btn primary" data-act="dismiss">Dismiss</button></div></div>`;
    m.hidden = false; document.body.classList.add('ringing'); SM.haptic(SM.HAPTIC.alarm);
    const loop = () => { if (!ringing || ringing.n++ > 12) return; const ms = A.fanfare() || 3400; ringing.t = setTimeout(loop, ms + 700); };
    loop();
  };
  app.dismiss = function (snooze) {
    if (!ringing) return; clearTimeout(ringing.t);
    if (snooze && ringing.alarm) { ringing.alarm.snoozeUntil = Date.now() + 5 * 60000; app.saveAlarms(); SM.toast('Snoozed 5 minutes'); }
    ringing = null; $('#modal').hidden = true; document.body.classList.remove('ringing'); SM.emit('alarms');
  };
  function checkAlarms(now) {
    const hm = pad(now.getHours()) + ':' + pad(now.getMinutes()), mk = todayKey(now) + hm;
    st.alarms.forEach(a => {
      if (a.snoozeUntil && Date.now() >= a.snoozeUntil) { a.snoozeUntil = 0; app.saveAlarms(); app.ring('Alarm (snoozed)', a.label, a); return; }
      if (!a.on || a.time !== hm || a.last === mk) return;
      if (a.days && a.days.length && !a.days.includes(now.getDay())) return;
      a.last = mk; if (!a.days || !a.days.length) a.on = false; app.saveAlarms();
      app.ring('Alarm · ' + a.time, a.label, a); SM.emit('alarms');
    });
  }
  function nextAlarm(now) {
    let best = null;
    st.alarms.forEach(a => {
      if (!a.on && !a.snoozeUntil) return;
      const [h, m] = a.time.split(':').map(Number);
      for (let d = 0; d < 8; d++) {
        const t = new Date(now); t.setDate(t.getDate() + d); t.setHours(h, m, 0, 0);
        if (t <= now) continue; if (a.days && a.days.length && !a.days.includes(t.getDay())) continue;
        if (!best || t < best.t) best = { t, a }; break;
      }
      if (a.snoozeUntil) { const t = new Date(a.snoozeUntil); if (!best || t < best.t) best = { t, a }; }
    });
    return best;
  }
  app.nextAlarm = nextAlarm;

  /* ---------------- light / pointer ---------------- */
  const light = { mx: -.45, my: -.55, x: -.45, y: -.55, last: 0, tilt: false, lastInput: performance.now() };
  app.light = light;
  function onPointer(e) { light.mx = clamp((e.clientX / innerWidth - .5) * 2, -1, 1); light.my = clamp((e.clientY / innerHeight - .5) * 2, -1, 1); poke(); }
  function poke() { light.lastInput = performance.now(); if (app.el.rig.classList.contains('idle')) app.el.rig.classList.remove('idle'); }
  app.poke = poke;
  function onTilt(e) {
    if (e.gamma == null) return; light.tilt = true;
    light.mx = clamp(e.gamma / 35, -1, 1); light.my = clamp((e.beta - 45) / 35, -1, 1);
  }
  app.enableTilt = function () {
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(r => { if (r === 'granted') SM.toast('Tilt lighting enabled'); else SM.toast('Tilt permission denied'); }).catch(() => SM.toast('Tilt not available'));
    } else SM.toast(DOE ? 'Tilt lighting is on: tilt your phone to move the glint' : 'Device orientation not supported here');
  };

  /* ---------------- 3D hologram (three.js, lazy-loaded on first use) ---------------- */
  let holoLoading = null;
  function loadHolo() {
    if (app.holo) return Promise.resolve(app.holo);
    if (!holoLoading) {
      SM.Q.hold(2500); /* module parse + shader compile: don't let the governor count it */
      holoLoading = import('./holo.mjs').then(mod => {
        const host = document.createElement('div');
        app.holo = mod.create({ host, onLost: () => { SM.toast('Hologram paused (graphics context lost)'); } });
        app.holo.setVariant(st.holoVariant); app.holo.setQuality(SM.Q.tier);
        app.holoInfo = { loadMs: Math.round(performance.now() - t0) };
        return app.holo;
      }).catch(err => { holoLoading = null; console.warn('Hologram unavailable', err); SM.toast('The 3D hologram needs WebGL and http(s) (it cannot load from file://).', 4200); throw err; });
      const t0 = performance.now();
    }
    return holoLoading;
  }
  app.loadHolo = loadHolo;
  function holoGeom() {
    const sr = app.el.stage.getBoundingClientRect(), wr = app.el.watch.getBoundingClientRect(), k = wr.width / 600;
    const lx = (wr.left + CX * k - sr.left) / sr.width, ly = (wr.top + CY * k - sr.top) / sr.height;
    const sy = Math.max(.25, ly - Math.min(.34, 250 * k / sr.height));
    return { lensPx: [lx, ly], shieldPx: [lx, sy], sizeFrac: Math.min(.7, (300 * k) / sr.width) };
  }
  app.openHolo = async function (mode) {
    mode = mode || 'power';
    let h; try { h = await loadHolo(); } catch (e) { return false; }
    if (mode === 'face' && !app.face.holo) return false;
    if (mode === 'power') {
      const ui = $('#holo-ui'); ui.hidden = false; document.body.classList.add('holo-on');
      h.show('power', $('#holo-host'), holoGeom());
    } else {
      let wrap = app.el.watch.querySelector('.ly-holo');
      if (!wrap) { wrap = document.createElement('div'); wrap.className = 'ly ly-holo'; app.el.watch.insertBefore(wrap, app.el.frost); }
      /* canvas spans x 5..95%, y 0..62% of the watch; lens sits on the dial centre (y = 50%) */
      h.show('face', wrap, { lensPx: [.5, .5 / .62], shieldPx: [.5, .30], sizeFrac: .36 });
      app.el.hit.querySelector('.dial-hit').setAttribute('pointer-events', 'all');
    }
    if (!app.holoSilent) { A.holo(); SM.haptic(SM.HAPTIC.holo); }
    SM.emit('holo', { open: true, mode });
    return true;
  };
  app.closeHolo = function () {
    if (!app.holo) return;
    const wasPower = app.holo.state.mode === 'power';
    app.holo.hide();
    $('#holo-ui').hidden = true; document.body.classList.remove('holo-on');
    const dh = app.el.hit.querySelector('.dial-hit'); if (dh) dh.setAttribute('pointer-events', 'none');
    const wrap = app.el.watch.querySelector('.ly-holo'); if (wrap) wrap.remove();
    /* still on the hologram face? keep projecting above the dial */
    if (wasPower && app.face.holo) app.openHolo('face');
    SM.emit('holo', { open: false });
  };
  app.toggleHolo = function () { if (app.holo && app.holo.state.mode === 'power') app.closeHolo(); else app.openHolo('power'); };
  app.setHoloVariant = function (v, silent) {
    st.holoVariant = v; store.set('holoVariant', v);
    if (app.holo) { app.holo.setVariant(v); if (!silent) { A.holo(true); SM.haptic(SM.HAPTIC.click); } }
    SM.emit('holoVariant', v);
  };
  SM.Q.onChange(t => { if (app.holo) app.holo.setQuality(t); if (app.bgObj && app.bgObj.resize) app.bgObj.resize(); SM.emit('quality', t); });

  /* ---------------- solar corona canvas ---------------- */
  let granule = null;
  function drawSolar(c, t) {
    const x = c.getContext('2d'), S = c.width, C = S / 2, R = S * .2;
    if (!granule) {
      granule = document.createElement('canvas'); granule.width = granule.height = 256; const g = granule.getContext('2d'), r = SM.rng(3);
      for (let i = 0; i < 1600; i++) { g.fillStyle = r() > .5 ? 'rgba(255,240,180,.16)' : 'rgba(160,40,0,.16)'; g.beginPath(); g.arc(r() * 256, r() * 256, 2 + r() * 6, 0, 6.283); g.fill(); }
    }
    const bg = x.createRadialGradient(C, C, R, C, C, C); bg.addColorStop(0, '#6a1a00'); bg.addColorStop(.35, '#2a0800'); bg.addColorStop(1, '#070100');
    x.globalCompositeOperation = 'source-over'; x.fillStyle = bg; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'lighter';
    const N = 140;
    for (let i = 0; i < N; i++) {
      const a = i / N * 6.283 + t * .03;
      const len = R * (1.35 + .35 * Math.sin(i * 1.7 + t * 1.1) + .25 * Math.sin(i * .37 - t * .7) + .18 * Math.sin(i * 5.3 + t * 2.1));
      const w = .03;
      const g = x.createLinearGradient(C + Math.cos(a) * R, C + Math.sin(a) * R, C + Math.cos(a) * (R + len), C + Math.sin(a) * (R + len));
      g.addColorStop(0, 'rgba(255,190,60,.34)'); g.addColorStop(.5, 'rgba(255,90,10,.12)'); g.addColorStop(1, 'rgba(255,40,0,0)');
      x.fillStyle = g; x.beginPath(); x.moveTo(C + Math.cos(a - w) * R, C + Math.sin(a - w) * R); x.lineTo(C + Math.cos(a) * (R + len), C + Math.sin(a) * (R + len)); x.lineTo(C + Math.cos(a + w) * R, C + Math.sin(a + w) * R); x.closePath(); x.fill();
    }
    for (let k = 0; k < 4; k++) {
      const a = k * 1.57 + t * .06 + Math.sin(t * .3 + k) * .2, h = R * (.5 + .25 * Math.sin(t * .9 + k * 2));
      x.strokeStyle = 'rgba(255,120,30,.5)'; x.lineWidth = 3;
      x.beginPath(); x.arc(C + Math.cos(a) * (R + h * .3), C + Math.sin(a) * (R + h * .3), h * .6, a + Math.PI * .95, a + Math.PI * 2.05, false); x.stroke();
    }
    x.globalCompositeOperation = 'source-over';
    const ph = x.createRadialGradient(C - R * .25, C - R * .25, R * .1, C, C, R * 1.02);
    ph.addColorStop(0, '#fffbe0'); ph.addColorStop(.5, '#ffd24a'); ph.addColorStop(.85, '#ff8a10'); ph.addColorStop(1, '#d04000');
    x.fillStyle = ph; x.beginPath(); x.arc(C, C, R, 0, 6.283); x.fill();
    x.save(); x.beginPath(); x.arc(C, C, R, 0, 6.283); x.clip(); x.translate(C, C); x.rotate(t * .05); x.globalAlpha = .9; x.drawImage(granule, -R * 1.5, -R * 1.5, R * 3, R * 3); x.restore();
    const halo = x.createRadialGradient(C, C, R * .95, C, C, R * 1.5); halo.addColorStop(0, 'rgba(255,220,120,.6)'); halo.addColorStop(1, 'rgba(255,120,0,0)');
    x.fillStyle = halo; x.beginPath(); x.arc(C, C, R * 1.5, 0, 6.283); x.fill();
  }

  /* ---------------- main loop ---------------- */
  /* only touch the DOM when the transform string actually changes */
  const setT = (e, v) => { if (e && e._t !== v) { e._t = v; e.setAttribute('transform', v); } };
  const rot = (e, a, dx, dy) => { if (e) setT(e, `${dx || dy ? `translate(${f(dx)} ${f(dy)}) ` : ''}rotate(${f(a)} ${CX} ${CY})`); };
  let lastBeat = -1, lastFrame = performance.now(), fpsAcc = [], lastLive = 0, prevLight = '';
  app.fps = 60;
  function frame(nowP) {
    requestAnimationFrame(frame);
    const dt = nowP - lastFrame; lastFrame = nowP;
    fpsAcc.push(dt); if (fpsAcc.length > 60) fpsAcc.shift();
    app.fps = 1000 / (fpsAcc.reduce((a, b) => a + b, 0) / fpsAcc.length);
    SM.Q.sample(dt, nowP);
    if (!SM.Q.gate(nowP)) return; /* Balanced / Battery tiers cap the visual rate */
    const QP = SM.Q.p(), w0 = performance.now();
    const t = nowP / 1000;
    const real = new Date(), now = st.speedOffset ? new Date(real.getTime() + st.speedOffset) : real;
    app.now = now;
    const ms = now.getMilliseconds(), s = now.getSeconds(), m = now.getMinutes(), h = now.getHours();

    /* timers */
    if (timer.running && timer.remaining() <= 0) { timer.running = false; timer.left = timer.dur; SM.emit('timer'); app.ring('Timer complete', 'Your ' + SM.fmtDur(timer.dur) + ' timer is done, Nick.'); }
    if (focus.running && focus.remaining() <= 0) { focusDone(); }
    if (chrono.hold !== null && chrono.running && nowP > chrono.holdUntil) chrono.hold = null;

    /* seconds by motion mode */
    let secA;
    if (st.speedOffset) secA = (s + ms / 1000) * 6;
    else if (st.motion === 'smooth') secA = (s + ms / 1000) * 6;
    else if (st.motion === 'quartz') { if (ms < 160) { const k = ms / 160 - 1, c1 = 2.2; secA = (s - 1 + 1 + (c1 + 1) * k * k * k + c1 * k * k) * 6; } else secA = s * 6; }
    else secA = (s + Math.floor(ms / (1000 / 6)) / 6) * 6;
    const minA = (m + (s + ms / 1000) / 60) * 6, hourA = ((h % 12) + minA / 360) * 30;

    /* ticks */
    if (!st.speedOffset && st.tickMode !== 'off' && !document.hidden) {
      const beat = st.tickMode === 'mech' ? Math.floor((s * 1000 + ms) / (1000 / 6)) : s;
      if (beat !== lastBeat && lastBeat !== -1) A.tick(st.tickMode === 'mech');
      lastBeat = beat;
    }

    /* light smoothing */
    const idle = nowP - light.lastInput > 15000 && !light.tilt;
    if (idle && !app.el.rig.classList.contains('idle') && !SM.reducedMotion()) app.el.rig.classList.add('idle');
    let tx = light.mx, ty = light.my;
    if (idle) { tx = Math.cos(t * .22) * .7; ty = -.4 + Math.sin(t * .31) * .4; }
    light.x += (tx - light.x) * .07; light.y += (ty - light.y) * .07;
    const lx = light.x, ly = light.y, lkey = f(lx * 100) + ',' + f(ly * 100);
    if (lkey !== prevLight && SM.Q.every('glass', QP.glassHz, nowP)) {
      prevLight = lkey;
      const gm = app.el.glass.querySelector('#gl-move'); if (gm) gm.setAttribute('transform', `translate(${f(lx * 16)} ${f(ly * 14)})`);
      if (app.el.brushPat) app.el.brushPat.setAttribute('patternTransform', `rotate(${f(lx * 38 + ly * 22)} 300 400)`);
      app.el.shadow.style.transform = `translate(${f(-lx * 16)}px, ${f(14 - ly * 12)}px)`;
      if (app.bgEl && !idle) SM.bgParallax(app.bgEl, lx, ly);
    }
    if (app.bgObj && app.bgObj.update && !document.hidden && !app.bgPaused && SM.Q.every('bg', Math.min(QP.bgHz, app.bgObj.maxHz || 120), nowP)) app.bgObj.update(t, lx, ly, idle);

    /* hands */
    const q = app.hq; if (q) {
      let hA = hourA, mA = minA, sA = secA;
      if (sweep) { const p = Math.min(1, (nowP - sweep.t0) / sweep.dur), e = SM.ease(p); hA = hourA * e; mA = minA * e; sA = secA * e; if (p >= 1) sweep = null; }
      const rev = app.face.reverse ? -1 : 1; hA *= rev; mA *= rev; sA *= rev;
      const sx = -lx * 3.2, sy = 3.2 - ly * 2.4;
      rot(q.hour, hA); rot(q.hourSh, hA, sx, sy); rot(q.hourSh2, hA, sx * 2, sy * 2);
      rot(q.min, mA); rot(q.minSh, mA, sx * 1.2, sy * 1.2); rot(q.minSh2, mA, sx * 2.4, sy * 2.4);
      rot(q.sec, sA); rot(q.secSh, sA, sx * 1.5, sy * 1.5);
      const ce = chrono.elapsed();
      if (q.chrono) { q.chrono.setAttribute('opacity', ce > 0 || chrono.running ? 1 : 0); rot(q.chrono, (ce / 1000 % 60) * 6); }
      if (q.split) { q.split.setAttribute('opacity', chrono.hold !== null ? 1 : 0); rot(q.split, ((chrono.hold || 0) / 1000 % 60) * 6); }
      q.subs.forEach(({ s: sd, g, sh }) => {
        let a = 0;
        switch (sd.type) {
          case 'sec': a = secA; break;
          case 'chr30': a = ((ce / 60000) % 30) / 30 * 360; break;
          case 'chr12': a = ((ce / 3600000) % 12) / 12 * 360; break;
          case 'pwr': a = -120 + 240 * (app.solar ? app.solar.charge / 100 : .7); break;
          case 'gauge': a = -110 + 220 * (.55 + .2 * Math.sin(t * .7) + .05 * Math.sin(t * 3.1)); break;
          case 'date': a = (now.getDate() - 1) / 31 * 360; break;
          case 'day': a = now.getDay() / 7 * 360; break;
          case '24h': a = (h + m / 60) / 24 * 360; break;
          case 'tide': a = (app.tide ? app.tide.phase : 0) * 360; break;
        }
        if (app.face.reverse) a = -a;
        if (sweep) a *= SM.ease(Math.min(1, (nowP - sweep.t0) / sweep.dur));
        const r = `rotate(${f(a)} ${sd.cx} ${sd.cy})`;
        setT(g, r); setT(sh, `translate(${f(sx * .6)} ${f(sy * .6)}) ${r}`);
      });
      /* progress arc: focus > timer */
      if (q.arc) {
        let frac = 0;
        if (focus.running || focus.left < FOCUS_DUR[focus.mode]) frac = focus.remaining() / FOCUS_DUR[focus.mode];
        else if (timer.running || timer.left < timer.dur) frac = timer.remaining() / timer.dur;
        q.arc.setAttribute('d', frac > 0 ? (frac > .999 ? SM.arcPath(CX, CY, 150.5, 0, 180) + ' ' + SM.arcPath(CX, CY, 150.5, 180, 359.9) : SM.arcPath(CX, CY, 150.5, 0, frac * 360)) : '');
      }
      /* super-speed ghosts */
      if (q.ghosts) {
        if (st.speedOffset && !q.ghosts.childElementCount) {
          let gs = ''; for (let i = 1; i <= 7; i++) gs += `<use href="#h-min" opacity="${f(.34 - i * .04)}" data-lag="${i}"/><use href="#h-hour" opacity="${f(.3 - i * .035)}" data-lagh="${i}"/>`;
          q.ghosts.innerHTML = gs;
        } else if (!st.speedOffset && q.ghosts.childElementCount) q.ghosts.innerHTML = '';
        if (st.speedOffset) { const vel = 22; q.ghosts.querySelectorAll('use').forEach(u => { const i = +(u.dataset.lag || u.dataset.lagh); u.setAttribute('transform', `rotate(${-i * (u.dataset.lag ? vel : vel / 12)} ${CX} ${CY})`); }); }
      }
    }
    /* digital + solar */
    if (app.face.update) app.face.update(app.el.dial, { now, fmt24: st.fmt24, chronoMs: chrono.elapsed(), timerLeft: timer.remaining(), focusLeft: focus.remaining(), alarmOn: st.alarms.some(a => a.on), digitalShow: chrono.running || chrono.elapsed() > 0 ? 'CHR' : timer.running ? 'TMR' : focus.running ? 'FOCUS' : 'TIME' });
    if (app.el.solar && !SM.reducedMotion() && SM.Q.every('solar', QP.bgHz, nowP)) drawSolar(app.el.solar, t);
    if (SM.powers.active.xray) SM.updateMovement(app.el.move, t);
    if (app.tbOn && !SM.reducedMotion()) SM.updateTourbillon(app.el.tourb, t, (s + ms / 1000) / 60);
    if (SM.cx) { if (app.hasEcg && SM.Q.every('ecg', 30, nowP)) SM.cx.live(nowP); else SM.cx.stepVitals(nowP); }
    SM.powers.update(nowP);
    if (SM.game && SM.game.running) SM.game.update(nowP);
    if (app.holo && app.holo.state.visible) app.holo.frame(nowP);
    app.workMs = (app.workMs || 0) * .95 + (performance.now() - w0) * .05;

    /* per-second work */
    if (s !== app.lastSecond) {
      app.lastSecond = s;
      updateBinds(now);
      if (!st.speedOffset) checkAlarms(real);
      if (m !== app.lastMinute) { app.lastMinute = m; minuteWork(real); }
      if (SM.cx) SM.cx.second(real);
      if (q && q.alarm) { const na = nextAlarm(real); q.alarm.setAttribute('opacity', na ? 1 : 0); if (na) rot(q.alarm, ((na.t.getHours() % 12) + na.t.getMinutes() / 60) * 30); }
    }
    if (nowP - lastLive > 90) { lastLive = nowP; SM.emit('live', now); }
  }
  function updateBinds(now) {
    const D = SM.DAYS[now.getDay()], M = SM.MONTHS[now.getMonth()];
    const wc = CITIES.find(c => c.name === st.world) || CITIES[10], wp = SM.cityTime(wc, now, st.fmt24);
    const vals = {
      date: now.getDate(), dayShort: D.slice(0, 3).toUpperCase(), monthDate: M.slice(0, 3).toUpperCase() + ' ' + now.getDate(),
      ampm: st.fmt24 ? '24H' : (now.getHours() >= 12 ? 'PM' : 'AM'),
      dateline: `METROPOLIS — ${D.toUpperCase()}, ${M.toUpperCase()} ${now.getDate()}, ${now.getFullYear()} — 25¢`,
      world2: `${wc.label} ${wp.hour}:${wp.minute}${wp.dayPeriod ? ' ' + wp.dayPeriod : ''}`
    };
    app.binds.forEach(e => { const k = e.dataset.bind; if (k && vals[k] !== undefined && e.textContent !== String(vals[k])) e.textContent = vals[k]; });
  }
  function minuteWork(now) {
    const mo = SM.astro.moon(now); app.moon = mo;
    app.moons.forEach(p => p.setAttribute('d', SM.moonPath(+p.dataset.cx, +p.dataset.cy, +p.dataset.r, mo.phase)));
    app.solar = SM.astro.solarCharge(now, st.loc.lat, st.loc.lon);
    app.solar.base = app.solar.charge; app.solar.charge = Math.min(100, app.solar.charge + app.solarBoost());
    if (SM.cx) { app.tide = SM.cx.tide(now); SM.cx.fetchWeather(); }
    /* new day: rebuild dials that print the date grid */
    if (app.dialDate !== undefined && now.getDate() !== app.dialDate) { app.dialDate = now.getDate(); if (app.subs.some(x => x.type === 'cal')) setFace(st.face, { noSweep: true, noGhost: true }); }
    SM.emit('minute', now);
  }
  app.refreshAstro = () => minuteWork(app.now || new Date());

  /* ---------------- input wiring ---------------- */
  function wireWatch() {
    const hit = app.el.hit;
    let drag = null;
    hit.addEventListener('pointerdown', e => {
      A.init(); poke();
      const t = e.target;
      if (t.classList.contains('crown-hit')) { app.pressCrown(); e.preventDefault(); }
      else if (t.classList.contains('pusher-hit')) { pressPusher(t.dataset.p); e.preventDefault(); }
      else if (t.classList.contains('bezel-hit')) { drag = { a: angleAt(e), acc: 0 }; t.setPointerCapture(e.pointerId); e.preventDefault(); }
      else if (t.classList.contains('dial-hit') && app.holo && app.holo.state.mode === 'face') { app.holo.pointerDown(e); holoDrag = true; e.preventDefault(); }
    });
    let holoDrag = false;
    hit.addEventListener('pointermove', e => {
      if (holoDrag && app.holo) { app.holo.pointerMove(e); return; }
      if (!drag) return; const a = angleAt(e); let d = a - drag.a; if (d > 180) d -= 360; if (d < -180) d += 360;
      drag.a = a; drag.acc += d; const steps = Math.trunc(drag.acc / 6);
      if (steps) { drag.acc -= steps * 6; app.turnBezel(steps); }
    });
    const end = e => { drag = null; if (holoDrag && app.holo) { app.holo.pointerUp(e); holoDrag = false; } };
    hit.addEventListener('pointerup', end); hit.addEventListener('pointercancel', end);
    hit.addEventListener('dblclick', e => { if (e.target.classList.contains('bezel-hit')) { st.bezel = 0; applyBezel(); store.set('bezel', 0); A.bezel(); SM.toast('Bezel zeroed'); } });
    hit.addEventListener('wheel', e => { if (e.target.classList.contains('bezel-hit')) { e.preventDefault(); app.turnBezel(e.deltaY > 0 ? 1 : -1); } }, { passive: false });
  }

  app.boot = function () {
    SM.Q.init();
    if (st.custom) SM.faceById('custom').configure(st.custom);
    SM.buildTextures();
    A.loadSettings();
    buildWatch();
    setFace(st.face, { noSweep: true });
    app.setBg(st.bg);
    wireWatch();
    SM.powers.init(app);
    addEventListener('pointermove', onPointer, { passive: true });
    /* always listen; iOS only starts delivering events once permission is granted via Settings > Tilt */
    addEventListener('deviceorientation', onTilt);
    addEventListener('pointerdown', () => { poke(); }, { passive: true });
    addEventListener('keydown', poke);
    minuteWork(new Date());
    const unlock = () => { A.init(); };
    addEventListener('pointerdown', unlock, { passive: true }); addEventListener('keydown', unlock);
    addEventListener('resize', () => { if (app.bgObj && app.bgObj.resize) app.bgObj.resize(); sizeStage(); if (app.holo && app.holo.state.mode === 'power') { Object.assign(app.holo.state, holoGeom()); app.holo.layout(); } });
    sizeStage();
    if (SM.ui) SM.ui.init(app);
    requestAnimationFrame(frame);
    app.ready = true;
    if (SM.cx) SM.cx.fromHash();
    /* full-resolution textures after first paint (cached in IndexedDB for next launch) */
    setTimeout(() => SM.upgradeTextures().then(log => { app.texLog = log; }), 900);
    SM.Q.onChange((t, old) => { if (SM.Q.P[t].texRes > SM.Q.P[old].texRes) SM.upgradeTextures(); });
    setTimeout(() => SM.cx && SM.cx.fetchWeather(), 1200);
    /* pause the scene + hologram work while the tab is hidden (rAF also stops on its own) */
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastFrame = performance.now(); SM.Q.hold(800); } });
  };
  function sizeStage() {
    const s = $('#stage'), r = s.getBoundingClientRect();
    const h = Math.max(260, Math.min(r.height * .96, r.width / .75 * .92));
    document.documentElement.style.setProperty('--wh', Math.round(h) + 'px');
    if (SM.powers.resize) SM.powers.resize();
  }
  app.sizeStage = sizeStage;
})(window.SM);
