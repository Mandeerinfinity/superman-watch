/* Synthesized sound engine — every sound is generated with WebAudio (no files). */
(function (SM) {
  'use strict';
  const A = SM.audio = {
    ctx: null, ready: false,
    cats: { tick: true, mech: true, ui: true, alarm: true, powers: true, intro: true },
    volume: .7, muted: false, tickVol: .5
  };
  const CAT_GAIN = { tick: 1, mech: 1, ui: .5, alarm: 1, powers: .9, intro: .9 };

  A.loadSettings = function () {
    const s = SM.store;
    A.volume = s.get('volume', .7); A.muted = s.get('muted', false); A.tickVol = s.get('tickVol', .5);
    Object.assign(A.cats, s.get('soundCats', {}));
  };
  A.save = function () {
    SM.store.set('volume', A.volume); SM.store.set('muted', A.muted); SM.store.set('tickVol', A.tickVol); SM.store.set('soundCats', A.cats);
  };

  function makeImpulse(ctx, secs, decay) {
    const rate = ctx.sampleRate, len = Math.floor(rate * secs), buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const early = i < rate * .08 && Math.random() < .004 ? (Math.random() * 2 - 1) * 1.6 : 0;
        d[i] = ((Math.random() * 2 - 1) * Math.pow(1 - t, decay) + early) * .9;
      }
    }
    return buf;
  }

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume().catch(() => { }); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { A.ctx = new AC(); } catch (e) { return false; }
    const c = A.ctx;
    A.master = c.createGain();
    A.comp = c.createDynamicsCompressor();
    A.comp.threshold.value = -14; A.comp.knee.value = 12; A.comp.ratio.value = 4; A.comp.attack.value = .004; A.comp.release.value = .2;
    A.master.connect(A.comp); A.comp.connect(c.destination);
    A.reverb = c.createConvolver(); A.reverb.buffer = makeImpulse(c, 2.8, 2.6);
    A.revIn = c.createGain(); A.revIn.gain.value = 1; A.revIn.connect(A.reverb);
    A.revOut = c.createGain(); A.revOut.gain.value = .55; A.reverb.connect(A.revOut); A.revOut.connect(A.master);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    A.noiseBuf = nb;
    A.buses = {};
    Object.keys(A.cats).forEach(k => { const g = c.createGain(); g.connect(A.master); A.buses[k] = g; });
    A.apply();
    A.ready = true;
    if (c.state === 'suspended') c.resume().catch(() => { });
    return true;
  };
  A.apply = function () {
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    A.master.gain.setTargetAtTime(A.muted ? 0 : A.volume, t, .03);
    Object.keys(A.buses).forEach(k => A.buses[k].gain.setTargetAtTime(A.cats[k] ? CAT_GAIN[k] : 0, t, .03));
  };
  A.can = function (cat) { return A.ready && A.ctx && A.ctx.state === 'running' && !A.muted && A.cats[cat] && A.volume > 0; };

  /* ---------- building blocks ---------- */
  function out(cat, send) { const g = A.ctx.createGain(); g.connect(A.buses[cat]); if (send) { const s = A.ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(A.revIn); } return g; }
  function env(g, t, a, peak, dec, sus, rel, hold) {
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * (sus === undefined ? 0 : sus), t + a, dec / 3);
    if (hold !== undefined) { g.gain.setTargetAtTime(0.0001, t + a + hold, rel / 4); }
  }
  function noise(t, dur, dest, type, freq, q, gainPeak, attack, decay) {
    const c = A.ctx, s = c.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq || 2000; f.Q.value = q || 1;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gainPeak, t + (attack || .001));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (attack || .001) + (decay || dur));
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + (decay || 0) + .05);
    return { src: s, filter: f, gain: g };
  }
  function tone(t, freq, dur, dest, type, peak, attack, decay) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + (attack || .002));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (attack || .002) + (decay || dur));
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + (decay || 0) + .05);
    return { osc: o, gain: g };
  }

  /* ---------- watch mechanics ---------- */
  let tickFlip = false;
  A.tick = function (soft) {
    if (!A.can('tick') || A.tickVol <= 0) return;
    const c = A.ctx, t = c.currentTime + .005, o = out('tick', .06), v = A.tickVol * (soft ? .35 : 1);
    tickFlip = !tickFlip;
    const base = tickFlip ? 1 : .86;
    noise(t, .012, o, 'bandpass', 4200 * base, 5, .55 * v, .0008, .018);
    noise(t + .004, .01, o, 'highpass', 7000, .7, .18 * v, .0005, .01);
    tone(t, 2650 * base, .03, o, 'sine', .12 * v, .0008, .028);
    tone(t, 5310 * base, .02, o, 'sine', .06 * v, .0005, .015);
    tone(t, 820 * base, .02, o, 'triangle', .08 * v, .001, .02);
  };
  A.crown = function () {
    if (!A.can('mech')) return;
    const c = A.ctx, t = c.currentTime + .005, o = out('mech', .12);
    for (let i = 0; i < 3; i++) {
      const tt = t + i * .028;
      noise(tt, .01, o, 'highpass', 3200, .8, .35, .0006, .012);
      tone(tt, 6100 - i * 300, .03, o, 'sine', .07, .0006, .03);
    }
  };
  A.bezel = function () {
    if (!A.can('mech')) return;
    const t = A.ctx.currentTime + .003, o = out('mech', .08);
    noise(t, .008, o, 'bandpass', 5200, 3, .3, .0005, .01);
    tone(t, 3900, .02, o, 'sine', .05, .0005, .02);
  };
  A.pusher = function (up) {
    if (!A.can('mech')) return;
    const c = A.ctx, t = c.currentTime + .005, o = out('mech', .1), v = up ? .45 : 1;
    const th = c.createOscillator(), tg = c.createGain();
    th.frequency.setValueAtTime(190, t); th.frequency.exponentialRampToValueAtTime(55, t + .05);
    tg.gain.setValueAtTime(.0001, t); tg.gain.linearRampToValueAtTime(.5 * v, t + .002); tg.gain.exponentialRampToValueAtTime(.0001, t + .07);
    th.connect(tg); tg.connect(o); th.start(t); th.stop(t + .1);
    noise(t, .015, o, 'bandpass', 2200, 2, .5 * v, .0008, .025);
    tone(t + .004, 4600, .08, o, 'sine', .07 * v, .001, .09);
    tone(t + .004, 7300, .05, o, 'sine', .03 * v, .001, .05);
  };

  /* ---------- UI ---------- */
  let lastHover = 0;
  A.hover = function () {
    if (!A.can('ui')) return;
    const now = performance.now(); if (now - lastHover < 45) return; lastHover = now;
    const t = A.ctx.currentTime + .002, o = out('ui', 0);
    tone(t, 2300, .02, o, 'sine', .035, .002, .025);
  };
  A.click = function () {
    if (!A.can('ui')) return;
    const c = A.ctx, t = c.currentTime + .002, o = out('ui', .05);
    const os = c.createOscillator(), g = c.createGain();
    os.frequency.setValueAtTime(1100, t); os.frequency.exponentialRampToValueAtTime(420, t + .05);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.12, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + .07);
    os.connect(g); g.connect(o); os.start(t); os.stop(t + .09);
    noise(t, .008, o, 'highpass', 5000, .7, .05, .0005, .008);
  };

  /* ---------- brass fanfare with timpani & cymbal (original melody) ---------- */
  function brassNote(t, freq, dur, dest, vel) {
    const c = A.ctx, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.Q.value = 2.5;
    f.frequency.setValueAtTime(350, t);
    f.frequency.linearRampToValueAtTime(900 + 2600 * vel, t + .06);
    f.frequency.setTargetAtTime(1100 + 1200 * vel, t + .08, .12);
    f.frequency.setTargetAtTime(420, t + dur, .08);
    env(g, t, .045, .16 * vel, .18, .72, .22, dur);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(freq * .006, t + .35);
    lfo.connect(lg);
    [-7, 0, 6].forEach(det => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = det;
      lg.connect(o.frequency); o.connect(f); o.start(t); o.stop(t + dur + .6);
    });
    const sq = c.createOscillator(); sq.type = 'square'; sq.frequency.value = freq / 2; const sg = c.createGain(); sg.gain.value = .25;
    sq.connect(sg); sg.connect(f); sq.start(t); sq.stop(t + dur + .6);
    lfo.start(t); lfo.stop(t + dur + .6);
    f.connect(g); g.connect(dest);
  }
  function timpani(t, freq, dest, v) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(freq * 1.5, t); o.frequency.exponentialRampToValueAtTime(freq, t + .08);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.55 * v, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + 1.4);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 1.5);
    noise(t, .06, dest, 'lowpass', 900, .7, .3 * v, .002, .12);
  }
  function cymbal(t, dest, v, dur) {
    noise(t, dur || 1.8, dest, 'highpass', 6500, .5, .16 * v, .01, dur || 1.8);
    noise(t, .3, dest, 'bandpass', 9000, 1.5, .1 * v, .002, .4);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  A.fanfare = function () {
    if (!A.can('alarm')) return 0;
    const t = A.ctx.currentTime + .05, o = out('alarm', .5);
    const seq = [[55, 0, .16, .7], [60, .18, .16, .75], [64, .36, .16, .8], [67, .54, .5, 1], [64, 1.08, .16, .8], [67, 1.26, .16, .85], [72, 1.46, 1.5, 1]];
    seq.forEach(([n, st, d, v]) => brassNote(t + st, N(n), d, o, v));
    [[48, 1.46], [52, 1.46], [55, 1.46], [60, 1.46]].forEach(([n, st]) => brassNote(t + st, N(n), 1.5, o, .55));
    brassNote(t + .54, N(48), .5, o, .5);
    timpani(t, N(36), o, .8); timpani(t + .54, N(43), o, .7); timpani(t + 1.46, N(36), o, 1); timpani(t + 1.62, N(36), o, .6);
    cymbal(t + 1.46, o, 1, 2.4);
    return 3400;
  };
  /* FM bell chime */
  function bell(t, freq, dest, v, dur) {
    const c = A.ctx, car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.value = freq; mod.frequency.value = freq * 3.5;
    mg.gain.setValueAtTime(freq * 2.2, t); mg.gain.exponentialRampToValueAtTime(freq * .05, t + dur);
    mod.connect(mg); mg.connect(car.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.2 * v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    car.connect(g); g.connect(dest); car.start(t); mod.start(t); car.stop(t + dur + .05); mod.stop(t + dur + .05);
    tone(t, freq * 2.01, dur * .6, dest, 'sine', .05 * v, .003, dur * .6);
  }
  A.chime = function (kind) {
    if (!A.can('alarm')) return;
    const t = A.ctx.currentTime + .03, o = out('alarm', .6);
    const notes = kind === 'break' ? [72, 76, 79, 84] : kind === 'focus' ? [79, 76, 72] : [88, 84, 79];
    notes.forEach((n, i) => bell(t + i * .22, N(n), o, 1, 2.2));
  };

  /* ---------- whooshes & powers ---------- */
  A.whoosh = function (dur, up) {
    if (!A.can('powers')) return;
    const c = A.ctx, t = c.currentTime + .01; dur = dur || 1.1;
    const p = c.createStereoPanner ? c.createStereoPanner() : c.createGain(); const o = out('powers', .35); p.connect(o);
    if (p.pan) { p.pan.setValueAtTime(-.8, t); p.pan.linearRampToValueAtTime(.8, t + dur); }
    const n = noise(t, dur, p, 'bandpass', 300, 1.3, .9, dur * .45, dur * .6);
    n.filter.frequency.setValueAtTime(up ? 250 : 400, t);
    n.filter.frequency.exponentialRampToValueAtTime(up ? 3200 : 2200, t + dur * .5);
    n.filter.frequency.exponentialRampToValueAtTime(up ? 900 : 300, t + dur);
    const l = noise(t, dur, p, 'lowpass', 500, .7, .5, dur * .4, dur * .6);
    l.filter.frequency.setValueAtTime(200, t); l.filter.frequency.exponentialRampToValueAtTime(700, t + dur * .5);
  };
  A.heat = function (dur) {
    if (!A.can('powers')) return;
    const c = A.ctx, t = c.currentTime + .01, o = out('powers', .25); dur = dur || 2.2;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 4;
    const ws = c.createWaveShaper(), curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 3.5); } ws.curve = curve;
    const g = c.createGain(); env(g, t, .15, .35, .3, .8, .3, dur - .2);
    [68, 68.7, 136.5].forEach((f, i) => { const os = c.createOscillator(); os.type = i === 2 ? 'square' : 'sawtooth'; os.frequency.value = f; os.connect(ws); os.start(t); os.stop(t + dur + .5); });
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 9; lg.gain.value = 380; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t); lfo.stop(t + dur + .5);
    ws.connect(lp); lp.connect(g); g.connect(o);
    const ch = c.createOscillator(), cg = c.createGain(); ch.type = 'sine';
    ch.frequency.setValueAtTime(180, t); ch.frequency.exponentialRampToValueAtTime(1400, t + .35); ch.frequency.exponentialRampToValueAtTime(900, t + dur);
    cg.gain.setValueAtTime(.0001, t); cg.gain.linearRampToValueAtTime(.08, t + .1); cg.gain.setTargetAtTime(.0001, t + dur - .2, .1);
    ch.connect(cg); cg.connect(o); ch.start(t); ch.stop(t + dur + .4);
    const s = c.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2600;
    const sg = c.createGain(); sg.gain.setValueAtTime(0, t);
    for (let tt = .2; tt < dur; tt += .015 + Math.random() * .02) sg.gain.setValueAtTime(Math.random() < .3 ? .35 * Math.random() : .06, t + tt);
    sg.gain.setValueAtTime(0, t + dur);
    s.connect(hp); hp.connect(sg); sg.connect(o); s.start(t); s.stop(t + dur + .1);
  };
  A.freeze = function () {
    if (!A.can('powers')) return;
    const c = A.ctx, t = c.currentTime + .01, o = out('powers', .45);
    const b = noise(t, 1.6, o, 'lowpass', 900, .8, .45, .5, 1.3);
    b.filter.frequency.setValueAtTime(500, t); b.filter.frequency.linearRampToValueAtTime(2200, t + .7); b.filter.frequency.linearRampToValueAtTime(800, t + 1.8);
    for (let i = 0; i < 70; i++) {
      const tt = t + .3 + Math.pow(Math.random(), 1.4) * 2.4;
      noise(tt, .006, o, 'highpass', 3500 + Math.random() * 4000, .9, .08 + Math.random() * .3, .0004, .006 + Math.random() * .01);
    }
    for (let i = 0; i < 14; i++) tone(t + .4 + Math.random() * 2, 2400 + Math.random() * 4800, .5, o, 'sine', .025, .002, .6);
  };
  A.xray = function (on) {
    if (!A.can('powers')) return;
    const c = A.ctx, t = c.currentTime + .01, o = out('powers', .3);
    const sw = c.createOscillator(), g = c.createGain(); sw.type = 'sine';
    sw.frequency.setValueAtTime(on ? 300 : 1500, t); sw.frequency.exponentialRampToValueAtTime(on ? 1500 : 250, t + .7);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.12, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + .9);
    const trem = c.createOscillator(), tg = c.createGain(); trem.frequency.value = 22; tg.gain.value = .06; trem.connect(tg); tg.connect(g.gain);
    sw.connect(g); g.connect(o); sw.start(t); trem.start(t); sw.stop(t + 1); trem.stop(t + 1);
    const bz = c.createOscillator(), bg = c.createGain(), bf = c.createBiquadFilter(); bz.type = 'sawtooth'; bz.frequency.value = 60; bf.type = 'bandpass'; bf.frequency.value = 480; bf.Q.value = 3;
    bg.gain.setValueAtTime(.0001, t); bg.gain.linearRampToValueAtTime(.09, t + .08); bg.gain.exponentialRampToValueAtTime(.0001, t + .8);
    bz.connect(bf); bf.connect(bg); bg.connect(o); bz.start(t); bz.stop(t + .9);
  };
  A.speed = function (dur) {
    if (!A.can('powers')) return;
    const c = A.ctx, t = c.currentTime + .01, o = out('powers', .3); dur = dur || 3;
    const s = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); s.type = 'sawtooth';
    s.frequency.setValueAtTime(90, t); s.frequency.exponentialRampToValueAtTime(900, t + dur * .7); s.frequency.exponentialRampToValueAtTime(120, t + dur);
    f.type = 'bandpass'; f.Q.value = 6; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3800, t + dur * .7); f.frequency.exponentialRampToValueAtTime(500, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.12, t + dur * .6); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o); s.start(t); s.stop(t + dur + .1);
    let tt = 0, gap = .12;
    while (tt < dur * .85) { noise(t + tt, .006, o, 'bandpass', 4200, 4, .22, .0006, .01); tt += gap; gap = Math.max(.012, gap * (tt < dur * .6 ? .9 : 1.12)); }
    A.whoosh(dur * .5, true);
  };
  A.lume = function () {
    if (!A.can('powers')) return;
    const t = A.ctx.currentTime + .02, o = out('powers', .7);
    [67, 71, 74, 79].forEach((n, i) => tone(t + i * .09, N(n + 12), 1.4, o, 'sine', .05, .01, 1.4));
  };
  A.intro = function () {
    if (!A.can('intro')) return;
    const t = A.ctx.currentTime + .02, o = out('intro', .6);
    A.whoosh(1.4, true);
    const th = A.ctx.createOscillator(), tg = A.ctx.createGain();
    th.frequency.setValueAtTime(80, t + 1.1); th.frequency.exponentialRampToValueAtTime(34, t + 2.2);
    tg.gain.setValueAtTime(.0001, t + 1.1); tg.gain.linearRampToValueAtTime(.5, t + 1.12); tg.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
    th.connect(tg); tg.connect(o); th.start(t + 1.1); th.stop(t + 2.7);
    [60, 64, 67, 72, 76].forEach((n, i) => bell(t + 1.15 + i * .05, N(n + 12), o, .6, 2.6));
  };

  /* ---------- v3: hologram activate, variant switch, Solar game ---------- */
  A.holo = function (small) {
    if (!A.can('powers')) return;
    const c = A.ctx, t = c.currentTime + .01, o = out('powers', .45);
    if (small) { /* variant switch: quick digital chirp pair */
      tone(t, 1760, .05, o, 'square', .03, .002, .05); tone(t + .06, 2637, .06, o, 'sine', .08, .002, .12); return;
    }
    /* power-up sweep: detuned saws through a rising resonant low-pass */
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 9; lp.frequency.setValueAtTime(180, t); lp.frequency.exponentialRampToValueAtTime(5200, t + .55); lp.frequency.exponentialRampToValueAtTime(1400, t + 1.3);
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.16, t + .08); g.gain.exponentialRampToValueAtTime(.0001, t + 1.5);
    lp.connect(g); g.connect(o);
    [-9, 0, 7].forEach(dt => { const os = c.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(N(45), t); os.frequency.exponentialRampToValueAtTime(N(57), t + .5); os.detune.value = dt; os.connect(lp); os.start(t); os.stop(t + 1.6); });
    /* shimmer: fast arpeggio of glassy partials */
    [76, 83, 88, 95, 100].forEach((n, i) => { tone(t + .32 + i * .055, N(n), .5, o, 'sine', .07, .003, .7); tone(t + .32 + i * .055, N(n) * 2.01, .3, o, 'sine', .02, .003, .4); });
    /* data crackle */
    for (let i = 0; i < 7; i++) noise(t + .2 + Math.random() * .9, .02, o, 'bandpass', 3000 + Math.random() * 5000, 8, .12, .001, .03);
    /* sub thump when the shield locks in */
    const th = c.createOscillator(), tg = c.createGain(); th.frequency.setValueAtTime(110, t + .55); th.frequency.exponentialRampToValueAtTime(40, t + 1.1);
    tg.gain.setValueAtTime(.0001, t + .55); tg.gain.linearRampToValueAtTime(.35, t + .57); tg.gain.exponentialRampToValueAtTime(.0001, t + 1.2);
    th.connect(tg); tg.connect(o); th.start(t + .55); th.stop(t + 1.3);
  };
  A.collect = function (combo) {
    if (!A.can('ui')) return;
    const t = A.ctx.currentTime + .005, o = out('ui', .25), n = 79 + Math.min(12, combo || 0);
    tone(t, N(n), .08, o, 'triangle', .22, .002, .12); tone(t + .045, N(n + 7), .1, o, 'sine', .16, .002, .18);
  };
  A.bad = function () {
    if (!A.can('ui')) return;
    const c = A.ctx, t = c.currentTime + .005, o = out('ui', .15), os = c.createOscillator(), g = c.createGain();
    os.type = 'square'; os.frequency.setValueAtTime(220, t); os.frequency.exponentialRampToValueAtTime(70, t + .25);
    g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.0001, t + .3); os.connect(g); g.connect(o); os.start(t); os.stop(t + .32);
  };
  A.gameEnd = function (good) {
    if (!A.can('ui')) return;
    const t = A.ctx.currentTime + .02, o = out('ui', .5);
    (good ? [72, 76, 79, 84] : [72, 70, 67]).forEach((n, i) => bell(t + i * .12, N(n), o, .8, 1.6));
  };
})(window.SM);
