/* Control deck, tabs, toolbar, keyboard, intro, export, PWA (v3: Builder, Hologram, Today, Presets, Quality) */
(function (SM) {
  'use strict';
  const { $, $$, f, pad, esc, store } = SM;
  const A = SM.audio;
  const U = SM.ui = {};
  let app, st;

  const I = (d, extra) => `<svg viewBox="0 0 24 24" class="ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra || ''}>${d}</svg>`;
  const ICON = {
    faces: I('<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>'),
    style: I('<path d="M8 2h8l-1 5H9z"/><path d="M9 17h6l1 5H8z"/><circle cx="12" cy="12" r="5"/>'),
    scenes: I('<path d="M3 20l6-9 4 6 3-4 5 7z"/><circle cx="17" cy="6" r="2"/>'),
    chrono: I('<circle cx="12" cy="13" r="8"/><path d="M12 13l3-3M10 2h4M19 5l1.5-1.5"/>'),
    timer: I('<path d="M6 2h12M6 22h12M7 2c0 6 10 6 10 10S7 16 7 22M17 2c0 6-10 6-10 10"/>'),
    alarms: I('<circle cx="12" cy="13" r="7"/><path d="M12 10v3l2 2M3 5l3-2M21 5l-3-2"/>'),
    world: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
    sky: I('<circle cx="9" cy="10" r="4"/><path d="M9 2v2M2 10h2M4 5l1.5 1.5M14 5l-1.5 1.5"/><path d="M20 15a5 5 0 1 1-6-6 4 4 0 0 0 6 6z"/>'),
    focus: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
    powers: I('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
    sound: I('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'),
    settings: I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
    dice: I('<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/>'),
    watch: I('<circle cx="12" cy="12" r="6"/><path d="M9 6l1-4h4l1 4M9 18l1 4h4l1-4M12 9v3h2"/>'),
    full: I('<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>'),
    camera: I('<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>'),
    mute: I('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
    help: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01"/>'),
    menu: I('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    builder: I('<circle cx="12" cy="12" r="8"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>'),
    holo: I('<path d="M5 3h14l-2 5H7z"/><path d="M7 8l5 13 5-13"/><path d="M9.5 13h5"/>'),
    today: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15.5" r="2.2"/>'),
    presets: I('<path d="M6 3h12v18l-6-4-6 4z"/><path d="M9 8h6M9 11h4"/>')
  };
  U.ICON = ICON;

  const TABS = [
    ['faces', 'Faces'], ['builder', 'Builder'], ['style', 'Strap & Case'], ['scenes', 'Scenes'], ['holo', 'Hologram'], ['today', 'Today'], ['powers', 'Powers'], ['chrono', 'Chrono'],
    ['timer', 'Timer'], ['alarms', 'Alarms'], ['world', 'World'], ['sky', 'Sky & Power'], ['focus', 'Focus'], ['presets', 'Presets'], ['sound', 'Sound'], ['settings', 'Settings']
  ];
  const SHORTCUTS = [
    ['← / →', 'Previous / next face'], ['B', 'Next background scene'], ['S', 'Next strap material'], ['C', 'Next strap colour'],
    ['Space', 'Chronograph start / stop'], ['L', 'Split (lap)'], ['R', 'Reset chronograph'], ['[ / ]', 'Turn bezel'],
    ['T', 'Timer start / pause'], ['F', 'Focus start / pause'], ['H', 'Heat Vision'], ['Y', 'Fly'], ['X', 'X-Ray vision'], ['Z', 'Freeze Breath'],
    ['Q', 'Super Speed'], ['G', 'Lume check (glow)'], ['M', 'Mute / unmute'], ['W', 'Watch-only mode'], ['Enter', 'Fullscreen'],
    ['O', '3D hologram on / off'], ['K', 'Next hologram colour'], ['U', 'Tourbillon on / off'], ['J', 'Solar Recharge game'],
    ['P', 'Export PNG'], ['D', 'Surprise me (randomize)'], ['1–9, 0', 'Jump to tab'], ['?', 'Shortcut help'], ['Esc', 'Close / exit']
  ];

  /* ---------------- thumbnails ---------------- */
  const thumbCache = {};
  function thumb(face) {
    if (thumbCache[face.id] && !face.builder) return thumbCache[face.id];
    const d = SM.dialMarkup(face);
    let hands = SM.handsMarkup(face, d.subs);
    const R = (id, a) => { hands = hands.replace(`<g id="${id}"`, `<g id="${id}" transform="rotate(${a} 300 400)"`); };
    ['h-hour', 'h-hour-sh', 'h-hour-sh2'].forEach(i => R(i, 305)); ['h-min', 'h-min-sh', 'h-min-sh2'].forEach(i => R(i, 60)); ['h-sec', 'h-sec-sh'].forEach(i => R(i, 200));
    const html = SM.scopeIds(`<svg class="thumb" viewBox="136 236 328 328" aria-hidden="true"><defs><linearGradient id="tr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#8a929c"/><stop offset="1" stop-color="#2a2f36"/></linearGradient></defs>
      <circle cx="300" cy="400" r="163" fill="url(#tr)"/>${d.markup}${d.overlay}${hands}<circle cx="300" cy="400" r="158" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/></svg>`, 't' + face.id);
    return thumbCache[face.id] = html;
  }

  /* ---------------- tab renderers ---------------- */
  const opt = (v, cur, label) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(label)}</option>`;
  const R = {};
  R.faces = () => `<h3>Watch faces <small>${SM.FACES.length} designs · click the crown to cycle</small></h3>
    <div class="grid faces">${SM.FACES.map(fc => `<button class="card face-card${fc.id === st.face ? ' on' : ''}" data-act="face" data-id="${fc.id}" title="${esc(fc.desc)}">${thumb(fc)}<b>${esc(fc.name)}</b><small>${esc(fc.desc)}</small></button>`).join('')}</div>`;
  R.style = () => {
    const sw = { leather: `url(${SM.tex.leather})`, bracelet: 'linear-gradient(90deg,#6b737d,#f4f6f8 30%,#9aa3ad 50%,#f4f6f8 70%,#6b737d)', rubber: 'repeating-linear-gradient(0deg,#222 0 4px,#111 4px 6px)', suit: `url(${SM.tex.suit.base})`, cape: 'linear-gradient(90deg,#6a0710,#d01a28,#7a0a14,#c01424)' };
    return `<h3>Strap material</h3><div class="grid straps">${Object.keys(SM.STRAPS).map(k => `<button class="card strap-card${k === st.strap ? ' on' : ''}" data-act="strap" data-id="${k}"><span class="swatch" style="background:${sw[k]};background-size:${k === 'suit' ? '12px 14px' : 'auto'}"></span><b>${SM.STRAPS[k].name}</b></button>`).join('')}</div>
      <h3>Strap colour <small>${st.strap === 'bracelet' ? 'bracelet follows the case metal' : st.strap === 'suit' || st.strap === 'cape' ? 'tints the fabric' : ''}</small></h3>
      <div class="dots">${SM.STRAP_COLORS.map(c => `<button class="dot${c.id === st.strapColor ? ' on' : ''}" data-act="strapcolor" data-id="${c.id}" title="${c.n}" style="--c:${c.c}"><span>${c.n}</span></button>`).join('')}</div>
      <h3>Case finish</h3><div class="grid finishes"><button class="card fin-card${st.finish === 'auto' ? ' on' : ''}" data-act="finish" data-id="auto"><span class="metal" style="background:conic-gradient(#cba04a,#eef3fa,#c98066,#30343a,#5b85bf,#cba04a)"></span><b>Auto (match face)</b></button>
      ${Object.keys(SM.FINISHES).map(k => { const p = SM.FINISHES[k]; return `<button class="card fin-card${st.finish === k ? ' on' : ''}" data-act="finish" data-id="${k}"><span class="metal" style="background:linear-gradient(135deg,${p.hi},${p.mid} 40%,${p.dark} 60%,${p.lite})"></span><b>${p.name}</b></button>`; }).join('')}</div>`;
  };
  R.scenes = () => `<h3>Background scenes <small>animated · parallax · move your mouse</small></h3><div class="grid scenes">${SM.BACKGROUNDS.map(b => `<button class="card scene-card${b.id === st.bg ? ' on' : ''}" data-act="bg" data-id="${b.id}"><span class="scene-prev" style="background:${b.preview}"></span><b>${b.name}</b></button>`).join('')}</div>`;
  R.chrono = () => `<h3>Chronograph <small>rattrapante split-seconds</small></h3>
    <div class="readout big" data-live="chrono">00:00.00</div>
    <div class="row"><button class="btn primary" data-act="chrono-ss" data-live="chronoBtn">Start</button><button class="btn" data-act="chrono-sr" data-live="chronoBtn2">Reset</button></div>
    <p class="hint">Or press the pushers on the case: <b>top</b> = start/stop, <b>bottom</b> = split while running / reset when stopped. The gold split hand freezes at each split.</p>
    <table class="splits"><thead><tr><th>#</th><th>Lap</th><th>Total</th></tr></thead><tbody>${app.chrono.splits.slice().reverse().map(s => `<tr><td>${s.n}</td><td>${SM.fmtDur(s.lap, true)}</td><td>${SM.fmtDur(s.total, true)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">No splits yet</td></tr>'}</tbody></table>`;
  R.timer = () => `<h3>Countdown timer <small>progress ring shows on the dial</small></h3>
    <div class="readout big" data-live="timer">05:00</div>
    <div class="row wrap">${[[1, '1 min'], [3, '3 min'], [5, '5 min'], [10, '10 min'], [15, '15 min'], [30, '30 min'], [60, '1 hour']].map(([m, l]) => `<button class="chip" data-act="timer-preset" data-ms="${m * 60000}">${l}</button>`).join('')}</div>
    <div class="row"><label class="field">Min <input type="number" id="t-min" min="0" max="999" value="${Math.floor(app.timer.dur / 60000)}"></label><label class="field">Sec <input type="number" id="t-sec" min="0" max="59" value="${Math.floor(app.timer.dur / 1000) % 60}"></label><button class="btn" data-act="timer-set">Set</button></div>
    <div class="row"><button class="btn primary" data-act="timer-ss" data-live="timerBtn">Start</button><button class="btn" data-act="timer-reset">Reset</button></div>`;
  R.alarms = () => {
    const D = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return `<h3>Alarms <small>heroic brass fanfare · snooze 5 min</small></h3>
    <div class="alarm-form"><input type="time" id="al-time" value="07:30" aria-label="Alarm time"><input type="text" id="al-label" placeholder="Label (e.g. Daily Planet deadline)" maxlength="40" aria-label="Alarm label">
      <div class="days">${D.map((d, i) => `<label><input type="checkbox" value="${i}" class="al-day"><span>${d}</span></label>`).join('')}</div>
      <button class="btn primary" data-act="alarm-add">Add alarm</button></div>
    <p class="hint" data-live="nextAlarm"></p>
    <ul class="alarm-list">${st.alarms.map(a => `<li class="${a.on ? 'on' : ''}"><label class="switch"><input type="checkbox" data-act="alarm-toggle" data-id="${a.id}"${a.on ? ' checked' : ''}><i></i></label>
      <div><b>${a.time}</b><span>${esc(a.label || 'Alarm')}</span><small>${a.days && a.days.length ? (a.days.length === 7 ? 'Every day' : a.days.map(d => SM.DAYS[d].slice(0, 3)).join(' ')) : 'Once'}${a.snoozeUntil ? ' · snoozed' : ''}</small></div>
      <button class="icon-btn" data-act="alarm-del" data-id="${a.id}" title="Delete alarm">✕</button></li>`).join('') || '<li class="muted">No alarms</li>'}</ul>
    <button class="btn" data-act="alarm-test">Preview alarm</button>`;
  };
  R.world = () => `<h3>World time <small>day/night map · tap a city to show it on the dial</small></h3>
    <canvas id="worldmap" width="720" height="360"></canvas>
    <ul class="cities">${app.CITIES.map((c, i) => `<li class="${c.name === st.world ? 'on' : ''}" data-act="city" data-i="${i}"><b>${esc(c.name)}${c.home ? ' <em>home</em>' : ''}</b><span data-live="city" data-i="${i}"></span></li>`).join('')}</ul>`;
  R.sky = () => `<h3>Sky &amp; power <small>${esc(st.loc.name)} · ${f(st.loc.lat)}°, ${f(st.loc.lon)}°</small></h3>
    <div class="row"><select id="loc-sel" aria-label="Location">${app.CITIES.map((c, i) => opt(i, app.CITIES.findIndex(x => x.name === st.loc.name), c.name)).join('')}${app.CITIES.some(c => c.name === st.loc.name) ? '' : opt(-1, -1, st.loc.name)}</select><button class="btn" data-act="geo">Use my location</button></div>
    <div class="sky-grid" data-live="sky"></div>`;
  R.focus = () => `<h3>Focus mode <small>Pomodoro 25 · 5 · 15</small></h3>
    <div class="seg-ctl">${[['focus', 'Focus 25'], ['short', 'Short break 5'], ['long', 'Long break 15']].map(([m, l]) => `<button class="${app.focus.mode === m ? 'on' : ''}" data-act="focus-mode" data-m="${m}">${l}</button>`).join('')}</div>
    <div class="focus-ring"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="10"/><path data-live="focusArc" fill="none" stroke="url(#fg)" stroke-width="10" stroke-linecap="round"/><defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd21f"/><stop offset="1" stop-color="#e3202f"/></linearGradient></defs></svg><div><div class="readout" data-live="focus">25:00</div><small data-live="focusMode"></small></div></div>
    <div class="row"><button class="btn primary" data-act="focus-ss" data-live="focusBtn">Start</button><button class="btn" data-act="focus-reset">Reset</button></div>
    <p class="hint">Sessions completed today: <b data-live="focusCount">0</b>. Every 4th break is a long one.</p>`;
  R.powers = () => `<h3>Super powers <small>each one has its own synthesized sound</small></h3><div class="grid powers">${[
    ['heat', 'Heat Vision', 'Twin beams sear the crystal, sparks and a red-hot glow', 'H'], ['fly', 'Fly', 'Up, up and away, through the clouds', 'Y'],
    ['xray', 'X-Ray Vision', 'See the Krypton Cal. S-38 movement ticking beneath the dial', 'X'], ['freeze', 'Freeze Breath', 'Frost crystals grow across the sapphire, then melt', 'Z'],
    ['speed', 'Super Speed', 'Twelve hours in two seconds, with motion-blurred hands', 'Q'], ['lume', 'Lume Check', 'Lights out: glowing Super-LumiNova', 'G']
  ].map(([k, n, d, key]) => `<button class="card power-card p-${k}${SM.powers.active[k] ? ' on' : ''}" data-act="power" data-id="${k}"><b>${n}</b><small>${d}</small><kbd>${key}</kbd></button>`).join('')}
    <button class="card power-card p-holo${app.holo && app.holo.state.mode === 'power' ? ' on' : ''}" data-act="holo-toggle"><b>3D Hologram</b><small>Project a spinning, extruded S shield from the dial</small><kbd>O</kbd></button>
    <button class="card power-card p-tourb${st.tourbillon ? ' on' : ''}" data-act="tourbillon"><b>Tourbillon</b><small>Open a flying tourbillon at 6 o'clock on any face</small><kbd>U</kbd></button>
    <button class="card power-card p-game${SM.game.running ? ' on' : ''}" data-act="game-start"><b>Solar Recharge</b><small>30-second minigame: catch sunlight, dodge Kryptonite${SM.game.best ? ' · best ' + SM.game.best : ''}</small><kbd>J</kbd></button></div>`;
  R.sound = () => {
    const cats = [['tick', 'Ticking'], ['mech', 'Crown, pushers, bezel'], ['ui', 'Interface hover/click'], ['alarm', 'Alarm fanfare & chimes'], ['powers', 'Super-power effects'], ['intro', 'Intro whoosh']];
    return `<h3>Sound <small>everything is synthesized live with WebAudio</small></h3>
    <label class="range">Master volume <input type="range" id="vol" min="0" max="1" step=".01" value="${A.volume}"><output>${Math.round(A.volume * 100)}%</output></label>
    <label class="check"><input type="checkbox" id="mute"${A.muted ? ' checked' : ''}> Mute all</label>
    <label class="field wide">Ticking <select id="tickmode">${opt('off', st.tickMode, 'Off')}${opt('ticktock', st.tickMode, 'Tick-tock (1 beat/s)')}${opt('mech', st.tickMode, 'Mechanical (6 beats/s, 21,600 vph)')}</select></label>
    <label class="range">Tick-tock volume <input type="range" id="tickvol" min="0" max="1" step=".01" value="${A.tickVol}"><output>${Math.round(A.tickVol * 100)}%</output></label>
    <h4>Sound groups</h4><div class="checks">${cats.map(([k, l]) => `<label class="check"><input type="checkbox" class="cat" value="${k}"${A.cats[k] ? ' checked' : ''}> ${l}</label>`).join('')}</div>
    <h4>Test sounds</h4><div class="row wrap">${['tick', 'crown', 'pusher', 'bezel', 'click', 'fanfare', 'chime', 'whoosh', 'heat', 'freeze', 'xray', 'speed', 'lume', 'intro'].map(s => `<button class="chip" data-act="snd" data-id="${s}">${s}</button>`).join('')}</div>`;
  };
  R.settings = () => `<h3>Settings</h3>
    <h4>Graphics quality</h4><label class="field wide">Quality <select id="quality">${opt('auto', SM.Q.mode, 'Auto (adapts to frame rate)')}${opt('high', SM.Q.mode, 'High (always full detail)')}${opt('battery', SM.Q.mode, 'Battery Saver (30 fps, lighter effects)')}</select></label>
    <div class="tile wide stats" data-live="qstats"></div>
    <label class="check"><input type="checkbox" id="haptics"${store.get('haptics', true) ? ' checked' : ''}> Haptic feedback ${SM.cx.hapticsSupported ? '' : '<em class="muted">(not supported by this browser; iPhone Safari has no vibration API)</em>'}</label>
    <label class="field wide">Temperature <select id="units">${opt('f', SM.cx.units(), '°F')}${opt('c', SM.cx.units(), '°C')}</select></label>
    <label class="check"><input type="checkbox" id="fmt24"${st.fmt24 ? ' checked' : ''}> 24-hour time</label>
    <label class="field wide">Seconds hand motion <select id="motion">${opt('mech', st.motion, 'Mechanical sweep (6 beats/s)')}${opt('smooth', st.motion, 'Smooth glide')}${opt('quartz', st.motion, 'Quartz tick with bounce')}</select></label>
    <label class="check"><input type="checkbox" id="intro"${st.intro ? ' checked' : ''}> Play shield intro on launch</label>
    <label class="check"><input type="checkbox" id="rmotion"${SM.reducedMotion() ? ' checked' : ''}> Reduce motion (calmer backgrounds, no idle float)</label>
    <div class="row wrap"><button class="btn" data-act="motion">Enable motion &amp; tilt (iPhone)</button><button class="btn" data-act="install" id="install-btn"${U.installEvt ? '' : ' hidden'}>Install app</button><button class="btn" data-act="replay-intro">Replay intro</button></div>
    <h4>Keyboard shortcuts</h4><table class="keys">${SHORTCUTS.map(([k, d]) => `<tr><td><kbd>${k}</kbd></td><td>${d}</td></tr>`).join('')}</table>
    <p class="hint">Settings are saved in this browser. Works offline once loaded (installable PWA).</p>
    <button class="btn danger" data-act="reset-all">Reset everything</button>`;

  /* ---------- v3 tabs ---------- */
  const chipRow = (k, list, cur) => `<div class="row wrap chips" role="group">${list.map(([v, l]) => `<button class="chip${String(v) === String(cur) ? ' on' : ''}" data-act="b-set" data-k="${k}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;
  R.builder = () => {
    const B = SM.BUILDER, c = Object.assign({}, SM.CUSTOM_DEFAULT, st.custom || {}), sel = (k, list) => `<select data-bk="${k}" aria-label="${k}">${list.map(([v, l]) => opt(v, c[k], l)).join('')}</select>`;
    return `<h3>Face Builder <small>design your own dial · saved automatically</small></h3>
    <div class="builder-top"><div class="b-prev" data-live="bprev">${thumb(SM.faceById('custom'))}</div>
      <div class="b-side"><label class="field wide">Name on dial <input type="text" data-bk="name" maxlength="22" value="${esc(c.name)}"></label>
      <button class="btn primary" data-act="wear-custom">${st.face === 'custom' ? 'Wearing it ✓' : 'Wear this face'}</button><button class="btn" data-act="b-random">Randomize</button></div></div>
    <h4>Dial colour</h4><div class="dots">${B.dials.map(d => `<button class="dot${d === c.dial ? ' on' : ''}" data-act="b-set" data-k="dial" data-v="${d}" style="--c:${d}" title="${d}"><span>${d}</span></button>`).join('')}<label class="dot pick" title="Custom colour" style="--c:${c.dial}"><input type="color" data-bk="dial" value="${c.dial}" aria-label="Custom dial colour"></label></div>
    <h4>Dial finish</h4>${chipRow('tex', B.tex, c.tex)}
    <h4>Hands</h4>${chipRow('hands', B.hands, c.hands)}${chipRow('metal', B.metal, c.metal)}
    <h4>Hour markers</h4>${chipRow('idx', B.idx, c.idx)}
    <h4>Shield style</h4><div class="shield-pick">${['none'].concat(Object.keys(SM.SHIELD_STYLES)).map(k => `<button class="sp${k === c.shield ? ' on' : ''}" data-act="b-set" data-k="shield" data-v="${k}" title="${k}">${k === 'none' ? '<span>None</span>' : SM.shieldSVG(k)}</button>`).join('')}</div>
    <h4>Complications</h4><div class="b-grid"><label class="field">At 9 ${sel('left', B.comps)}</label><label class="field">At 3 ${sel('right', B.comps)}</label><label class="field">At 6 ${sel('bottom', B.comps)}</label></div>
    <h4>Bezel &amp; accents</h4><div class="b-grid"><label class="field">Bezel ${sel('bezel', B.bezel)}</label><label class="field">Bezel colour <input type="color" data-bk="bezelColor" value="${c.bezelColor}"></label>
      <label class="field">Seconds hand <input type="color" data-bk="sec" value="${c.sec}"></label><label class="field">Lume <input type="color" data-bk="lume" value="${c.lume}"></label>
      <label class="field">Case ${sel('finish', Object.keys(SM.FINISHES).map(k => [k, SM.FINISHES[k].name]))}</label></div>
    <p class="hint">Tip: save the result under <b>Presets</b> and share it as a link.</p>`;
  };
  R.holo = () => {
    const h = app.holo, on = h && h.state.mode === 'power', V = { classic: ['Classic 3D', 'linear-gradient(135deg,#c8102e,#ffd21f)'], cyan: ['Cyan hologram', 'radial-gradient(#bff6ff,#1fb8e0 60%,#03314a)'], kryptonite: ['Kryptonite', 'radial-gradient(#d0ffd8,#39ff6a 55%,#063a16)'], gold: ['Solid gold', 'linear-gradient(135deg,#fff4c4,#e1b24c 45%,#7b5314)'] };
    return `<h3>3D Hologram <small>extruded S shield · WebGL · drag, pinch, tilt</small></h3>
    <div class="row"><button class="btn primary big-btn" data-act="holo-toggle">${on ? 'Deactivate hologram' : 'Activate hologram'}</button></div>
    <h4>Projection colour</h4><div class="grid holo-vars">${Object.keys(V).map(k => `<button class="card hv-card${st.holoVariant === k ? ' on' : ''}" data-act="holo-variant" data-id="${k}"><span class="hv-sw" style="background:${V[k][1]}"></span><b>${V[k][0]}</b></button>`).join('')}</div>
    <div class="row wrap"><button class="btn" data-act="face" data-id="hologram">Wear the Hologram Command face</button><button class="btn" data-act="motion">Enable tilt &amp; motion (iPhone)</button></div>
    <label class="range">Zoom <input type="range" id="holo-zoom" min=".55" max="2.2" step=".01" value="${h ? h.state.zoom : 1}"><output>${Math.round((h ? h.state.zoom : 1) * 100)}%</output></label>
    <div class="tile wide stats" data-live="holoStats">${h ? '' : 'three.js loads the first time you activate the hologram (≈160 KB gzipped), and its render loop only runs while it is on screen.'}</div>
    <p class="hint">Geometry is built from the same vector S shield as the dial, extruded 3D with a bevel. Cyan and Kryptonite use a holographic shader (Fresnel glow, scanlines, flicker and glitch); Classic and Gold are solid metal with real reflections.</p>`;
  };
  R.today = () => {
    const W = SM.cx.weather, info = W.temp !== undefined ? SM.cx.wxInfo(W.code) : null, now = app.now || new Date(), T = app.tide || SM.cx.tide(now), R2 = SM.cx.rings(), M = SM.cx.monthMatrix(now), u = SM.cx.units();
    const ring = (v, r, c) => `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${c}" stroke-opacity=".18" stroke-width="10"/><path data-live="ring" data-r="${r}" d="${v > .004 ? SM.arcPath(60, 60, r, 0, Math.min(.999, v) * 360) : ''}" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>`;
    const tt = d => d ? SM.fmtClock(d.t, st.fmt24) : '—';
    return `<h3>Today <small>${SM.DAYS[now.getDay()]}, ${SM.MONTHS[now.getMonth()]} ${now.getDate()}</small></h3>
    <blockquote class="quote">“${esc(SM.cx.quote(now))}”<small>Daily Superman thought (original)</small></blockquote>
    <div class="today-grid">
      <div class="tile wx"><small>Weather · ${esc(st.loc.name)}</small>${info ? `<div class="wx-row"><svg viewBox="-12 -12 24 26" class="wx-ic">${SM.cx.wxGlyph(info.icon, W.isDay)}</svg><b class="wx-t">${SM.cx.temp(W.temp)}${u.toUpperCase()}</b></div><span>${info.label} · H ${SM.cx.temp(W.hi)} L ${SM.cx.temp(W.lo)}</span><span>Feels ${SM.cx.temp(W.feels)} · ${Math.round(W.hum)}% humidity · wind ${Math.round(W.wind)} mph${W.pop != null ? ' · ' + W.pop + '% rain' : ''}</span>` : `<b>${W.status === 'loading' ? 'Loading…' : 'No weather yet'}</b>`}
        <span class="muted">${esc(W.msg || (W.t ? 'Updated ' + SM.fmtClock(new Date(W.t), st.fmt24) + ' · Open-Meteo' : 'Open-Meteo, no key needed'))}</span>
        <div class="row"><button class="chip${u === 'f' ? ' on' : ''}" data-act="units" data-id="f">°F</button><button class="chip${u === 'c' ? ' on' : ''}" data-act="units" data-id="c">°C</button><button class="chip" data-act="wx-refresh">Refresh</button></div></div>
      <div class="tile rings-tile"><small>Activity rings</small><svg viewBox="0 0 120 120" class="rings-big">${ring(R2.move, 52, '#ff3b50')}${ring(R2.solar, 40, '#ffd34a')}${ring(R2.focus, 28, '#3fe0ff')}</svg>
        <span><b style="color:#ff6a7a" data-live="steps">${R2.steps}</b> / ${SM.cx.activity.goal} steps${SM.cx.activity.live ? '' : ' <em class="muted">(motion sensor off)</em>'}</span><span><b style="color:#ffd34a">${Math.round(R2.solar * 100)}%</b> solar · <b style="color:#3fe0ff">${R2.fc}</b>/4 focus</span>
        <div class="row"><button class="chip" data-act="motion">Enable step counter</button><label class="field mini">Goal <input type="number" id="step-goal" min="500" max="50000" step="500" value="${SM.cx.activity.goal}"></label></div></div>
      <div class="tile tide-tile"><small>Metropolis Harbor tide (model)</small><div class="tide-bar"><i style="height:${Math.round(T.level * 100)}%"></i><em>${T.ft.toFixed(1)} ft</em></div>
        <span><b>${T.rising ? 'Rising ↑' : 'Falling ↓'}</b> · ${T.kind}</span><span>Next high ${tt(T.nextHigh)} · next low ${tt(T.nextLow)}</span><span class="muted">Harmonic model (M2 + S2 + N2 + K1), not for navigation.</span></div>
      <div class="tile vit-tile"><small>Kryptonian vitals</small><svg viewBox="0 0 200 70" class="ecg"><path data-live="ecg" d="" fill="none" stroke="#ff3b50" stroke-width="1.6"/></svg><span><b data-live="bpm">52</b> BPM · rises with powers, games and alarms</span></div>
      <div class="tile wide cal-tile"><small>${SM.MONTHS[M.m]} ${M.y}</small><div class="cal">${'SMTWTFS'.split('').map(d => `<b>${d}</b>`).join('')}${M.cells.map(d => `<span class="${d === M.today ? 'today' : ''}">${d || ''}</span>`).join('')}</div></div>
    </div>`;
  };
  R.presets = () => {
    const saved = SM.cx.list(), row = (p, i, src) => `<li><button class="card preset" data-act="preset-load" data-src="${src}" data-i="${i}"><b>${esc(p.name)}</b><small>${esc(SM.faceById(p.face).name)} · ${esc(SM.bgById(p.bg || st.bg).name)} · ${esc((SM.STRAPS[p.strap] || {}).name || '')}</small></button>${src === 'saved' ? `<button class="icon-btn" data-act="preset-del" data-i="${i}" title="Delete preset" aria-label="Delete ${esc(p.name)}">✕</button>` : ''}</li>`;
    return `<h3>Theme presets <small>save · load · share as a link</small></h3>
    <div class="row"><input type="text" id="preset-name" maxlength="30" placeholder="Name this look" value="${esc(app.face.name)} + ${esc(SM.bgById(st.bg).name)}" aria-label="Preset name"><button class="btn primary" data-act="preset-save">Save</button></div>
    <div class="row"><button class="btn" data-act="preset-share">Share current look (copy link)</button></div>
    <input type="text" id="share-url" readonly class="share-url" value="" placeholder="Share link appears here" aria-label="Share link">
    <h4>My presets</h4><ul class="preset-list">${saved.map((p, i) => row(p, i, 'saved')).join('') || '<li class="muted">Nothing saved yet.</li>'}</ul>
    <h4>Built-in looks</h4><ul class="preset-list">${SM.cx.BUILTIN_PRESETS.map((p, i) => row(p, i, 'builtin')).join('')}</ul>
    <p class="hint">A share link stores the look in the URL after <code>#preset=</code>, so it works on GitHub Pages with no server. Opening it applies the look instantly.</p>`;
  };

  U.show = function (tab) {
    if (!R[tab]) tab = 'faces';
    U.tab = tab; store.set('tab', tab);
    $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const body = $('#tab-body'); body.innerHTML = R[tab](); body.scrollTop = 0; body.dataset.tab = tab;
    if (tab === 'world') drawMap();
    if (tab === 'sky') renderSky();
    if (tab === 'alarms') { const n = new Date(Date.now() + 30 * 60000); const t = $('#al-time'); if (t) t.value = pad(n.getHours()) + ':' + pad(n.getMinutes()); }
    U.live(app.now || new Date());
  };
  const rerender = tabs => { if (tabs.includes(U.tab)) { const sc = $('#tab-body').scrollTop; U.show(U.tab); $('#tab-body').scrollTop = sc; } };

  function drawMap() {
    const c = $('#worldmap'); if (!c) return;
    SM.drawWorldMap(c, app.now || new Date(), app.CITIES.map(x => ({ name: x.name, lat: x.lat, lon: x.lon, label: x.label })), st.world);
  }
  function fmtT(d) { return d ? SM.fmtClock(d, st.fmt24) : '—'; }
  function renderSky() {
    const box = $('[data-live="sky"]'); if (!box) return;
    const now = app.now || new Date(), L = st.loc, sun = SM.astro.sunTimes(now, L.lat, L.lon), mo = SM.astro.moon(now), sol = SM.astro.solarCharge(now, L.lat, L.lon);
    const len = sun.length ? `${Math.floor(sun.length / 3600000)}h ${pad(Math.floor(sun.length / 60000) % 60)}m` : (sun.polar === 'day' ? 'Midnight sun' : 'Polar night');
    const moonSvg = `<svg viewBox="0 0 100 100" class="moon-big"><defs><radialGradient id="mb" cx=".4" cy=".35"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#d8cfa8"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="#1b2234"/><path d="${SM.moonPath(50, 50, 40, mo.phase)}" fill="url(#mb)"/><circle cx="38" cy="40" r="6" fill="#000" opacity=".07"/><circle cx="60" cy="62" r="8" fill="#000" opacity=".06"/><circle cx="58" cy="34" r="3.5" fill="#000" opacity=".07"/></svg>`;
    const bat = U.battery ? `${Math.round(U.battery.level * 100)}%${U.battery.charging ? ' · charging' : ''}` : 'Not reported by this browser';
    box.innerHTML = `
      <div class="tile"><small>Sunrise</small><b>${fmtT(sun.rise)}</b></div><div class="tile"><small>Sunset</small><b>${fmtT(sun.set)}</b></div>
      <div class="tile"><small>Solar noon</small><b>${fmtT(sun.noon)}</b></div><div class="tile"><small>Day length</small><b>${len}</b></div>
      <div class="tile"><small>Sun altitude now</small><b>${f(sol.alt)}°</b></div><div class="tile"><small>Sun input</small><b>${Math.round(sol.input * 100)}%</b></div>
      <div class="tile wide moon">${moonSvg}<div><small>Moon / Krypton phase</small><b>${mo.name}</b><span>${Math.round(mo.illum * 100)}% lit · ${f(mo.age)} days old</span><span>Next full: ${mo.nextFull.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · Next new: ${mo.nextNew.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div></div>
      <div class="tile wide"><small>Yellow-sun solar reserve (drives the power subdial)</small><div class="meter"><i style="width:${Math.round(sol.charge)}%"></i></div><span>${Math.round(sol.charge)}% ${sol.alt > 0 ? '· charging from sunlight ☀' : '· night, running on reserve'}</span></div>
      <div class="tile wide"><small>Device battery</small><b>${bat}</b></div>`;
  }

  /* ---------------- live values ---------------- */
  const setL = (k, v, attr) => $$(`[data-live="${k}"]`).forEach(e => { if (attr) e.setAttribute(attr, v); else if (e.textContent !== v) e.textContent = v; });
  U.live = function (now) {
    const ch = app.chrono, ce = ch.elapsed();
    setL('chrono', SM.fmtDur(ce, true)); setL('chronoBtn', ch.running ? 'Stop' : ce > 0 ? 'Resume' : 'Start'); setL('chronoBtn2', ch.running ? 'Split' : 'Reset');
    setL('timer', SM.fmtDur(app.timer.remaining())); setL('timerBtn', app.timer.running ? 'Pause' : 'Start');
    const fr = app.focus.remaining(); setL('focus', SM.fmtDur(fr)); setL('focusBtn', app.focus.running ? 'Pause' : 'Start');
    setL('focusMode', { focus: 'Focus session', short: 'Short break', long: 'Long break' }[app.focus.mode]);
    const fk = st.focusCount; setL('focusCount', String(fk.date === (now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()) ? fk.n : 0));
    const frac = fr / app.FOCUS_DUR[app.focus.mode];
    $$('[data-live="focusArc"]').forEach(e => { const [x0, y0] = SM.polar(100, 100, 86, 0), a = Math.max(.01, frac) * 359.9, [x1, y1] = SM.polar(100, 100, 86, a); e.setAttribute('d', `M${f(x0)} ${f(y0)} A86 86 0 ${a > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`); });
    const na = app.nextAlarm(new Date());
    setL('nextAlarm', na ? `Next alarm: ${SM.DAYS[na.t.getDay()]} ${SM.fmtClock(na.t, st.fmt24)} (${esc(na.a.label || 'Alarm')})` : 'No alarms set.');
    if (U.tab === 'world' && now.getMilliseconds() < 100) {
      $$('[data-live="city"]').forEach(e => {
        const c = app.CITIES[+e.dataset.i], p = SM.cityTime(c, now, st.fmt24), off = (SM.cityOffset(c, now) - SM.cityOffset(app.CITIES[0], now)) / 60;
        const hr = +p.hour + (p.dayPeriod === 'PM' && p.hour !== '12' ? 12 : 0) - (p.dayPeriod === 'AM' && p.hour === '12' ? 12 : 0);
        const v = `${p.hour}:${p.minute}${p.dayPeriod ? ' ' + p.dayPeriod : ''} · ${p.weekday} · ${off === 0 ? 'same as Chicago' : (off > 0 ? '+' : '') + off + 'h'} ${hr >= 6 && hr < 18 ? '☀' : '☾'}`;
        if (e.textContent !== v) e.textContent = v;
      });
    }
    /* stage chips */
    const chips = [];
    if (ch.running || ce > 0) chips.push(`<span class="schip ${ch.running ? 'run' : ''}">CHRONO ${SM.fmtDur(ce, true)}</span>`);
    if (app.timer.running || app.timer.left < app.timer.dur) chips.push(`<span class="schip ${app.timer.running ? 'run' : ''}">TIMER ${SM.fmtDur(app.timer.remaining())}</span>`);
    if (app.focus.running || fr < app.FOCUS_DUR[app.focus.mode]) chips.push(`<span class="schip ${app.focus.running ? 'run' : ''}">${app.focus.mode === 'focus' ? 'FOCUS' : 'BREAK'} ${SM.fmtDur(fr)}</span>`);
    if (na) chips.push(`<span class="schip">ALARM ${SM.fmtClock(na.t, st.fmt24)}</span>`);
    if (app.solar) chips.push(`<span class="schip sun">SOLAR ${Math.round(app.solar.charge)}%</span>`);
    const html = chips.join(''); const sc = $('#status-chips'); if (sc._h !== html) { sc._h = html; sc.innerHTML = html; }
    const tc = $('#top-clock'); if (tc) { const v = SM.fmtClock(now, st.fmt24, true); if (tc.textContent !== v) tc.textContent = v; }
    if ($('#modal') && !$('#modal').hidden) setL('clock', SM.fmtClock(new Date(), st.fmt24));
    if (U.tab === 'today') {
      $$('[data-live="ecg"]').forEach(e => e.setAttribute('d', SM.cx.ecgPath(2, 52, 196, 40, 90)));
      setL('bpm', String(Math.round(SM.cx.vitals.bpm))); setL('steps', String(SM.cx.activity.steps));
    }
    if (now.getMilliseconds() < 100 || U._statsT === undefined || performance.now() - U._statsT > 1000) {
      U._statsT = performance.now();
      const qs = SM.Q.stats, P = SM.Q.p();
      setL('qstats', `Now: ${P.name} tier · ${qs ? Math.round(qs.fps) + ' fps (median ' + qs.med.toFixed(1) + ' ms, p90 ' + qs.p90.toFixed(1) + ' ms) · display ~' + qs.hz + ' Hz' : 'measuring…'} · background ${P.bgHz} Hz · particles ${Math.round(P.particles * 100)}% · hologram ≤${P.holoPR}× pixels${SM.Q.log.length ? ' · last change: ' + SM.Q.log[SM.Q.log.length - 1].why : ''}`);
      if (app.holo && U.tab === 'holo') { const i = app.holo.info(); setL('holoStats', `${i.renderer} · ${i.mode || 'off'} · ${i.w}×${i.h} css px @ ${i.pr}× · ${i.ms.toFixed(1)} ms/frame GPU submit · ${i.dust} dust particles · bloom ${i.bloom ? 'on' : 'off'}`); }
    }
  };

  /* ---------------- actions ---------------- */
  const ACT = {
    face: b => app.setFace(b.dataset.id), strap: b => app.setStrap(b.dataset.id), strapcolor: b => app.setStrap(null, b.dataset.id),
    finish: b => app.setFinish(b.dataset.id), bg: b => { app.setBg(b.dataset.id); A.whoosh(.7, true); },
    'chrono-ss': () => app.pressPusher('top'), 'chrono-sr': () => app.pressPusher('bottom'),
    'timer-preset': b => app.timerSet(+b.dataset.ms), 'timer-set': () => app.timerSet(((+$('#t-min').value || 0) * 60 + (+$('#t-sec').value || 0)) * 1000),
    'timer-ss': () => app.timerStart(), 'timer-reset': () => app.timerReset(),
    'alarm-add': () => {
      const time = $('#al-time').value; if (!/^\d\d:\d\d$/.test(time)) { SM.toast('Pick a time first'); return; }
      const days = $$('.al-day').filter(c => c.checked).map(c => +c.value);
      st.alarms.push({ id: SM.uid('al') + Date.now().toString(36), time, label: $('#al-label').value.trim() || 'Alarm', days, on: true });
      app.saveAlarms(); SM.toast('Alarm set for ' + time); rerender(['alarms']);
    },
    'alarm-toggle': b => { const a = st.alarms.find(x => x.id === b.dataset.id); if (a) { a.on = b.checked; if (!a.on) a.snoozeUntil = 0; app.saveAlarms(); rerender(['alarms']); } },
    'alarm-del': b => { st.alarms = st.alarms.filter(x => x.id !== b.dataset.id); app.state.alarms = st.alarms; app.saveAlarms(); rerender(['alarms']); },
    'alarm-test': () => app.ring('Alarm preview', 'This is what your alarm sounds like, Nick.', null),
    snooze: () => app.dismiss(true), dismiss: () => app.dismiss(false),
    city: b => { st.world = app.CITIES[+b.dataset.i].name; store.set('world', st.world); $$('.cities li').forEach(l => l.classList.toggle('on', l === b)); drawMap(); SM.toast('Dial world time: ' + st.world); },
    geo: () => {
      if (!navigator.geolocation) { SM.toast('Geolocation not available'); return; }
      navigator.geolocation.getCurrentPosition(p => { st.loc = { name: 'My location', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }; store.set('loc', st.loc); app.refreshAstro(); rerender(['sky']); SM.toast('Location updated'); },
        () => SM.toast('Location unavailable, keeping ' + st.loc.name), { timeout: 8000, maximumAge: 3600000 });
    },
    'focus-mode': b => app.focusMode(b.dataset.m), 'focus-ss': () => app.focusStart(), 'focus-reset': () => app.focusReset(),
    power: b => U.power(b.dataset.id),
    snd: b => { A.init(); const k = b.dataset.id; if (k === 'heat') A.heat(2); else if (k === 'whoosh') A.whoosh(1, true); else if (k === 'speed') A.speed(2); else if (k === 'xray') A.xray(true); else if (k === 'pusher') { A.pusher(false); setTimeout(() => A.pusher(true), 150); } else A[k](); },
    tilt: () => app.enableTilt(),
    motion: async () => { const r = await SM.cx.enableMotion(); SM.toast(`Motion: ${r.motion} · tilt: ${r.orientation}`); rerender(['today']); },
    'b-set': b => { const c = Object.assign({}, SM.CUSTOM_DEFAULT, st.custom || {}); c[b.dataset.k] = b.dataset.v; U.setCustom(c); },
    'b-random': () => { const B = SM.BUILDER, pk = a => a[Math.floor(Math.random() * a.length)], k = a => pk(a)[0]; U.setCustom(Object.assign({}, st.custom || SM.CUSTOM_DEFAULT, { dial: pk(B.dials), tex: k(B.tex), hands: k(B.hands), metal: k(B.metal), idx: k(B.idx), shield: pk(Object.keys(SM.SHIELD_STYLES)), left: k(B.comps), right: k(B.comps), bottom: k(B.comps), bezel: k(B.bezel) })); },
    'wear-custom': () => { app.setFace('custom'); },
    'holo-toggle': () => { A.init(); app.toggleHolo(); },
    'holo-variant': b => { app.setHoloVariant(b.dataset.id); if (!app.holo) app.openHolo('power'); rerender(['holo']); },
    'holo-exit': () => app.closeHolo(),
    tourbillon: () => app.setTourbillon(),
    'game-start': () => { $('#modal').hidden = true; SM.game.start(); },
    'game-stop': () => SM.game.stop(false),
    'modal-close': () => { $('#modal').hidden = true; },
    units: b => { store.set('units', b.dataset.id); SM.emit('weather', SM.cx.weather); rerender(['today']); },
    'wx-refresh': () => { SM.cx.fetchWeather(true); },
    'preset-save': () => { const n = ($('#preset-name').value || '').trim() || 'My preset'; SM.cx.save(n); SM.toast('Saved preset: ' + n); rerender(['presets']); },
    'preset-load': b => { const list = b.dataset.src === 'saved' ? SM.cx.list() : SM.cx.BUILTIN_PRESETS, p = list[+b.dataset.i]; if (p) { SM.cx.apply(p); SM.toast('Loaded: ' + p.name); A.whoosh(.7, true); } },
    'preset-del': b => { const p = SM.cx.list()[+b.dataset.i]; if (p) { SM.cx.remove(p.name); rerender(['presets']); } },
    'preset-share': async () => { const r = await SM.cx.share(); const i = $('#share-url'); if (i) { i.value = r.url; i.select && i.select(); } SM.toast(r.how === 'clipboard' ? 'Share link copied to clipboard' : r.how === 'share' ? 'Shared' : 'Copy the link below'); },
    install: () => { if (U.installEvt) { U.installEvt.prompt(); U.installEvt.userChoice.finally(() => { U.installEvt = null; const b = $('#install-btn'); if (b) b.hidden = true; }); } },
    'replay-intro': () => U.intro(true),
    'reset-all': () => { if (confirm('Reset all settings, alarms and preferences?')) { store.reset(); location.reload(); } },
    surprise: () => U.surprise(), watchonly: () => U.watchOnly(), fullscreen: () => U.fullscreen(), export: () => U.exportPNG(),
    mute: () => U.toggleMute(), help: () => U.help(), panel: () => document.body.classList.toggle('panel-open'), 'close-help': () => U.help(false), 'exit-wo': () => U.watchOnly(false)
  };
  U.setCustom = function (c) {
    app.setCustom(c);
    const pv = $('[data-live="bprev"]'); if (pv) pv.innerHTML = thumb(SM.faceById('custom'));
    const sc = $('#tab-body').scrollTop; if (U.tab === 'builder') { U.show('builder'); $('#tab-body').scrollTop = sc; }
  };
  U.power = function (k) {
    A.init(); const P = SM.powers;
    if (k === 'xray') P.xray(); else if (k === 'lume') { P.lume(); } else P[k]();
    setTimeout(() => rerender(['powers']), 50);
  };
  U.surprise = function () {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const faces = SM.FACES.filter(x => x.id !== st.face), bgs = SM.BACKGROUNDS.filter(x => x.id !== st.bg);
    app.setStrap(pick(Object.keys(SM.STRAPS)), pick(SM.STRAP_COLORS).id);
    st.finish = 'auto'; store.set('finish', 'auto');
    app.setFace(pick(faces).id); app.setBg(pick(bgs).id);
    A.whoosh(.9, true); SM.toast('Surprise! ' + app.face.name + ' · ' + SM.bgById(st.bg).name + ' · ' + SM.STRAPS[st.strap].name);
  };
  U.watchOnly = function (on) { on = on === undefined ? !document.body.classList.contains('watch-only') : on; document.body.classList.toggle('watch-only', on); setTimeout(app.sizeStage, 30); setTimeout(app.sizeStage, 400); if (on) SM.toast('Watch-only mode. Press W or Esc to exit.'); };
  U.fullscreen = function () {
    const d = document;
    if (d.fullscreenElement) { d.exitFullscreen().catch(() => { }); return; }
    const el = d.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().then(() => setTimeout(app.sizeStage, 200)).catch(() => SM.toast('Fullscreen not allowed here'));
    else SM.toast('Fullscreen not supported. Try watch-only mode (W).');
  };
  U.toggleMute = function () { A.muted = !A.muted; A.apply(); A.save(); syncMute(); SM.toast(A.muted ? 'Sound muted' : 'Sound on'); };
  function syncMute() { const b = $('[data-act="mute"]'); if (b) { b.classList.toggle('on', A.muted); b.innerHTML = A.muted ? ICON.mute : ICON.sound; b.title = A.muted ? 'Unmute (M)' : 'Mute (M)'; } const m = $('#mute'); if (m) m.checked = A.muted; }
  U.help = function (show) {
    const h = $('#help'); show = show === undefined ? h.hidden : show;
    if (show) h.innerHTML = `<div class="modal-card help-card"><h2>Keyboard shortcuts</h2><table class="keys">${SHORTCUTS.map(([k, d]) => `<tr><td><kbd>${k}</kbd></td><td>${d}</td></tr>`).join('')}</table>
      <p class="hint">On the watch: click the <b>crown</b> to change faces, the <b>pushers</b> to run the chronograph, and drag, scroll or double-click the <b>bezel</b>.</p><button class="btn primary" data-act="close-help">Got it</button></div>`;
    h.hidden = !show;
  };

  /* ---------------- export PNG ---------------- */
  U.exportPNG = function () {
    const W = 1600, H = 1200, bg = SM.bgById(st.bg);
    const layers = SM.shadowMarkup() + ['strap', 'case'].map(k => app.el[k].innerHTML).join('');
    const dial = app.el.dial, dsvg = dial.querySelector('.dial-svg'), over = dial.querySelector('.dial-over');
    const top = $$('.dial-anim svg', dial).map(e => e.innerHTML).join('') + ['tourb', 'hands', 'glass'].map(k => app.el[k].innerHTML).join('');
    const mk = inner => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 600 800" width="900" height="1200"><defs>${SM.defsMarkup()}</defs>${inner}</svg>`;
    const load = s => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' })); });
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const g = x.createRadialGradient(W / 2, H * .45, 50, W / 2, H / 2, W * .7); g.addColorStop(0, bg.exp[0]); g.addColorStop(1, bg.exp[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const bgc = app.bgObj && app.bgObj.exportCanvas && app.bgObj.exportCanvas(); if (bgc) { x.globalAlpha = .9; x.drawImage(bgc, 0, 0, W, H); x.globalAlpha = 1; }
    if (st.bg === 'suit') { const p = x.createPattern(Object.assign(new Image(), { src: SM.tex.suit.base }), 'repeat'); if (p) { x.globalAlpha = .5; x.fillStyle = p; x.fillRect(0, 0, W, H); x.globalAlpha = 1; } }
    const ox = (W - 900) / 2;
    Promise.all([load(mk(layers)), load(mk(dsvg ? dsvg.innerHTML : '')), load(mk((over ? over.innerHTML : '') + top))]).then(([a, b, d]) => {
      x.drawImage(a, ox, 0); x.drawImage(b, ox, 0);
      if (app.el.solar) { const k = 900 / 600; x.save(); x.beginPath(); x.arc(ox + 300 * k, 400 * k, 146 * k, 0, 6.283); x.clip(); x.drawImage(app.el.solar, ox + 154 * k, 254 * k, 292 * k, 292 * k); x.restore(); }
      x.drawImage(d, ox, 0);
      if (app.holo && app.holo.state.visible) {
        const hr = app.holo.canvas.getBoundingClientRect(), wr = app.el.watch.getBoundingClientRect(), k = 900 / wr.width;
        app.holo.drawTo(x, ox + (hr.left - wr.left) * k, (hr.top - wr.top) * k, hr.width * k, hr.height * k);
      }
      x.font = '700 34px SMOswald, Oswald, sans-serif'; x.fillStyle = 'rgba(255,255,255,.92)'; x.textAlign = 'left';
      x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 8;
      x.fillText("NICK'S SUPERMAN WATCH", 48, H - 86);
      x.font = '500 22px SMRajdhani, Rajdhani, sans-serif'; x.fillStyle = 'rgba(255,255,255,.75)';
      x.fillText(`${app.face.name} · ${SM.STRAPS[st.strap].name} · ${bg.name} · ${SM.fmtClock(new Date(), st.fmt24)}`, 48, H - 52);
      const url = c.toDataURL('image/png'); U.lastExport = url;
      const a2 = document.createElement('a'); a2.href = url; a2.download = `nick-superman-watch-${app.face.id}.png`; document.body.appendChild(a2); a2.click(); a2.remove();
      A.click(); SM.toast('Exported PNG (1600×1200)');
    }).catch(() => SM.toast('Export failed in this browser'));
  };

  /* ---------------- keyboard ---------------- */
  function onKey(e) {
    if (e.target.matches('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key, P = SM.powers;
    const map = {
      ArrowRight: () => app.nextFace(1), ArrowLeft: () => app.nextFace(-1),
      b: () => { const i = SM.BACKGROUNDS.findIndex(x => x.id === st.bg); ACT.bg({ dataset: { id: SM.BACKGROUNDS[(i + 1) % SM.BACKGROUNDS.length].id } }); },
      s: () => { const ks = Object.keys(SM.STRAPS), i = ks.indexOf(st.strap); app.setStrap(ks[(i + 1) % ks.length]); SM.toast(SM.STRAPS[st.strap].name); },
      c: () => { const i = SM.STRAP_COLORS.findIndex(x => x.id === st.strapColor); app.setStrap(null, SM.STRAP_COLORS[(i + 1) % SM.STRAP_COLORS.length].id); },
      ' ': () => app.pressPusher('top'), l: () => { if (app.chrono.running) app.pressPusher('bottom'); },
      r: () => { if (app.chrono.running) app.chronoStartStop(); app.chronoSplitReset(); A.pusher(false); },
      '[': () => app.turnBezel(-1), ']': () => app.turnBezel(1), t: () => app.timerStart(), f: () => app.focusStart(),
      h: () => U.power('heat'), y: () => U.power('fly'), x: () => U.power('xray'), z: () => U.power('freeze'), q: () => U.power('speed'), g: () => U.power('lume'),
      o: () => { A.init(); app.toggleHolo(); }, u: () => app.setTourbillon(), j: () => { if (SM.game.running) SM.game.stop(false); else SM.game.start(); },
      k: () => { const ks = ['classic', 'cyan', 'kryptonite', 'gold'], i = ks.indexOf(st.holoVariant); app.setHoloVariant(ks[(i + 1) % ks.length]); SM.toast('Hologram: ' + ks[(i + 1) % ks.length]); rerender(['holo']); },
      m: () => U.toggleMute(), w: () => U.watchOnly(), Enter: () => U.fullscreen(), p: () => U.exportPNG(), d: () => U.surprise(), '?': () => U.help(),
      Escape: () => { if (!$('#help').hidden) U.help(false); else if (SM.game.running) SM.game.stop(false); else if (app.holo && app.holo.state.mode === 'power') app.closeHolo(); else if (!$('#modal').hidden) { app.dismiss(false); $('#modal').hidden = true; } else if (document.body.classList.contains('watch-only')) U.watchOnly(false); else { SM.powers.xray(false); SM.powers.lume(false); } }
    };
    const fn = map[k] || map[k.toLowerCase()];
    if (fn) { e.preventDefault(); fn(); return; }
    if (/^[0-9]$/.test(k)) { const i = k === '0' ? 9 : +k - 1; if (TABS[i]) { U.show(TABS[i][0]); document.body.classList.add('panel-open'); } }
  }

  /* ---------------- intro ---------------- */
  U.intro = function (force) {
    const box = $('#intro');
    const skip = !force && (!st.intro || /[?&]nointro/.test(location.search));
    if (skip) { box.remove(); document.body.classList.add('ready'); return; }
    box.hidden = false; box.className = 'intro';
    box.innerHTML = `<div class="intro-inner"><div class="intro-shield">${SM.shieldSVG('chrome', 'intro-svg')}</div><div class="intro-title">NICK'S <b>SUPERMAN</b> WATCH</div><div class="intro-sub">KRYPTON CAL. S-38 · VERSION 3</div><button class="btn primary intro-go" data-act="intro-go">Power up</button><small class="intro-skip">tap anywhere to begin · sound on</small></div>`;
    let done = false, started = false;
    const finish = () => { if (done) return; done = true; box.classList.add('leave'); document.body.classList.add('ready'); setTimeout(() => { box.hidden = true; box.innerHTML = ''; }, 900); };
    const start = () => { if (started) return; started = true; A.init(); A.intro(); box.classList.add('go'); setTimeout(finish, 2600); };
    box.onclick = () => { if (started) finish(); else start(); };
    U._introAuto = setTimeout(() => { if (!started) { started = true; box.classList.add('go'); setTimeout(finish, 2600); } }, 7000);
  };

  /* ---------------- init ---------------- */
  U.init = function (a) {
    app = a; st = app.state;
    $('#tabs').innerHTML = TABS.map(([id, l], i) => `<button data-tab="${id}" title="${l} (${(i + 1) % 10})">${ICON[id]}<span>${l}</span></button>`).join('');
    $$('#tb button').forEach(b => { const k = b.dataset.act; b.insertAdjacentHTML('afterbegin', ICON[{ 'holo-toggle': 'holo', surprise: 'dice', watchonly: 'watch', fullscreen: 'full', export: 'camera', mute: 'sound', help: 'help', panel: 'menu' }[k]] || ''); });
    $('#brand-shield').innerHTML = SM.shieldSVG('classic');
    $('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { U.show(b.dataset.tab); A.click(); } });
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = ACT[b.dataset.act]; if (!act) return;
      if (b.tagName === 'INPUT') { act(b); return; }
      e.preventDefault(); A.init(); act(b);
      if (!['snd', 'face', 'bg', 'power', 'surprise', 'export'].includes(b.dataset.act)) A.click();
    });
    let lastHover = 0;
    document.addEventListener('pointerover', e => { const b = e.target.closest('.btn, .card, .chip, #tabs button, #tb button, .dot'); if (b && b !== U._hov && performance.now() - lastHover > 70) { U._hov = b; lastHover = performance.now(); A.hover(); } });
    document.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'vol') { A.volume = +t.value; A.apply(); A.save(); }
      else if (t.id === 'mute') { A.muted = t.checked; A.apply(); A.save(); syncMute(); }
      else if (t.id === 'tickmode') { st.tickMode = t.value; store.set('tickMode', t.value); }
      else if (t.id === 'tickvol') { A.tickVol = +t.value; A.save(); A.tick(); }
      else if (t.classList.contains('cat')) { A.cats[t.value] = t.checked; A.apply(); A.save(); }
      else if (t.id === 'fmt24') { st.fmt24 = t.checked; store.set('fmt24', t.checked); app.lastSecond = -1; }
      else if (t.id === 'motion') { st.motion = t.value; store.set('motion', t.value); }
      else if (t.id === 'intro') { st.intro = t.checked; store.set('intro', t.checked); }
      else if (t.id === 'rmotion') { store.set('reduceMotion', t.checked); document.body.classList.toggle('reduce-motion', t.checked); }
      else if (t.id === 'quality') { SM.Q.setMode(t.value); SM.toast('Quality: ' + t.options[t.selectedIndex].text); rerender(['settings']); }
      else if (t.id === 'haptics') { store.set('haptics', t.checked); if (t.checked) SM.haptic(SM.HAPTIC.click); }
      else if (t.id === 'units') { store.set('units', t.value); SM.emit('weather', SM.cx.weather); }
      else if (t.id === 'step-goal') { SM.cx.activity.goal = Math.max(500, +t.value || 8000); store.set('stepGoal', SM.cx.activity.goal); }
      else if (t.dataset.bk) { const c = Object.assign({}, SM.CUSTOM_DEFAULT, st.custom || {}); c[t.dataset.bk] = t.value; U.setCustom(c); }
      else if (t.id === 'loc-sel') { const c = app.CITIES[+t.value]; if (c) { st.loc = { name: c.name, lat: c.lat, lon: c.lon }; store.set('loc', st.loc); app.refreshAstro(); rerender(['sky']); } }
    });
    document.addEventListener('input', e => { const t = e.target; if (t.id === 'holo-zoom') { if (app.holo) app.holo.setZoom(+t.value); } if (t.type === 'range') { const o = t.parentNode.querySelector('output'); if (o) o.textContent = Math.round(t.value * 100) + '%'; if (t.id === 'vol') { A.volume = +t.value; A.apply(); } } });
    addEventListener('keydown', onKey);
    SM.on('live', U.live);
    SM.on('face', () => rerender(['faces']));
    SM.on('bg', () => rerender(['scenes']));
    SM.on('strap', () => rerender(['style']));
    SM.on('chrono', () => rerender(['chrono']));
    SM.on('timer', () => rerender([]));
    SM.on('focus', () => rerender(['focus']));
    SM.on('alarms', () => rerender(['alarms']));
    SM.on('minute', () => { if (U.tab === 'world') drawMap(); if (U.tab === 'sky') renderSky(); });
    SM.on('power', p => { if (p === 'lume') app.buildLume(); app.lumeOn = !!SM.powers.active.lume; rerender(['powers']); });
    SM.on('holo', () => rerender(['holo', 'powers'])); SM.on('game', () => rerender(['powers'])); SM.on('tourbillon', () => rerender(['powers']));
    SM.on('weather', () => rerender(['today'])); SM.on('quality', () => rerender(['settings'])); SM.on('preset', () => rerender(['presets', 'builder']));
    SM.on('face', () => rerender(['builder']));
    const syncHv = () => $$('.holo-bar .hv[data-id]').forEach(b => b.classList.toggle('on', b.dataset.id === st.holoVariant));
    SM.on('holoVariant', syncHv); syncHv();
    if (store.get('reduceMotion', false)) document.body.classList.add('reduce-motion');
    if (navigator.getBattery) navigator.getBattery().then(b => { U.battery = b; const up = () => { if (U.tab === 'sky') renderSky(); }; b.addEventListener('levelchange', up); b.addEventListener('chargingchange', up); }).catch(() => { });
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); U.installEvt = e; const b = $('#install-btn'); if (b) b.hidden = false; });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
    syncMute();
    U.show(store.get('tab', 'faces'));
    U.intro(false);
  };
})(window.SM);
