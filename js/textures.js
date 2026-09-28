/* Procedural textures (canvas) -> SVG patterns. All original, generated at runtime. */
(function (SM) {
  'use strict';
  const T = SM.tex = {};
  function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function gray(v, a) { v = Math.max(0, Math.min(255, v | 0)); return `rgba(${v},${v},${v},${a === undefined ? 1 : a})`; }

  function brushedRadial() {
    const S = 800, c = cnv(S, S), x = c.getContext('2d'), r = SM.rng(11);
    x.fillStyle = '#8c8c8c'; x.fillRect(0, 0, S, S);
    for (let rad = 1; rad < 566; rad += 1) {
      x.strokeStyle = gray(128 + (r() - .5) * 60, .5); x.lineWidth = 1.1;
      x.beginPath(); x.arc(S / 2, S / 2, rad, 0, Math.PI * 2); x.stroke();
    }
    for (let i = 0; i < 1800; i++) {
      const rad = r() * 560, a0 = r() * Math.PI * 2, len = .05 + r() * .9;
      x.strokeStyle = gray(r() > .5 ? 230 : 30, .08 + r() * .12); x.lineWidth = .6 + r();
      x.beginPath(); x.arc(S / 2, S / 2, rad, a0, a0 + len); x.stroke();
    }
    const g = x.createConicGradient(-Math.PI / 4, S / 2, S / 2);
    [[0, '#fff'], [.08, '#e8e8e8'], [.2, '#555'], [.3, '#2a2a2a'], [.42, '#9a9a9a'], [.5, '#fff'], [.58, '#dcdcdc'], [.7, '#444'], [.8, '#222'], [.92, '#aaa'], [1, '#fff']]
      .forEach(s => g.addColorStop(s[0], s[1]));
    x.globalCompositeOperation = 'overlay'; x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'source-over';
    return c.toDataURL('image/jpeg', .9);
  }
  function brushedLinear() {
    const S = 512, c = cnv(S, S), x = c.getContext('2d'), r = SM.rng(21);
    for (let y = 0; y < S; y++) { x.fillStyle = gray(140 + (r() - .5) * 46); x.fillRect(0, y, S, 1); }
    for (let i = 0; i < 700; i++) {
      const y = r() * S, x0 = r() * S, l = 40 + r() * 400;
      x.fillStyle = gray(r() > .5 ? 235 : 40, .07 + r() * .1); x.fillRect(x0, y, l, .6 + r() * .8);
      if (x0 + l > S) x.fillRect(x0 - S, y, l, 1);
    }
    return c.toDataURL('image/jpeg', .9);
  }
  function sunburst() {
    const S = 1024, c = cnv(S, S), x = c.getContext('2d'), r = SM.rng(31), cx = S / 2;
    x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
    const N = 1440;
    for (let i = 0; i < N; i++) {
      const a0 = i / N * Math.PI * 2, a1 = (i + 1.2) / N * Math.PI * 2;
      x.fillStyle = gray(128 + (r() - .5) * 60, .8);
      x.beginPath(); x.moveTo(cx, cx); x.arc(cx, cx, S * .75, a0, a1); x.closePath(); x.fill();
    }
    const g = x.createConicGradient(-Math.PI / 3, cx, cx);
    [[0, '#fff'], [.12, '#777'], [.25, '#111'], [.38, '#777'], [.5, '#fff'], [.62, '#777'], [.75, '#111'], [.88, '#777'], [1, '#fff']].forEach(s => g.addColorStop(s[0], s[1]));
    x.globalCompositeOperation = 'overlay'; x.fillStyle = g; x.fillRect(0, 0, S, S);
    const rg = x.createRadialGradient(cx, cx, 0, cx, cx, cx);
    rg.addColorStop(0, 'rgba(255,255,255,.25)'); rg.addColorStop(.7, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.45)');
    x.globalCompositeOperation = 'source-over'; x.fillStyle = rg; x.fillRect(0, 0, S, S);
    return c.toDataURL('image/jpeg', .88);
  }
  function guilloche() {
    const S = 1024, c = cnv(S, S), x = c.getContext('2d'), cx = S / 2;
    x.lineWidth = 1.4;
    for (let k = 0; k < 150; k++) {
      const r0 = 14 + k * 3.4;
      for (let pass = 0; pass < 2; pass++) {
        x.strokeStyle = pass ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.34)';
        x.beginPath();
        for (let i = 0; i <= 720; i++) {
          const th = i / 720 * Math.PI * 2;
          const rr = r0 + 4.2 * Math.sin(18 * th + k * .42) + (pass ? 1.3 : 0);
          const px = cx + rr * Math.cos(th), py = cx + rr * Math.sin(th);
          i ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.stroke();
      }
    }
    return c.toDataURL('image/png');
  }
  function snail() {
    const S = 256, c = cnv(S, S), x = c.getContext('2d');
    for (let rr = 128; rr > 0; rr -= 1.6) {
      x.fillStyle = (Math.round(rr / 1.6) % 2) ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.18)';
      x.beginPath(); x.arc(128, 128, rr, 0, Math.PI * 2); x.fill();
    }
    return c.toDataURL('image/png');
  }
  function carbon() {
    const S = 64, c = cnv(S, S), x = c.getContext('2d'), cs = 8;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      const horiz = ((i + j) % 4) < 2;
      const px = i * cs, py = j * cs;
      const g = horiz ? x.createLinearGradient(px, py, px, py + cs) : x.createLinearGradient(px, py, px + cs, py);
      g.addColorStop(0, '#0b0c0e'); g.addColorStop(.5, horiz ? '#474b52' : '#2b2e33'); g.addColorStop(1, '#0b0c0e');
      x.fillStyle = g; x.fillRect(px, py, cs, cs);
      x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = .5;
      for (let f = 1; f < cs; f += 2) { x.beginPath(); horiz ? (x.moveTo(px, py + f), x.lineTo(px + cs, py + f)) : (x.moveTo(px + f, py), x.lineTo(px + f, py + cs)); x.stroke(); }
    }
    return c.toDataURL('image/png');
  }
  function leather() {
    const S = 256, c = cnv(S, S), x = c.getContext('2d'), r = SM.rng(41);
    x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) {
      const px = r() * S, py = r() * S, rr = 1.5 + r() * 3.8;
      for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) {
        const g = x.createRadialGradient(px + ox - rr * .3, py + oy - rr * .3, 0, px + ox, py + oy, rr);
        g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(.7, 'rgba(128,128,128,0)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
        x.fillStyle = g; x.beginPath(); x.arc(px + ox, py + oy, rr, 0, Math.PI * 2); x.fill();
      }
    }
    return c.toDataURL('image/jpeg', .9);
  }
  function weave() {
    const S = 32, c = cnv(S, S), x = c.getContext('2d');
    x.fillStyle = '#5a5a5a'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const over = (i + j) % 2 === 0, px = i * 8, py = j * 8;
      const g = over ? x.createLinearGradient(px, py, px, py + 8) : x.createLinearGradient(px, py, px + 8, py);
      g.addColorStop(0, '#3a3a3a'); g.addColorStop(.5, over ? '#d8d8d8' : '#b0b0b0'); g.addColorStop(1, '#3a3a3a');
      x.fillStyle = g; x.fillRect(px + .5, py + .5, 7, 7);
    }
    return c.toDataURL('image/png');
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
    return c.toDataURL('image/jpeg', .9);
  }
  function geneva() {
    const S = 256, c = cnv(S, S), x = c.getContext('2d');
    const band = 32;
    for (let i = -2; i < S / band + 2; i++) {
      const g = x.createLinearGradient(i * band, 0, i * band + band, 0);
      g.addColorStop(0, '#6d6d6d'); g.addColorStop(.45, '#f2f2f2'); g.addColorStop(.55, '#dedede'); g.addColorStop(1, '#6d6d6d');
      x.fillStyle = g; x.fillRect(i * band, 0, band, S);
    }
    return c.toDataURL('image/jpeg', .9);
  }
  function noise() {
    const S = 128, c = cnv(S, S), x = c.getContext('2d'), id = x.createImageData(S, S), r = SM.rng(51);
    for (let i = 0; i < S * S; i++) { const v = r() * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 40; }
    x.putImageData(id, 0, 0); return c.toDataURL('image/png');
  }
  function paper() {
    const S = 256, c = cnv(S, S), x = c.getContext('2d'), r = SM.rng(61);
    x.fillStyle = '#efe4c8'; x.fillRect(0, 0, S, S);
    const id = x.getImageData(0, 0, S, S);
    for (let i = 0; i < S * S; i++) { const n = (r() - .5) * 22; id.data[i * 4] += n; id.data[i * 4 + 1] += n; id.data[i * 4 + 2] += n * .8; }
    x.putImageData(id, 0, 0);
    for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(120,100,60,${.05 + r() * .08})`; x.lineWidth = .5; const px = r() * S, py = r() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - .5) * 24, py + (r() - .5) * 24); x.stroke(); }
    return c.toDataURL('image/jpeg', .9);
  }
  function facets() {
    const S = 900, c = cnv(S, S), x = c.getContext('2d'), r = SM.rng(71), N = 11, cell = S / N;
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
    return c.toDataURL('image/jpeg', .9);
  }

  /* Embossed suit scales: overlapping fish-scale height field + normal map, re-lit live */
  function suitTiles() {
    const W = 40, H = 40, R = 23;
    const centers = [];
    for (let j = -2; j <= 4; j++) for (let i = -1; i <= 2; i++) centers.push([i * W + (j & 1 ? W / 2 : 0), j * H / 2]);
    centers.sort((p, q) => p[1] - q[1]); /* upper rows lie on top */
    const hmap = new Float32Array(W * H), ao = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let own = null;
      for (const c of centers) { const dx = x + .5 - c[0], dy = y + .5 - c[1]; if (dx * dx + dy * dy <= R * R) { own = c; break; } }
      if (!own) { hmap[y * W + x] = 0; continue; }
      const dx = x + .5 - own[0], dy = y + .5 - own[1], d = R - Math.sqrt(dx * dx + dy * dy);
      const bevel = Math.min(1, d / 3.2), bv = bevel * bevel * (3 - 2 * bevel);
      const t = Math.max(0, Math.min(1, (dy + R * .15) / (R * 1.05)));
      hmap[y * W + x] = bv * (.35 + .65 * t) + .025 * Math.sin(dx * .9) * bv * t;
    }
    /* ambient occlusion: darker just under an overlapping edge */
    const hAt = (px, py) => hmap[(((py % H) + H) % H) * W + (((px % W) + W) % W)];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let occ = 0; for (let k = 1; k <= 4; k++) occ = Math.max(occ, (hAt(x, y - k) - hAt(x, y)) / k);
      ao[y * W + x] = Math.max(0, Math.min(1, occ * 2.2));
    }
    const N = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (hAt(x + 1, y) - hAt(x - 1, y)) * 2.6, dy = (hAt(x, y + 1) - hAt(x, y - 1)) * 2.6, l = Math.hypot(dx, dy, 1), i = (y * W + x) * 3;
      N[i] = -dx / l; N[i + 1] = -dy / l; N[i + 2] = 1 / l;
    }
    /* light (lx,ly) in -1..1 screen space; returns ImageData-ready RGBA */
    function light(lx, ly, out, strength) {
      const Lz = .75, ll = Math.hypot(lx, ly, Lz), L0 = lx / ll, L1 = ly / ll, L2 = Lz / ll;
      const h0 = L0, h1 = L1, h2 = L2 + 1, hl = Math.hypot(h0, h1, h2), k = strength || 1;
      for (let i = 0, p = 0; i < W * H; i++, p += 4) {
        const n0 = N[i * 3], n1 = N[i * 3 + 1], n2 = N[i * 3 + 2];
        const dif = Math.max(0, n0 * L0 + n1 * L1 + n2 * L2), spec = Math.pow(Math.max(0, (n0 * h0 + n1 * h1 + n2 * h2) / hl), 26);
        const occ = 1 - ao[i] * .75, hh = hmap[i];
        const base = (.16 + dif * .78) * occ * (.55 + hh * .45);
        out[p] = Math.min(255, (14 + 60 * base) * 1.1 + spec * 150 * k);
        out[p + 1] = Math.min(255, (34 + 120 * base) * 1.1 + spec * 175 * k);
        out[p + 2] = Math.min(255, (92 + 205 * base) + spec * 205 * k);
        out[p + 3] = 255;
      }
      return out;
    }
    const c = cnv(W, H), x = c.getContext('2d'), id = x.createImageData(W, H);
    light(-.45, -.6, id.data); x.putImageData(id, 0, 0);
    return { base: c.toDataURL('image/png'), W, H, light };
  }

  SM.buildTextures = function () {
    const t0 = performance.now();
    T.brushedRadial = brushedRadial(); T.brushedLinear = brushedLinear(); T.sunburst = sunburst();
    T.guilloche = guilloche(); T.snail = snail(); T.carbon = carbon(); T.leather = leather();
    T.weave = weave(); T.perlage = perlage(); T.geneva = geneva(); T.noise = noise(); T.paper = paper();
    T.facets = facets(); T.suit = suitTiles();
    SM.texTime = performance.now() - t0;
    buildDefs();
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
      ${P('p-facets', T.facets, 320, 320, '', 'userSpaceOnUse', 140, 240)}
      ${bb('p-snail', T.snail)}
      ${P('p-carbon', T.carbon, 14, 14)}
      ${P('p-leather', T.leather, 110, 110)}
      ${P('p-weave', T.weave, 9, 9)}
      ${P('p-perlage', T.perlage, 150, 150)}
      ${P('p-geneva', T.geneva, 60, 60, 'patternTransform="rotate(28)"')}
      ${P('p-noise', T.noise, 50, 50)}
      ${P('p-paper', T.paper, 150, 150)}
      ${P('p-suit', T.suit.base, 11, 11)}
      <pattern id="p-halftone" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><circle cx="2" cy="2" r=".9" fill="#000" opacity=".22"/></pattern>
      <pattern id="p-hex" patternUnits="userSpaceOnUse" width="17.32" height="30"><path d="M8.66 0 L17.32 5 L17.32 15 L8.66 20 L0 15 L0 5 Z M8.66 20 L8.66 30" fill="none" stroke="#39ff7a" stroke-width=".6" opacity=".35"/></pattern>
      <pattern id="p-hobnail" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45 300 400)"><rect width="7" height="7" fill="#000" opacity=".15"/><path d="M0 0 L7 0 L3.5 3.5 Z" fill="#fff" opacity=".35"/><path d="M0 0 L3.5 3.5 L0 7 Z" fill="#fff" opacity=".15"/><path d="M7 0 L7 7 L3.5 3.5 Z" fill="#000" opacity=".25"/><path d="M0 7 L7 7 L3.5 3.5 Z" fill="#000" opacity=".4"/></pattern>
      <pattern id="p-scan" patternUnits="userSpaceOnUse" width="4" height="4"><rect width="4" height="1.3" fill="#9fe8ff" opacity=".12"/></pattern>
      <radialGradient id="g-dome" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>
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
