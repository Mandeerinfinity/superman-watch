/* Layered, animated, parallax backgrounds */
(function (SM) {
  'use strict';
  const f = SM.f;
  const BG = SM.BACKGROUNDS = [];
  const def = o => { BG.push(o); return o; };
  const DPR = () => Math.min(1.5, window.devicePixelRatio || 1);

  function layer(el, html, depth, cls, style) {
    const d = document.createElement('div');
    d.className = 'bg-lay ' + (cls || ''); if (depth) d.dataset.depth = depth;
    if (style) d.setAttribute('style', style);
    d.innerHTML = html || ''; el.appendChild(d); return d;
  }
  const svg = (inner, par, vb) => `<svg viewBox="${vb || '0 0 1600 1000'}" preserveAspectRatio="${par || 'xMidYMax slice'}" width="100%" height="100%">${inner}</svg>`;
  function canvasLayer(el, depth, cls, hiDpi) {
    const d = layer(el, '<canvas></canvas>', depth, 'bg-canvas ' + (cls || ''));
    const c = d.firstChild, ctx = c.getContext('2d');
    const o = { c, ctx, w: 0, h: 0, resize() { const r = hiDpi === true ? DPR() : (hiDpi || 1); o.w = d.clientWidth || innerWidth; o.h = d.clientHeight || innerHeight; c.width = Math.round(o.w * r); c.height = Math.round(o.h * r); ctx.setTransform(r, 0, 0, r, 0, 0); } };
    o.resize(); return o;
  }
  SM.bgParallax = function (el, mx, my) {
    el.querySelectorAll('[data-depth]').forEach(e => {
      const d = +e.dataset.depth, x = Math.round(-mx * d), y = Math.round(-my * d), k = x + ',' + y;
      if (e._pk !== k) { e._pk = k; e.style.transform = `translate3d(${x}px,${y}px,0)`; }
    });
  };
  function stars(n, seed, w, h, maxY, maxR) {
    const r = SM.rng(seed); let s = '';
    for (let i = 0; i < n; i++) s += `<circle cx="${f(r() * w)}" cy="${f(r() * h * (maxY || .6))}" r="${f(.4 + Math.pow(r(), 3) * (maxR || 1.8))}" fill="#fff" opacity="${f(.3 + r() * .7)}"/>`;
    return s;
  }
  /* periodic value-noise fBm (tiles horizontally with period P cells) */
  function hash(i, j, seed) { const h = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return h - Math.floor(h); }
  function vnoise(x, y, P, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const i0 = ((xi % P) + P) % P, i1 = (i0 + 1) % P;
    const a = hash(i0, yi, seed), b = hash(i1, yi, seed), c = hash(i0, yi + 1, seed), d = hash(i1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, P, seed, oct) { let s = 0, amp = .5, fr = 1, n = 0; for (let o = 0; o < (oct || 5); o++) { s += amp * vnoise(x * fr, y * fr, P * fr, seed + o * 13); n += amp; amp *= .5; fr *= 2; } return s / n; }
  SM.fbm = fbm;
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function cloudStrip(w, h, seed, top, bot, cover, alpha) {
    const W2 = Math.round(w / 2), H2 = Math.round(h / 2), c = document.createElement('canvas'); c.width = W2; c.height = H2;
    const x = c.getContext('2d'), img = x.createImageData(W2, H2), D = new Float32Array(W2 * H2), P = 12, th = cover || .42, A = alpha || 1;
    const T = top.split(',').map(Number), B = bot.split(',').map(Number);
    for (let y = 0; y < H2; y++) {
      const yy = y / H2, env = Math.exp(-Math.pow((yy - .6) / .26, 2));
      for (let i = 0; i < W2; i++) D[y * W2 + i] = fbm(i / W2 * P, y / W2 * P * 1.6, P, seed) * (.35 + .85 * env);
    }
    for (let y = 0; y < H2; y++) for (let i = 0; i < W2; i++) {
      const k = y * W2 + i, d = D[k], up = y > 3 ? D[k - 4 * W2] : 0;
      const a = sstep(th, th + .16, d), lit = Math.max(0, Math.min(1, .62 + (d - up) * 7 - (y / H2) * .35));
      const p = k * 4;
      img.data[p] = B[0] + (T[0] - B[0]) * lit; img.data[p + 1] = B[1] + (T[1] - B[1]) * lit; img.data[p + 2] = B[2] + (T[2] - B[2]) * lit; img.data[p + 3] = a * A * 255;
    }
    x.putImageData(img, 0, 0); return c.toDataURL();
  }
  /* Earth: equirectangular texture + precomputed sphere lookup, re-rendered by rotation only */
  function makeEarth(N) {
    const TW = 720, TH = 360, tex = new Uint8ClampedArray(TW * TH * 3), cl = new Float32Array(TW * TH), lights = new Uint8Array(TW * TH), oceanF = new Uint8Array(TW * TH);
    /* 1-degree land grid, gaussian-smoothed twice so coastlines come out rounded rather than stair-stepped */
    let LG = new Float32Array(360 * 180);
    for (let a = 0; a < 180; a++) for (let b = 0; b < 360; b++) LG[a * 360 + b] = SM.isLand(90 - a - .5, b - 180 + .5) ? 1 : 0;
    for (let pass = 0; pass < 2; pass++) {
      const src = LG; LG = new Float32Array(360 * 180);
      for (let a = 0; a < 180; a++) for (let b = 0; b < 360; b++) {
        let sum = 0, wsum = 0;
        for (let da = -1; da <= 1; da++) { const aa = a + da; if (aa < 0 || aa > 179) continue; for (let db = -1; db <= 1; db++) { const w = (da ? 1 : 2) * (db ? 1 : 2); sum += src[aa * 360 + (b + db + 360) % 360] * w; wsum += w; } }
        LG[a * 360 + b] = sum / wsum;
      }
    }
    for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
      const lat = 90 - (ty + .5) / 2, lon = -180 + (tx + .5) / 2;
      const fy = 90 - lat - .5, fx = lon + 180 - .5, y0 = Math.floor(fy), x0 = Math.floor(fx), u = fy - y0, v = fx - x0;
      const L = (a, b) => LG[Math.max(0, Math.min(179, a)) * 360 + ((b % 360) + 360) % 360];
      const bil = L(y0, x0) * (1 - u) * (1 - v) + L(y0, x0 + 1) * (1 - u) * v + L(y0 + 1, x0) * u * (1 - v) + L(y0 + 1, x0 + 1) * u * v;
      const n = fbm(tx / TW * 24, ty / TW * 24, 24, 3, 4), n2 = fbm(tx / TW * 8, ty / TW * 8, 8, 17, 3), val = bil + (n - .5) * .35 + (n2 - .5) * .3, k = (ty * TW + tx) * 3, al = Math.abs(lat);
      let r, g, b;
      const la2 = sstep(.44, .56, val);
      {
        const dry = fbm(tx / TW * 10, ty / TW * 10, 10, 9, 3);
        if (al > 62 + n * 10) { r = 236; g = 240; b = 246; }
        else if (al > 15 && al < 35 && dry > .45) { r = 196 - n * 30; g = 164 - n * 30; b = 108 - n * 20; }
        else if (al < 15) { r = 38 + n * 30; g = 96 + n * 30; b = 40; }
        else if (al < 50) { r = 72 + n * 40; g = 110 + n * 30; b = 52; }
        else { r = 86 + n * 30; g = 98 + n * 20; b = 70; }
        lights[ty * TW + tx] = la2 > .7 && al < 60 && hash(tx, ty, 5) > .82 ? 1 : 0;
      }
      {
        const sh = sstep(.2, .5, val);
        let orr = 8 + sh * 30, og = 34 + sh * 70, ob = 92 + sh * 70;
        if (al > 70 + n * 8) { orr = 225; og = 235; ob = 245; }
        r = orr + (r - orr) * la2; g = og + (g - og) * la2; b = ob + (b - ob) * la2;
      }
      oceanF[ty * TW + tx] = la2 < .5 ? 1 : 0;
      tex[k] = r; tex[k + 1] = g; tex[k + 2] = b;
      const cv = fbm(tx / TW * 16, ty / TW * 30, 16, 21, 5) + .08 * Math.sin(lat * .21) * Math.cos(lat * .07);
      cl[ty * TW + tx] = sstep(.5, .72, cv);
    }
    { /* soften texel edges: one 3x3 box blur pass (wraps in longitude) */
      const src = tex.slice();
      for (let ty = 1; ty < TH - 1; ty++) for (let tx = 0; tx < TW; tx++) for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += src[((ty + dy) * TW + ((tx + dx + TW) % TW)) * 3 + c] * (dx || dy ? 1 : 4);
        tex[(ty * TW + tx) * 3 + c] = sum / 12;
      }
    }
    const R = N / 2, tilt = 23 * Math.PI / 180, Ls = [-.62, -.3, .72], ll = Math.hypot(...Ls), Lx = Ls[0] / ll, Ly = Ls[1] / ll, Lz = Ls[2] / ll;
    const pix = [];
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const nx = (px - R + .5) / R, ny = (py - R + .5) / R, rr = nx * nx + ny * ny; if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr), y2 = ny * Math.cos(tilt) - nz * Math.sin(tilt), z2 = ny * Math.sin(tilt) + nz * Math.cos(tilt);
      const lat = -Math.asin(Math.max(-1, Math.min(1, y2))) * 180 / Math.PI, lon = Math.atan2(nx, z2) * 180 / Math.PI;
      const dif = nx * Lx + ny * Ly + nz * Lz, hz = Math.max(0, (nx * Lx + ny * Ly + nz * (Lz + 1)) / Math.hypot(Lx, Ly, Lz + 1));
      pix.push(py * N + px, Math.min(TH - 1, Math.floor((90 - lat) * 2)), (lon + 180) * 2, Math.max(0, dif), Math.pow(hz, 40), rr > .97 ? (1 - rr) / .03 : 1);
    }
    return function render(ctx, rot) {
      const img = ctx.createImageData(N, N), d = img.data, off = rot * 2, offc = rot * 2.3;
      for (let i = 0; i < pix.length; i += 6) {
        const o = pix[i] * 4, ty = pix[i + 1], txf = pix[i + 2], dif = pix[i + 3], sp = pix[i + 4], edge = pix[i + 5];
        const tx = ((Math.floor(txf + off) % TW) + TW) % TW, tc = ((Math.floor(txf + offc) % TW) + TW) % TW, k = ty * TW + tx;
        const c = cl[ty * TW + tc], light = .05 + dif * 1.0, ocean = oceanF[k];
        let r = tex[k * 3], g = tex[k * 3 + 1], b = tex[k * 3 + 2];
        r += (250 - r) * c; g += (252 - g) * c; b += (255 - b) * c;
        r *= light; g *= light; b *= light;
        if (ocean && c < .5) { const s2 = sp * 160 * (1 - c); r += s2; g += s2; b += s2 * 1.05; }
        if (dif < .06 && lights[k] && c < .4) { const q = (1 - dif / .06) * 200; r += q; g += q * .75; b += q * .35; }
        const rim = Math.pow(1 - Math.sqrt(Math.max(0, 1 - ((pix[i] % N - R) ** 2 + (Math.floor(pix[i] / N) - R) ** 2) / (R * R))), 3) * Math.max(.15, dif + .3);
        d[o] = r + rim * 80; d[o + 1] = g + rim * 140; d[o + 2] = b + rim * 255; d[o + 3] = 255 * edge;
      }
      return img;
    };
  }
  function crystalsSVG(seed, n, x0, x1, baseY, hMin, hMax, cols, glow) {
    const r = SM.rng(seed); let s = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), h = hMin + r() * (hMax - hMin), w = h * (.12 + r() * .1), lean = (r() - .5) * h * .25;
      const tip = [x + lean, baseY - h], sh = baseY - h * .82;
      s += `<path d="M${f(x - w)} ${baseY} L${f(x - w + lean * .8)} ${f(sh)} L${f(tip[0])} ${f(tip[1])} L${f(x + lean * .9)} ${f(sh + h * .04)} L${f(x)} ${baseY} Z" fill="${cols[0]}"/>
        <path d="M${f(x)} ${baseY} L${f(x + lean * .9)} ${f(sh + h * .04)} L${f(tip[0])} ${f(tip[1])} L${f(x + w + lean * .8)} ${f(sh)} L${f(x + w)} ${baseY} Z" fill="${cols[1]}"/>
        <path d="M${f(x + lean * .9)} ${f(sh + h * .04)} L${f(tip[0])} ${f(tip[1])}" stroke="${cols[2]}" stroke-width="${f(1 + h / 300)}" opacity=".9"/>
        ${glow ? `<path d="M${f(x - w + lean * .8)} ${f(sh)} L${f(tip[0])} ${f(tip[1])}" stroke="${glow}" stroke-width="2" opacity=".5"/>` : ''}`;
    }
    return s;
  }

  /* ---------- 1. SUIT BLUE ---------- */
  def({
    id: 'suit', name: 'Suit Blue', preview: 'radial-gradient(circle at 30% 30%,#3d7be6,#0d2a78 60%,#061640)', exp: ['#123a9a', '#061640'],
    build(el) {
      const T = SM.tex.suit;
      layer(el, '', 0, 'fill', 'background:#0a2366');
      this.cv = canvasLayer(el, 5, 'suit-cv', true);
      this.tile = document.createElement('canvas'); this.tile.width = T.W; this.tile.height = T.H;
      this.tx = this.tile.getContext('2d'); this.img = this.tx.createImageData(T.W, T.H);
      layer(el, svg(`<defs>
          <radialGradient id="sfA" cx=".24" cy=".3" r=".5"><stop offset="0" stop-color="#9cc0ff" stop-opacity=".16"/><stop offset="1" stop-color="#9cc0ff" stop-opacity="0"/></radialGradient>
          <radialGradient id="sfB" cx=".78" cy=".74" r=".55"><stop offset="0" stop-color="#000418" stop-opacity=".5"/><stop offset="1" stop-color="#000418" stop-opacity="0"/></radialGradient>
          <linearGradient id="sfC" x1="0" y1="0" x2="1" y2=".55"><stop offset=".3" stop-color="#000830" stop-opacity="0"/><stop offset=".47" stop-color="#000830" stop-opacity=".42"/><stop offset=".53" stop-color="#a8c6ff" stop-opacity=".12"/><stop offset=".68" stop-color="#000830" stop-opacity="0"/></linearGradient>
          <linearGradient id="sfD" x1="1" y1="0" x2=".2" y2="1"><stop offset=".5" stop-color="#000830" stop-opacity="0"/><stop offset=".7" stop-color="#000830" stop-opacity=".34"/><stop offset=".86" stop-color="#000830" stop-opacity="0"/></linearGradient>
          <linearGradient id="seamG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".55" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#b8d0ff" stop-opacity=".35"/></linearGradient></defs>
        <rect x="-100" y="-100" width="1800" height="1200" fill="url(#sfA)"/><rect x="-100" y="-100" width="1800" height="1200" fill="url(#sfB)"/>
        <rect x="-100" y="-100" width="1800" height="1200" fill="url(#sfC)"/><rect x="-100" y="-100" width="1800" height="1200" fill="url(#sfD)"/>
        <path d="M-60 170 C380 250 720 110 1010 290 S1500 410 1700 320" fill="none" stroke="#000a2a" stroke-opacity=".55" stroke-width="10"/>
        <path d="M-60 166 C380 246 720 106 1010 286 S1500 406 1700 316" fill="none" stroke="#9fc0ff" stroke-opacity=".28" stroke-width="2"/>
        <path d="M-60 182 C380 262 720 122 1010 302 S1500 422 1700 332" fill="none" stroke="#cfe0ff" stroke-opacity=".32" stroke-width="1.3" stroke-dasharray="7 5"/>
        <path d="M-60 156 C380 236 720 96 1010 276 S1500 396 1700 306" fill="none" stroke="#cfe0ff" stroke-opacity=".32" stroke-width="1.3" stroke-dasharray="7 5"/>
        <path d="M1190 -40 C1105 300 1265 610 1150 1040" fill="none" stroke="#000a2a" stroke-opacity=".5" stroke-width="10"/>
        <path d="M1186 -40 C1101 300 1261 610 1146 1040" fill="none" stroke="#9fc0ff" stroke-opacity=".26" stroke-width="2"/>
        <path d="M1199 -40 C1114 300 1274 610 1159 1040" fill="none" stroke="#cfe0ff" stroke-opacity=".3" stroke-width="1.3" stroke-dasharray="7 5"/>`, 'xMidYMid slice'), 5, 'suit-over');
      this.spot = layer(el, '', 0, 'suit-spot');
      layer(el, '', 0, 'vignette');
      this.key = '';
    },
    update(t, mx, my, idle) {
      let lx = mx, ly = my;
      if (idle) { lx = Math.cos(t * .25) * .8; ly = Math.sin(t * .31) * .6; }
      const key = Math.round(lx * 60) + ',' + Math.round(ly * 60);
      if (key === this.key) return; this.key = key;
      const T = SM.tex.suit, { ctx, c } = this.cv;
      T.light(lx * 1.25, ly * 1.25, this.img.data); this.tx.putImageData(this.img, 0, 0);
      const pat = ctx.createPattern(this.tile, 'repeat'), r = c.width / Math.max(1, this.cv.w), sc = .42 * r;
      if (pat.setTransform) pat.setTransform(new DOMMatrix([sc, 0, 0, sc, 0, 0]));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = pat; ctx.fillRect(0, 0, c.width, c.height);
      const gx = (.5 + lx * .42) * c.width, gy = (.5 + ly * .42) * c.height, g = ctx.createRadialGradient(gx, gy, 0, gx, gy, c.width * .5);
      g.addColorStop(0, 'rgba(120,170,255,.42)'); g.addColorStop(.35, 'rgba(70,120,240,.14)'); g.addColorStop(1, 'rgba(0,10,60,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
      const g2 = ctx.createRadialGradient(c.width - gx, c.height - gy, 0, c.width - gx, c.height - gy, c.width * .6);
      g2.addColorStop(0, 'rgba(0,4,30,.45)'); g2.addColorStop(1, 'rgba(0,4,30,0)');
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g2; ctx.fillRect(0, 0, c.width, c.height);
      ctx.restore();
    },
    resize() { if (this.cv) { this.cv.resize(); this.key = ''; } }
  });

  /* ---------- 2. CAPE RED ---------- */
  def({
    id: 'cape', name: 'Cape Red', preview: 'linear-gradient(100deg,#5a0710,#c01424 40%,#7a0a14 60%,#b3121f)', exp: ['#a0101c', '#4a050c'],
    build(el) {
      this.cv = canvasLayer(el, 6);
      const r = SM.rng(8); this.folds = [];
      for (let i = 0; i < 10; i++) this.folds.push({ x: -.08 + i * .12 + r() * .04, w: .05 + r() * .06, sp: .25 + r() * .35, ph: r() * 6, amp: .012 + r() * .02 });
      layer(el, '', 4, 'cape-weave', `background-image:url(${SM.tex.weave});background-size:6px 6px`);
      layer(el, svg(`<g transform="translate(1180 690) rotate(-8) scale(1.25)" opacity=".16">${SM.shield(0, 0, 220, 'ink')}</g>`, 'xMidYMid slice'), 8);
      layer(el, '', 0, 'vignette');
    },
    update(t, mx, my, idle) {
      const { ctx, w, h } = this.cv;
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#a8121f'); g.addColorStop(.6, '#700812'); g.addColorStop(1, '#3a030a');
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (const fd of this.folds) {
        const sway = Math.sin(t * fd.sp + fd.ph) * fd.amp, x0 = (fd.x + sway) * w, ww = fd.w * w, x1 = (fd.x + sway * 2.2 + fd.amp) * w, ww1 = ww * 1.5;
        const gr = ctx.createLinearGradient(x0 - ww, 0, x0 + ww, 0);
        gr.addColorStop(0, 'rgba(30,0,4,0)'); gr.addColorStop(.38, 'rgba(30,0,4,.6)'); gr.addColorStop(.55, 'rgba(255,120,110,.20)'); gr.addColorStop(.72, 'rgba(255,190,170,.12)'); gr.addColorStop(1, 'rgba(30,0,4,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x0 - ww, 0); ctx.bezierCurveTo(x0 - ww * .6, h * .35, x1 - ww1 * 1.2, h * .65, x1 - ww1, h); ctx.lineTo(x1 + ww1, h); ctx.bezierCurveTo(x1 + ww1 * 1.2, h * .65, x0 + ww * .6, h * .35, x0 + ww, 0); ctx.closePath(); ctx.fill();
      }
      const lx = idle ? Math.sin(t * .2) * .6 : mx, ly = idle ? -.3 : my, sx = (.5 + lx * .4) * w, sy = (.4 + ly * .3) * h;
      const sh = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * .45); sh.addColorStop(0, 'rgba(255,120,100,.22)'); sh.addColorStop(1, 'rgba(255,120,100,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = sh; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over';
    },
    resize() { this.cv && this.cv.resize(); }
  });

  /* ---------- 3. METROPOLIS NIGHT ---------- */
  function skyline(seed, n, minH, maxH, col, winId, yBase, opts = {}) {
    const r = SM.rng(seed); let s = '', x = -40;
    while (x < 1640) {
      const w = 50 + r() * (opts.maxW || 110), h = minH + r() * (maxH - minH), top = yBase - h;
      s += `<rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${f(h + 5)}" fill="${col}"/>`;
      if (winId) s += `<rect x="${f(x + 5)}" y="${f(top + 10)}" width="${f(w - 10)}" height="${f(h - 10)}" fill="url(#${winId})"/>`;
      const k = r();
      if (k < .25) s += `<rect x="${f(x + w * .2)}" y="${f(top - 22)}" width="${f(w * .6)}" height="24" fill="${col}"/><rect x="${f(x + w * .35)}" y="${f(top - 40)}" width="${f(w * .3)}" height="20" fill="${col}"/>`;
      else if (k < .4) s += `<path d="M${f(x + w * .5 - 2)} ${f(top)} L${f(x + w * .5)} ${f(top - 60 - r() * 60)} L${f(x + w * .5 + 2)} ${f(top)} Z" fill="${col}"/>`;
      else if (k < .5) s += `<path d="M${f(x)} ${f(top)} L${f(x + w / 2)} ${f(top - w * .45)} L${f(x + w)} ${f(top)} Z" fill="${col}"/>`;
      x += w + r() * (opts.gap || 14);
    }
    return s;
  }
  function windowPattern(id, seed, lit, col, w, h) {
    const r = SM.rng(seed); let s = `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w || 96}" height="${h || 120}">`;
    for (let y = 0; y < (h || 120); y += 12) for (let x = 0; x < (w || 96); x += 9) if (r() < lit) s += `<rect x="${x + 2}" y="${y + 3}" width="4.5" height="6.5" fill="${col}" opacity="${f(.45 + r() * .55)}"/>`;
    return s + '</pattern>';
  }
  def({
    id: 'metropolis', name: 'Metropolis Night', preview: 'linear-gradient(180deg,#030816,#16285a 60%,#3a2a4a)', exp: ['#0b1d44', '#030716'],
    build(el) {
      layer(el, '', 0, 'fill', 'background:linear-gradient(180deg,#02050f 0%,#0a1838 45%,#1e2d5c 70%,#4a3350 88%,#6a4040 100%)');
      layer(el, svg(stars(220, 3, 1600, 1000, .62, 1.6)), 2);
      layer(el, svg(`<defs><radialGradient id="mg"><stop offset="0" stop-color="#fff8e0" stop-opacity=".55"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/></radialGradient></defs>
        <circle cx="1270" cy="180" r="170" fill="url(#mg)"/><circle cx="1270" cy="180" r="56" fill="#f4f0dc"/><circle cx="1252" cy="166" r="11" fill="#d8d2b8"/><circle cx="1290" cy="196" r="8" fill="#d8d2b8"/><circle cx="1278" cy="160" r="5" fill="#d8d2b8"/><circle cx="1256" cy="200" r="6" fill="#e2dcc4"/>`), 3);
      layer(el, `<div class="drift" style="background-image:url(${cloudStrip(1600, 300, 5, '150,160,200', '40,50,90', .46, .5)});--tw:1600px;background-size:1600px 300px;height:300px;top:12%;animation-duration:140s"></div>`, 5, 'clouds');
      layer(el, svg(`<defs>${windowPattern('w1', 11, .12, '#9fb4e8', 96, 120)}</defs>${skyline(21, 30, 180, 420, '#18244c', 'w1', 1000, { maxW: 90, gap: 4 })}`), 8);
      layer(el, '<i class="beam" style="left:27%"></i><i class="beam b2" style="left:74%"></i>', 10, 'beams');
      const globe = `<g transform="translate(1135 0)"><rect x="-70" y="470" width="140" height="540" fill="#0c1430"/><rect x="-62" y="480" width="124" height="520" fill="url(#w2)"/><rect x="-40" y="430" width="80" height="44" fill="#0c1430"/><rect x="-8" y="400" width="16" height="34" fill="#0c1430"/>
        <circle cx="0" cy="360" r="54" fill="url(#globeG)"/><ellipse cx="0" cy="360" rx="20" ry="54" fill="none" stroke="#6a4a18" stroke-width="2"/><ellipse cx="0" cy="360" rx="42" ry="54" fill="none" stroke="#6a4a18" stroke-width="1.5"/><line x1="-54" y1="360" x2="54" y2="360" stroke="#6a4a18" stroke-width="2"/>
        <ellipse cx="0" cy="360" rx="82" ry="17" fill="none" stroke="#e8c26a" stroke-width="6" transform="rotate(-14 0 360)"/></g>`;
      layer(el, svg(`<defs>${windowPattern('w2', 12, .38, '#ffd98a', 96, 120)}<radialGradient id="globeG" cx=".35" cy=".3"><stop offset="0" stop-color="#ffe8a8"/><stop offset=".6" stop-color="#c8902e"/><stop offset="1" stop-color="#5a3a0a"/></radialGradient></defs>${skyline(33, 20, 240, 560, '#0c1430', 'w2', 1000, { maxW: 120, gap: 22 })}${globe}`), 15);
      const r = SM.rng(9); let lights = '';
      for (let i = 0; i < 12; i++) lights += `<circle class="blink" style="animation-delay:${f(-r() * 2)}s" cx="${f(r() * 1600)}" cy="${f(420 + r() * 200)}" r="3" fill="#ff3b3b"/>`;
      lights += `<g class="plane"><circle cx="0" cy="210" r="2.5" fill="#fff"/><circle class="blink" cx="-8" cy="210" r="2.2" fill="#ff4040"/></g>`;
      layer(el, svg(lights), 15);
      layer(el, svg(`<defs>${windowPattern('w3', 14, .2, '#ffc870', 96, 120)}</defs>${skyline(45, 16, 90, 300, '#060b1c', 'w3', 1000, { maxW: 150, gap: 6 })}`), 24);
      layer(el, '', 0, 'haze', 'background:linear-gradient(0deg,rgba(255,150,80,.25),transparent 30%)');
      layer(el, '', 0, 'vignette');
    }
  });

  /* ---------- 4. OUTER SPACE ---------- */
  def({
    id: 'space', name: 'Outer Space', preview: 'radial-gradient(circle at 70% 70%,#2a5dbf 0,#0b1030 18%,#000 70%)', exp: ['#0b0a26', '#000'],
    build(el) {
      layer(el, '', 0, 'fill', 'background:#000005');
      const neb = document.createElement('canvas'); neb.width = 1024; neb.height = 640; const nx = neb.getContext('2d'), r = SM.rng(17);
      const cols = ['rgba(120,60,200,', 'rgba(40,90,200,', 'rgba(200,60,140,', 'rgba(30,160,190,'];
      for (let i = 0; i < 90; i++) { const x = r() * 1024, y = 150 + r() * 380, rad = 40 + r() * 170, c = cols[i % 4]; const g = nx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, c + (.05 + r() * .09) + ')'); g.addColorStop(1, c + '0)'); nx.fillStyle = g; nx.fillRect(0, 0, 1024, 640); }
      layer(el, '', 3, 'nebula', `background:url(${neb.toDataURL()}) center/cover no-repeat`);
      this.cv = canvasLayer(el, 0);
      const rr = SM.rng(23); this.stars = [];
      for (let i = 0; i < 520; i++) this.stars.push({ x: rr(), y: rr(), z: .15 + rr() * .85, p: rr() * 6.28, c: rr() < .1 ? '#ffd9b0' : rr() < .2 ? '#b8d0ff' : '#fff' });
      this.earth = document.createElement('canvas'); this.earth.width = this.earth.height = 420; this.ex = this.earth.getContext('2d'); this.frame = 0; this.rot = -95; if (!SM._earthR) SM._earthR = makeEarth(420); this.er = SM._earthR;
      this.shoot = null;
    },
    update(t, mx, my) {
      const { ctx, w, h } = this.cv; ctx.clearRect(0, 0, w, h);
      for (const s of this.stars) {
        const x = ((s.x * w - t * 4 * s.z - mx * 30 * s.z) % w + w) % w, y = ((s.y * h - my * 20 * s.z) % h + h) % h;
        const a = .45 + .55 * Math.sin(t * (1 + s.z * 2) + s.p) * .5 + .25;
        ctx.globalAlpha = Math.max(.1, Math.min(1, a)); ctx.fillStyle = s.c;
        const rad = s.z * 1.5; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (this.frame++ % 3 === 0) { this.rot += .12; this.ex.putImageData(this.er(this.ex, this.rot), 0, 0); }
      const er = Math.min(w, h) * .34, ex = w * .86 - mx * 14, ey = h * .92 - my * 10;
      const glow = ctx.createRadialGradient(ex, ey, er * .96, ex, ey, er * 1.18); glow.addColorStop(0, 'rgba(90,170,255,.55)'); glow.addColorStop(.3, 'rgba(60,130,255,.2)'); glow.addColorStop(1, 'rgba(40,90,255,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ex, ey, er * 1.25, 0, 6.283); ctx.fill();
      ctx.drawImage(this.earth, ex - er, ey - er, er * 2, er * 2);
      if (!this.shoot && Math.random() < .004) this.shoot = { x: Math.random() * w, y: Math.random() * h * .5, t: 0 };
      if (this.shoot) {
        const s = this.shoot; s.t += .02; const L = 160, x = s.x + s.t * 700, y = s.y + s.t * 260;
        const g = ctx.createLinearGradient(x, y, x - L, y - L * .37); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L, y - L * .37); ctx.stroke();
        if (s.t > 1) this.shoot = null;
      }
    },
    resize() { this.cv && this.cv.resize(); },
    exportCanvas() { return this.cv && this.cv.c; }
  });

  /* ---------- 5. KRYPTON RED SUN ---------- */
  function sunTexture(size, c0, c1, c2) {
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), R = size / 2, r = SM.rng(5);
    const g = x.createRadialGradient(R, R, 0, R, R, R); g.addColorStop(0, c0); g.addColorStop(.7, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.beginPath(); x.arc(R, R, R, 0, 6.283); x.fill();
    x.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 2600; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * R, px = R + Math.cos(a) * d, py = R + Math.sin(a) * d, s = 2 + r() * 7; x.fillStyle = r() > .5 ? 'rgba(255,230,160,.10)' : 'rgba(80,0,0,.12)'; x.beginPath(); x.arc(px, py, s, 0, 6.283); x.fill(); }
    return c.toDataURL();
  }
  function embers(cv, list, t, col) {
    const { ctx, w, h } = cv; ctx.clearRect(0, 0, w, h);
    for (const p of list) {
      p.y -= p.v; p.x += Math.sin(t + p.p) * .3; if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      const a = .4 + .6 * Math.sin(t * 3 + p.p) * .5 + .3;
      ctx.fillStyle = col(p, a); ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill();
    }
  }
  def({
    id: 'krypton', name: 'Krypton Red Sun', preview: 'radial-gradient(circle at 50% 110%,#ff6a2a,#a01408 35%,#2a0206 70%)', exp: ['#6a0a08', '#12000a'],
    build(el) {
      layer(el, '', 0, 'fill', 'background:linear-gradient(180deg,#0e0008 0%,#3a040e 40%,#8a120c 70%,#c43214 100%)');
      layer(el, svg(stars(90, 41, 1600, 1000, .4, 1.2)), 2);
      layer(el, `<img alt="" src="${sunTexture(700, '#ffd08a', '#ff5a1a', '#b01008')}" class="bigsun">`, 4, 'sunwrap');
      layer(el, svg(crystalsSVG(71, 26, -50, 1650, 1000, 180, 520, ['#3a0508', '#1a0204', '#ff6a4a'])), 9, '', 'opacity:.75');
      layer(el, svg(crystalsSVG(72, 18, -50, 1650, 1010, 260, 700, ['#1a0204', '#0a0002', '#ff8a5a'], '#ff5a3a')), 16);
      layer(el, '', 0, 'haze', 'background:linear-gradient(0deg,rgba(255,90,30,.3),transparent 40%)');
      this.cv = canvasLayer(el, 0);
      this.p = Array.from({ length: 90 }, () => ({ x: Math.random() * this.cv.w, y: Math.random() * this.cv.h, v: .3 + Math.random() * 1.1, s: .6 + Math.random() * 2.2, p: Math.random() * 6 }));
      layer(el, '', 0, 'vignette');
    },
    update(t) { embers(this.cv, this.p, t, (p, a) => `rgba(255,${120 + (p.s * 40 | 0)},60,${Math.min(1, a).toFixed(2)})`); },
    resize() { this.cv && this.cv.resize(); }
  });

  /* ---------- 6. FORTRESS ICE ---------- */
  function aurora(cv, t, cols) {
    const { ctx, w, h } = cv; ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 3; b++) {
      for (let x = 0; x < w; x += 16) {
        const y = h * (.18 + b * .07) + Math.sin(x * .004 + t * .4 + b) * 40 + Math.sin(x * .011 - t * .7) * 16;
        const hh = 90 + 60 * Math.sin(x * .006 + t * .5 + b * 2);
        const g = ctx.createLinearGradient(0, y - hh, 0, y);
        g.addColorStop(0, cols[b] + '0)'); g.addColorStop(.7, cols[b] + '.10)'); g.addColorStop(1, cols[b] + '0)');
        ctx.fillStyle = g; ctx.fillRect(x, y - hh, 16, hh);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  def({
    id: 'fortress', name: 'Fortress Ice', preview: 'linear-gradient(180deg,#eaf6ff,#9fcbef 60%,#4d82b8)', exp: ['#bfe0f5', '#5d8fc0'],
    build(el) {
      layer(el, '', 0, 'fill', 'background:linear-gradient(180deg,#0e2a4a 0%,#2f6a9e 30%,#8cc3ea 62%,#e8f6ff 100%)');
      this.au = canvasLayer(el, 3, '', .3);
      layer(el, '', 0, 'rays');
      layer(el, svg(crystalsSVG(81, 30, -60, 1660, 1000, 250, 620, ['#a9d3f2', '#6fa6d6', '#ffffff'])), 7, '', 'opacity:.7');
      layer(el, svg(crystalsSVG(82, 20, -60, 1660, 1000, 300, 780, ['#dff1ff', '#8fbfe6', '#ffffff'], '#ffffff')), 14);
      layer(el, svg(`<path d="M0 930 Q400 880 800 925 T1600 915 L1600 1000 L0 1000 Z" fill="#f4fbff"/><path d="M0 960 Q500 930 900 962 T1600 950 L1600 1000 L0 1000 Z" fill="#ffffff"/>`), 20);
      this.cv = canvasLayer(el, 0);
      this.p = Array.from({ length: 160 }, () => ({ x: Math.random() * this.cv.w, y: Math.random() * this.cv.h, v: .4 + Math.random() * 1.2, s: .8 + Math.random() * 2.4, p: Math.random() * 6 }));
      layer(el, '', 0, 'vignette light');
    },
    update(t) {
      aurora(this.au, t, ['rgba(120,255,210,', 'rgba(110,180,255,', 'rgba(180,140,255,']);
      const { ctx, w, h } = this.cv; ctx.clearRect(0, 0, w, h);
      for (const p of this.p) { p.y += p.v; p.x += Math.sin(t * .8 + p.p) * .6; if (p.y > h + 5) { p.y = -5; p.x = Math.random() * w; } ctx.fillStyle = `rgba(255,255,255,${(.5 + p.s / 6).toFixed(2)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill(); }
    },
    resize() { this.cv && this.cv.resize(); this.au && this.au.resize(); }
  });

  /* ---------- 7. SMALLVILLE SUNSET ---------- */
  def({
    id: 'smallville', name: 'Smallville Sunset', preview: 'linear-gradient(180deg,#2b3a6b,#e0784a 55%,#ffd27a 75%,#3a2a12)', exp: ['#e0784a', '#2b3a6b'],
    build(el) {
      layer(el, '', 0, 'fill', 'background:linear-gradient(180deg,#1f2c5c 0%,#6a4a7a 28%,#d86a4a 52%,#f5a54a 66%,#ffd98a 74%,#e8a050 80%)');
      layer(el, svg(`<defs><radialGradient id="sg"><stop offset="0" stop-color="#fffbe0"/><stop offset=".25" stop-color="#ffe9a0"/><stop offset=".6" stop-color="#ffb050" stop-opacity=".45"/><stop offset="1" stop-color="#ff8030" stop-opacity="0"/></radialGradient></defs>
        <circle cx="1250" cy="690" r="330" fill="url(#sg)"/><circle cx="1250" cy="690" r="78" fill="#fff6d0"/>`), 3);
      layer(el, `<div class="drift" style="background-image:url(${cloudStrip(1600, 360, 9, '255,206,160', '140,80,120', .44, .9)});--tw:1600px;background-size:1600px 360px;height:360px;top:8%;animation-duration:180s"></div>`, 5, 'clouds');
      let birds = ''; const r = SM.rng(4);
      for (let i = 0; i < 7; i++) birds += `<path class="bird" style="animation-delay:${f(-r() * 3)}s" d="M${f(r() * 120)} ${f(r() * 60)} q8 -8 16 0 q8 -8 16 0" fill="none" stroke="#2a1a24" stroke-width="2.2"/>`;
      layer(el, svg(`<g class="flock">${birds}</g>`, 'xMidYMid slice'), 6, 'birds');
      layer(el, svg(`<path d="M0 760 Q300 700 600 740 T1200 720 T1600 735 L1600 1000 L0 1000 Z" fill="#6a4a6a" opacity=".75"/>`), 8);
      const farm = `<g fill="#1c1210"><rect x="300" y="700" width="110" height="80"/><path d="M290 702 L355 650 L420 702 Z"/><rect x="330" y="720" width="18" height="20" fill="#ffcf70"/><rect x="365" y="720" width="18" height="20" fill="#ffcf70"/>
        <path d="M470 780 L470 700 L500 670 L560 670 L590 700 L590 780 Z"/><rect x="600" y="640" width="36" height="140" rx="18"/><path d="M745 780 L764 600 L783 780 Z" fill="none" stroke="#1c1210" stroke-width="3"/><path d="M750 740 L778 700 M778 740 L750 700" stroke="#1c1210" stroke-width="2"/><g transform="translate(764 598)"><g class="blades">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 0 L-4 -54 L4 -54 Z" transform="rotate(${a})"/>`).join('')}<circle r="5"/></g><path d="M0 0 L26 -6 L26 6 Z"/></g></g>
        <path d="M0 790 Q400 760 800 780 T1600 770 L1600 1000 L0 1000 Z" fill="#3a2a18"/>`;
      layer(el, svg(farm), 12);
      this.cv = canvasLayer(el, 20, 'bottom');
      const rr = SM.rng(6); this.stalks = Array.from({ length: 520 }, () => ({ x: rr(), h: .1 + rr() * .16, p: rr() * 6, c: rr() }));
      layer(el, '', 0, 'vignette');
    },
    update(t, mx) {
      const { ctx, w, h } = this.cv, H = h / .34; ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, h - H * .2, 0, h); g.addColorStop(0, '#5a3a14'); g.addColorStop(1, '#2a1a08');
      ctx.fillStyle = g; ctx.fillRect(0, h - H * .16, w, H * .16);
      ctx.lineWidth = 1.6;
      for (const s of this.stalks) {
        const x = s.x * w, base = h, top = h - s.h * H, sway = Math.sin(t * 1.4 + s.x * 9 + s.p) * 7 + mx * 6;
        ctx.strokeStyle = s.c < .5 ? '#c8902e' : s.c < .8 ? '#8a5a1a' : '#f0c060';
        ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + sway * .3, (base + top) / 2, x + sway, top); ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.ellipse(x + sway, top - 6, 2.4, 8, sway * .03, 0, 6.283); ctx.fill();
      }
    },
    resize() { this.cv && this.cv.resize(); }
  });

  /* ---------- 8. DAILY PLANET ROOFTOP ---------- */
  def({
    id: 'rooftop', name: 'Daily Planet Rooftop', preview: 'linear-gradient(180deg,#241a4a,#a0506a 55%,#ffb070 80%,#1a1420)', exp: ['#a0506a', '#241a4a'],
    build(el) {
      layer(el, '', 0, 'fill', 'background:linear-gradient(180deg,#130f33 0%,#3a2a66 30%,#a0507a 58%,#ff9a6a 76%,#ffc890 86%)');
      layer(el, svg(stars(80, 61, 1600, 1000, .3, 1.2)), 2);
      layer(el, svg(`<defs>${windowPattern('w5', 51, .3, '#ffdca0', 96, 120)}</defs>${skyline(52, 30, 160, 420, '#2a2040', 'w5', 1000, { maxW: 90, gap: 4 })}`), 7, '', 'opacity:.9');
      const r = SM.rng(3); let letters = '';
      const word = 'DAILY PLANET';
      this.globe = layer(el, `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
        <defs><radialGradient id="dpG" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff2c0"/><stop offset=".45" stop-color="#d9a441"/><stop offset="1" stop-color="#4a2c06"/></radialGradient>
        <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2e3a"/><stop offset="1" stop-color="#140f16"/></linearGradient>
        <path id="ringFront" d="M1000 520 A230 52 -8 0 0 1460 456"/></defs>
        <rect x="0" y="800" width="1600" height="200" fill="url(#roofG)"/><rect x="0" y="790" width="1600" height="16" fill="#4a3a48"/>
        <g fill="#18121a"><rect x="120" y="610" width="130" height="150"/><path d="M110 612 L185 560 L260 612 Z"/><rect x="128" y="760" width="10" height="40"/><rect x="232" y="760" width="10" height="40"/><rect x="360" y="700" width="6" height="100"/><rect x="420" y="660" width="4" height="140"/></g>
        <circle class="blink" cx="422" cy="656" r="4" fill="#ff4040"/><circle class="blink" style="animation-delay:-1s" cx="363" cy="696" r="3.5" fill="#ff4040"/>
        <rect x="1195" y="560" width="70" height="240" fill="#1d1620"/><path d="M1170 800 L1195 600 L1265 600 L1290 800 Z" fill="#241c28"/>
        <circle cx="1230" cy="400" r="170" fill="url(#dpG)"/>
        <g id="dpMer" fill="none" stroke="#5a3a0a" stroke-width="3" opacity=".75"></g>
        <g fill="none" stroke="#5a3a0a" stroke-width="2.6" opacity=".65"><ellipse cx="1230" cy="400" rx="170" ry="24"/><ellipse cx="1230" cy="340" rx="158" ry="21"/><ellipse cx="1230" cy="460" rx="158" ry="21"/><ellipse cx="1230" cy="285" rx="118" ry="16"/><ellipse cx="1230" cy="515" rx="118" ry="16"/></g>
        <ellipse cx="1230" cy="488" rx="230" ry="52" fill="none" stroke="#f3d27a" stroke-width="16" transform="rotate(-8 1230 488)"/>
        <ellipse cx="1230" cy="488" rx="230" ry="52" fill="none" stroke="#7a5412" stroke-width="2" transform="rotate(-8 1230 488) translate(0 7)"/>
        <text font-family="SMCinzel, Cinzel, serif" font-weight="700" font-size="30" fill="#2a1a04" letter-spacing="10" dy="10"><textPath href="#ringFront" startOffset="8%">${word}</textPath></text>
      </svg>`, 12);
      this.mer = this.globe.querySelector('#dpMer');
      layer(el, '', 0, 'vignette');
    },
    update(t) {
      if (!this.mer) return; let s = '';
      for (let i = 0; i < 8; i++) { const a = ((t * 12 + i * 22.5) % 180) * Math.PI / 180, rx = Math.abs(Math.cos(a)) * 170; s += `<ellipse cx="1230" cy="400" rx="${f(rx)}" ry="170"/>`; }
      this.mer.innerHTML = s;
    }
  });

  /* ---------- 9. KRYPTONIAN SKY ---------- */
  def({
    id: 'kryptonsky', name: 'Kryptonian Sky', preview: 'linear-gradient(180deg,#0c2a3a,#3a6a7a 45%,#e0603a 80%,#401020)', exp: ['#2a5a6a', '#0c1a2a'],
    build(el) {
      layer(el, '', 0, 'fill', 'background:linear-gradient(180deg,#07121f 0%,#123a4e 30%,#3f7a82 55%,#c77048 78%,#e8894a 86%,#40121e 100%)');
      layer(el, svg(stars(120, 91, 1600, 1000, .45, 1.4)), 2);
      this.au = canvasLayer(el, 3, '', .3);
      layer(el, svg(`<defs><radialGradient id="ks"><stop offset="0" stop-color="#ffd0a0"/><stop offset=".5" stop-color="#ff5a2a"/><stop offset=".8" stop-color="#c01a1a" stop-opacity=".6"/><stop offset="1" stop-color="#c01a1a" stop-opacity="0"/></radialGradient></defs>
        <circle cx="330" cy="900" r="460" fill="url(#ks)"/>
        <circle cx="1240" cy="210" r="46" fill="#cfe8f0"/><circle cx="1258" cy="200" r="44" fill="#1a3a4e"/>
        <circle cx="420" cy="140" r="22" fill="#e8d0b0"/><circle cx="413" cy="135" r="21" fill="#3a5a6a" opacity=".6"/>`), 4);
      let isl = '';
      [[1240, 330, .8], [380, 300, .6], [1330, 600, .55]].forEach(([x, y, s], i) => {
        isl += `<g class="float" style="animation-delay:${-i * 1.7}s"><g transform="translate(${x} ${y}) scale(${s})"><path d="M-110 0 L110 0 L60 60 L20 130 L-10 70 L-50 90 Z" fill="#132a36"/><path d="M-110 0 L110 0 L60 60 Z" fill="#1d4252"/>${crystalsSVG(100 + i, 7, -90, 90, 2, 60, 180, ['#6fd6e8', '#2f8aa8', '#e8ffff'], '#9ff4ff')}</g></g>`;
      });
      layer(el, svg(isl), 9);
      layer(el, svg(crystalsSVG(95, 24, -60, 1660, 1000, 200, 560, ['#0e2230', '#07131c', '#6fd6e8'], '#6fd6e8')), 16);
      layer(el, '', 0, 'vignette');
    },
    update(t) { aurora(this.au, t * .8, ['rgba(255,110,180,', 'rgba(90,240,220,', 'rgba(140,120,255,']); },
    resize() { this.au && this.au.resize(); }
  });

  /* ---------- 10. ABOVE THE CLOUDS ---------- */
  def({
    id: 'clouds', name: 'Above the Clouds', preview: 'linear-gradient(180deg,#1a3a7a,#f0905a 60%,#fff0c0 72%,#e8d8e8)', exp: ['#f0905a', '#1a3a7a'],
    build(el) {
      layer(el, '', 0, 'fill', 'background:linear-gradient(180deg,#0a1f55 0%,#2a4c9a 22%,#7a6ab0 40%,#e88a78 54%,#ffc07a 62%,#ffe6b0 67%,#f3d6c8 74%,#c9b4d0 100%)');
      layer(el, svg(stars(40, 5, 1600, 1000, .18, 1)), 1, '', 'opacity:.6');
      this.sun = layer(el, svg(`<defs><radialGradient id="cs"><stop offset="0" stop-color="#fff"/><stop offset=".1" stop-color="#fff6d8"/><stop offset=".35" stop-color="#ffc870" stop-opacity=".45"/><stop offset="1" stop-color="#ff9050" stop-opacity="0"/></radialGradient>
        <linearGradient id="csr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff0c0" stop-opacity="0"/><stop offset=".5" stop-color="#fff0c0" stop-opacity=".5"/><stop offset="1" stop-color="#fff0c0" stop-opacity="0"/></linearGradient></defs>
        <circle cx="1210" cy="640" r="460" fill="url(#cs)"/><rect x="200" y="636" width="2000" height="8" fill="url(#csr)"/><circle cx="1210" cy="640" r="46" fill="#fffef4"/>`), 2);
      const strips = [
        [11, '255,206,170', '140,100,150', 110, 52, 5, 240, .40, .9],
        [12, '255,228,200', '150,112,165', 75, 58, 11, 320, .38, .97],
        [13, '255,248,236', '168,132,180', 48, 66, 20, 400, .36, 1]];
      strips.forEach(([seed, a, b, dur, top, depth, hh, dens, al]) => layer(el, `<div class="drift" style="--tw:1800px;background-image:url(${cloudStrip(1800, hh, seed, a, b, dens, al)});background-size:1800px ${hh}px;height:${hh}px;top:${top}%;animation-duration:${dur}s"></div>`, depth, 'clouds'));
      layer(el, '', 0, 'fill', 'top:auto;height:12%;background:linear-gradient(180deg,rgba(236,214,226,0),#e6d2dc 60%)');
      this.flare = layer(el, '<i></i><i></i><i></i><i></i>', 0, 'flare');
      layer(el, '', 0, 'vignette light');
    },
    update(t, mx, my) {
      const is = this.flare.children, r = this.flare.getBoundingClientRect(), cx = .76, cy = .62, dx = (.5 + mx * .15) - cx, dy = (.5 + my * .15) - cy;
      [.5, .9, 1.3, 1.7].forEach((k, i) => { is[i].style.left = f((cx + dx * k) * 100) + '%'; is[i].style.top = f((cy + dy * k) * 100) + '%'; });
    }
  });

  SM.bgById = id => BG.find(b => b.id === id) || BG[0];
})(window.SM);
