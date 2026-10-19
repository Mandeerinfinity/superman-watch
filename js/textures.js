/* Procedural textures (canvas -> SVG patterns). All original and generated at runtime.
   v3: higher-resolution, finer, height-field shaded textures (guilloche depth, brushed grain, leather pores,
   carbon twill with fibres, embossed suit scales with specular), sized by the quality tier so phones stay fast. */
(function (SM) {
  'use strict';
  const T = SM.tex = {};
  function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function gray(v, a) { v = Math.max(0, Math.min(255, v | 0)); return `rgba(${v},${v},${v},${a === undefined ? 1 : a})`; }
  /* fast integer hash -> [0,1) */
  function h2(x, y, s) { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
  function h1(x, s) { return h2(x, 0, s); }
  function vnoise1(x, s) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return h1(i, s) * (1 - u) + h1(i + 1, s) * u; }
  /* tileable value noise on a period grid */
  function vnoise2(x, y, px, py, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const X0 = ((xi % px) + px) % px, X1 = (X0 + 1) % px, Y0 = ((yi % py) + py) % py, Y1 = (Y0 + 1) % py;
    const a = h2(X0, Y0, s), b = h2(X1, Y0, s), c = h2(X0, Y1, s), d = h2(X1, Y1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  /* shade a height field into a neutral-gray relief map (128 = flat), ready for overlay blending */
  function relief(hf, W, H, o) {
    o = o || {};
    const k = o.k || 3, Lx = o.lx === undefined ? -.55 : o.lx, Ly = o.ly === undefined ? -.65 : o.ly, Lz = o.lz || .55, ll = Math.hypot(Lx, Ly, Lz);
    const lx = Lx / ll, ly = Ly / ll, lz = Lz / ll, hx = lx, hy = ly, hz = lz + 1, hl = Math.hypot(hx, hy, hz);
    const spec = o.spec || 0, sp = o.specPow || 30, amb = o.amb === undefined ? .35 : o.amb, wrap = o.wrap !== false, gain = o.gain || 1;
    const c = cnv(W, H), x = c.getContext('2d'), id = x.createImageData(W, H), d = id.data;
    const at = wrap ? (i, j) => hf[((j + H) % H) * W + ((i + W) % W)] : (i, j) => hf[Math.max(0, Math.min(H - 1, j)) * W + Math.max(0, Math.min(W - 1, i))];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const dx = (at(i + 1, j) - at(i - 1, j)) * k, dy = (at(i, j + 1) - at(i, j - 1)) * k, n = Math.hypot(dx, dy, 1);
      const nx = -dx / n, ny = -dy / n, nz = 1 / n;
      const dif = nx * lx + ny * ly + nz * lz, s = spec ? Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), sp) * spec : 0;
      const flat = lz; /* diffuse of a flat surface -> maps to 128 */
      let v = 128 + (dif - flat) * 190 * gain + s * 255 + (o.ao ? (at(i, j) - .5) * o.ao * 60 : 0);
      if (o.base) v = o.base(i, j, v, dif, s);
      const p = (j * W + i) * 4; d[p] = d[p + 1] = d[p + 2] = v < 0 ? 0 : v > 255 ? 255 : v; d[p + 3] = 255;
    }
    x.putImageData(id, 0, 0); return c;
  }
  const url = (c, jpg) => jpg ? c.toDataURL('image/jpeg', .9) : c.toDataURL('image/png');

  function brushedRadial(S) {
    const c = cnv(S, S), x = c.getContext('2d'), id = x.createImageData(S, S), d = id.data, C = S / 2, k = S / 800;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const dx = i - C + .5, dy = j - C + .5, r = Math.sqrt(dx * dx + dy * dy) / k, th = Math.atan2(dy, dx);
      /* concentric grain: per-ring tone + streak segments that run along the circle */
      const ring = h1(Math.floor(r * 1.6), 3) - .5, ring2 = h1(Math.floor(r * 4.2), 5) - .5;
      const streak = vnoise1(th * r * .045 + h1(Math.floor(r * 1.6), 9) * 80, Math.floor(r * 1.6)) - .5;
      const v = 132 + ring * 34 + ring2 * 18 + streak * 30 * (h1(Math.floor(r * .8), 11) > .6 ? 1.6 : .6);
      const p = (j * S + i) * 4; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    const g = x.createConicGradient(-Math.PI / 4, C, C);
    [[0, '#fff'], [.07, '#eaeaea'], [.18, '#5a5a5a'], [.29, '#262626'], [.41, '#9a9a9a'], [.5, '#fff'], [.57, '#dcdcdc'], [.69, '#444'], [.8, '#1e1e1e'], [.92, '#aaa'], [1, '#fff']].forEach(s => g.addColorStop(s[0], s[1]));
    x.globalCompositeOperation = 'overlay'; x.fillStyle = g; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'source-over';
    return url(c, true);
  }
  function brushedLinear(S) {
    const c = cnv(S, S), x = c.getContext('2d'), id = x.createImageData(S, S), d = id.data;
    for (let j = 0; j < S; j++) {
      const row = h1(j, 21) - .5, row2 = h1(j >> 1, 22) - .5;
      for (let i = 0; i < S; i++) {
        const seg = vnoise1((i / S) * 9 + h1(j, 23) * 40, j) - .5, seg2 = vnoise1((i / S) * 31 + h1(j, 24) * 90, j + 7) - .5;
        const v = 138 + row * 40 + row2 * 16 + seg * 26 + seg2 * 12;
        const p = (j * S + i) * 4; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255;
      }
    }
    x.putImageData(id, 0, 0); return url(c, true);
  }
  function sunburst(S) {
    const c = cnv(S, S), x = c.getContext('2d'), id = x.createImageData(S, S), d = id.data, C = S / 2, N = 4096;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const dx = i - C + .5, dy = j - C + .5, r = Math.sqrt(dx * dx + dy * dy) / C, a = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) * N;
      const b = Math.floor(a), fr = a - b, ray = h1(b % N, 31) * (1 - fr) + h1((b + 1) % N, 31) * fr;
      const ray2 = h1(Math.floor(a / 7) % N, 37);
      const v = 128 + (ray - .5) * 70 + (ray2 - .5) * 26 + (h2(i, j, 5) - .5) * 10;
      const p = (j * S + i) * 4; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    const g = x.createConicGradient(-Math.PI / 3, C, C);
    [[0, '#fff'], [.12, '#777'], [.25, '#111'], [.38, '#777'], [.5, '#fff'], [.62, '#777'], [.75, '#111'], [.88, '#777'], [1, '#fff']].forEach(s => g.addColorStop(s[0], s[1]));
    x.globalCompositeOperation = 'overlay'; x.fillStyle = g; x.fillRect(0, 0, S, S);
    const rg = x.createRadialGradient(C, C, 0, C, C, C);
    rg.addColorStop(0, 'rgba(255,255,255,.22)'); rg.addColorStop(.7, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.45)');
    x.globalCompositeOperation = 'source-over'; x.fillStyle = rg; x.fillRect(0, 0, S, S);
    return url(c, true);
  }
  /* engraved guilloche: a real height field (wavy concentric grooves) shaded with light + specular */
  function guilloche(S) {
    const C = S / 2, hf = new Float32Array(S * S), k = S / 1024;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const dx = (i - C + .5) / k, dy = (j - C + .5) / k, r = Math.sqrt(dx * dx + dy * dy), th = Math.atan2(dy, dx);
      const w = r + 5.2 * Math.sin(18 * th + r * .045) + 1.6 * Math.sin(54 * th - r * .02);
      const g = .5 + .5 * Math.cos(w / 3.4 * Math.PI * 2);
      hf[j * S + i] = Math.pow(g, 1.6) * Math.min(1, r / 18);
    }
    return url(relief(hf, S, S, { k: 1.7 * k, spec: .55, specPow: 40, wrap: false, gain: 1.05 }), true);
  }
  function barleycorn(S) {
    const C = S / 2, hf = new Float32Array(S * S), k = S / 1024;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const dx = (i - C + .5) / k, dy = (j - C + .5) / k, r = Math.sqrt(dx * dx + dy * dy), th = Math.atan2(dy, dx);
      const a = Math.abs(Math.sin(th * 72 + Math.sin(r * .09) * 1.4)), b = .5 + .5 * Math.cos(r * .55);
      hf[j * S + i] = Math.min(a, b + .2);
    }
    return url(relief(hf, S, S, { k: 1.5 * k, spec: .45, specPow: 28, wrap: false }), true);
  }
  function snail(S) {
    const C = S / 2, hf = new Float32Array(S * S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const r = Math.hypot(i - C + .5, j - C + .5); hf[j * S + i] = .5 + .5 * Math.sin(r / S * 2 * Math.PI * 52); }
    return url(relief(hf, S, S, { k: 1.4, spec: .35, specPow: 24, wrap: false, gain: .8 }));
  }
  /* 2/2 twill carbon with individual fibres and a clear-coat sheen */
  function carbon(S) {
    const c = cnv(S, S), x = c.getContext('2d'), id = x.createImageData(S, S), d = id.data, N = 8, cs = S / N;
    const L = [-.5, -.65, .58], ll = Math.hypot(...L);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const ci = Math.floor(i / cs), cj = Math.floor(j / cs), horiz = ((ci + cj) % 4) < 2;
      const u = horiz ? (j % cs) / cs : (i % cs) / cs, v = horiz ? (i % cs) / cs : (j % cs) / cs;
      const bulge = Math.sin(Math.PI * u), nU = Math.cos(Math.PI * u) * .9, along = Math.sin(Math.PI * v) * .15;
      const nx = horiz ? along : nU, ny = horiz ? nU : along, nz = 1;
      const nl = Math.hypot(nx, ny, nz), dif = Math.max(0, (nx * -L[0] * -1 + ny * L[1] + nz * L[2]) / (nl * ll));
      const fib = h1(Math.floor(u * 22) + ci * 131 + cj * 71, 5) * .5 + vnoise1(v * 6 + u * 22, ci * 7 + cj) * .5;
      /* anisotropic highlight: fibres catch light across their axis */
      const aniso = Math.pow(Math.max(0, horiz ? .55 + .45 * nU : .55 - .45 * nU), 6) * (horiz ? 1 : .55);
      let val = 14 + bulge * 34 * dif + fib * 16 * bulge + aniso * 95;
      val *= .55 + .45 * Math.min(1, Math.min(u, 1 - u) * 8);
      const p = (j * S + i) * 4; d[p] = val * .96; d[p + 1] = val; d[p + 2] = val * 1.07; d[p + 3] = 255;
    }
    x.putImageData(id, 0, 0); return url(c);
  }
  /* pebbled leather: jittered-cell (Worley) pebbles, creases, pores and large-scale variation */
  function leather(S) {
    const G = 58, cell = S / G, hf = new Float32Array(S * S), pts = [];
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) pts.push([(i + .15 + .7 * h2(i, j, 41)) * cell, (j + .15 + .7 * h2(i, j, 42)) * cell]);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const ci = Math.floor(x / cell), cj = Math.floor(y / cell); let f1 = 1e9, f2 = 1e9;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = (ci + di + G) % G, jj = (cj + dj + G) % G, p = pts[jj * G + ii];
        let px = p[0] + (ci + di - ii) * cell, py = p[1] + (cj + dj - jj) * cell;
        const dd = (px - x) * (px - x) + (py - y) * (py - y);
        if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd;
      }
      const edge = (Math.sqrt(f2) - Math.sqrt(f1)) / cell, peb = Math.min(1, edge * 2.6);
      const big = vnoise2(x / S * 6, y / S * 6, 6, 6, 44) * .35 + vnoise2(x / S * 22, y / S * 22, 22, 22, 45) * .15;
      let hgt = peb * peb * (3 - 2 * peb) * .8 + big;
      if (h2(Math.floor(x * 640 / S), Math.floor(y * 640 / S), 46) > .9965) hgt -= .55; /* pores */
      hf[y * S + x] = hgt;
    }
    return url(relief(hf, S, S, { k: 2.2, spec: .18, specPow: 18, gain: .9, ao: 1 }), true);
  }
  function weave(S) {
    const hf = new Float32Array(S * S), n = 4, c = S / n;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const ci = Math.floor(x / c), cj = Math.floor(y / c), over = (ci + cj) % 2 === 0, u = (x % c) / c, v = (y % c) / c;
      const a = over ? Math.sin(Math.PI * v) : Math.sin(Math.PI * u), b = over ? Math.sin(Math.PI * u) : Math.sin(Math.PI * v);
      hf[y * S + x] = a * .8 + b * .2 + (h2(x, y, 7) - .5) * .06 + (over ? .1 : 0);
    }
    return url(relief(hf, S, S, { k: 2.5, spec: .25, specPow: 16, gain: 1.1 }));
  }
  function perlage() {
    const S = 240, c = cnv(S, S), x = c.getContext('2d');
    x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, S, S);
    const step = 20;
    for (let row = -1; row <= S / step + 1; row++) for (let col = -1; col <= S / step + 1; col++) {
      const px = col * step + (row % 2 ? step / 2 : 0), py = row * step * .9;
      const g = x.createConicGradient(row * .7 + col, px, py);
      [[0, '#e4e6e9'], [.25, '#8a8e94'], [.5, '#d6d9dd'], [.75, '#7e838a'], [1, '#e4e6e9']].forEach(s => g.addColorStop(s[0], s[1]));
      x.fillStyle = g; x.beginPath(); x.arc(px, py, 13, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1; x.stroke();
    }
    return url(c, true);
  }
  function geneva() {
    const S = 256, c = cnv(S, S), x = c.getContext('2d'), band = 32;
    for (let i = -2; i < S / band + 2; i++) {
      const g = x.createLinearGradient(i * band, 0, i * band + band, 0);
      g.addColorStop(0, '#6d6d6d'); g.addColorStop(.45, '#f2f2f2'); g.addColorStop(.55, '#dedede'); g.addColorStop(1, '#6d6d6d');
      x.fillStyle = g; x.fillRect(i * band, 0, band, S);
    }
    return url(c, true);
  }
  function noise(S, a) {
    const c = cnv(S, S), x = c.getContext('2d'), id = x.createImageData(S, S), r = SM.rng(51);
    for (let i = 0; i < S * S; i++) { const v = r() * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = a; }
    x.putImageData(id, 0, 0); return url(c);
  }
  /* micro grain for dials: soft monochrome speckle around neutral grey (overlay) */
  function grain(S) {
    const c = cnv(S, S), x = c.getContext('2d'), id = x.createImageData(S, S), d = id.data;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const v = 128 + (h2(i, j, 61) - .5) * 38 + (vnoise2(i / 6, j / 6, S / 6, S / 6, 62) - .5) * 20;
      const p = (j * S + i) * 4; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255;
    }
    x.putImageData(id, 0, 0); return url(c, true);
  }
  function paper() {
    const S = 256, c = cnv(S, S), x = c.getContext('2d'), r = SM.rng(61);
    x.fillStyle = '#efe4c8'; x.fillRect(0, 0, S, S);
    const id = x.getImageData(0, 0, S, S);
    for (let i = 0; i < S * S; i++) { const n = (r() - .5) * 22; id.data[i * 4] += n; id.data[i * 4 + 1] += n; id.data[i * 4 + 2] += n * .8; }
    x.putImageData(id, 0, 0);
    for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(120,100,60,${.05 + r() * .08})`; x.lineWidth = .5; const px = r() * S, py = r() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - .5) * 24, py + (r() - .5) * 24); x.stroke(); }
    return url(c, true);
  }
  function facets() {
    const S = 1024, c = cnv(S, S), x = c.getContext('2d'), r = SM.rng(71), N = 11, cell = S / N;
    const pts = [];
    for (let j = 0; j <= N; j++) { pts[j] = []; for (let i = 0; i <= N; i++) { const edge = i === 0 || j === 0 || i === N || j === N; pts[j][i] = [i * cell + (edge ? 0 : (r() - .5) * cell * .8), j * cell + (edge ? 0 : (r() - .5) * cell * .8)]; } }
    const tri = (a, b, d) => {
      const v = 60 + r() * 170, g = x.createLinearGradient(a[0], a[1], d[0], d[1]);
      g.addColorStop(0, gray(v + 40)); g.addColorStop(1, gray(v - 40));
      x.fillStyle = g; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(d[0], d[1]); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1.5; x.stroke();
    };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = pts[j][i], b = pts[j][i + 1], cc = pts[j + 1][i + 1], d = pts[j + 1][i];
      if ((i + j) % 2) { tri(a, b, cc); tri(a, cc, d); } else { tri(a, b, d); tri(b, cc, d); }
    }
    return url(c, true);
  }

  /* Embossed suit scales: overlapping fish-scale height field + normal map, re-lit live (v3: 64 px tile, micro weave) */
  function suitTiles() {
    const W = 64, H = 64, R = 37;
    const centers = [];
    for (let j = -2; j <= 4; j++) for (let i = -1; i <= 2; i++) centers.push([i * W + (j & 1 ? W / 2 : 0), j * H / 2]);
    centers.sort((p, q) => p[1] - q[1]);
    const hmap = new Float32Array(W * H), ao = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let own = null;
      for (const c of centers) { const dx = x + .5 - c[0], dy = y + .5 - c[1]; if (dx * dx + dy * dy <= R * R) { own = c; break; } }
      if (!own) { hmap[y * W + x] = 0; continue; }
      const dx = x + .5 - own[0], dy = y + .5 - own[1], d = R - Math.sqrt(dx * dx + dy * dy);
      const bevel = Math.min(1, d / 5), bv = bevel * bevel * (3 - 2 * bevel);
      const t = Math.max(0, Math.min(1, (dy + R * .15) / (R * 1.05)));
      const weaveMicro = .018 * Math.sin((x + y) * 1.6) * Math.sin((x - y) * 1.6);
      hmap[y * W + x] = bv * (.35 + .65 * t) + .03 * Math.sin(dx * .6) * bv * t + weaveMicro * bv;
    }
    const hAt = (px, py) => hmap[(((py % H) + H) % H) * W + (((px % W) + W) % W)];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let occ = 0; for (let k = 1; k <= 6; k++) occ = Math.max(occ, (hAt(x, y - k) - hAt(x, y)) / k);
      ao[y * W + x] = Math.max(0, Math.min(1, occ * 3));
    }
    const N = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (hAt(x + 1, y) - hAt(x - 1, y)) * 3.2, dy = (hAt(x, y + 1) - hAt(x, y - 1)) * 3.2, l = Math.hypot(dx, dy, 1), i = (y * W + x) * 3;
      N[i] = -dx / l; N[i + 1] = -dy / l; N[i + 2] = 1 / l;
    }
    function light(lx, ly, out, strength) {
      const Lz = .75, ll = Math.hypot(lx, ly, Lz), L0 = lx / ll, L1 = ly / ll, L2 = Lz / ll;
      const h0 = L0, h1 = L1, h2 = L2 + 1, hl = Math.hypot(h0, h1, h2), k = strength || 1;
      for (let i = 0, p = 0; i < W * H; i++, p += 4) {
        const n0 = N[i * 3], n1 = N[i * 3 + 1], n2 = N[i * 3 + 2];
        const dif = Math.max(0, n0 * L0 + n1 * L1 + n2 * L2), hd = Math.max(0, (n0 * h0 + n1 * h1 + n2 * h2) / hl);
        const spec = Math.pow(hd, 34) + Math.pow(hd, 8) * .18;
        const occ = 1 - ao[i] * .8, hh = hmap[i];
        const base = (.14 + dif * .8) * occ * (.52 + hh * .48);
        out[p] = Math.min(255, (14 + 60 * base) * 1.1 + spec * 160 * k);
        out[p + 1] = Math.min(255, (34 + 120 * base) * 1.1 + spec * 185 * k);
        out[p + 2] = Math.min(255, (92 + 205 * base) + spec * 215 * k);
        out[p + 3] = 255;
      }
      return out;
    }
    const c = cnv(W, H), x = c.getContext('2d'), id = x.createImageData(W, H);
    light(-.45, -.6, id.data); x.putImageData(id, 0, 0);
    return { base: c.toDataURL('image/png'), W, H, light };
  }

  /* Textures are built in two passes so first paint is fast on phones:
     1. buildTextures(): a quick "lite" set (~40% resolution, ~250 ms) so the watch renders immediately.
     2. upgradeTextures(): full-resolution versions generated one per idle slice (or loaded from an IndexedDB
        cache on later launches) and hot-swapped into the shared <pattern> elements. */
  const HEAVY = {
    brushedRadial: [brushedRadial, 1408, ['p-brushR']], sunburst: [sunburst, 1280, ['p-sunburst']],
    guilloche: [guilloche, 1280, ['p-guilloche']], barleycorn: [barleycorn, 1024, ['p-barley']],
    leather: [leather, 640, ['p-leather']], brushedLinear: [brushedLinear, 768, ['p-brushL', 'p-brushV']],
    grain: [grain, 512, ['p-grain']], snail: [snail, 384, ['p-snail']]
  };
  const TEXV = 'v3.0';
  const sz = (n, q) => Math.max(256, Math.round(n * q / 64) * 64);
  SM.texLevel = {};
  SM.buildTextures = function () {
    const t0 = performance.now(), timing = {};
    const run = (k, fn) => { const a = performance.now(); T[k] = fn(); timing[k] = Math.round(performance.now() - a); };
    for (const k in HEAVY) { const [fn, n] = HEAVY[k]; const S = sz(n, .4); run(k, () => fn(S)); SM.texLevel[k] = S; }
    run('carbon', () => carbon(256)); run('weave', () => weave(64));
    run('perlage', perlage); run('geneva', geneva); run('noise', () => noise(128, 40)); run('paper', paper);
    run('facets', facets); run('suit', suitTiles);
    SM.texTime = performance.now() - t0; SM.texTiming = timing;
    buildDefs();
  };
  /* tiny IndexedDB key/value cache (silently disabled when unavailable, e.g. private mode) */
  let dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(res => {
      try {
        const r = indexedDB.open('nickSupermanTex', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('t');
        r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null);
      } catch (e) { res(null); }
    });
    return dbP;
  }
  const idb = (mode, fn) => db().then(d => d ? new Promise(res => {
    try { const tx = d.transaction('t', mode), q = fn(tx.objectStore('t')); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }
    catch (e) { res(null); }
  }) : null);
  function swap(k, url) {
    T[k] = url;
    for (const id of HEAVY[k][2]) { const im = document.querySelector('#gdefs #' + id + ' image'); if (im) im.setAttribute('href', url); }
  }
  SM.upgradeTextures = async function () {
    const q = SM.Q ? SM.Q.p().texRes : 1, t0 = performance.now(), log = SM.texUpgrade = { cached: [], built: [], ms: 0 };
    for (const k in HEAVY) {
      const [fn, n] = HEAVY[k], S = sz(n, q);
      if ((SM.texLevel[k] || 0) >= S) continue;
      const key = `${TEXV}|${k}|${S}`;
      let url = await idb('readonly', s => s.get(key));
      if (url) log.cached.push(k);
      else {
        await new Promise(r => setTimeout(r, 30));
        if (SM.Q && SM.Q.hold) SM.Q.hold(1500);
        const a = performance.now(); url = fn(S); log.built.push([k, Math.round(performance.now() - a)]);
        idb('readwrite', s => s.put(url, key));
      }
      swap(k, url); SM.texLevel[k] = S;
    }
    log.ms = Math.round(performance.now() - t0);
    SM.emit && SM.emit('textures');
    return log;
  };

  function buildDefs() {
    const P = (id, url, w, h, extra = '', units = 'userSpaceOnUse', x = 0, y = 0) =>
      `<pattern id="${id}" patternUnits="${units}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}><image href="${url}" width="${w}" height="${h}" preserveAspectRatio="none"/></pattern>`;
    const bb = (id, url) => `<pattern id="${id}" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1"><image href="${url}" width="1" height="1" preserveAspectRatio="none"/></pattern>`;
    const defs = `
      ${P('p-brushR', T.brushedRadial, 800, 800, 'patternTransform="rotate(0 300 400)"', 'userSpaceOnUse', -100, 0)}
      ${P('p-brushL', T.brushedLinear, 256, 256)}
      ${P('p-brushV', T.brushedLinear, 256, 256, 'patternTransform="rotate(90)"')}
      ${P('p-sunburst', T.sunburst, 320, 320, '', 'userSpaceOnUse', 140, 240)}
      ${P('p-guilloche', T.guilloche, 320, 320, '', 'userSpaceOnUse', 140, 240)}
      ${P('p-barley', T.barleycorn, 320, 320, '', 'userSpaceOnUse', 140, 240)}
      ${P('p-facets', T.facets, 320, 320, '', 'userSpaceOnUse', 140, 240)}
      ${bb('p-snail', T.snail)}
      ${P('p-carbon', T.carbon, 16, 16)}
      ${P('p-leather', T.leather, 96, 96)}
      ${P('p-weave', T.weave, 7, 7)}
      ${P('p-perlage', T.perlage, 150, 150)}
      ${P('p-geneva', T.geneva, 60, 60, 'patternTransform="rotate(28)"')}
      ${P('p-noise', T.noise, 50, 50)}
      ${P('p-grain', T.grain, 90, 90)}
      ${P('p-paper', T.paper, 150, 150)}
      ${P('p-suit', T.suit.base, 11, 11)}
      <pattern id="p-halftone" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><circle cx="2" cy="2" r=".9" fill="#000" opacity=".22"/></pattern>
      <pattern id="p-hex" patternUnits="userSpaceOnUse" width="17.32" height="30"><path d="M8.66 0 L17.32 5 L17.32 15 L8.66 20 L0 15 L0 5 Z M8.66 20 L8.66 30" fill="none" stroke="#39ff7a" stroke-width=".6" opacity=".35"/></pattern>
      <pattern id="p-hobnail" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45 300 400)"><rect width="7" height="7" fill="#000" opacity=".15"/><path d="M0 0 L7 0 L3.5 3.5 Z" fill="#fff" opacity=".35"/><path d="M0 0 L3.5 3.5 L0 7 Z" fill="#fff" opacity=".15"/><path d="M7 0 L7 7 L3.5 3.5 Z" fill="#000" opacity=".25"/><path d="M0 7 L7 7 L3.5 3.5 Z" fill="#000" opacity=".4"/></pattern>
      <pattern id="p-scan" patternUnits="userSpaceOnUse" width="4" height="4"><rect width="4" height="1.3" fill="#9fe8ff" opacity=".12"/></pattern>
      <pattern id="p-holo" patternUnits="userSpaceOnUse" width="3" height="3"><rect width="3" height="1" fill="#6ff" opacity=".10"/></pattern>
      <radialGradient id="g-dome" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>
      <radialGradient id="g-ao" cx=".5" cy=".5" r=".5"><stop offset=".86" stop-color="#000" stop-opacity="0"/><stop offset=".955" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
      <radialGradient id="g-vig" cx=".5" cy=".5" r=".5"><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      <filter id="f-lume" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="f-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
    `;
    let svg = document.getElementById('gdefs');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'gdefs'; svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
      document.body.prepend(svg);
    }
    svg.innerHTML = '<defs>' + defs + '</defs>';
  }
  SM.defsMarkup = () => (document.getElementById('gdefs') || {}).innerHTML || '';
})(window.SM);
