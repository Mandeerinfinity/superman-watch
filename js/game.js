/* Nick's Superman Watch v3: "Solar Recharge" minigame.
   Tap yellow-sun photons to channel them into the watch, dodge Kryptonite. 30 seconds; the score becomes extra solar charge for today.
   Rendered on one DPR-capped canvas with pre-rendered sprites, driven by the app's single rAF loop (no loop of its own). */
(function (SM) {
  'use strict';
  const G = SM.game = { running: false, score: 0, best: SM.store.get('gameBest', 0), items: [], fx: [], combo: 0 };
  const DUR = 30000;
  let cv, cx, hud, W = 0, H = 0, pr = 1, t0 = 0, last = 0, spawnAcc = 0, sprites = null, target = { x: 0, y: 0 };

  function sprite(r, draw) { const c = document.createElement('canvas'); c.width = c.height = Math.ceil(r * 2 * 2); const x = c.getContext('2d'); x.scale(2, 2); draw(x, r); return c; }
  function makeSprites() {
    const glow = (col, core) => (x, r) => { const g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, core); g.addColorStop(.25, col); g.addColorStop(1, 'rgba(255,180,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(r, r, r, 0, 6.283); x.fill(); };
    sprites = {
      photon: sprite(26, glow('rgba(255,210,70,.75)', '#fffbe6')),
      flare: sprite(40, (x, r) => { glow('rgba(255,140,30,.8)', '#fff')(x, r); x.strokeStyle = 'rgba(255,240,180,.9)'; x.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = i * .785; x.beginPath(); x.moveTo(r + Math.cos(a) * 9, r + Math.sin(a) * 9); x.lineTo(r + Math.cos(a) * 22, r + Math.sin(a) * 22); x.stroke(); } }),
      krypt: sprite(26, (x, r) => {
        const g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, 'rgba(90,255,130,.55)'); g.addColorStop(1, 'rgba(40,255,90,0)'); x.fillStyle = g; x.beginPath(); x.arc(r, r, r, 0, 6.283); x.fill();
        const shard = (dx, h, w, rot) => { x.save(); x.translate(r + dx, r + 8); x.rotate(rot); x.beginPath(); x.moveTo(-w, 0); x.lineTo(-w * .6, -h * .8); x.lineTo(0, -h); x.lineTo(w * .6, -h * .8); x.lineTo(w, 0); x.closePath(); x.fillStyle = '#39ff6a'; x.fill(); x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.moveTo(0, -h); x.lineTo(w * .6, -h * .8); x.lineTo(w * .2, 0); x.closePath(); x.fill(); x.restore(); };
        shard(-5, 14, 3.4, -.35); shard(5, 12, 3, .4); shard(0, 18, 4, 0);
      })
    };
  }
  function resize() {
    if (!cv) return; const r = cv.getBoundingClientRect();
    pr = Math.min(2, devicePixelRatio || 1) * (SM.Q && SM.Q.tier >= 3 ? .75 : 1);
    W = r.width; H = r.height; cv.width = Math.round(W * pr); cv.height = Math.round(H * pr);
    const wr = SM.app.el.watch.getBoundingClientRect(), k = wr.width / 600; target = { x: wr.left - r.left + 300 * k, y: wr.top - r.top + 400 * k, r: 150 * k };
  }
  G.start = function () {
    if (G.running) return;
    if (!sprites) makeSprites();
    const stage = SM.$('#stage');
    cv = document.createElement('canvas'); cv.id = 'game-cv'; stage.appendChild(cv);
    hud = SM.el(`<div id="game-hud" role="region" aria-label="Solar Recharge game"><div class="g-stat"><b data-g="score">0</b><span>photons</span></div><div class="g-title">SOLAR RECHARGE<small>Tap the sunlight · avoid Kryptonite</small></div><div class="g-stat"><b data-g="time">30</b><span>seconds</span></div><button class="btn g-exit" data-act="game-stop" aria-label="Stop game">✕</button><div class="g-bar"><i data-g="bar"></i></div></div>`);
    stage.appendChild(hud);
    resize(); addEventListener('resize', resize);
    cv.addEventListener('pointerdown', tap);
    G.running = true; G.score = 0; G.combo = 0; G.items = []; G.fx = []; G.hits = 0; G.misses = 0; G.bad = 0;
    t0 = last = performance.now(); spawnAcc = 0;
    document.body.classList.add('game-on');
    SM.audio.whoosh(1, true); SM.haptic(SM.HAPTIC.power);
    SM.emit('game', { running: true });
  };
  function spawn(now) {
    const r = Math.random(), kind = r < .16 ? 'krypt' : r < .21 ? 'flare' : 'photon';
    const sx = W * (.15 + Math.random() * .7), sy = -30;
    const ang = Math.atan2(target.y - sy, target.x - sx) + (Math.random() - .5) * .6, sp = (H * .16 + Math.random() * H * .1) * (1 + (now - t0) / DUR * .7);
    G.items.push({ kind, x: sx, y: sy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: kind === 'flare' ? 30 : 22, born: now, wob: Math.random() * 6 });
  }
  function tap(e) {
    e.preventDefault(); SM.audio.init();
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bd = 1e9;
    for (const it of G.items) { const d = Math.hypot(it.x - x, it.y - y); if (d < it.r + 20 && d < bd) { bd = d; best = it; } }
    if (!best) { G.combo = 0; return; }
    G.items.splice(G.items.indexOf(best), 1);
    if (best.kind === 'krypt') {
      G.score = Math.max(0, G.score - 5); G.combo = 0; G.bad++; SM.audio.bad(); SM.haptic(SM.HAPTIC.bad);
      for (let i = 0; i < 16; i++) G.fx.push({ k: 'shard', x: best.x, y: best.y, vx: (Math.random() - .5) * 320, vy: (Math.random() - .5) * 320, life: 1 });
      hud.classList.remove('hurt'); void hud.offsetWidth; hud.classList.add('hurt');
    } else {
      const pts = best.kind === 'flare' ? 5 : 1 + Math.min(4, Math.floor(G.combo / 5));
      G.score += pts; G.combo++; G.hits++; SM.audio.collect(G.combo); SM.haptic(SM.HAPTIC.collect);
      G.fx.push({ k: 'beam', x: best.x, y: best.y, life: 1, pts });
      for (let i = 0; i < 8; i++) G.fx.push({ k: 'spark', x: best.x, y: best.y, vx: (Math.random() - .5) * 260, vy: (Math.random() - .5) * 260, life: 1 });
    }
  }
  G.tap = tap;
  G.update = function (now) {
    if (!G.running || !cx && !(cx = cv.getContext('2d'))) return;
    const dt = Math.min(.05, (now - last) / 1000), el = now - t0; last = now;
    if (el >= DUR) return G.stop(true);
    spawnAcc += dt * (2.2 + el / DUR * 2.6);
    while (spawnAcc > 1) { spawnAcc -= 1; spawn(now); }
    cx.setTransform(pr, 0, 0, pr, 0, 0); cx.clearRect(0, 0, W, H);
    /* the sun */
    const sg = cx.createRadialGradient(W / 2, -H * .08, 0, W / 2, -H * .08, H * .45); sg.addColorStop(0, 'rgba(255,240,190,.55)'); sg.addColorStop(.4, 'rgba(255,190,60,.18)'); sg.addColorStop(1, 'rgba(255,150,0,0)');
    cx.fillStyle = sg; cx.fillRect(0, 0, W, H * .5);
    /* charge halo on the watch */
    const pulse = .25 + Math.min(.5, G.combo * .03);
    const hg = cx.createRadialGradient(target.x, target.y, target.r * .8, target.x, target.y, target.r * 1.35); hg.addColorStop(0, `rgba(255,210,80,${pulse})`); hg.addColorStop(1, 'rgba(255,210,80,0)');
    cx.fillStyle = hg; cx.beginPath(); cx.arc(target.x, target.y, target.r * 1.4, 0, 6.283); cx.fill();
    cx.globalCompositeOperation = 'lighter';
    const keep = [];
    for (const it of G.items) {
      it.x += it.vx * dt + Math.sin(now / 300 + it.wob) * .4; it.y += it.vy * dt;
      if (Math.hypot(it.x - target.x, it.y - target.y) < target.r * .55 || it.y > H + 40) { if (it.kind !== 'krypt') { G.misses++; G.combo = 0; } continue; }
      const s = sprites[it.kind], sz = it.r * 2 * (1 + .08 * Math.sin(now / 120 + it.wob));
      if (it.kind === 'krypt') cx.globalCompositeOperation = 'source-over';
      cx.drawImage(s, it.x - sz / 2, it.y - sz / 2, sz, sz);
      cx.globalCompositeOperation = 'lighter';
      keep.push(it);
    }
    G.items = keep;
    const fk = [];
    for (const p of G.fx) {
      p.life -= dt * (p.k === 'beam' ? 2.2 : 1.6); if (p.life <= 0) continue;
      if (p.k === 'beam') {
        const e = 1 - p.life, bx = p.x + (target.x - p.x) * e, by = p.y + (target.y - p.y) * e;
        cx.strokeStyle = `rgba(255,220,120,${(p.life * .8).toFixed(2)})`; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(p.x + (target.x - p.x) * Math.max(0, e - .25), p.y + (target.y - p.y) * Math.max(0, e - .25)); cx.lineTo(bx, by); cx.stroke();
        cx.font = '700 16px system-ui, sans-serif'; cx.fillStyle = `rgba(255,240,200,${p.life.toFixed(2)})`; cx.fillText('+' + p.pts, p.x + 10, p.y - 10 - e * 20);
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt;
        cx.fillStyle = p.k === 'shard' ? `rgba(80,255,120,${p.life.toFixed(2)})` : `rgba(255,220,120,${p.life.toFixed(2)})`; cx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
      fk.push(p);
    }
    G.fx = fk.slice(-240 * (SM.Q ? SM.Q.p().particles : 1));
    cx.globalCompositeOperation = 'source-over';
    const q = s => hud.querySelector(`[data-g="${s}"]`);
    q('score').textContent = G.score; q('time').textContent = Math.ceil((DUR - el) / 1000); q('bar').style.transform = `scaleX(${(1 - el / DUR).toFixed(3)})`;
  };
  G.boostFor = score => Math.min(40, Math.round(score * .8));
  G.stop = function (finished) {
    if (!G.running) return;
    G.running = false; removeEventListener('resize', resize);
    if (cv) cv.remove(); if (hud) hud.remove(); cv = cx = hud = null;
    document.body.classList.remove('game-on');
    if (finished) {
      const boost = G.boostFor(G.score), isBest = G.score > G.best;
      if (isBest) { G.best = G.score; SM.store.set('gameBest', G.best); }
      if (boost > 0) SM.app.addSolarBoost(boost);
      SM.audio.gameEnd(boost > 0);
      G.last = { score: G.score, boost, best: G.best, hits: G.hits, bad: G.bad };
      const m = SM.$('#modal');
      m.innerHTML = `<div class="modal-card game-end"><div class="ring-shield">${SM.shieldSVG('solar')}</div><h2>Solar charge +${boost}%</h2><p>${G.score} photons channelled · ${G.hits} caught · ${G.bad} Kryptonite hit${G.bad === 1 ? '' : 's'}${isBest ? ' · <b>new best!</b>' : ` · best ${G.best}`}</p><p class="muted">The extra charge shows on SOLAR gauges and the activity rings until midnight.</p><div class="row"><button class="btn" data-act="game-start">Play again</button><button class="btn primary" data-act="modal-close">Done</button></div></div>`;
      m.hidden = false;
    }
    SM.emit('game', { running: false, last: G.last });
  };
})(window.SM);
