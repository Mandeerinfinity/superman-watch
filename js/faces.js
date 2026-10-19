/* Dial toolkit + 20 watch faces (v3 adds Bizarro, Phantom Zone, Tourbillon, Clark Kent, Hologram Command, Metropolis Harbor + the Face Builder) */
(function (SM) {
  'use strict';
  const CX = 300, CY = 400, f = SM.f;
  const F = SM.FONTS = {
    cond: "SMOswald, Oswald, 'Arial Narrow', sans-serif", serif: "SMPlayfair, 'Playfair Display', Georgia, serif",
    roman: "SMCinzel, Cinzel, Georgia, serif", frak: "SMFraktur, UnifrakturMaguntia, 'Old English Text MT', serif", ui: "SMRajdhani, Rajdhani, 'Segoe UI', sans-serif"
  };
  const HM = SM.HAND_METALS;
  const K = SM.K = {};

  K.text = (x, y, s, o = {}) => `<text x="${f(x)}" y="${f(y)}" font-size="${o.size || 8}" fill="${o.fill || '#fff'}" font-weight="${o.weight || 600}" letter-spacing="${o.ls || 0}" text-anchor="${o.anchor || 'middle'}" font-family="${o.font || F.cond}"${o.op ? ` opacity="${o.op}"` : ''}${o.cls ? ` class="${o.cls}"` : ''}${o.bind ? ` data-bind="${o.bind}"` : ''}${o.style ? ` style="${o.style}"` : ''}${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}" paint-order="stroke"` : ''}>${s}</text>`;
  K.base = (fill) => `<circle cx="${CX}" cy="${CY}" r="158" fill="${fill}"/>`;
  K.disc = (fill, op, blend, r) => `<circle cx="${CX}" cy="${CY}" r="${r || 146}" fill="${fill}"${op !== undefined ? ` opacity="${op}"` : ''}${blend ? ` style="mix-blend-mode:${blend}"` : ''}/>`;
  K.radial = (id, stops, cx, cy, r) => `<radialGradient id="${id}" cx="${cx || .5}" cy="${cy || .5}" r="${r || .5}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`;
  K.linear = (id, stops, x2, y2) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 || 0}" y2="${y2 === undefined ? 1 : y2}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`;
  K.dome = (strength) => `<circle cx="${CX}" cy="${CY}" r="146" fill="url(#g-dome)" opacity="${strength || 1}"/>`;

  K.rehaut = function (o) {
    const id = SM.uid('rh'), c = o.color || ['#20242b', '#0b0d10'], ink = o.ink || '#e8ecf1';
    let g = `<radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset=".90" stop-color="${c[1]}"/><stop offset=".96" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></radialGradient>
      <circle cx="${CX}" cy="${CY}" r="158" fill="url(#${id})"/><circle cx="${CX}" cy="${CY}" r="146.4" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1.4"/>`;
    const tick = (a, r0, r1, w, col) => { const [x0, y0] = SM.polar(CX, CY, r0, a), [x1, y1] = SM.polar(CX, CY, r1, a); return `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${col || ink}" stroke-width="${w}"/>`; };
    if (o.type === 'minutes') {
      for (let m = 0; m < 60; m++) { g += tick(m * 6, 147.5, m % 5 ? 150.5 : 152.5, m % 5 ? .8 : 1.6); if (m % 5 === 0) g += `<text x="${CX}" y="${CY - 153.4}" font-size="5" fill="${ink}" text-anchor="middle" font-family="${F.cond}" font-weight="600" transform="rotate(${m * 6} ${CX} ${CY})">${m === 0 ? 60 : SM.pad(m)}</text>`; }
    } else if (o.type === 'fifths') {
      for (let i = 0; i < 300; i++) g += tick(i * 1.2, 147.5, i % 25 === 0 ? 154 : i % 5 === 0 ? 152 : 150, i % 5 ? .45 : 1.1);
    } else if (o.type === 'glyph') {
      const r = SM.rng(7);
      for (let i = 0; i < 48; i++) g += `<g transform="rotate(${i * 7.5} ${CX} ${CY})">${SM.glyph(CX, CY - 152, 6, r, ink, .7)}</g>`;
    } else if (o.type === 'text' && o.text) {
      const pid = SM.uid('rt');
      g += `<path id="${pid}" d="M ${CX - 152} ${CY} A 152 152 0 1 1 ${CX + 152} ${CY} A 152 152 0 1 1 ${CX - 152} ${CY}" fill="none"/><text font-size="5.6" fill="${ink}" letter-spacing="2.2" font-family="${F.cond}" font-weight="600"><textPath href="#${pid}">${o.text}</textPath></text>`;
    }
    return g;
  };
  K.track = function (r, col, type, w) {
    let g = '';
    if (type === 'rail') {
      g += `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${col}" stroke-width=".7"/><circle cx="${CX}" cy="${CY}" r="${r - 6}" fill="none" stroke="${col}" stroke-width=".7"/>`;
      for (let m = 0; m < 60; m++) { const [x0, y0] = SM.polar(CX, CY, r, m * 6), [x1, y1] = SM.polar(CX, CY, r - 6, m * 6); g += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${col}" stroke-width="${m % 5 ? .6 : 1.4}"/>`; }
    } else if (type === 'dots') {
      for (let m = 0; m < 60; m++) if (m % 5) { const [x, y] = SM.polar(CX, CY, r, m * 6); g += `<circle cx="${f(x)}" cy="${f(y)}" r="${w || .9}" fill="${col}"/>`; }
    } else {
      for (let m = 0; m < 60; m++) { const [x0, y0] = SM.polar(CX, CY, r, m * 6), [x1, y1] = SM.polar(CX, CY, r - (m % 5 ? 4 : 7), m * 6); g += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${col}" stroke-width="${m % 5 ? (w || .7) : (w || .7) * 2}"/>`; }
    }
    return g;
  };
  K.indices = function (o) {
    const m = HM[o.metal || 'steel'], id = SM.uid('ix'), w = o.w || 7, r0 = o.r0 || 108, r1 = o.r1 || 132, lume = o.lume;
    let g = `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${m[0]}"/><stop offset=".48" stop-color="${m[1]}"/><stop offset=".52" stop-color="${m[2]}"/><stop offset="1" stop-color="${m[1]}"/></linearGradient>`;
    for (let h = 0; h < 12; h++) {
      if ((o.skip || []).includes(h)) continue;
      const a = h * 30, big = h % 3 === 0 && o.bigQuarters;
      const ww = big ? w * 1.35 : w;
      let shape, lumeShape = '';
      const T = o.type || 'baton';
      if (h === 0 && o.twelve === 'double') {
        shape = `M${CX - ww * 1.25} ${CY - r1} h${ww} v${r1 - r0} h${-ww} Z M${CX + ww * .25} ${CY - r1} h${ww} v${r1 - r0} h${-ww} Z`;
        if (lume) lumeShape = `M${CX - ww * 1.05} ${CY - r1 + 3} h${ww * .6} v${r1 - r0 - 6} h${-ww * .6} Z M${CX + ww * .45} ${CY - r1 + 3} h${ww * .6} v${r1 - r0 - 6} h${-ww * .6} Z`;
      } else if (h === 0 && o.twelve === 'triangle') {
        shape = `M${CX - ww * 1.5} ${CY - r1} L${CX + ww * 1.5} ${CY - r1} L${CX} ${CY - r0 + 2} Z`;
        if (lume) lumeShape = `M${CX - ww * 1.0} ${CY - r1 + 3} L${CX + ww * 1.0} ${CY - r1 + 3} L${CX} ${CY - r0 + 10} Z`;
      } else if (T === 'baton') {
        shape = `M${CX - ww / 2} ${CY - r1} h${ww} v${r1 - r0} h${-ww} Z`;
        if (lume) lumeShape = `M${CX - ww * .28} ${CY - r1 + 3} h${ww * .56} v${r1 - r0 - 6} h${-ww * .56} Z`;
      } else if (T === 'dagger') {
        shape = `M${CX - ww / 2} ${CY - r1} L${CX + ww / 2} ${CY - r1} L${CX + ww * .36} ${CY - r0 - 6} L${CX} ${CY - r0} L${CX - ww * .36} ${CY - r0 - 6} Z`;
        if (lume) lumeShape = `M${CX - ww * .24} ${CY - r1 + 3} L${CX + ww * .24} ${CY - r1 + 3} L${CX} ${CY - r0 - 4} Z`;
      } else if (T === 'wedge') {
        shape = `M${CX - ww * .8} ${CY - r1} L${CX + ww * .8} ${CY - r1} L${CX} ${CY - r0} Z`;
        if (lume) lumeShape = `M${CX - ww * .45} ${CY - r1 + 3} L${CX + ww * .45} ${CY - r1 + 3} L${CX} ${CY - r0 - 6} Z`;
      } else if (T === 'dot') {
        const rr = (r0 + r1) / 2, s = big ? ww * .8 : ww * .6;
        shape = `M${CX - s} ${CY - rr} a${s} ${s} 0 1 0 ${2 * s} 0 a${s} ${s} 0 1 0 ${-2 * s} 0`;
        if (lume) lumeShape = `M${CX - s * .7} ${CY - rr} a${s * .7} ${s * .7} 0 1 0 ${1.4 * s} 0 a${s * .7} ${s * .7} 0 1 0 ${-1.4 * s} 0`;
      } else if (T === 'crystal') {
        shape = `M${CX} ${CY - r1 - 2} L${CX + ww / 2} ${CY - r1 + 6} L${CX + ww / 2} ${CY - r0 - 6} L${CX} ${CY - r0} L${CX - ww / 2} ${CY - r0 - 6} L${CX - ww / 2} ${CY - r1 + 6} Z`;
        lumeShape = `M${CX} ${CY - r1 + 2} L${CX + ww * .2} ${CY - r1 + 8} L${CX + ww * .2} ${CY - r0 - 8} L${CX} ${CY - r0 - 3} Z`;
      } else if (T === 'star') {
        const rr = (r0 + r1) / 2, s = big ? ww * 1.25 : ww * .95; let p = '';
        for (let i = 0; i < 10; i++) { const rad = i % 2 ? s * .42 : s, [x, y] = SM.polar(CX, CY - rr, rad, i * 36); p += (i ? 'L' : 'M') + f(x) + ' ' + f(y); }
        shape = p + 'Z';
      } else if (T === 'paw') {
        const rr = (r0 + r1) / 2, cy = CY - rr;
        shape = `M${CX - 5.5} ${cy + 3} a5.5 4.6 0 1 0 11 0 a5.5 4.6 0 1 0 -11 0 M${CX - 8} ${cy - 3} a2.2 2.8 0 1 0 4.4 0 a2.2 2.8 0 1 0 -4.4 0 M${CX - 4} ${cy - 7} a2.2 2.8 0 1 0 4.4 0 a2.2 2.8 0 1 0 -4.4 0 M${CX - .4} ${cy - 7} a2.2 2.8 0 1 0 4.4 0 a2.2 2.8 0 1 0 -4.4 0 M${CX + 3.6} ${cy - 3} a2.2 2.8 0 1 0 4.4 0 a2.2 2.8 0 1 0 -4.4 0`;
      }
      const fill = o.flat ? o.flat : `url(#${id})`;
      g += `<path d="${shape}" fill="#000" opacity="${o.shadow === undefined ? .4 : o.shadow}" transform="translate(1.3 2.2) rotate(${a} ${CX} ${CY})"/>`;
      g += `<g transform="rotate(${a} ${CX} ${CY})"><path d="${shape}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.lumeBody ? ' class="lume"' : ''}/>${lumeShape ? `<path d="${lumeShape}" fill="${lume || 'rgba(255,255,255,.5)'}"${lume ? ' class="lume"' : ''}/>` : ''}</g>`;
    }
    return g;
  };
  const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  K.numerals = function (o) {
    let g = '';
    (o.hours || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).forEach(h => {
      const [x, y] = SM.polar(CX, CY, o.r || 118, h * 30);
      const s = o.roman ? ROMAN[h] : (h === 0 ? 12 : h);
      if (o.applied) g += K.text(x + .9, y + (o.size || 16) * .36 + 1.4, s, { size: o.size || 16, fill: '#000', font: o.font, weight: o.weight || 700, op: .45, ls: o.ls });
      g += K.text(x, y + (o.size || 16) * .36, s, { size: o.size || 16, fill: o.fill || '#fff', font: o.font || F.cond, weight: o.weight || 700, ls: o.ls, cls: o.lume ? 'lume' : '', stroke: o.stroke, sw: o.sw });
    });
    return g;
  };
  /* subdials */
  K.sub = function (ctx, type, cx, cy, r, st = {}) {
    const i = ctx.subs.length;
    ctx.subs.push({ type, cx, cy, r, hand: !['moon', 'datebig', 'weather', 'rings', 'vitals', 'cal'].includes(type), handColor: st.hand });
    const ink = st.ink || '#1b2238', ring = st.ring || '#c9d0da';
    const pol = (rr, a) => SM.polar(cx, cy, rr, a);
    let g = `<circle cx="${cx}" cy="${cy}" r="${r + 1.8}" fill="#000" opacity=".35" transform="translate(-.6 -.9)"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${st.bg || (['vitals', 'rings', 'weather'].includes(type) ? '#080b12' : '#e8ecf1')}"/>`;
    if (st.tex !== false && !['vitals', 'rings', 'weather', 'tide', 'cal'].includes(type)) g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${st.tex || 'p-snail'})" opacity="${st.texOp || .9}" style="mix-blend-mode:${st.texBlend || 'overlay'}"/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="${r - 1.2}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="2.4" transform="translate(.7 1)"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ring}" stroke-width="${st.ringW || 1.5}"/>`;
    const tick = (a, l, w) => { const [x0, y0] = pol(r - 2, a), [x1, y1] = pol(r - 2 - l, a); return `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${ink}" stroke-width="${w}"/>`; };
    const num = (a, s, rr, sz) => { const [x, y] = pol(rr || r - 11, a); return K.text(x, y + (sz || 6.5) * .36, s, { size: sz || 6.5, fill: ink, weight: 600 }); };
    if (type === 'sec') { for (let k = 0; k < 60; k++) g += tick(k * 6, k % 5 ? 2.4 : 4.5, k % 5 ? .5 : 1); g += num(0, 60) + num(120, 20) + num(240, 40); }
    else if (type === 'chr30') { for (let k = 0; k < 30; k++) g += tick(k * 12, k % 5 ? 2.6 : 4.8, k % 5 ? .6 : 1.1); g += num(0, 30) + num(120, 10) + num(240, 20); }
    else if (type === 'chr12') { for (let k = 0; k < 12; k++) g += tick(k * 30, k % 3 ? 3 : 5, k % 3 ? .7 : 1.2); g += num(0, 12) + num(90, 3) + num(180, 6) + num(270, 9); }
    else if (type === 'pwr' || type === 'gauge') {
      const a0 = type === 'pwr' ? -120 : -110, a1 = -a0, col = st.accent || '#e3202f';
      g += `<path d="${SM.arcPath(cx, cy, r - 5, a0, a0 + (a1 - a0) * .22)}" fill="none" stroke="${col}" stroke-width="3"/>`;
      if (type === 'gauge') g += `<path d="${SM.arcPath(cx, cy, r - 5, a0 + (a1 - a0) * .22, a1)}" fill="none" stroke="${st.accent2 || ink}" stroke-opacity=".35" stroke-width="3"/>`;
      for (let k = 0; k <= 12; k++) g += tick(a0 + (a1 - a0) * k / 12, k % 3 ? 2.6 : 5, k % 3 ? .6 : 1.2);
      g += num(a0, st.lo || '0', r - 13, 5.5) + num(a1, st.hi || '100', r - 13, 5.5);
      g += K.text(cx, cy + r * .5, st.label || (type === 'pwr' ? 'SOLAR' : 'LEVEL'), { size: 5.2, fill: ink, ls: 1, weight: 700 });
    }
    else if (type === 'date') { for (let d = 1; d <= 31; d++) { const a = (d - 1) / 31 * 360; g += tick(a, d % 2 ? 1.8 : 1.2, .5); if (d % 2) { const [x, y] = pol(r - 9, a); g += K.text(x, y + 1.7, d, { size: 4.6, fill: ink, weight: 600 }); } } }
    else if (type === 'day') { ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach((d, k) => { const a = k / 7 * 360; g += tick(a, 2.5, .8); const [x, y] = pol(r - 10.5, a); g += K.text(x, y + 1.9, d, { size: 5, fill: ink, weight: 700 }); }); }
    else if (type === '24h') {
      g += `<path d="M${cx - r + 2} ${cy} A${r - 2} ${r - 2} 0 0 1 ${cx + r - 2} ${cy} Z" fill="#000" opacity=".22"/>`;
      for (let k = 0; k < 24; k++) g += tick(k * 15, k % 6 ? 2.2 : 4.5, k % 6 ? .5 : 1.1);
      g += num(0, 24) + num(90, 6) + num(180, 12) + num(270, 18);
    }
    else if (type === 'moon') {
      g += `<circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="#07123a"/>`;
      const rr = SM.rng(cx + cy); for (let k = 0; k < 18; k++) { const [x, y] = pol(Math.sqrt(rr()) * (r - 5), rr() * 360); g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.3 + rr() * .7)}" fill="#fff" opacity="${f(.4 + rr() * .6)}"/>`; }
      const mr = r * .52;
      g += `<circle cx="${cx}" cy="${cy}" r="${mr}" fill="#1c2436" stroke="#000" stroke-opacity=".3"/>
        <path data-moon="1" data-cx="${cx}" data-cy="${cy}" data-r="${mr}" d="" fill="${st.moon || '#f3e3a4'}"/>
        <circle cx="${cx - mr * .3}" cy="${cy - mr * .2}" r="${mr * .18}" fill="#000" opacity=".08"/><circle cx="${cx + mr * .25}" cy="${cy + mr * .3}" r="${mr * .12}" fill="#000" opacity=".08"/>`;
      g += K.text(cx, cy + r * .8, st.label || 'KRYPTON PHASE', { size: 3.8, fill: '#e8e0b8', ls: .6 });
    }
    else if (type === 'datebig') {
      g += K.text(cx, cy + 7, '28', { size: 21, fill: ink, font: st.font || F.serif, weight: 800, bind: 'date' });
      g += K.text(cx, cy - r * .5, st.label || 'EDITION', { size: 4.6, fill: ink, ls: 1.2, weight: 700 });
    }
    else if (type === 'weather') {
      g += `<circle cx="${cx}" cy="${cy}" r="${r - 3.5}" fill="none" stroke="${ink}" stroke-opacity=".25" stroke-width=".6"/>`;
      for (let k = 0; k < 24; k++) g += tick(k * 15, k % 6 ? 1.4 : 2.6, k % 6 ? .35 : .7);
      g += `<g data-wx="icon" data-s="${f(r / 34)}" transform="translate(${cx} ${f(cy - r * .24)})"></g>`;
      g += `<text data-wx="temp" x="${cx}" y="${f(cy + r * .38)}" font-size="${f(r * .34)}" fill="${ink}" font-weight="700" text-anchor="middle" font-family="${F.cond}">--°</text>`;
      g += `<text data-wx="hilo" x="${cx}" y="${f(cy + r * .62)}" font-size="${f(r * .13)}" fill="${ink}" opacity=".8" font-weight="600" letter-spacing=".3" text-anchor="middle" font-family="${F.cond}">NO DATA</text>`;
      g += K.text(cx, cy - r * .64, st.label || 'WEATHER', { size: r * .12, fill: ink, ls: .6, weight: 700, op: .85 });
    }
    else if (type === 'rings') {
      const RC = [['move', '#ff3b50'], ['solar', '#ffd34a'], ['focus', '#3fe0ff']], w = Math.max(3, r * .15);
      RC.forEach(([k, c], j) => {
        const rr = r - 4 - j * (w + 1.2);
        g += `<circle cx="${cx}" cy="${cy}" r="${f(rr)}" fill="none" stroke="${c}" stroke-opacity=".2" stroke-width="${f(w)}"/>
          <path data-ring="${k}" data-cx="${cx}" data-cy="${cy}" data-r="${f(rr)}" d="" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
      });
      const cr = r - 4 - 3 * (w + 1.2) + w * .2;
      g += `<circle cx="${cx}" cy="${cy}" r="${f(cr)}" fill="${st.core || '#0b0f18'}"/>` + SM.shield(cx, cy - cr * .05, cr * 1.3, st.shield || 'classic');
    }
    else if (type === 'tide') {
      const cid = SM.uid('tc'), wid = SM.uid('tw');
      g += `<clipPath id="${cid}"><circle cx="${cx}" cy="${cy}" r="${r - 3}"/></clipPath>
        <linearGradient id="${wid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${st.water || '#2f8fe8'}"/><stop offset="1" stop-color="#062a5a"/></linearGradient>
        <g clip-path="url(#${cid})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${st.sky || '#0b1a38'}"/>
        <g data-tidefill="1" data-cy="${cy}" data-r="${r}" transform="translate(0 ${r * .2})"><path d="M${cx - r * 1.4} ${cy} q${f(r * .175)} ${-r * .09} ${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 V${cy + r * 2} H${cx - r * 1.4} Z" fill="url(#${wid})" opacity=".92"/>
        <path d="M${cx - r * 1.4} ${cy} q${f(r * .175)} ${-r * .09} ${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0 t${f(r * .35)} 0" fill="none" stroke="#bfe6ff" stroke-opacity=".7" stroke-width=".8"/></g></g>`;
      for (let k = 0; k < 24; k++) g += tick(k * 15, k % 6 ? 1.6 : 3.2, k % 6 ? .4 : .9);
      g += K.text(cx, cy - r + 10, 'HIGH', { size: r * .13, fill: st.ink || '#dff1ff', ls: .5, weight: 700 }) + K.text(cx, cy + r - 5.5, 'LOW', { size: r * .13, fill: st.ink || '#dff1ff', ls: .5, weight: 700 });
      g += K.text(cx - r * .62, cy + 1.6, 'EBB', { size: r * .1, fill: st.ink || '#dff1ff', op: .7 }) + K.text(cx + r * .62, cy + 1.6, 'FLOOD', { size: r * .1, fill: st.ink || '#dff1ff', op: .7 });
      g += K.text(cx, cy + r * .42, st.label || 'HARBOR TIDE', { size: r * .11, fill: st.ink || '#dff1ff', ls: .6, weight: 700, op: .9 });
    }
    else if (type === 'vitals') {
      const sw = r * 1.56, sh = r * .74, x0 = cx - sw / 2, y0 = cy - sh * .48, col = st.accent || '#ff3b50';
      g += `<rect x="${f(x0)}" y="${f(y0)}" width="${f(sw)}" height="${f(sh)}" rx="3" fill="#04070b" stroke="${col}" stroke-opacity=".35" stroke-width=".6"/>`;
      for (let k = 1; k < 8; k++) g += `<line x1="${f(x0 + sw * k / 8)}" y1="${f(y0)}" x2="${f(x0 + sw * k / 8)}" y2="${f(y0 + sh)}" stroke="${col}" stroke-opacity=".12" stroke-width=".3"/>`;
      for (let k = 1; k < 4; k++) g += `<line x1="${f(x0)}" y1="${f(y0 + sh * k / 4)}" x2="${f(x0 + sw)}" y2="${f(y0 + sh * k / 4)}" stroke="${col}" stroke-opacity=".12" stroke-width=".3"/>`;
      const base = y0 + sh * .72, amp = sh * .62;
      g += `<path data-ecg="1" data-x="${f(x0 + 1)}" data-y="${f(base)}" data-w="${f(sw - 2)}" data-h="${f(amp)}" d="" fill="none" stroke="${col}" stroke-opacity=".35" stroke-width="2.4" stroke-linejoin="round"/>`;
      g += `<path data-ecg="1" data-x="${f(x0 + 1)}" data-y="${f(base)}" data-w="${f(sw - 2)}" data-h="${f(amp)}" d="" fill="none" stroke="${st.trace || '#ffd0d6'}" stroke-width=".9" stroke-linejoin="round"/>`;
      const hy = cy + r * .5;
      g += `<path data-beat="1" transform="translate(${f(cx - r * .42)} ${f(hy - 2.2)}) scale(${f(r / 60)})" d="M0 4 C-4 0 -8 -1 -8 -5 C-8 -8 -4 -9 0 -6 C4 -9 8 -8 8 -5 C8 -1 4 0 0 4 Z" fill="${col}"/>`;
      g += `<text data-bind="bpm" x="${f(cx + r * .02)}" y="${f(hy + 1.5)}" font-size="${f(r * .27)}" fill="${st.ink || '#ffe3e6'}" font-weight="700" text-anchor="middle" font-family="${F.cond}">52</text>`;
      g += K.text(cx + r * .45, hy + 1.2, 'BPM', { size: r * .11, fill: st.ink || '#ffe3e6', weight: 700, op: .8 });
      g += K.text(cx, cy - r * .62, st.label || 'KRYPTONIAN VITALS', { size: r * .105, fill: st.ink || '#ffe3e6', ls: .5, weight: 700, op: .9 });
    }
    else if (type === 'cal') {
      const M = SM.cx.monthMatrix(new Date()), cw = r * 1.52 / 7, rows = M.cells.length / 7, ch = Math.min(cw * .92, r * 1.12 / rows), x0 = cx - cw * 3.5, y0 = cy - r * .36;
      g += K.text(cx, cy - r * .56, SM.MONTHS[M.m].toUpperCase() + ' ' + M.y, { size: r * .135, fill: ink, ls: .8, weight: 700 });
      'SMTWTFS'.split('').forEach((d, k) => { g += K.text(x0 + cw * (k + .5), y0, d, { size: r * .1, fill: k === 0 ? (st.accent || '#c0182a') : ink, weight: 700, op: .75 }); });
      M.cells.forEach((d, k) => {
        if (!d) return; const x = x0 + cw * (k % 7 + .5), y = y0 + ch * (Math.floor(k / 7) + 1) + ch * .15;
        if (d === M.today) g += `<circle cx="${f(x)}" cy="${f(y - r * .035)}" r="${f(ch * .52)}" fill="${st.accent || '#c0182a'}"/>`;
        g += K.text(x, y, d, { size: r * .105, fill: d === M.today ? '#fff' : ink, weight: d === M.today ? 800 : 600 });
      });
    }
    if (st.label && !['pwr', 'gauge', 'moon', 'datebig', 'weather', 'rings', 'tide', 'vitals', 'cal'].includes(type)) g += K.text(cx, cy + r * .48, st.label, { size: 4.6, fill: ink, ls: .8, weight: 600 });
    return g;
  };
  K.dateWin = function (x, y, w, h, st = {}) {
    const id = SM.uid('dw');
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#9aa3ae"/></linearGradient>
      <rect x="${x - w / 2 - 2}" y="${y - h / 2 - 2}" width="${w + 4}" height="${h + 4}" rx="2" fill="url(#${id})"/>
      <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="1" fill="${st.bg || '#fbfbf8'}"/>
      <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="3" fill="#000" opacity=".25"/>
      ${K.text(x, y + h * .32, '28', { size: h * .82, fill: st.ink || '#111', weight: 700, bind: 'date' })}`;
  };
  /* moon phase lit-region path */
  SM.moonPath = function (cx, cy, r, phase) {
    const k = Math.cos(phase * 2 * Math.PI), rx = Math.abs(k) * r;
    const waxing = phase < .5, crescent = k > 0;
    if (phase < .015 || phase > .985) return '';
    const top = `${f(cx)} ${f(cy - r)}`, bot = `${f(cx)} ${f(cy + r)}`;
    const limbSweep = waxing ? 1 : 0;
    const termSweep = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
    return `M${top} A${f(r)} ${f(r)} 0 0 ${limbSweep} ${bot} A${f(rx)} ${f(r)} 0 0 ${termSweep} ${top} Z`;
  };

  /* seven-segment digits */
  function seg7(x, y, w, h, t, key) {
    const g = t * .22, L = x + t / 2, Rr = x + w - t / 2, T = y + t / 2, M = y + h / 2, B = y + h - t / 2;
    const Hs = (x1, x2, yc) => `${f(x1 + g)},${f(yc)} ${f(x1 + g + t / 2)},${f(yc - t / 2)} ${f(x2 - g - t / 2)},${f(yc - t / 2)} ${f(x2 - g)},${f(yc)} ${f(x2 - g - t / 2)},${f(yc + t / 2)} ${f(x1 + g + t / 2)},${f(yc + t / 2)}`;
    const Vs = (xc, y1, y2) => `${f(xc)},${f(y1 + g)} ${f(xc + t / 2)},${f(y1 + g + t / 2)} ${f(xc + t / 2)},${f(y2 - g - t / 2)} ${f(xc)},${f(y2 - g)} ${f(xc - t / 2)},${f(y2 - g - t / 2)} ${f(xc - t / 2)},${f(y1 + g + t / 2)}`;
    const segs = { a: Hs(L, Rr, T), b: Vs(Rr, T, M), c: Vs(Rr, M, B), d: Hs(L, Rr, B), e: Vs(L, M, B), f: Vs(L, T, M), g: Hs(L, Rr, M) };
    const sk = Math.tan(7 * Math.PI / 180) * (y + h / 2);
    return `<g transform="translate(${f(sk)} 0) skewX(-7)">${Object.keys(segs).map(s => `<polygon class="seg" data-seg="${key}${s}" points="${segs[s]}"/>`).join('')}</g>`;
  }
  const DIG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', ' ': '', '-': 'g' };
  SM.setSeg = function (root, key, ch) {
    const on = DIG[ch] || '';
    'abcdefg'.split('').forEach(s => { const e = root.querySelector(`[data-seg="${key}${s}"]`); if (e) e.classList.toggle('on', on.includes(s)); });
  };

  /* helpers for scenery on dials */
  function crystals(cx, baseY, n, seed, cols, scale) {
    const r = SM.rng(seed); let g = ''; scale = scale || 1;
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - .5) * 150 * scale, h = (30 + r() * 60) * scale, w = (8 + r() * 12) * scale, lean = (r() - .5) * 30;
      const tipX = x + lean * .4, y0 = baseY;
      g += `<path d="M${f(x - w / 2)} ${f(y0)} L${f(x - w / 2 + lean * .3)} ${f(y0 - h * .8)} L${f(tipX)} ${f(y0 - h)} L${f(x + w / 2 + lean * .3)} ${f(y0 - h * .8)} L${f(x + w / 2)} ${f(y0)} Z" fill="${cols[0]}" opacity=".9"/>
        <path d="M${f(tipX)} ${f(y0 - h)} L${f(x + w / 2 + lean * .3)} ${f(y0 - h * .8)} L${f(x + w / 2)} ${f(y0)} L${f(x + lean * .1)} ${f(y0)} Z" fill="${cols[1]}" opacity=".85"/>
        <path d="M${f(x - w / 2 + lean * .3)} ${f(y0 - h * .8)} L${f(tipX)} ${f(y0 - h)} L${f(x + lean * .1)} ${f(y0)}" fill="none" stroke="${cols[2]}" stroke-width=".8" opacity=".9"/>`;
    }
    return g;
  }
  function clouds(list, fill, shadow) {
    return list.map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 8 Q-32 -6 -18 -6 Q-14 -20 2 -16 Q12 -26 24 -14 Q38 -14 36 0 Q44 8 34 12 L-26 12 Q-36 12 -30 8 Z" fill="${shadow}" transform="translate(2 4)"/><path d="M-30 8 Q-32 -6 -18 -6 Q-14 -20 2 -16 Q12 -26 24 -14 Q38 -14 36 0 Q44 8 34 12 L-26 12 Q-36 12 -30 8 Z" fill="${fill}"/></g>`).join('');
  }

  /* ---------------- FACES ---------------- */
  const FACES = SM.FACES = [];
  const def = o => { FACES.push(o); return o; };

  def({
    id: 'classic', name: 'Metropolis Classic', desc: 'Tri-compax chronograph · blue sunburst', finish: 'steel',
    bezel: { type: 'tachy', color: ['#0d1c3f', '#050b1d'], ink: '#eef2f7', accent: '#ff3b50' },
    hands: { style: 'dauphine', metal: 'steel', lume: '#eaffe6', sec: '#e3202f', counter: 'shield', subColor: '#e3202f', hourL: 84, minL: 128 },
    lume: '#9dffb0',
    render(ctx) {
      let g = K.base('#0b1f4d') + K.rehaut({ color: ['#f3f5f8', '#aab2bd'], ink: '#18223a', type: 'fifths' });
      g += K.disc('#1846a6') + K.disc('url(#p-sunburst)', .95, 'overlay') + K.dome();
      g += K.track(141, 'rgba(255,255,255,.75)', 'rail');
      g += K.indices({ type: 'baton', r0: 108, r1: 132, w: 7, metal: 'steel', lume: '#e8ffe4', twelve: 'double', skip: [6] });
      g += K.sub(ctx, 'sec', 230, 400, 33, { bg: '#e6eaf0', ink: '#1a2440', label: 'SEC', hand: '#1a2a5c' });
      g += K.sub(ctx, 'chr30', 370, 400, 33, { bg: '#e6eaf0', ink: '#1a2440', label: 'MIN', hand: '#e3202f' });
      g += K.sub(ctx, 'chr12', 300, 470, 33, { bg: '#e6eaf0', ink: '#1a2440', label: 'HRS', hand: '#e3202f' });
      g += K.dateWin(386, 478, 20, 15);
      g += SM.shield(300, 326, 58, 'classic');
      g += K.text(300, 365, 'SUPERMAN', { size: 8.5, fill: '#f6d36b', ls: 3.2, weight: 700 });
      g += K.text(300, 427, 'AUTOMATIC · CHRONOGRAPH', { size: 5.2, fill: '#dfe6f2', ls: 1.4 });
      g += K.text(300, 539, 'KRYPTON MADE', { size: 4.6, fill: '#dfe6f2', ls: 1.6, op: .8 });
      return g;
    }
  });

  def({
    id: 'digital', name: 'Krypton LED', desc: 'Seven-segment LED · 60-dot seconds ring', finish: 'black',
    bezel: { type: 'diver', color: ['#161719', '#060607'], ink: '#ff4a3a', lume: '#ffb0a0' },
    hands: { style: 'none' }, lume: '#ff5a3a', digital: true,
    render(ctx) {
      let g = K.base('#050507') + K.rehaut({ color: ['#1c1d20', '#060607'], ink: '#ff5a3a', type: 'minutes' });
      g += K.disc('#0a0a0c') + K.disc('url(#p-carbon)', .45) + K.dome(.8);
      for (let i = 0; i < 60; i++) { const [x, y] = SM.polar(CX, CY, 136, i * 6); g += `<circle class="led" data-led="${i}" cx="${f(x)}" cy="${f(y)}" r="${i % 5 ? 1.9 : 2.8}"/>`; }
      g += SM.shield(300, 293, 60, 'heat');
      g += `<rect x="182" y="334" width="236" height="112" rx="16" fill="#1a1c20"/><rect x="186" y="338" width="228" height="104" rx="13" fill="#0b0202"/>
        <rect x="186" y="338" width="228" height="104" rx="13" fill="none" stroke="#000" stroke-width="3" opacity=".8"/>`;
      g += `<g class="lcd">`;
      g += K.text(200, 355, 'MON', { size: 10, fill: '#ff4a3a', anchor: 'start', font: F.ui, weight: 700, bind: 'dayShort', cls: 'lcd-txt' });
      g += K.text(400, 355, 'SEP 28', { size: 10, fill: '#ff4a3a', anchor: 'end', font: F.ui, weight: 700, bind: 'monthDate', cls: 'lcd-txt' });
      const xs = [196, 238, 290, 332]; xs.forEach((x, i) => { g += seg7(x, 362, 36, 60, 7.5, 'd' + i); });
      g += `<circle class="seg colon" cx="${283.5}" cy="380" r="3.2"/><circle class="seg colon" cx="${281.5}" cy="404" r="3.2"/>`;
      g += seg7(374, 394, 15, 28, 3.6, 'd4') + seg7(392, 394, 15, 28, 3.6, 'd5');
      g += K.text(390, 385, 'AM', { size: 8, fill: '#ff4a3a', font: F.ui, weight: 700, bind: 'ampm', cls: 'lcd-txt' });
      ['TIME', 'CHR', 'TMR', 'ALM', 'FOCUS'].forEach((t, i) => { g += K.text(212 + i * 44, 436, t, { size: 7, fill: '#ff4a3a', font: F.ui, weight: 700, cls: 'lcd-ind', style: '', bind: '' }).replace('class="lcd-ind"', `class="lcd-ind" data-ind="${t}"`); });
      g += `</g>`;
      g += `<rect x="186" y="338" width="228" height="40" rx="13" fill="#fff" opacity=".05"/>`;
      g += K.text(300, 470, 'KRYPTON-TECH', { size: 8, fill: '#c8cdd4', ls: 3, weight: 700 });
      g += K.text(300, 486, '—', { size: 6.4, fill: '#ff6a55', ls: 1, bind: 'world2', font: F.ui, weight: 700 });
      g += K.text(300, 512, 'WATER RESIST 200M · NICK', { size: 4.6, fill: '#8a9098', ls: 1.2 });
      return g;
    },
    update(root, S) {
      let digits, sec, showColon = true, ampm = '';
      const ind = S.digitalShow;
      if (ind === 'CHR') { const ms = S.chronoMs; const m = Math.floor(ms / 60000) % 100, s = Math.floor(ms / 1000) % 60, cs = Math.floor(ms / 10) % 100; digits = SM.pad(m) + SM.pad(s); sec = SM.pad(cs); }
      else if (ind === 'TMR' || ind === 'FOCUS') { const ms = ind === 'TMR' ? S.timerLeft : S.focusLeft; const m = Math.floor(ms / 60000) % 100, s = Math.floor(ms / 1000) % 60; digits = SM.pad(m) + SM.pad(s); sec = '  '; showColon = Math.floor(ms / 500) % 2 === 0 || ms === 0; }
      else { let h = S.now.getHours(); if (!S.fmt24) { ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; } digits = (h < 10 && !S.fmt24 ? ' ' + h : SM.pad(h)) + SM.pad(S.now.getMinutes()); sec = SM.pad(S.now.getSeconds()); showColon = S.now.getMilliseconds() < 500; }
      const key = digits + sec + showColon + ampm + ind;
      if (root._k !== key) {
        root._k = key;
        for (let i = 0; i < 4; i++) SM.setSeg(root, 'd' + i, digits[i]);
        SM.setSeg(root, 'd4', sec[0]); SM.setSeg(root, 'd5', sec[1]);
        root.querySelectorAll('.colon').forEach(c => c.classList.toggle('on', showColon));
        const ap = root.querySelector('[data-bind="ampm"]'); if (ap) ap.textContent = ampm;
        root.querySelectorAll('.lcd-ind').forEach(e => e.classList.toggle('on', e.getAttribute('data-ind') === ind || (e.getAttribute('data-ind') === 'ALM' && S.alarmOn)));
      }
      const s = S.now.getSeconds();
      if (root._s !== s) { root._s = s; root.querySelectorAll('.led').forEach(e => { const i = +e.getAttribute('data-led'); e.classList.toggle('on', i <= s); }); }
    }
  });

  def({
    id: 'crystal', name: 'Kryptonian Crystal', desc: 'Faceted crystal · Krypton phase', finish: 'blue',
    bezel: { type: 'glyph', color: ['#0e2d45', '#03101c'], ink: '#8feaff' },
    hands: { style: 'glow', metal: 'cyan', lume: '#dffbff', sec: '#bff4ff', counter: 'dot', subColor: '#bff4ff', hourL: 86, minL: 126 },
    lume: '#7fe8ff',
    render(ctx) {
      const u = SM.uid('cr');
      let g = K.base('#06253b') + K.rehaut({ color: ['#12405e', '#041320'], ink: '#8feaff', type: 'glyph' });
      g += K.radial(u + 'g', [[0, '#3fb6e8'], [.55, '#0f4f7c'], [1, '#051a2c']]);
      g += K.disc(`url(#${u}g)`) + K.disc('url(#p-facets)', .8, 'overlay') + K.disc('url(#p-facets)', .25, 'screen');
      g += `<circle cx="300" cy="400" r="124" fill="none" stroke="#8feaff" stroke-opacity=".35" stroke-width=".6"/><circle cx="300" cy="400" r="112" fill="none" stroke="#8feaff" stroke-opacity=".25" stroke-width=".6"/>`;
      const r = SM.rng(5); for (let i = 0; i < 36; i++) g += `<g transform="rotate(${i * 10} 300 400)">${SM.glyph(300, 282, 7, r, '#9ff0ff', .8)}</g>`;
      g += K.indices({ type: 'crystal', r0: 126, r1: 142, w: 7, metal: 'white', lume: '#dffbff', flat: 'rgba(200,245,255,.55)', stroke: '#e8fdff', sw: .8, shadow: .25 });
      g += `<ellipse cx="300" cy="332" rx="62" ry="54" fill="url(#${u}g)" opacity=".0"/>`;
      g += SM.shield(300, 332, 76, 'crystal');
      g += K.text(300, 382, 'KRYPTONIAN CRYSTAL', { size: 6.4, fill: '#c8f6ff', ls: 2.4, weight: 600 });
      g += K.sub(ctx, 'moon', 300, 468, 32, { bg: '#062033', tex: 'p-facets', texOp: .5, ring: '#8feaff', ink: '#bff4ff', moon: '#d9f7ff', label: 'KRYPTON PHASE' });
      return g;
    }
  });

  def({
    id: 'fortress', name: 'Fortress of Solitude', desc: 'Ice guilloché · blued steel · small seconds', finish: 'steel',
    bezel: { type: 'engraved', text: 'FORTRESS · OF · SOLITUDE · ARCTIC · CIRCLE · ICE · CRYSTAL · ' + 'FORTRESS · OF · SOLITUDE ·', ink: '#27324a' },
    hands: { style: 'sword', metal: 'blued', lume: '#d7f3ff', sec: '#2a6fe0', counter: 'dot', subColor: '#1d4fb8', hourL: 86, minL: 128 },
    lume: '#9fe0ff',
    render(ctx) {
      const u = SM.uid('ft');
      let g = K.base('#dde9f3') + K.rehaut({ color: ['#ffffff', '#b8c9d9'], ink: '#244b82', type: 'minutes' });
      g += K.radial(u + 'g', [[0, '#ffffff'], [.6, '#e3f1fb'], [1, '#a9cbe6']], .5, .4, .6);
      g += K.disc(`url(#${u}g)`) + K.disc('url(#p-guilloche)', .9);
      g += `<g clip-path="url(#dial-clip)" opacity=".85">${crystals(300, 548, 14, 12, ['#cfe8fb', '#8fbde3', '#ffffff'], 1.3)}</g>`;
      g += K.dome(.6);
      g += K.indices({ type: 'dagger', r0: 104, r1: 134, w: 9, metal: 'steel', lume: '#d7f3ff', twelve: 'double', skip: [6], shadow: .3 });
      g += SM.shield(300, 330, 66, 'ice');
      g += K.text(300, 375, 'FORTRESS OF SOLITUDE', { size: 6.2, fill: '#1c3a66', ls: 2.2, weight: 700 });
      g += K.text(300, 386, 'ARCTIC CHRONOMETER', { size: 4.4, fill: '#35598c', ls: 1.6 });
      g += K.sub(ctx, 'sec', 300, 472, 30, { bg: '#f4f9fd', tex: 'p-snail', ink: '#244b82', ring: '#9fb9d4', hand: '#1d4fb8' });
      g += K.sub(ctx, 'pwr', 224, 420, 22, { bg: '#eef5fb', ink: '#244b82', ring: '#9fb9d4', hand: '#1d4fb8', accent: '#e3202f', label: 'SOLAR' });
      return g;
    }
  });

  def({
    id: 'heat', name: 'Heat Vision', desc: 'Molten fumé · pulsing heat rings · kelvin gauge', finish: 'black',
    bezel: { type: 'diver', color: ['#4d0a05', '#170201'], ink: '#ffa040', lume: '#ffd27a' },
    hands: { style: 'baton', metal: 'orange', lume: '#fff0b0', sec: '#ffcf4a', counter: 'dot', subColor: '#ffcf4a', hourL: 82, minL: 124, hourW: 11, minW: 9 },
    lume: '#ffb347',
    render(ctx) {
      const u = SM.uid('ht');
      let g = K.base('#140202') + K.rehaut({ color: ['#3a0a05', '#0d0101'], ink: '#ff9a3a', type: 'minutes' });
      g += K.radial(u + 'g', [[0, '#8a1a06'], [.45, '#3a0603'], [1, '#050000']]);
      g += K.radial(u + 'h', [[0, '#ffcf6a', .9], [.35, '#ff5a14', .5], [1, '#ff2000', 0]]);
      g += K.disc(`url(#${u}g)`) + K.disc('url(#p-sunburst)', .35, 'overlay');
      for (let i = 0; i < 6; i++) g += `<circle class="anim-pulse" style="animation-delay:${-i * .5}s" cx="300" cy="400" r="${40 + i * 16}" fill="none" stroke="#ff6a1a" stroke-opacity="${.5 - i * .06}" stroke-width="${2.2 - i * .2}"/>`;
      g += `<circle class="anim-glow" cx="300" cy="396" r="90" fill="url(#${u}h)"/>`;
      g += K.indices({ type: 'baton', r0: 116, r1: 138, w: 6, metal: 'orange', flat: '#ff8a2a', lume: '#ffd27a', twelve: 'triangle', lumeBody: true, shadow: .5 });
      g += K.text(300, 296, 'HEAT VISION', { size: 7.6, fill: '#ffb060', ls: 3.4, weight: 700 });
      g += SM.shield(300, 392, 104, 'heat');
      g += K.sub(ctx, 'gauge', 300, 484, 26, { bg: '#1a0302', tex: false, ink: '#ffb060', ring: '#ff6a1a', hand: '#ffcf4a', accent: '#ff3a1a', accent2: '#ffb060', label: 'KELVIN', lo: '0', hi: '6K' });
      return g;
    }
  });

  def({
    id: 'kryptonite', name: 'Kryptonite', desc: 'Radioactive lume · crystal cluster · radiation gauge', finish: 'black',
    bezel: { type: 'diver', color: ['#0c1f12', '#020705'], ink: '#8dffab', lume: '#8dffab' },
    hands: { style: 'baton', metal: 'black', lume: '#8dffab', sec: '#39ff6a', counter: 'dot', subColor: '#39ff6a', hourL: 82, minL: 124, hourW: 12, minW: 9 },
    lume: '#39ff6a',
    render(ctx) {
      const u = SM.uid('kr');
      let g = K.base('#030a06') + K.rehaut({ color: ['#12301c', '#020604'], ink: '#8dffab', type: 'minutes' });
      g += K.radial(u + 'g', [[0, '#0f3a1c'], [.6, '#051609'], [1, '#010402']], .5, .7, .7);
      g += K.radial(u + 'h', [[0, '#5dff8a', .7], [.5, '#20c050', .25], [1, '#20c050', 0]]);
      g += K.disc(`url(#${u}g)`) + K.disc('url(#p-hex)', .8);
      g += `<ellipse class="anim-glow" cx="300" cy="520" rx="120" ry="70" fill="url(#${u}h)"/>`;
      g += `<g clip-path="url(#dial-clip)">${crystals(300, 552, 16, 33, ['#1fbf52', '#0a6a2a', '#caffd8'], 1.15)}</g>`;
      g += K.dome(.7);
      g += K.indices({ type: 'dot', r0: 118, r1: 136, w: 9, metal: 'black', lume: '#8dffab', twelve: 'triangle', bigQuarters: true, skip: [6] });
      g += SM.shield(300, 330, 70, 'kryptonite');
      g += K.text(300, 378, 'KRYPTONITE', { size: 9, fill: '#7dff9e', ls: 4, weight: 700 });
      g += K.sub(ctx, 'gauge', 234, 430, 25, { bg: '#051209', tex: false, ink: '#8dffab', ring: '#39ff6a', hand: '#39ff6a', accent: '#39ff6a', accent2: '#8dffab', label: 'RAD', lo: '0', hi: 'MAX' });
      g += K.sub(ctx, 'sec', 366, 430, 25, { bg: '#051209', tex: false, ink: '#8dffab', ring: '#39ff6a', hand: '#39ff6a' });
      return g;
    }
  });

  def({
    id: 'chrome', name: 'Chrome Minimal', desc: 'Matte black · mirror-polished S', finish: 'steel',
    bezel: { type: 'smooth' },
    hands: { style: 'pencil', metal: 'steel', sec: '#d9dde3', counter: 'dot', lumeOn: false, secLume: false, hourL: 88, minL: 132, hourW: 9, minW: 7 },
    lume: '#e6f0ff',
    render() {
      let g = K.base('#0b0c0e') + K.rehaut({ color: ['#1c1e22', '#060708'], ink: '#8a9098', type: 'plain' });
      g += K.disc('#0c0d0f') + K.disc('url(#p-noise)', 1) + K.dome(.7);
      g += K.track(140, '#8a9098', 'dots', .8);
      g += K.indices({ type: 'baton', r0: 112, r1: 138, w: 8, metal: 'steel', skip: [1, 2, 4, 5, 7, 8, 10, 11] });
      g += SM.shield(300, 402, 150, 'chrome');
      g += K.text(300, 498, 'STEEL · EDITION', { size: 6, fill: '#9aa1aa', ls: 3 });
      g += K.text(300, 296, 'NICK', { size: 6.4, fill: '#c9ced6', ls: 5, weight: 500 });
      return g;
    }
  });

  def({
    id: 'daily', name: 'Daily Planet', desc: 'Newsprint front page · edition date', finish: 'gold',
    bezel: { type: 'engraved', text: 'DAILY PLANET · METROPOLIS · LATE CITY EDITION · DAILY PLANET · METROPOLIS · LATE CITY ·', ink: '#3a2a0a' },
    hands: { style: 'leaf', metal: 'black', sec: '#b3262f', counter: 'dot', lumeOn: false, secLume: false, hourL: 84, minL: 124, hourW: 12, minW: 10 },
    lume: '#fff4d0',
    render(ctx) {
      let g = K.base('#e9dcbc') + K.rehaut({ color: ['#f3ead3', '#bda97f'], ink: '#2b2418', type: 'minutes' });
      g += K.disc('url(#p-paper)') + K.disc('url(#p-halftone)', .35) + `<circle cx="300" cy="400" r="146" fill="url(#g-vig)" opacity=".5"/>`;
      g += K.numerals({ r: 128, size: 12.5, fill: '#1c1812', font: F.serif, roman: true, weight: 700 });
      g += `<g transform="translate(300 262)"><circle r="9" fill="#e9dcbc" stroke="#1c1812" stroke-width="1.2"/><ellipse rx="4" ry="9" fill="none" stroke="#1c1812" stroke-width=".7"/><line x1="-9" x2="9" stroke="#1c1812" stroke-width=".7"/><ellipse rx="15" ry="3.6" fill="none" stroke="#1c1812" stroke-width="1.1" transform="rotate(-18)"/></g>`;
      g += K.text(300, 294, 'The Daily Planet', { size: 19, fill: '#15110c', font: F.frak, weight: 400 });
      g += `<line x1="214" y1="301" x2="386" y2="301" stroke="#15110c" stroke-width="1.3"/><line x1="214" y1="304" x2="386" y2="304" stroke="#15110c" stroke-width=".5"/>`;
      g += K.text(300, 311.5, 'METROPOLIS — MONDAY, SEPTEMBER 28, 2026 — 25¢', { size: 4.4, fill: '#2a2418', ls: .4, font: F.serif, weight: 700, bind: 'dateline' });
      g += `<line x1="214" y1="315" x2="386" y2="315" stroke="#15110c" stroke-width=".5"/>`;
      g += K.text(300, 336, 'UP, UP &amp; AWAY!', { size: 17, fill: '#15110c', font: F.serif, weight: 900, ls: .3 });
      g += K.text(300, 346, 'Mysterious hero spotted over Metropolis skyline', { size: 5, fill: '#2a2418', font: F.serif, weight: 400, style: 'font-style:italic' });
      g += `<rect x="212" y="353" width="72" height="62" fill="#d8c9a4" stroke="#15110c" stroke-width=".8"/><rect x="212" y="353" width="72" height="62" fill="url(#p-halftone)" opacity=".8"/>`;
      g += SM.shield(248, 384, 48, 'ink');
      const lorem = 'Witnesses report a figure in a red cape lifting a stalled train clear of the Hob\'s River bridge moments before disaster. Our reporters followed the trail across the city; eyewitnesses describe incredible speed and strength. City officials praised the rescue while police searched for answers. More on page A4. Editorial: who is the Man of Tomorrow? Weather: clear skies, light winds. ';
      let y = 358, pos = 0; const words = lorem.split(' ');
      for (let line = 0; line < 12; line++) {
        let s = ''; while (pos < words.length * 3 && (s + words[pos % words.length]).length < 30) { s += words[pos % words.length] + ' '; pos++; }
        g += K.text(292, y, SM.esc(s.trim()), { size: 4.1, fill: '#2a2418', anchor: 'start', font: F.serif, weight: 400 }); y += 5.1;
      }
      g += `<line x1="300" y1="422" x2="300" y2="422" />`;
      g += K.sub(ctx, 'datebig', 300, 470, 24, { bg: '#efe4c8', tex: 'p-halftone', texBlend: 'normal', texOp: .5, ink: '#15110c', ring: '#15110c', ringW: 1, label: 'EDITION' });
      return g;
    }
  });

  def({
    id: 'manofsteel', name: 'Man of Steel Sport', desc: 'Carbon fibre · screwed bezel · tri-compax', finish: 'black',
    bezel: { type: 'screws', color: ['#17191c', '#060607'], ink: '#f2f4f6', accent: '#e3263c' },
    hands: { style: 'baton', metal: 'steel', lume: '#eafff1', sec: '#e3263c', counter: 'shield', subColor: '#e3263c', hourL: 82, minL: 126, hourW: 12, minW: 9 },
    lume: '#b8ffd0',
    render(ctx) {
      let g = K.base('#0c0d0f') + K.rehaut({ color: ['#c81d33', '#5c0812'], ink: '#ffffff', type: 'minutes' });
      g += K.disc('#111214') + K.disc('url(#p-carbon)', 1) + K.dome(.9);
      g += K.indices({ type: 'baton', r0: 110, r1: 138, w: 9, metal: 'steel', lume: '#eafff1', twelve: 'triangle', skip: [3, 6, 9] });
      for (const h of [3, 9]) { const [x, y] = SM.polar(300, 400, 124, h * 30); g += `<rect x="${f(x - 7)}" y="${f(y - 2)}" width="14" height="4" fill="#e3263c"/>`; }
      const st = { bg: '#141518', tex: 'p-carbon', texBlend: 'normal', texOp: .9, ink: '#f2f4f6', ring: '#e3263c', ringW: 2 };
      g += K.sub(ctx, 'sec', 232, 400, 32, Object.assign({ hand: '#f2f4f6', label: 'SEC' }, st));
      g += K.sub(ctx, 'chr30', 368, 400, 32, Object.assign({ hand: '#e3263c', label: 'MIN' }, st));
      g += K.sub(ctx, 'chr12', 300, 470, 32, Object.assign({ hand: '#e3263c', label: 'HRS' }, st));
      g += SM.shield(300, 322, 56, 'carbon');
      g += K.text(300, 362, 'MAN OF STEEL', { size: 8, fill: '#ffffff', ls: 3.2, weight: 700 });
      g += K.text(300, 427, 'CHRONOGRAPH · 500M', { size: 5, fill: '#ff5a6a', ls: 1.6, weight: 600 });
      return g;
    }
  });

  def({
    id: 'justice', name: 'Justice League Gold', desc: 'Gold sunburst · perpetual day/date · moon', finish: 'gold',
    bezel: { type: 'fluted' },
    hands: { style: 'dauphine', metal: 'black', lume: '#fff4c8', sec: '#15120c', counter: 'dot', subColor: '#e6c068', hourL: 84, minL: 128 },
    lume: '#fff2b8',
    render(ctx) {
      let g = K.base('#6a4a12') + K.rehaut({ color: ['#f6dc92', '#8c6420'], ink: '#3a2606', type: 'minutes' });
      g += K.disc('#c8962f') + K.disc('url(#p-sunburst)', 1, 'overlay') + K.dome(.8);
      g += K.indices({ type: 'star', r0: 118, r1: 136, w: 9, metal: 'gold', skip: [3, 6, 9], bigQuarters: true });
      g += K.track(142, '#3a2606', 'ticks', .5);
      const st = { bg: '#0d0c0a', tex: 'p-snail', texOp: .35, ink: '#f0cf74', ring: '#f6dc92', ringW: 2 };
      g += K.sub(ctx, 'day', 230, 400, 31, Object.assign({ hand: '#f0cf74' }, st));
      g += K.sub(ctx, 'date', 370, 400, 31, Object.assign({ hand: '#f0cf74' }, st));
      g += K.sub(ctx, 'moon', 300, 472, 31, Object.assign({ moon: '#f6e3a0', label: 'LUNAR PHASE' }, st));
      g += SM.shield(300, 322, 60, 'gold');
      g += K.text(300, 364, 'JUSTICE LEAGUE', { size: 7.4, fill: '#2a1a04', ls: 2.6, weight: 700 });
      g += K.text(300, 428, 'PERPETUAL CALENDAR', { size: 4.8, fill: '#2a1a04', ls: 1.6, font: F.roman, weight: 700 });
      return g;
    }
  });

  def({
    id: 'kalel', name: 'Kal-El Glyph', desc: 'Rotating Kryptonian script rings', finish: 'blue',
    bezel: { type: 'glyph', color: ['#141a44', '#04061a'], ink: '#8feaff' },
    hands: { style: 'glow', metal: 'cyan', lume: '#e8fdff', sec: '#bff4ff', counter: 'dot', hourL: 80, minL: 122 },
    lume: '#7fe8ff',
    render(ctx) {
      const u = SM.uid('ke');
      let g = K.base('#070a24') + K.rehaut({ color: ['#1b2360', '#04061a'], ink: '#8feaff', type: 'glyph' });
      g += K.radial(u + 'g', [[0, '#1d2f7a'], [.6, '#0b1040'], [1, '#03041a']]);
      g += K.radial(u + 'h', [[0, '#5fd4ff', .5], [1, '#5fd4ff', 0]]);
      g += K.disc(`url(#${u}g)`) + `<circle cx="300" cy="400" r="70" fill="url(#${u}h)" class="anim-glow"/>`;
      const ring = (r, n, cls, seed, size, op) => { const rr = SM.rng(seed); let s = `<g class="${cls}">`; s += `<circle cx="300" cy="400" r="${r + size * .8}" fill="none" stroke="#8feaff" stroke-opacity=".25" stroke-width=".5"/><circle cx="300" cy="400" r="${r - size * .8}" fill="none" stroke="#8feaff" stroke-opacity=".25" stroke-width=".5"/>`; for (let i = 0; i < n; i++) s += `<g transform="rotate(${f(i * 360 / n)} 300 400)" opacity="${op}">${SM.glyph(300, 400 - r, size, rr, '#9ff0ff', .9)}</g>`; return s + '</g>'; };
      g += ring(118, 40, 'spin spin-a', 3, 7, .8) + ring(96, 30, 'spin spin-b', 4, 7, .65) + ring(74, 22, 'spin spin-c', 8, 6, .5);
      const hr = SM.rng(42);
      for (let h = 0; h < 12; h++) { const [x, y] = SM.polar(300, 400, 136, h * 30); g += `<g class="lume">${SM.glyph(x, y, h % 3 === 0 ? 11 : 8, hr, '#c8f8ff', h % 3 === 0 ? 1.8 : 1.3)}</g>`; }
      g += SM.shield(300, 400, 92, 'glyph');
      g += K.text(300, 472, 'HOUSE OF EL', { size: 6.6, fill: '#bff4ff', ls: 4, weight: 600 });
      return g;
    }
  });

  def({
    id: 'solarflare', name: 'Solar Flare', desc: 'Live animated corona · yellow-sun power', finish: 'gold',
    bezel: { type: 'diver', color: ['#2c1700', '#0a0500'], ink: '#ffcc33', lume: '#fff2b0' },
    hands: { style: 'dauphine', metal: 'gold', lume: '#fff4c0', sec: '#ffd21f', counter: 'dot', subColor: '#ffd21f', hourL: 84, minL: 128 },
    lume: '#ffd76a', canvas: 'solar',
    render(ctx) {
      const u = SM.uid('sf');
      let g = K.base('#0a0400') + K.rehaut({ color: ['#3a2200', '#0a0500'], ink: '#ffcc33', type: 'minutes' });
      g += K.radial(u + 's', [[0, '#fff6c8'], [.3, '#ffb81f'], [.62, '#e04a00'], [.8, '#5a1000'], [1, '#050100']]);
      g += `<circle class="solar-fallback" cx="300" cy="400" r="146" fill="url(#${u}s)"/>`;
      return g;
    },
    overlay(ctx) {
      let g = K.indices({ type: 'dot', r0: 124, r1: 140, w: 8, metal: 'gold', lume: '#fff2b0', twelve: 'triangle', bigQuarters: true });
      g += SM.shield(300, 402, 104, 'solar');
      g += K.text(300, 296, 'SOLAR FLARE', { size: 7.4, fill: '#fff2c0', ls: 3.4, weight: 700, stroke: '#2a1000', sw: 2 });
      g += K.text(300, 512, 'YELLOW SUN POWERED', { size: 5, fill: '#fff2c0', ls: 1.8, weight: 600, stroke: '#2a1000', sw: 1.6 });
      return g;
    }
  });

  def({
    id: 'lex', name: 'Luthor', desc: 'Villain edition · hex tech · cracked S', finish: 'titanium',
    bezel: { type: 'screws', color: ['#1f2327', '#08090a'], ink: '#6dffa0', accent: '#39ff7a' },
    hands: { style: 'sword', metal: 'black', lume: '#6dffa0', sec: '#39ff6a', counter: 'dot', subColor: '#39ff6a', hourL: 84, minL: 126 },
    lume: '#39ff7a',
    render(ctx) {
      const u = SM.uid('lx');
      let g = K.base('#050607') + K.rehaut({ color: ['#23282d', '#060708'], ink: '#6dffa0', type: 'minutes' });
      g += K.radial(u + 'g', [[0, '#12301c'], [.5, '#07100a'], [1, '#020303']], .3, .7, .8);
      g += K.disc(`url(#${u}g)`) + K.disc('url(#p-hex)', 1);
      const r = SM.rng(77); let tr = '';
      for (let i = 0; i < 16; i++) { let x = 170 + r() * 260, y = 280 + r() * 240; tr += `M${f(x)} ${f(y)} `; for (let k = 0; k < 3; k++) { if (r() > .5) x += (r() - .5) * 80; else y += (r() - .5) * 80; tr += `L${f(x)} ${f(y)} `; } }
      g += `<g clip-path="url(#dial-clip)"><path d="${tr}" fill="none" stroke="#39ff7a" stroke-width=".7" opacity=".45"/></g>`;
      g += K.dome(.8);
      g += K.indices({ type: 'wedge', r0: 112, r1: 138, w: 10, metal: 'black', lume: '#6dffa0', twelve: 'double', skip: [6] });
      g += SM.shield(300, 330, 66, 'lex');
      g += K.text(300, 378, 'LUTHOR', { size: 12, fill: '#6dffa0', ls: 7, weight: 700 });
      g += K.text(300, 390, 'ANTI-KRYPTONIAN CHRONOMETER', { size: 4.4, fill: '#9aa1a8', ls: 1.4 });
      g += K.sub(ctx, 'pwr', 300, 470, 30, { bg: '#0b0e10', tex: 'p-hex', texBlend: 'normal', texOp: 1, ink: '#6dffa0', ring: '#39ff7a', hand: '#39ff6a', accent: '#39ff7a', label: 'K-RESERVE' });
      return g;
    }
  });

  def({
    id: 'krypto', name: 'Krypto Playful', desc: 'Super-dog edition · clouds · treat meter', finish: 'steel',
    bezel: { type: 'diver', color: ['#ff4d6d', '#c8103a'], ink: '#ffffff', lume: '#ffffff' },
    hands: { style: 'cartoon', metal: 'red', lume: '#ffffff', sec: '#ff3d62', counter: 'bone', subColor: '#ff3d62', hourL: 80, minL: 120, hourW: 13, minW: 10 },
    lume: '#ffffff',
    render(ctx) {
      const u = SM.uid('kp');
      let g = K.base('#5ab4f4') + K.rehaut({ color: ['#ffffff', '#cfe6f8'], ink: '#1d63b8', type: 'minutes' });
      g += K.linear(u + 'g', [[0, '#b4e4ff'], [1, '#3e9ce8']]);
      g += K.disc(`url(#${u}g)`);
      g += `<g clip-path="url(#dial-clip)">${clouds([[210, 300, 1.1], [382, 330, .9], [230, 470, .8], [385, 500, 1.2], [300, 540, 1.4]], '#ffffff', '#9fcff2')}
        <path d="M160 520 Q260 440 440 480 L440 560 L160 560 Z" fill="#e8243f" opacity=".9"/><path d="M160 520 Q260 440 440 480" fill="none" stroke="#ff7a8e" stroke-width="3"/></g>`;
      g += K.indices({ type: 'paw', r0: 124, r1: 140, w: 8, flat: '#ffffff', stroke: '#1d63b8', sw: .8, skip: [0, 3, 6, 9], shadow: .2 });
      g += K.numerals({ r: 126, size: 20, fill: '#ffffff', font: F.ui, weight: 700, hours: [0, 3, 6, 9], stroke: '#1d63b8', sw: 3.5 });
      g += SM.shield(300, 332, 72, 'playful');
      g += K.text(300, 382, 'KRYPTO', { size: 11, fill: '#ffffff', ls: 4, weight: 700, font: F.ui, stroke: '#1d63b8', sw: 2.4 });
      g += K.sub(ctx, 'gauge', 300, 460, 24, { bg: '#ffffff', tex: false, ink: '#1d63b8', ring: '#ff3d62', ringW: 2.2, hand: '#ff3d62', accent: '#ff3d62', accent2: '#1d63b8', label: 'TREATS', lo: '0', hi: '∞' });
      return g;
    }
  });

  /* ================= v3 faces ================= */
  def({
    id: 'bizarro', name: 'Bizarro World', desc: 'Everything backwards · hands run counter-clockwise', finish: 'titanium', reverse: true,
    bezel: { type: 'engraved', text: 'OPPOSITE · DAY · GOODBYE · IS · HELLO · UP · IS · DOWN · ' + 'OPPOSITE · DAY · GOODBYE · IS · HELLO ·', ink: '#1f2a24' },
    hands: { style: 'cartoon', metal: 'black', lume: '#d7ffe0', sec: '#b8ff3a', counter: 'dot', subColor: '#b8ff3a', hourL: 80, minL: 122, hourW: 12, minW: 9 },
    lume: '#c8ff6a',
    render(ctx) {
      const u = SM.uid('bz');
      let g = K.base('#8b9a92') + K.rehaut({ color: ['#c9d6cf', '#6d7a73'], ink: '#1f2a24', type: 'minutes' });
      g += `<g transform="translate(600 0) scale(-1 1)">`;
      g += K.radial(u + 'g', [[0, '#d4dfd8'], [.55, '#a6b5ad'], [1, '#6f7e76']], .45, .4, .65);
      g += K.disc(`url(#${u}g)`) + K.disc('url(#p-facets)', .35, 'multiply') + K.disc('url(#p-grain)', .5, 'overlay');
      /* cracked chalk: jagged lines */
      const r = SM.rng(404); let cr = '';
      for (let i = 0; i < 9; i++) { let [x, y] = SM.polar(CX, CY, 60 + r() * 80, r() * 360), d = `M${f(x)} ${f(y)}`; for (let k = 0; k < 5; k++) { x += (r() - .5) * 26; y += (r() - .5) * 26; d += ` L${f(x)} ${f(y)}`; } cr += d + ' '; }
      g += `<path d="${cr}" fill="none" stroke="#2b3530" stroke-opacity=".45" stroke-width=".8" clip-path="url(#dial-clip)"/>`;
      g += K.dome(.5);
      g += `</g>`;
      g += K.track(141, '#27322c', 'ticks');
      /* numerals run counter-clockwise and are mirrored */
      for (let h = 0; h < 12; h++) {
        const [x, y] = SM.polar(CX, CY, 117, -h * 30), s = h === 0 ? 12 : h;
        g += `<g transform="translate(${f(2 * x)} 0) scale(-1 1)">${K.text(x + 1, y + 7.6, s, { size: 20, fill: '#000', op: .35, font: F.ui, weight: 700 })}${K.text(x, y + 6.6, s, { size: 20, fill: '#1c2621', font: F.ui, weight: 700, cls: 'lume' })}</g>`;
      }
      g += `<g transform="translate(600 0) scale(-1 1)">${SM.shield(300, 322, 62, 'kryptonite')}${K.text(300, 362, 'BIZARRO', { size: 10, fill: '#1c2621', ls: 3, weight: 700, font: F.ui })}${K.text(300, 373, 'NUMBER ONE · MADE IN HTRAE', { size: 4.4, fill: '#2b3530', ls: 1.2 })}</g>`;
      g += K.sub(ctx, 'vitals', 300, 468, 34, { accent: '#b8ff3a', trace: '#efffcf', ink: '#1c2621', label: 'BIZARRO PULSE' });
      return g;
    }
  });

  def({
    id: 'phantom', name: 'Phantom Zone', desc: 'Spinning prison pane · vortex · Kryptonian vitals', finish: 'black',
    bezel: { type: 'glyph', color: ['#171126', '#07040f'], ink: '#b9a7ff' },
    hands: { style: 'sword', metal: 'white', lume: '#e2d9ff', sec: '#b39bff', counter: 'dot', subColor: '#b39bff', hourL: 84, minL: 126 },
    lume: '#b39bff',
    render(ctx) {
      const u = SM.uid('pz');
      let g = K.base('#07040f') + K.rehaut({ color: ['#2a2045', '#07040f'], ink: '#cbbcff', type: 'glyph' });
      g += K.radial(u + 'g', [[0, '#2a1d58'], [.35, '#120b2a'], [.8, '#06030e'], [1, '#020106']]);
      g += K.disc(`url(#${u}g)`);
      for (let i = 0; i < 14; i++) g += `<circle cx="300" cy="400" r="${f(12 + i * 9.6)}" fill="none" stroke="#9d86ff" stroke-opacity="${f(.05 + (i % 3 === 0 ? .1 : 0))}" stroke-width="${i % 3 === 0 ? .9 : .5}" stroke-dasharray="${f(2 + i)} ${f(3 + i * .7)}"/>`;
      g += K.disc('url(#p-grain)', .35, 'overlay');
      g += K.indices({ type: 'baton', r0: 118, r1: 136, w: 3.2, metal: 'white', lume: '#d9ceff', twelve: 'triangle', shadow: .6 });
      g += K.text(300, 300, 'PHANTOM ZONE', { size: 8, fill: '#d9ceff', ls: 3.2, weight: 700 });
      g += K.text(300, 310, 'CONTAINMENT CHRONOMETER', { size: 4.2, fill: '#a797e6', ls: 1.4 });
      g += K.sub(ctx, 'vitals', 300, 478, 32, { accent: '#b39bff', trace: '#efe9ff', ink: '#e9e2ff', label: 'PRISONER VITALS' });
      g += K.sub(ctx, 'sec', 228, 410, 22, { bg: '#0d0820', tex: false, ink: '#cbbcff', ring: '#5a4a9a', hand: '#b39bff' });
      g += K.sub(ctx, '24h', 372, 410, 22, { bg: '#0d0820', tex: false, ink: '#cbbcff', ring: '#5a4a9a', hand: '#b39bff' });
      return g;
    },
    /* the spinning pane is composited separately (CSS transform) so the dial never repaints for it */
    anim() {
      const u = SM.uid('pa'), s = 70;
      const pane = (k, op) => `<g transform="rotate(${k * 45} 300 400)"><rect x="${300 - s * (1 - k * .18)}" y="${400 - s * (1 - k * .18)}" width="${2 * s * (1 - k * .18)}" height="${2 * s * (1 - k * .18)}" fill="url(#${u})" stroke="#e6ddff" stroke-opacity="${op}" stroke-width="1"/></g>`;
      return [{ cls: 'spin', dur: 24, markup: `<defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6ddff" stop-opacity=".22"/><stop offset=".45" stop-color="#9d86ff" stop-opacity=".05"/><stop offset=".55" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#6d58d8" stop-opacity=".04"/></linearGradient></defs>
        <g transform="translate(300 400) scale(1 .96) translate(-300 -400)">${pane(0, .55)}${pane(1, .3)}</g>
        <g opacity=".85">${SM.shield(300, 400, 34, 'crystal')}</g>` }];
    }
  });

  def({
    id: 'tourbillon', name: 'Kryptonian Tourbillon', desc: 'Flying tourbillon at 6 · open-worked bridges · power reserve', finish: 'rose', tourbillon: true,
    bezel: { type: 'smooth' },
    hands: { style: 'leaf', metal: 'rose', lume: '#fff', sec: '#b8743d', counter: 'dot', subColor: '#b8743d', hourL: 84, minL: 126, hourW: 12, minW: 9, seconds: false },
    lume: '#ffe9d0',
    render(ctx) {
      const u = SM.uid('tb');
      let g = K.base('#15171c') + K.rehaut({ color: ['#e9d2c0', '#8a6a55'], ink: '#3a2418', type: 'fifths' });
      g += K.disc('#23262d') + K.disc('url(#p-geneva)', .55, 'overlay');
      /* skeleton bridges (polished bevels) */
      g += K.linear(u + 'b', [[0, '#f3dccb'], [.5, '#b8866a'], [1, '#6b4632']], 1, 1);
      const br = (d) => `<path d="${d}" fill="url(#${u}b)"/><path d="${d}" fill="url(#p-perlage)" opacity=".45" style="mix-blend-mode:multiply"/><path d="${d}" fill="none" stroke="url(#${u}b)" stroke-width="2.4"/><path d="${d}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".5" transform="translate(.6 .9)"/>`;
      g += br('M196 330 Q240 300 300 296 Q360 300 404 330 L392 346 Q350 318 300 316 Q250 318 208 346 Z');
      g += br('M214 432 Q236 470 262 478 L270 462 Q248 452 230 424 Z') + br('M386 432 Q364 470 338 478 L330 462 Q352 452 370 424 Z');
      for (let i = 0; i < 5; i++) { const [x, y] = SM.polar(300, 400, 94, 220 + i * 22); g += `<circle cx="${f(x)}" cy="${f(y)}" r="3.2" fill="#b0103a"/><circle cx="${f(x - .8)}" cy="${f(y - .8)}" r="1" fill="#fff" opacity=".7"/><circle cx="${f(x)}" cy="${f(y)}" r="4.4" fill="none" stroke="url(#${u}b)" stroke-width="1.4"/>`; }
      /* sapphire chapter ring */
      g += `<circle cx="300" cy="400" r="137" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="18"/>`;
      g += K.numerals({ roman: true, r: 128, size: 11, fill: '#f2dccb', font: F.roman, weight: 700, hours: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], applied: true });
      g += K.track(143, 'rgba(242,220,203,.7)', 'dots', .7);
      g += SM.shield(300, 360, 40, 'gold');
      g += K.text(300, 388, 'TOURBILLON', { size: 6.5, fill: '#f2dccb', ls: 3, weight: 700, font: F.roman });
      g += K.sub(ctx, 'pwr', 238, 408, 22, { bg: '#1b1d23', tex: false, ink: '#f2dccb', ring: '#b8866a', hand: '#e7b48e', accent: '#ffd34a', label: 'SOLAR' });
      g += K.sub(ctx, '24h', 362, 408, 22, { bg: '#1b1d23', tex: false, ink: '#f2dccb', ring: '#b8866a', hand: '#e7b48e' });
      return g;
    }
  });

  def({
    id: 'clark', name: 'Clark Kent', desc: 'Reporter\'s dress watch · enamel · calendar · hidden S', finish: 'gold',
    bezel: { type: 'smooth' },
    hands: { style: 'leaf', metal: 'blued', lume: '#fff', sec: '#1d3f9a', counter: 'dot', subColor: '#1d3f9a', hourL: 82, minL: 128, hourW: 11, minW: 8 },
    lume: '#bfe0ff',
    render(ctx) {
      const u = SM.uid('ck');
      let g = K.base('#efe6d2') + K.rehaut({ color: ['#fbf6ea', '#cfc3a8'], ink: '#3a3226', type: 'minutes' });
      g += K.radial(u + 'g', [[0, '#fffdf6'], [.7, '#f4ecda'], [1, '#e1d4b8']], .45, .38, .7);
      g += K.disc(`url(#${u}g)`) + K.disc('url(#p-paper)', .25, 'multiply') + K.disc('url(#p-grain)', .3, 'overlay') + K.dome(.5);
      g += K.track(142, '#2a241c', 'rail');
      g += K.numerals({ roman: true, r: 118, size: 15, fill: '#1c1812', font: F.roman, weight: 700, hours: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11] });
      /* the "shirt rip" at 12: collar + tie pulled open over the S */
      g += `<g transform="translate(300 302) scale(1.25)">
        <path d="M-24 -14 L24 -14 L24 18 L-24 18 Z" fill="#c8102e"/>${SM.shield(0, 4, 36, 'classic')}
        <path d="M-26 -16 L-6 -16 L-2 24 L-14 26 L-26 10 Z" fill="#fbfbf8" stroke="#b9b2a2" stroke-width=".6"/>
        <path d="M26 -16 L6 -16 L2 24 L14 26 L26 10 Z" fill="#fbfbf8" stroke="#b9b2a2" stroke-width=".6"/>
        <path d="M-6 -16 L0 -8 L-10 -2 Z M6 -16 L0 -8 L10 -2 Z" fill="#e9e6de" stroke="#b9b2a2" stroke-width=".5"/>
        <path d="M-2.5 -9 L2.5 -9 L4 12 L0 17 L-4 12 Z" fill="#2a3a6a" transform="rotate(18 0 0) translate(9 2)"/>
      </g>`;
      g += K.text(300, 352, 'CLARK KENT', { size: 7.5, fill: '#1c1812', ls: 3, weight: 700, font: F.serif });
      g += K.text(300, 362, 'DAILY PLANET · REPORTER\'S EDITION', { size: 3.9, fill: '#5a4f3e', ls: 1.1 });
      g += K.sub(ctx, 'cal', 300, 462, 46, { bg: '#fbf6ea', tex: false, ink: '#2a241c', ring: '#b6a887', accent: '#c0182a' });
      return g;
    }
  });

  def({
    id: 'hologram', name: 'Hologram Command', desc: 'Projector dial · 3D S shield hologram · weather + activity', finish: 'titanium', holo: true,
    bezel: { type: 'hours24', color: ['#0c1a24', '#03080c'], ink: '#7fe8ff' },
    hands: { style: 'glow', metal: 'cyan', lume: '#bff6ff', sec: '#3fe0ff', counter: 'dot', subColor: '#3fe0ff', hourL: 82, minL: 126 },
    lume: '#5fe8ff',
    render(ctx) {
      const u = SM.uid('hc');
      let g = K.base('#03080c') + K.rehaut({ color: ['#123244', '#03080c'], ink: '#7fe8ff', type: 'fifths' });
      g += K.radial(u + 'g', [[0, '#0e3448'], [.45, '#071a26'], [1, '#02070b']]);
      g += K.disc(`url(#${u}g)`) + K.disc('url(#p-carbon)', .35, 'screen') + K.disc('url(#p-holo)', .9);
      for (let i = 0; i < 4; i++) g += `<circle cx="300" cy="400" r="${38 + i * 26}" fill="none" stroke="#3fe0ff" stroke-opacity="${f(.28 - i * .05)}" stroke-width=".7" stroke-dasharray="${i % 2 ? '1 3' : '14 4 2 4'}"/>`;
      g += K.track(142, 'rgba(127,232,255,.8)', 'ticks', .6);
      g += K.indices({ type: 'baton', r0: 120, r1: 136, w: 3, metal: 'cyan', flat: '#7fe8ff', lume: '#bff6ff', twelve: 'double', skip: [3, 9], shadow: .6 });
      /* projector lens */
      g += K.radial(u + 'l', [[0, '#e9fdff'], [.2, '#7fe8ff'], [.5, '#0f5a78'], [.8, '#06202e'], [1, '#02080c']]);
      g += `<circle cx="300" cy="400" r="22" fill="#000" opacity=".5" transform="translate(1 2)"/><circle cx="300" cy="400" r="21" fill="url(#${u}l)"/><circle cx="300" cy="400" r="21" fill="none" stroke="#9aa6b0" stroke-width="2.2"/>
        <circle cx="300" cy="400" r="16" fill="none" stroke="#3fe0ff" stroke-opacity=".6" stroke-width=".6"/><ellipse cx="294" cy="393" rx="5" ry="3" fill="#fff" opacity=".6" transform="rotate(-30 294 393)"/>`;
      g += K.text(300, 322, 'HOLOGRAM', { size: 8, fill: '#9ff0ff', ls: 3.6, weight: 700, font: F.ui });
      g += K.text(300, 332, 'FORTRESS COMMAND · 3D S', { size: 4.2, fill: '#5fc8e0', ls: 1.3 });
      g += K.sub(ctx, 'weather', 222, 400, 30, { bg: '#051620', tex: false, ink: '#bff6ff', ring: '#1f6f8a' });
      g += K.sub(ctx, 'rings', 378, 400, 30, { bg: '#051620', tex: false, ink: '#bff6ff', ring: '#1f6f8a', core: '#03080c', shield: 'ice' });
      g += K.text(300, 500, 'TAP ◈ TO SPIN THE SHIELD', { size: 4, fill: '#5fc8e0', ls: 1.2, op: .8 });
      return g;
    }
  });

  def({
    id: 'harbor', name: 'Metropolis Harbor', desc: 'Tide gauge · live weather · moon · lighthouse', finish: 'steel',
    bezel: { type: 'diver', color: ['#0d2a4a', '#04111f'], ink: '#e6f1ff', lume: '#bfe6ff' },
    hands: { style: 'sword', metal: 'white', lume: '#e8fff0', sec: '#ff5a3a', counter: 'shield', subColor: '#ff5a3a', hourL: 82, minL: 126 },
    lume: '#9dffb0',
    render(ctx) {
      const u = SM.uid('hb');
      let g = K.base('#06182e') + K.rehaut({ color: ['#e6eef7', '#8a9bb0'], ink: '#0d2a4a', type: 'minutes' });
      g += K.radial(u + 'g', [[0, '#1f5a9a'], [.6, '#0d3160'], [1, '#051a36']], .5, .35, .7);
      g += K.disc(`url(#${u}g)`) + K.disc('url(#p-barley)', .75, 'overlay') + K.dome(.8);
      /* engraved lighthouse at 12 */
      g += `<g transform="translate(300 318)" opacity=".95"><path d="M-5 16 L-3.2 -8 L3.2 -8 L5 16 Z" fill="#e6f1ff"/><rect x="-3.2" y="-2" width="6.4" height="3" fill="#ff5a3a"/><rect x="-3.2" y="6" width="6.4" height="3" fill="#ff5a3a"/><rect x="-4" y="-12" width="8" height="4" fill="#ffd34a"/><path d="M-4.6 -12 L0 -16 L4.6 -12 Z" fill="#e6f1ff"/>
        <path d="M4 -10 L34 -18 L34 -2 Z" fill="#ffd34a" opacity=".22"/><path d="M-4 -10 L-34 -18 L-34 -2 Z" fill="#ffd34a" opacity=".12"/><path d="M-30 17 Q-15 13 0 17 T30 17" fill="none" stroke="#9fd0ff" stroke-width="1"/></g>`;
      g += K.indices({ type: 'wedge', r0: 110, r1: 136, w: 9, metal: 'white', lume: '#e8fff0', twelve: 'triangle', skip: [0, 3, 6, 9], shadow: .45 });
      g += K.text(300, 350, 'METROPOLIS HARBOR', { size: 6.5, fill: '#e6f1ff', ls: 2.4, weight: 700 });
      g += K.text(300, 359, 'TIDE MASTER · 300 M', { size: 4.2, fill: '#9fc4ea', ls: 1.4 });
      g += K.sub(ctx, 'tide', 300, 468, 36, { sky: '#081a33', ink: '#dff1ff', ring: '#9fb9d4', hand: '#ff5a3a' });
      g += K.sub(ctx, 'weather', 224, 404, 28, { bg: '#0a2544', tex: false, ink: '#e6f1ff', ring: '#9fb9d4' });
      g += K.sub(ctx, 'moon', 376, 404, 28, { bg: '#0a2544', ring: '#9fb9d4', ink: '#e6f1ff', label: 'MOON' });
      return g;
    }
  });

  /* ---------------- Face Builder ---------------- */
  const CUSTOM_DEFAULT = { name: 'Nick\'s Build', dial: '#1846a6', tex: 'sunburst', hands: 'dauphine', metal: 'steel', idx: 'baton', shield: 'classic', left: 'sec', right: 'chr30', bottom: 'weather', bezel: 'tachy', bezelColor: '#0d1c3f', lume: '#9dffb0', sec: '#e3202f', finish: 'steel' };
  SM.CUSTOM_DEFAULT = CUSTOM_DEFAULT;
  SM.BUILDER = {
    tex: [['sunburst', 'Sunburst'], ['guilloche', 'Guilloché'], ['barley', 'Barleycorn'], ['brushR', 'Brushed'], ['carbon', 'Carbon'], ['facets', 'Crystal'], ['plain', 'Lacquer']],
    hands: [['dauphine', 'Dauphine'], ['sword', 'Sword'], ['baton', 'Baton'], ['leaf', 'Leaf'], ['pencil', 'Pencil'], ['glow', 'Hologram'], ['cartoon', 'Cartoon']],
    metal: [['steel', 'Steel'], ['gold', 'Gold'], ['rose', 'Rose'], ['blued', 'Blued'], ['black', 'Black'], ['red', 'Red'], ['cyan', 'Cyan']],
    idx: [['baton', 'Baton'], ['dagger', 'Dagger'], ['wedge', 'Wedge'], ['dot', 'Dot'], ['crystal', 'Crystal'], ['star', 'Star'], ['arabic', 'Arabic'], ['roman', 'Roman']],
    comps: [['none', 'None'], ['sec', 'Seconds'], ['chr30', 'Chrono 30'], ['chr12', 'Chrono 12'], ['pwr', 'Solar power'], ['moon', 'Moon'], ['24h', '24 h'], ['weather', 'Weather'], ['rings', 'Activity rings'], ['tide', 'Harbor tide'], ['vitals', 'Vitals'], ['cal', 'Calendar']],
    bezel: [['tachy', 'Tachymeter'], ['diver', 'Diver'], ['smooth', 'Smooth'], ['fluted', 'Fluted'], ['screws', 'Screwed'], ['glyph', 'Glyph'], ['hours24', '24 hour']],
    dials: ['#1846a6', '#0b0d12', '#e9ecf1', '#b3141f', '#0f5a3a', '#d7a52c', '#4b2a7a', '#0e3448', '#6b737d', '#e8d9b8']
  };
  const lumOf = hex => { const n = parseInt(hex.slice(1), 16); return (.299 * (n >> 16) + .587 * ((n >> 8) & 255) + .114 * (n & 255)) / 255; };
  const custom = def({
    id: 'custom', name: 'Your Build', desc: 'Designed in the Face Builder', finish: 'steel', builder: true,
    bezel: {}, hands: {}, lume: '#9dffb0',
    configure(c) {
      c = Object.assign({}, CUSTOM_DEFAULT, c || {});
      this.cfg = c; this.name = c.name || 'Your Build'; this.finish = c.finish || 'steel'; this.lume = c.lume;
      const light = lumOf(c.dial) > .55;
      this.ink = light ? '#1a1f2a' : '#eef2f7';
      this.bezel = { type: c.bezel, color: [c.bezelColor, SM.shade(c.bezelColor, -.55)], ink: lumOf(c.bezelColor) > .55 ? '#1a1f2a' : '#eef2f7', accent: c.sec, lume: c.lume, text: 'SUPERMAN · ' + String(c.name || '').toUpperCase() + ' · ' };
      this.hands = { style: c.hands, metal: c.metal, lume: c.lume, sec: c.sec, counter: 'shield', subColor: c.sec, hourL: 84, minL: 128 };
      this.desc = 'Face Builder · ' + c.tex + ' · ' + c.hands + ' hands';
      return this;
    },
    render(ctx) {
      const c = this.cfg || this.configure().cfg, ink = this.ink, light = ink === '#1a1f2a', u = SM.uid('cu');
      let g = K.base(SM.shade(c.dial, -.5)) + K.rehaut({ color: light ? ['#ffffff', '#b8c0cc'] : [SM.shade(c.dial, .25), SM.shade(c.dial, -.6)], ink, type: 'minutes' });
      g += K.radial(u + 'g', [[0, SM.shade(c.dial, .18)], [.7, c.dial], [1, SM.shade(c.dial, -.45)]], .45, .38, .7);
      g += K.disc(`url(#${u}g)`);
      const tex = { sunburst: ['p-sunburst', .95, 'overlay'], guilloche: ['p-guilloche', .85, 'overlay'], barley: ['p-barley', .8, 'overlay'], brushR: ['p-brushR', .6, 'overlay'], carbon: ['p-carbon', .9, 'multiply'], facets: ['p-facets', .6, 'overlay'] }[c.tex];
      if (tex) g += K.disc(`url(#${tex[0]})`, tex[1], tex[2]);
      g += K.dome(.8) + K.track(141, light ? 'rgba(20,24,32,.75)' : 'rgba(255,255,255,.75)', 'rail');
      const occupied = { 9: c.left !== 'none', 3: c.right !== 'none', 6: c.bottom !== 'none' };
      const skip = Object.keys(occupied).filter(k => occupied[k]).map(Number);
      if (c.idx === 'arabic' || c.idx === 'roman') g += K.numerals({ roman: c.idx === 'roman', r: 120, size: 15, fill: ink, font: c.idx === 'roman' ? F.roman : F.cond, hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(h => !skip.includes(h)), applied: true, lume: true });
      else g += K.indices({ type: c.idx, r0: 110, r1: 134, w: 7, metal: c.metal, lume: c.lume, twelve: 'double', skip, bigQuarters: true });
      const subSt = { bg: light ? '#f4f6f9' : SM.shade(c.dial, -.35), tex: light ? 'p-snail' : false, ink, ring: light ? '#9aa3ae' : SM.shade(c.dial, .35), hand: c.sec, core: SM.shade(c.dial, -.6), sky: SM.shade(c.dial, -.6), accent: c.sec };
      const hasSubs = c.left !== 'none' || c.right !== 'none';
      if (c.shield !== 'none') g += SM.shield(300, hasSubs ? 326 : 332, hasSubs ? 56 : 72, c.shield);
      g += K.text(300, hasSubs ? 364 : 380, String(c.name || 'SUPERMAN').toUpperCase().slice(0, 22), { size: 7, fill: light ? '#8a1020' : '#f6d36b', ls: 2.6, weight: 700 });
      if (c.left !== 'none') g += K.sub(ctx, c.left, 228, 402, 30, subSt);
      if (c.right !== 'none') g += K.sub(ctx, c.right, 372, 402, 30, subSt);
      if (c.bottom !== 'none') g += K.sub(ctx, c.bottom, 300, 474, 32, subSt);
      return g;
    }
  });
  custom.configure(SM.store.get('custom', null));

  SM.faceById = id => FACES.find(x => x.id === id) || FACES[0];

  /* full dial svg markup for a face (used for live dial + thumbnails) */
  SM.dialMarkup = function (face, forThumb) {
    const ctx = { subs: [] };
    const clip = `<clipPath id="dial-clip"><circle cx="${CX}" cy="${CY}" r="146"/></clipPath>`;
    let body = face.render(ctx);
    /* v3 micro-detail pass: fine grain + ambient-occlusion ring where the dial meets the rehaut */
    if (!face.noMicro) body += `<circle cx="${CX}" cy="${CY}" r="146" fill="url(#p-grain)" opacity=".22" style="mix-blend-mode:overlay"/><circle cx="${CX}" cy="${CY}" r="158" fill="url(#g-ao)"/>`;
    const over = face.overlay ? face.overlay(ctx) : '';
    return { markup: `<defs>${clip}</defs><g>${body}</g>`, overlay: over, subs: ctx.subs, anim: !forThumb && face.anim ? face.anim() : [] };
  };
})(window.SM);
