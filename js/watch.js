/* Watch renderer: case, lugs, crown, pushers, bezel, straps, glass, hands, movement (X-ray). */
(function (SM) {
  'use strict';
  const CX = 300, CY = 400, f = SM.f;
  const R = { case: 200, bezelOut: 193, insOut: 186, insIn: 163, lip: 158, dial: 146 };
  SM.W = { CX, CY, R };

  const FIN = SM.FINISHES = {
    steel: { name: 'Polished Steel', hi: '#ffffff', lite: '#e4e9ef', mid: '#a9b1bc', dark: '#58606b', deep: '#1f242b', tint: '#eef3fa' },
    gold: { name: '18k Yellow Gold', hi: '#fff8da', lite: '#f7da8f', mid: '#cba04a', dark: '#7a5419', deep: '#342306', tint: '#f0bf5c' },
    rose: { name: 'Rose Gold', hi: '#fff1ea', lite: '#f3bca5', mid: '#c98066', dark: '#7a412f', deep: '#351a12', tint: '#e59c80' },
    black: { name: 'Black DLC', hi: '#a4aab2', lite: '#5d636b', mid: '#30343a', dark: '#17191c', deep: '#050607', tint: '#34373d' },
    titanium: { name: 'Grade-5 Titanium', hi: '#f2f4f6', lite: '#bcc1c7', mid: '#8b9199', dark: '#4b5058', deep: '#1f2328', tint: '#a3a9b1' },
    blue: { name: 'Kryptonian Blue', hi: '#eef7ff', lite: '#a9cbef', mid: '#5b85bf', dark: '#244170', deep: '#0b1730', tint: '#6f9bd6' }
  };
  const STRAPS = SM.STRAPS = {
    leather: { name: 'Stitched Leather' }, bracelet: { name: 'Steel Bracelet' }, rubber: { name: 'Rubber Sport' },
    suit: { name: 'Suit-Blue Weave' }, cape: { name: 'Cape Fabric' }
  };
  SM.STRAP_COLORS = [
    { id: 'black', c: '#16181c', n: 'Midnight Black' }, { id: 'brown', c: '#5b3720', n: 'Espresso' }, { id: 'tan', c: '#a86a3a', n: 'Kansas Tan' },
    { id: 'navy', c: '#15234b', n: 'Navy' }, { id: 'suit', c: '#1d4fb8', n: 'Suit Blue' }, { id: 'red', c: '#b3141f', n: 'Cape Red' },
    { id: 'gold', c: '#d7a52c', n: 'Sun Yellow' }, { id: 'white', c: '#e7eaee', n: 'Fortress White' }, { id: 'green', c: '#1f5c34', n: 'Kryptonite' }
  ];

  function polish(id, p, x1, y1, x2, y2, units) {
    return `<linearGradient id="${id}" gradientUnits="${units || 'userSpaceOnUse'}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0" stop-color="${p.hi}"/><stop offset=".13" stop-color="${p.lite}"/><stop offset=".25" stop-color="${p.dark}"/>
      <stop offset=".34" stop-color="${p.mid}"/><stop offset=".47" stop-color="${p.hi}"/><stop offset=".56" stop-color="${p.lite}"/>
      <stop offset=".69" stop-color="${p.deep}"/><stop offset=".81" stop-color="${p.mid}"/><stop offset=".93" stop-color="${p.lite}"/><stop offset="1" stop-color="${p.hi}"/></linearGradient>`;
  }
  SM.polishGrad = polish;
  function cyl(id, p, y1, y2) {
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}"><stop offset="0" stop-color="${p.deep}"/><stop offset=".18" stop-color="${p.lite}"/><stop offset=".32" stop-color="${p.hi}"/><stop offset=".55" stop-color="${p.mid}"/><stop offset=".82" stop-color="${p.dark}"/><stop offset="1" stop-color="${p.deep}"/></linearGradient>`;
  }
  function screw(x, y, r, p, rot, blued) {
    const id = SM.uid('sc');
    const c = blued ? { hi: '#9fd0ff', mid: '#2b5fc0', dark: '#0b2560' } : p;
    return `<g><radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${c.hi}"/><stop offset=".5" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient>
      <circle cx="${x}" cy="${y}" r="${r + 1}" fill="#000" opacity=".45"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/>
      <rect x="${f(x - r * .85)}" y="${f(y - r * .16)}" width="${f(r * 1.7)}" height="${f(r * .32)}" fill="#111" opacity=".75" transform="rotate(${rot} ${x} ${y})"/>
      <rect x="${f(x - r * .85)}" y="${f(y + r * .16)}" width="${f(r * 1.7)}" height="${f(r * .12)}" fill="#fff" opacity=".35" transform="rotate(${rot} ${x} ${y})"/></g>`;
  }
  SM.screw = screw;

  /* ---------------- CASE ---------------- */
  function lugPath(sx, sy) {
    const P = (dx, dy) => `${f(CX + sx * dx)} ${f(CY + sy * dy)}`;
    return `M${P(121, 150)} C${P(122, 190)} ${P(120, 214)} ${P(115, 228)} Q${P(112, 235)} ${P(104, 235)} L${P(96, 235)} Q${P(89, 235)} ${P(89, 227)} L${P(89, 150)} Z`;
  }
  function lugEdge(sx, sy) {
    const P = (dx, dy) => `${f(CX + sx * dx)} ${f(CY + sy * dy)}`;
    return `M${P(121, 165)} C${P(122, 192)} ${P(120, 214)} ${P(115, 228)} Q${P(112, 235)} ${P(104, 235)}`;
  }
  SM.caseMarkup = function (face, finKey, lightAngle) {
    const p = FIN[finKey] || FIN.steel;
    const bz = face.bezel || { type: 'smooth' };
    let d = `<defs>
      ${polish('c-pol', p, 110, 205, 490, 595)}
      ${polish('c-pol2', p, 500, 200, 100, 600)}
      ${cyl('c-cyl', p, 372, 428)}${cyl('c-cylP', p, 384, 416)}
      <linearGradient id="c-lugL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
      <linearGradient id="c-lugR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>
      <radialGradient id="c-shade" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      <pattern id="c-flute" patternUnits="userSpaceOnUse" width="8" height="3.4"><rect width="8" height="1.7" fill="#000" opacity=".42"/><rect y="1.7" width="8" height=".7" fill="#fff" opacity=".5"/></pattern>
      <linearGradient id="c-ins" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="${(bz.color || ['#1a2a55'])[0]}"/><stop offset="1" stop-color="${(bz.color || ['#1a2a55', '#0a1430'])[1] || bz.color[0]}"/></linearGradient>
      <linearGradient id="c-gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>
    </defs>`;
    let g = '';
    /* lugs */
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      g += `<path d="${lugPath(sx, sy)}" fill="url(#p-brushV)"/>
        <path d="${lugPath(sx, sy)}" fill="${p.tint}" style="mix-blend-mode:multiply"/>
        <path d="${lugPath(sx, sy)}" fill="url(#${sx < 0 ? 'c-lugL' : 'c-lugR'})"/>
        <path d="${lugEdge(sx, sy)}" fill="none" stroke="url(#c-pol)" stroke-width="4" stroke-linecap="round"/>
        <path d="${lugPath(sx, sy)}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".8"/>`;
      g += screw(f(CX + sx * 104), f(CY + sy * 219), 4.4, p, sx * sy * 30 + 20);
    });
    /* crown guard */
    g += `<path d="M488 350 Q514 356 516 378 L516 422 Q514 444 488 450 Z" fill="url(#p-brushL)"/>
      <path d="M488 350 Q514 356 516 378 L516 422 Q514 444 488 450 Z" fill="${p.tint}" style="mix-blend-mode:multiply"/>
      <path d="M488 350 Q514 356 516 378 L516 422 Q514 444 488 450" fill="none" stroke="url(#c-pol2)" stroke-width="3"/>`;
    /* pushers (drawn at 3 o'clock then rotated) */
    [['top', -40], ['bottom', 40]].forEach(([id, a]) => {
      g += `<g transform="rotate(${a} ${CX} ${CY})"><g class="pusher-g" id="pusher-${id}">
        <rect x="494" y="390" width="20" height="20" fill="url(#c-cylP)"/>
        <rect x="511" y="383" width="22" height="34" rx="4" fill="url(#c-cylP)"/>
        <rect x="511" y="383" width="22" height="34" rx="4" fill="url(#c-flute)" opacity=".55" transform="rotate(90 522 400) translate(0 0)"/>
        <rect x="529" y="385" width="5" height="30" rx="2" fill="url(#c-pol)"/>
        <rect x="511" y="383" width="22" height="34" rx="4" fill="none" stroke="#000" stroke-opacity=".5"/></g></g>`;
    });
    /* crown */
    g += `<g id="crown-g"><rect x="508" y="388" width="12" height="24" fill="url(#c-cyl)"/>
      <rect x="514" y="372" width="36" height="56" rx="6" fill="url(#c-cyl)"/>
      <rect x="514" y="372" width="36" height="56" rx="6" fill="url(#c-flute)"/>
      <rect x="545" y="374" width="6" height="52" rx="2.5" fill="url(#c-pol)"/>
      <rect x="514" y="372" width="36" height="56" rx="6" fill="none" stroke="#000" stroke-opacity=".55"/>
      <rect x="516" y="375" width="30" height="2" rx="1" fill="#fff" opacity=".5"/></g>`;
    /* case body */
    g += `<circle cx="${CX}" cy="${CY}" r="200.5" fill="#000" opacity=".6"/>
      <circle id="case-body" cx="${CX}" cy="${CY}" r="199" fill="url(#p-brushR)"/>
      <circle cx="${CX}" cy="${CY}" r="199" fill="${p.tint}" style="mix-blend-mode:multiply"/>
      <circle cx="${CX}" cy="${CY}" r="199" fill="url(#c-shade)"/>
      <circle cx="${CX}" cy="${CY}" r="197" fill="none" stroke="url(#c-pol)" stroke-width="5" id="case-chamfer"/>
      <circle cx="${CX}" cy="${CY}" r="194.2" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1.2"/>
      <path d="${SM.arcPath(CX, CY, 198.5, 290, 350)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>`;
    g += `<g id="bezel">${bezelMarkup(face, p)}</g>`;
    return d + g;
  };

  function bezelMarkup(face, p) {
    const bz = face.bezel || { type: 'smooth' };
    const ink = bz.ink || '#f2f2f2', acc = bz.accent || '#e8233a';
    const circ = 2 * Math.PI * 191.5, tooth = circ / 120;
    let g = `<circle cx="${CX}" cy="${CY}" r="189.6" fill="none" stroke="url(#c-pol2)" stroke-width="7.2"/>`;
    if (bz.type !== 'smooth' && bz.type !== 'fluted') g += `<circle cx="${CX}" cy="${CY}" r="191.6" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="3.6" stroke-dasharray="${f(tooth * .42)} ${f(tooth * .58)}"/>
      <circle cx="${CX}" cy="${CY}" r="192.4" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.1" stroke-dasharray="${f(tooth * .3)} ${f(tooth * .7)}" stroke-dashoffset="${f(tooth * .45)}"/>`;
    const txt = (s, ang, r, size, fill, w, flip) => {
      const [x, y] = [CX, CY - r];
      return `<text x="${x}" y="${f(y + size * .36)}" font-size="${size}" font-weight="${w || 700}" text-anchor="middle" fill="${fill}" transform="rotate(${ang} ${CX} ${CY})${flip ? ` rotate(180 ${x} ${y})` : ''}" font-family="SMOswald, Oswald, 'Barlow Condensed', 'Roboto Condensed', Arial Narrow, sans-serif" letter-spacing=".5">${s}</text>`;
    };
    const engraved = (s, ang, r, size, fill, w) => `<g opacity=".95">${txt(s, ang, r - .5, size, '#000', w).replace('fill="#000"', 'fill="#000" opacity=".55"')}${txt(s, ang, r, size, fill, w)}</g>`;
    if (bz.type === 'smooth' || bz.type === 'engraved') {
      g += `<circle cx="${CX}" cy="${CY}" r="174.5" fill="none" stroke="url(#c-pol)" stroke-width="23"/>
        <circle cx="${CX}" cy="${CY}" r="174.5" fill="none" stroke="url(#c-gloss)" stroke-width="23"/>
        <circle cx="${CX}" cy="${CY}" r="185.6" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1"/>`;
      if (bz.text) {
        const id = SM.uid('bt');
        g += `<path id="${id}" d="M ${CX - 174} ${CY} A 174 174 0 1 1 ${CX + 174} ${CY} A 174 174 0 1 1 ${CX - 174} ${CY}" fill="none"/>
          <text font-size="9.5" font-weight="700" letter-spacing="4.2" fill="#000" opacity=".5" font-family="SMOswald, Oswald, Arial Narrow, sans-serif"><textPath href="#${id}" startOffset="0">${bz.text}</textPath></text>
          <text font-size="9.5" font-weight="700" letter-spacing="4.2" fill="${ink}" opacity=".8" transform="translate(.5 .7)" font-family="SMOswald, Oswald, Arial Narrow, sans-serif"><textPath href="#${id}" startOffset="0">${bz.text}</textPath></text>`;
      }
    } else if (bz.type === 'fluted') {
      g += `<circle cx="${CX}" cy="${CY}" r="174.5" fill="none" stroke="url(#c-pol)" stroke-width="23"/>`;
      for (let i = 0; i < 96; i++) {
        const a = i * 3.75, [x0, y0] = SM.polar(CX, CY, 164, a), [x1, y1] = SM.polar(CX, CY, 186, a);
        g += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${i % 2 ? '#000' : '#fff'}" stroke-opacity="${i % 2 ? .35 : .55}" stroke-width="${i % 2 ? 2.4 : 1.4}"/>`;
      }
      g += `<circle cx="${CX}" cy="${CY}" r="174.5" fill="none" stroke="url(#c-gloss)" stroke-width="23"/>`;
    } else {
      g += `<circle cx="${CX}" cy="${CY}" r="174.5" fill="none" stroke="url(#c-ins)" stroke-width="23"/>`;
      if (bz.tex) g += `<circle cx="${CX}" cy="${CY}" r="174.5" fill="none" stroke="url(#${bz.tex})" stroke-width="23" opacity=".6"/>`;
      /* v3: polished-ceramic insert: fine grain, bevelled inner/outer edges and two soft specular arcs */
      else g += `<circle cx="${CX}" cy="${CY}" r="174.5" fill="none" stroke="url(#p-grain)" stroke-width="23" opacity=".09"/>
        <path d="M ${f(CX + 174.5 * Math.cos(-2.5))} ${f(CY + 174.5 * Math.sin(-2.5))} A 174.5 174.5 0 0 1 ${f(CX + 174.5 * Math.cos(-1.75))} ${f(CY + 174.5 * Math.sin(-1.75))}" fill="none" stroke="#fff" stroke-opacity=".10" stroke-width="20" stroke-linecap="round"/>
        <path d="M ${f(CX + 174.5 * Math.cos(.55))} ${f(CY + 174.5 * Math.sin(.55))} A 174.5 174.5 0 0 1 ${f(CX + 174.5 * Math.cos(.95))} ${f(CY + 174.5 * Math.sin(.95))}" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="18" stroke-linecap="round"/>
        <circle cx="${CX}" cy="${CY}" r="164.4" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width=".8"/><circle cx="${CX}" cy="${CY}" r="184.9" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width=".8"/>`;
      g += `<circle cx="${CX}" cy="${CY}" r="174.5" fill="none" stroke="url(#c-gloss)" stroke-width="23"/>
        <circle cx="${CX}" cy="${CY}" r="185.8" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="1"/><circle cx="${CX}" cy="${CY}" r="163.4" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="1"/>`;
      if (bz.type === 'diver') {
        for (let m = 0; m < 60; m++) {
          const a = m * 6;
          if (m === 0) {
            g += `<g transform="rotate(0 ${CX} ${CY})"><path d="M${CX - 9} ${CY - 184} L${CX + 9} ${CY - 184} L${CX} ${CY - 168} Z" fill="${ink}" stroke="#000" stroke-opacity=".4"/><circle class="lume" cx="${CX}" cy="${CY - 178.5}" r="3.2" fill="${bz.lume || '#dfffe0'}"/></g>`;
          } else if (m % 10 === 0) g += engraved(m, a, 175, 15, ink, 700);
          else if (m % 5 === 0) g += `<rect x="${CX - 2.2}" y="${CY - 184}" width="4.4" height="13" fill="${ink}" transform="rotate(${a} ${CX} ${CY})"/>`;
          else if (m < 15) g += `<rect x="${CX - .9}" y="${CY - 184}" width="1.8" height="8" fill="${ink}" transform="rotate(${a} ${CX} ${CY})"/>`;
          else g += `<circle cx="${CX}" cy="${CY - 180}" r="1.6" fill="${ink}" transform="rotate(${a} ${CX} ${CY})"/>`;
        }
      } else if (bz.type === 'tachy') {
        g += txt('TACHYMETRE', 0, 175, 8.5, acc, 700);
        [500, 400, 300, 250, 200, 180, 160, 140, 120, 110, 100, 90, 85, 80, 75, 70, 65, 60].forEach(v => {
          const a = 3600 / v * 6; if (a > 358 || a < 30) return;
          g += `<rect x="${CX - .8}" y="${CY - 186}" width="1.6" height="5.5" fill="${ink}" transform="rotate(${f(a)} ${CX} ${CY})"/>`;
          g += txt(v, f(a), 173.5, 10.5, ink, 600);
        });
        for (let i = 60; i <= 500; i += 10) { const a = 3600 / i * 6; if (a > 30 && a < 358 && ![500, 400, 300, 250, 200, 180, 160, 140, 120, 110, 100, 90, 80, 70, 60].includes(i)) g += `<rect x="${CX - .5}" y="${CY - 186}" width="1" height="3.5" fill="${ink}" opacity=".7" transform="rotate(${f(a)} ${CX} ${CY})"/>`; }
      } else if (bz.type === 'screws') {
        for (let i = 0; i < 8; i++) { const [x, y] = SM.polar(CX, CY, 174.5, i * 45 + 22.5); g += screw(f(x), f(y), 6, FIN.steel, i * 37, false); }
        for (let i = 0; i < 4; i++) g += engraved(['60', '15', '30', '45'][i], i * 90, 175, 12, ink, 700);
        for (let m = 0; m < 60; m++) if (m % 15 && m % 5 === 0) g += `<rect x="${CX - 1.6}" y="${CY - 183}" width="3.2" height="9" fill="${acc}" transform="rotate(${m * 6} ${CX} ${CY})"/>`;
      } else if (bz.type === 'glyph') {
        const r = SM.rng(99);
        for (let i = 0; i < 24; i++) g += `<g transform="rotate(${i * 15} ${CX} ${CY})">${SM.glyph(CX, CY - 175, 11, r, ink, 1.5)}</g>`;
      } else if (bz.type === 'hours24') {
        for (let h = 0; h < 24; h++) {
          const a = h * 15;
          if (h % 2 === 0) g += engraved(h === 0 ? '24' : h, a, 175, 12, h >= 6 && h < 18 ? ink : acc, 700);
          else g += `<path d="M${CX - 3} ${CY - 183} L${CX + 3} ${CY - 183} L${CX} ${CY - 176} Z" fill="${ink}" transform="rotate(${a} ${CX} ${CY})"/>`;
        }
      }
    }
    g += `<circle cx="${CX}" cy="${CY}" r="160.6" fill="none" stroke="url(#c-pol2)" stroke-width="5"/>
      <circle cx="${CX}" cy="${CY}" r="158.2" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="1"/>`;
    return g;
  }

  /* Kryptonian-style glyph (original abstract marks) */
  SM.glyph = function (x, y, s, r, color, sw) {
    const pts = []; const n = 2 + Math.floor(r() * 3);
    let p = '';
    for (let i = 0; i < n; i++) {
      const t = Math.floor(r() * 5);
      const x0 = x + (r() - .5) * s, y0 = y + (r() - .5) * s, x1 = x + (r() - .5) * s, y1 = y + (r() - .5) * s;
      if (t === 0) p += `M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)} `;
      else if (t === 1) p += `M${f(x - s / 2)} ${f(y0)} Q${f(x)} ${f(y0 - s * .6)} ${f(x + s / 2)} ${f(y0)} `;
      else if (t === 2) p += `M${f(x0)} ${f(y - s / 2)} L${f(x0)} ${f(y + s / 2)} `;
      else if (t === 3) p += `M${f(x0 - s * .15)} ${f(y0)} a${f(s * .15)} ${f(s * .15)} 0 1 0 ${f(s * .3)} 0 a${f(s * .15)} ${f(s * .15)} 0 1 0 ${f(-s * .3)} 0 `;
      else p += `M${f(x - s / 2)} ${f(y + s / 2)} L${f(x)} ${f(y - s / 2)} L${f(x + s / 2)} ${f(y + s / 2)} `;
      pts.push(t);
    }
    return `<path d="${p}" fill="none" stroke="${color}" stroke-width="${sw || 1.2}" stroke-linecap="round"/>`;
  };

  /* ---------------- STRAPS ---------------- */
  function strapShape(top) {
    return top ? `M216 -20 L384 -20 L390 250 L210 250 Z` : `M210 550 L390 550 L384 820 L216 820 Z`;
  }
  function strapInset(top, ins) {
    return top ? `M${216 + ins} -20 L${384 - ins} -20 L${390 - ins} 250 L${210 + ins} 250 Z` : `M${210 + ins} 550 L${390 - ins} 550 L${384 - ins} 820 L${216 + ins} 820 Z`;
  }
  function edgeLines(top, ins) {
    return top ? `M${216 + ins} -20 L${210 + ins} 250 M${384 - ins} -20 L${390 - ins} 250` : `M${210 + ins} 550 L${216 + ins} 820 M${390 - ins} 550 L${384 - ins} 820`;
  }
  function shade(c, amt) {
    const n = parseInt(c.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  SM.shade = shade;
  /* stitches along both edges of a strap half: each one a slanted capsule with a lit side and a hole at each end */
  function stitches(top, ins, col) {
    const lines = top ? [[216 + ins, -20, 210 + ins, 250], [384 - ins, -20, 390 - ins, 250]] : [[210 + ins, 550, 216 + ins, 820], [390 - ins, 550, 384 - ins, 820]];
    let sh = '', th = '', hi = '', holes = '';
    lines.forEach(([x0, y0, x1, y1]) => {
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / 6.2), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
      for (let i = 0; i < n; i++) {
        const t = (i + .5) * L / n, cx = x0 + ux * t, cy = y0 + uy * t;
        const ax = cx - ux * 2.1 - .5, ay = cy - uy * 2.1, bx = cx + ux * 2.1 + .5, by = cy + uy * 2.1;
        sh += `M${f(ax + .5)} ${f(ay + .8)}L${f(bx + .5)} ${f(by + .8)}`;
        th += `M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}`;
        hi += `M${f(ax + .3)} ${f(ay - .3)}L${f(cx)} ${f(cy - .4)}`;
        holes += `M${f(ax - ux * 1.1)} ${f(ay - uy * 1.1)}h.01`;
      }
    });
    return `<path d="${holes}" stroke="#000" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round"/><path d="${sh}" stroke="#000" stroke-opacity=".5" stroke-width="1.7" stroke-linecap="round"/><path d="${th}" stroke="${col}" stroke-width="1.45" stroke-linecap="round"/><path d="${hi}" stroke="#fff" stroke-opacity=".45" stroke-width=".5" stroke-linecap="round"/>`;
  }
  SM.strapMarkup = function (mat, color, finKey) {
    const p = FIN[finKey] || FIN.steel;
    let d = `<defs>
      <linearGradient id="s-edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset=".12" stop-color="#000" stop-opacity=".05"/><stop offset=".4" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#fff" stop-opacity=".04"/><stop offset=".88" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></linearGradient>
      <linearGradient id="s-fadeT" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse" y2b="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity="1"/></linearGradient>
      <mask id="s-mask" maskUnits="userSpaceOnUse" x="0" y="-20" width="600" height="840"><rect x="0" y="-20" width="600" height="840" fill="url(#s-fadeV)"/></mask>
      <linearGradient id="s-fadeV" gradientUnits="userSpaceOnUse" x1="0" y1="-20" x2="0" y2="820"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".045" stop-color="#fff" stop-opacity="1"/><stop offset=".955" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="s-farT" gradientUnits="userSpaceOnUse" x1="0" y1="-20" x2="0" y2="170"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
      <linearGradient id="s-farB" gradientUnits="userSpaceOnUse" x1="0" y1="820" x2="0" y2="630"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
      <linearGradient id="s-pad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
      <linearGradient id="s-nearT" gradientUnits="userSpaceOnUse" x1="0" y1="160" x2="0" y2="250"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
      <linearGradient id="s-nearB" gradientUnits="userSpaceOnUse" x1="0" y1="640" x2="0" y2="550"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
      ${polish('s-pol', p, 264, 0, 336, 0)}
      <linearGradient id="s-link" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
    </defs>`;
    let g = '';
    const both = fn => fn(true) + fn(false);
    if (mat === 'bracelet') {
      g += both(top => {
        let s = `<path d="${strapShape(top)}" fill="${p.deep}"/>`;
        const rows = [];
        for (let y = top ? 244 : 556; top ? y > -40 : y < 840; y += top ? -27 : 27) rows.push(y);
        rows.forEach((y, i) => {
          const yy = top ? y - 25 : y, t = top ? (250 - y) / 270 : (y - 550) / 270;
          const half = 90 - t * 6, xl = CX - half, xr = CX + half;
          const cw = 34 - t * 1.5;
          s += `<rect x="${f(xl + 1)}" y="${f(yy + 1)}" width="${f(half - cw - 2)}" height="24" rx="3" fill="url(#p-brushL)"/>
            <rect x="${f(xl + 1)}" y="${f(yy + 1)}" width="${f(half - cw - 2)}" height="24" rx="3" fill="${p.tint}" style="mix-blend-mode:multiply"/>
            <rect x="${f(CX + cw + 1)}" y="${f(yy + 1)}" width="${f(half - cw - 2)}" height="24" rx="3" fill="url(#p-brushL)"/>
            <rect x="${f(CX + cw + 1)}" y="${f(yy + 1)}" width="${f(half - cw - 2)}" height="24" rx="3" fill="${p.tint}" style="mix-blend-mode:multiply"/>
            <rect x="${f(CX - cw)}" y="${f(yy + 2)}" width="${f(cw * 2)}" height="22" rx="4" fill="url(#s-pol)"/>
            <rect x="${f(xl + 1)}" y="${f(yy + 1)}" width="${f(half * 2 - 2)}" height="24" fill="url(#s-link)"/>
            <rect x="${f(CX - cw)}" y="${f(yy + 2)}" width="${f(cw * 2)}" height="22" rx="4" fill="none" stroke="#000" stroke-opacity=".45"/>
            <line x1="${f(xl + 2)}" y1="${f(yy + 1.5)}" x2="${f(xr - 2)}" y2="${f(yy + 1.5)}" stroke="#fff" stroke-opacity=".35"/>`;
        });
        return s + `<path d="${strapShape(top)}" fill="url(#${top ? 's-nearT' : 's-nearB'})"/><path d="${strapShape(top)}" fill="url(#${top ? 's-farT' : 's-farB'})"/>`;
      });
    } else {
      const base = color;
      const tex = mat === 'leather' ? 'p-leather' : mat === 'suit' ? 'p-suit' : mat === 'cape' ? 'p-weave' : null;
      g += both(top => {
        let s = `<path d="${strapShape(top)}" fill="${base}"/>`;
        if (tex && mat !== 'suit') s += `<path d="${strapShape(top)}" fill="url(#${tex})" style="mix-blend-mode:overlay" opacity="${mat === 'cape' ? .5 : .75}"/>`;
        if (mat === 'suit') s += `<path d="${strapShape(top)}" fill="url(#p-suit)"/>${color.toLowerCase() === '#1d4fb8' ? '' : `<path d="${strapShape(top)}" fill="${base}" opacity=".5"/>`}`;
        if (mat === 'leather') {
          s += `<path d="${strapInset(top, 13)}" fill="url(#s-pad)"/>`;
          /* painted edge + individual saddle stitches (angled thread, highlight, awl hole) */
          s += `<path d="${edgeLines(top, 1.6)}" stroke="${shade(base, -.45)}" stroke-width="3" opacity=".9"/><path d="${edgeLines(top, 3.2)}" stroke="#fff" stroke-opacity=".12" stroke-width=".8"/>`;
          s += stitches(top, 8, SM.leatherThread || shade(base, .6));
          s += `<path d="${strapInset(top, 13)}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="1.2"/>`;
        }
        if (mat === 'rubber') {
          s += `<path d="${strapInset(top, 52)}" fill="#fff" opacity=".07"/><path d="${edgeLines(top, 52)}" stroke="#000" stroke-opacity=".45" stroke-width="2"/><path d="${edgeLines(top, 53.5)}" stroke="#fff" stroke-opacity=".14" stroke-width="1"/>`;
          for (let y = top ? 232 : 562; top ? y > -20 : y < 820; y += top ? -18 : 18) s += [226, 350].map(x => `<rect x="${x}" y="${y}" width="24" height="9" rx="4.5" fill="#000" opacity=".5"/><rect x="${x + 1}" y="${y + 7.4}" width="22" height="1.4" rx=".7" fill="#fff" opacity=".16"/>`).join('');
          if (!top) for (let y = 660; y < 800; y += 30) s += `<rect x="291" y="${y}" width="18" height="10" rx="5" fill="#000" opacity=".75"/><rect x="291" y="${y + 8}" width="18" height="2" rx="1" fill="#fff" opacity=".15"/>`;
        }
        if (mat === 'cape') {
          s += `<path d="${strapShape(top)}" fill="url(#s-pad)" opacity=".9"/>`;
          for (let k = 0; k < 4; k++) s += `<path d="${strapInset(top, 25 + k * 30)}" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="10"/>`;
        }
        if (mat === 'suit') s += `<path d="${edgeLines(top, 6)}" stroke="#c9d6f2" stroke-opacity=".6" stroke-width="1.2" stroke-dasharray="3 2"/>`;
        s += `<path d="${strapShape(top)}" fill="url(#s-edge)"/>`;
        s += `<path d="${strapShape(top)}" fill="url(#${top ? 's-nearT' : 's-nearB'})"/><path d="${strapShape(top)}" fill="url(#${top ? 's-farT' : 's-farB'})"/>`;
        if (!top && (mat === 'leather' || mat === 'suit' || mat === 'cape')) {
          for (let i = 0; i < 5; i++) { const y = 672 + i * 26; s += `<ellipse cx="300" cy="${y}" rx="4.6" ry="5.4" fill="#000" opacity=".85"/><path d="M295.6 ${y + 2} A4.6 5.4 0 0 0 304.4 ${y + 2}" fill="none" stroke="#fff" stroke-opacity=".3"/>`; }
          s += `<rect x="206" y="612" width="188" height="16" rx="4" fill="${shade(base, -.25)}"/><rect x="206" y="612" width="188" height="16" rx="4" fill="url(#s-link)"/>`;
          if (tex) s += `<rect x="206" y="612" width="188" height="16" rx="4" fill="url(#${tex})" style="mix-blend-mode:overlay" opacity=".6"/>`;
        }
        return s;
      });
    }
    return d + `<g mask="url(#s-mask)">${g}</g>`;
  };

  /* ---------------- SHADOW ---------------- */
  SM.shadowMarkup = function () {
    return `<defs><filter id="sh-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter></defs>
      <g filter="url(#sh-blur)" opacity=".62"><rect x="214" y="0" width="172" height="800" rx="20" fill="#000" opacity=".7"/><circle cx="300" cy="400" r="205" fill="#000"/><rect x="505" y="372" width="48" height="56" rx="8" fill="#000"/></g>`;
  };

  /* ---------------- GLASS ---------------- */
  SM.glassMarkup = function () {
    return `<defs>
      <clipPath id="gl-clip"><circle cx="${CX}" cy="${CY}" r="158"/></clipPath>
      <radialGradient id="gl-edge" cx=".5" cy=".5" r=".5"><stop offset=".88" stop-color="#000" stop-opacity="0"/><stop offset=".95" stop-color="#000" stop-opacity=".3"/><stop offset=".985" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></radialGradient>
      <radialGradient id="gl-ar" cx=".5" cy=".5" r=".5"><stop offset=".65" stop-color="#7a5cff" stop-opacity="0"/><stop offset="1" stop-color="#6d7dff" stop-opacity=".14"/></radialGradient>
      <linearGradient id="gl-refl" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".6" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="gl-glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".26"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="gl-spec" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".4" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <radialGradient id="gl-heat" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".55"/><stop offset=".5" stop-color="#ff5a14" stop-opacity=".35"/><stop offset="1" stop-color="#b00000" stop-opacity=".15"/></radialGradient>
      <radialGradient id="gl-fres" cx=".5" cy=".5" r=".5"><stop offset=".80" stop-color="#cfe6ff" stop-opacity="0"/><stop offset=".94" stop-color="#cfe6ff" stop-opacity=".07"/><stop offset=".99" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="gl-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>
      <radialGradient id="gl-ao" cx=".5" cy=".5" r=".5"><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset=".975" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></radialGradient>
    </defs>
    <circle cx="${CX + 2}" cy="${CY + 3}" r="157" fill="url(#gl-ao)"/>
    <g clip-path="url(#gl-clip)">
      <circle cx="${CX}" cy="${CY}" r="158" fill="url(#gl-ar)"/>
      <circle cx="${CX}" cy="${CY}" r="158" fill="url(#gl-fres)"/>
      <g id="gl-move">
        <g opacity=".55"><path d="M168 262 L236 232 L262 300 L196 334 Z" fill="url(#gl-win)"/><path d="M244 228 L292 208 L316 270 L268 294 Z" fill="url(#gl-win)"/><path d="M175 344 L258 306 L270 330 L186 372 Z" fill="url(#gl-win)" opacity=".6"/><path d="M200 318 L300 274" stroke="#fff" stroke-opacity=".12" stroke-width="3"/></g>
        <path d="${pathCrescent()}" fill="url(#gl-refl)" opacity=".75"/>
        <path d="M188 318 Q226 262 300 246" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="360" y="468" width="70" height="26" rx="10" fill="#fff" opacity=".07" transform="rotate(-38 395 481)"/>
        <ellipse cx="236" cy="300" rx="16" ry="6" fill="url(#gl-spec)" transform="rotate(-38 236 300)"/>
        <ellipse cx="392" cy="505" rx="7" ry="3" fill="url(#gl-spec)" opacity=".5" transform="rotate(-38 392 505)"/>
      </g>
      <g transform="rotate(32 ${CX} ${CY})"><rect class="glint" x="0" y="150" width="70" height="500" fill="url(#gl-glint)"/></g>
      <circle id="gl-heat" cx="${CX}" cy="${CY}" r="158" fill="url(#gl-heat)" opacity="0"/>
    </g>
    <circle cx="${CX}" cy="${CY}" r="158" fill="url(#gl-edge)"/>
    <circle cx="${CX}" cy="${CY}" r="155.2" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.6"/>
    <path d="${SM.arcPath(CX, CY, 156.3, 120, 250)}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>
    <path d="${SM.arcPath(CX, CY, 156.3, 290, 350)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>
    <circle cx="${CX}" cy="${CY}" r="157" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width=".8"/>`;
  };
  function pathCrescent() {
    const [x1, y1] = SM.polar(CX, CY, 154, 282), [x2, y2] = SM.polar(CX, CY, 154, 28);
    return `M${f(x1)} ${f(y1)} A154 154 0 0 1 ${f(x2)} ${f(y2)} Q${CX - 20} ${CY - 70} ${f(x1)} ${f(y1)} Z`;
  }

  /* ---------------- HIT TARGETS ---------------- */
  SM.hitMarkup = function () {
    return `<circle class="hit dial-hit" cx="${CX}" cy="${CY}" r="150" fill="transparent" pointer-events="none"><title>Drag to spin the hologram</title></circle>
      <circle class="hit bezel-hit" cx="${CX}" cy="${CY}" r="178" fill="none" stroke="transparent" stroke-width="34" pointer-events="stroke"><title>Rotating bezel — drag to turn (double-click resets)</title></circle>
      <rect class="hit crown-hit" x="500" y="354" width="92" height="92" rx="10" fill="transparent" pointer-events="all"><title>Crown — click to change face</title></rect>
      <g transform="rotate(-40 ${CX} ${CY})"><rect class="hit pusher-hit" data-p="top" x="498" y="354" width="92" height="92" rx="10" fill="transparent" pointer-events="all"><title>Top pusher — start / stop chronograph</title></rect></g>
      <g transform="rotate(40 ${CX} ${CY})"><rect class="hit pusher-hit" data-p="bottom" x="498" y="354" width="92" height="92" rx="10" fill="transparent" pointer-events="all"><title>Bottom pusher — split / reset</title></rect></g>`;
  };

  /* ---------------- HANDS ---------------- */
  const HP = SM.HAND_METALS = {
    steel: ['#ffffff', '#c9d0d9', '#6c7480'], gold: ['#fff4c4', '#e1b24c', '#7b5314'], rose: ['#ffe6dc', '#e39a80', '#7b3f2d'],
    blued: ['#8fc2ff', '#2a5fc4', '#0b245e'], black: ['#6b7078', '#2b2f35', '#0b0c0e'], white: ['#ffffff', '#f2f4f7', '#b9c0c9'],
    red: ['#ff7a86', '#e0202e', '#8a0a14'], green: ['#b6ffcb', '#39e06a', '#0c6a2a'], cyan: ['#e6fdff', '#6fe3ff', '#1b7ea8'], orange: ['#ffe0a0', '#ff8a1a', '#8a2a00']
  };
  function hg(id, m) { return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${m[0]}"/><stop offset=".5" stop-color="${m[1]}"/><stop offset="1" stop-color="${m[2]}"/></linearGradient>`; }
  function handShape(style, L, W, which) {
    const x = CX, y = CY;
    switch (style) {
      case 'dauphine': return {
        a: `M${x} ${y + 16} L${x - W / 2} ${y - 12} L${x} ${y - L} Z`, b: `M${x} ${y + 16} L${x + W / 2} ${y - 12} L${x} ${y - L} Z`,
        lume: `M${x} ${y - 24} L${x - W * .18} ${y - 34} L${x} ${y - L + 14} L${x + W * .18} ${y - 34} Z`
      };
      case 'sword': return {
        a: `M${x - W * .35} ${y + 18} L${x - W / 2} ${y - 14} L${x - W * .42} ${y - L + 22} L${x} ${y - L} L${x} ${y + 18} Z`,
        b: `M${x + W * .35} ${y + 18} L${x + W / 2} ${y - 14} L${x + W * .42} ${y - L + 22} L${x} ${y - L} L${x} ${y + 18} Z`,
        lume: `M${x - W * .22} ${y - 22} L${x - W * .25} ${y - L + 26} L${x} ${y - L + 10} L${x + W * .25} ${y - L + 26} L${x + W * .22} ${y - 22} Z`
      };
      case 'baton': return {
        a: `M${x - W / 2} ${y + 20} L${x - W / 2} ${y - L + 14} L${x} ${y - L} L${x} ${y + 20} Z`, b: `M${x + W / 2} ${y + 20} L${x + W / 2} ${y - L + 14} L${x} ${y - L} L${x} ${y + 20} Z`,
        lume: `M${x - W * .3} ${y - 20} L${x - W * .3} ${y - L + 16} L${x} ${y - L + 6} L${x + W * .3} ${y - L + 16} L${x + W * .3} ${y - 20} Z`
      };
      case 'leaf': return {
        a: `M${x} ${y + 14} C${x - W * .9} ${y - L * .3} ${x - W * .6} ${y - L * .75} ${x} ${y - L} Z`, b: `M${x} ${y + 14} C${x + W * .9} ${y - L * .3} ${x + W * .6} ${y - L * .75} ${x} ${y - L} Z`, lume: null
      };
      case 'pencil': return {
        a: `M${x - W * .3} ${y + 18} L${x - W * .3} ${y - L + 10} L${x} ${y - L} L${x} ${y + 18} Z`, b: `M${x + W * .3} ${y + 18} L${x + W * .3} ${y - L + 10} L${x} ${y - L} L${x} ${y + 18} Z`, lume: null
      };
      case 'glow': return {
        a: `M${x - 1.6} ${y + 16} L${x - 2.4} ${y - L + 12} L${x} ${y - L} L${x} ${y + 16} Z`, b: `M${x + 1.6} ${y + 16} L${x + 2.4} ${y - L + 12} L${x} ${y - L} L${x} ${y + 16} Z`,
        lume: `M${x - 3.5} ${y - L * .35} L${x} ${y - L - 2} L${x + 3.5} ${y - L * .35} L${x} ${y - L * .55} Z`
      };
      case 'cartoon': return {
        a: `M${x - W / 2} ${y + 14} L${x - W / 2} ${y - L + W / 2} A${W / 2} ${W / 2} 0 0 1 ${x} ${y - L} L${x} ${y + 14} Z`, b: `M${x + W / 2} ${y + 14} L${x + W / 2} ${y - L + W / 2} A${W / 2} ${W / 2} 0 0 0 ${x} ${y - L} L${x} ${y + 14} Z`,
        lume: `M${x - W * .22} ${y - 18} L${x - W * .22} ${y - L + W * .6} L${x + W * .22} ${y - L + W * .6} L${x + W * .22} ${y - 18} Z`
      };
      default: return handShape('sword', L, W);
    }
  }
  SM.handsMarkup = function (face, subs) {
    const H = face.hands || {}; if (H.style === 'none') return subsMarkup(face, subs) + progressArc(face) + alarmPip(face);
    const metal = HP[H.metal || 'steel'], lume = H.lume || '#e4ffe0', sec = H.sec || '#e3202f', chr = H.chrono || sec;
    const st = H.style || 'sword';
    let d = `<defs>${hg('hm-a', metal)}<linearGradient id="hm-b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${metal[2]}"/><stop offset="1" stop-color="${metal[1]}"/></linearGradient>
      <radialGradient id="hm-cap" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${metal[0]}"/><stop offset=".6" stop-color="${metal[1]}"/><stop offset="1" stop-color="${metal[2]}"/></radialGradient></defs>`;
    const hand = (id, L, W) => {
      const s = handShape(st, L, W);
      const body = `<path d="${s.a}" fill="url(#hm-a)" class="hand-body"/><path d="${s.b}" fill="url(#hm-b)" class="hand-body"/>${s.lume && H.lumeOn !== false ? `<path d="${s.lume}" class="lume" fill="${lume}"/>` : ''}
        <path d="${s.a} ${s.b}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".6"/>`;
      const shadow = `<g fill="#000"><path d="${s.a}"/><path d="${s.b}"/></g>`;
      return `<g id="${id}-sh" opacity=".32">${shadow}</g><g id="${id}-sh2" opacity=".16">${shadow}</g><g id="${id}">${body}</g>`;
    };
    let g = subsMarkup(face, subs) + progressArc(face) + alarmPip(face);
    g += `<g id="h-ghosts"></g>`;
    g += hand('h-hour', H.hourL || 86, H.hourW || 13);
    g += hand('h-min', H.minL || 128, H.minW || 10);
    /* chrono + split (rattrapante) hands */
    g += `<g id="h-split" class="chrono-hand" opacity="0"><line x1="${CX}" y1="${CY + 22}" x2="${CX}" y2="${CY - 142}" stroke="${H.split || '#f6d36b'}" stroke-width="1.4"/><path d="M${CX - 3} ${CY - 128} L${CX} ${CY - 142} L${CX + 3} ${CY - 128} Z" fill="${H.split || '#f6d36b'}"/></g>`;
    g += `<g id="h-chrono" class="chrono-hand" opacity="0"><line x1="${CX}" y1="${CY + 30}" x2="${CX}" y2="${CY - 142}" stroke="${chr}" stroke-width="1.8"/><path d="M${CX - 4} ${CY - 124} L${CX} ${CY - 143} L${CX + 4} ${CY - 124} Z" fill="${chr}"/><circle cx="${CX}" cy="${CY + 26}" r="4.2" fill="${chr}"/></g>`;
    /* seconds */
    if (H.seconds !== false) {
      const cw = H.counter || 'shield';
      let tail = cw === 'shield' ? `<g transform="translate(${CX - 9} ${CY + 20}) scale(.09)"><path d="${SM.SHIELD.OUT}" fill="${sec}"/><path d="${SM.SHIELD.IN}" fill="#ffd21f"/><path d="${SM.SHIELD.S}" fill="${sec}"/></g>`
        : cw === 'bone' ? `<g transform="translate(${CX} ${CY + 30})"><rect x="-3" y="-7" width="6" height="14" fill="#fff"/><circle cx="-3.5" cy="-7" r="3.5" fill="#fff"/><circle cx="3.5" cy="-7" r="3.5" fill="#fff"/><circle cx="-3.5" cy="7" r="3.5" fill="#fff"/><circle cx="3.5" cy="7" r="3.5" fill="#fff"/></g>`
          : `<circle cx="${CX}" cy="${CY + 26}" r="5.5" fill="${sec}"/>`;
      const secBody = `<line x1="${CX}" y1="${CY + 22}" x2="${CX}" y2="${CY - 140}" stroke="${sec}" stroke-width="1.7"/>${tail}${H.secLume !== false ? `<rect class="lume" x="${CX - 2.4}" y="${CY - 118}" width="4.8" height="13" rx="2" fill="${lume}" stroke="${sec}" stroke-width="1"/>` : ''}`;
      g += `<g id="h-sec-sh" opacity=".28"><line x1="${CX}" y1="${CY + 22}" x2="${CX}" y2="${CY - 140}" stroke="#000" stroke-width="2"/></g><g id="h-sec">${secBody}</g>`;
    }
    g += `<circle cx="${CX}" cy="${CY}" r="7.5" fill="url(#hm-cap)" stroke="#000" stroke-opacity=".4"/><circle cx="${CX}" cy="${CY}" r="3.3" fill="${H.seconds === false ? metal[2] : sec}"/><circle cx="${CX - 1.2}" cy="${CY - 1.2}" r="1" fill="#fff" opacity=".7"/>`;
    return d + g;
  };
  function subsMarkup(face, subs) {
    const H = face.hands || {}; let g = '';
    (subs || []).forEach((s, i) => {
      if (!s.hand) return;
      const col = s.handColor || H.subColor || (H.sec || '#e3202f'), L = s.r * .82;
      const body = `<path d="M${s.cx - 1.6} ${s.cy + 7} L${s.cx - 1.8} ${s.cy - L + 5} L${s.cx} ${s.cy - L} L${s.cx + 1.8} ${s.cy - L + 5} L${s.cx + 1.6} ${s.cy + 7} Z" fill="${col}"/><circle cx="${s.cx}" cy="${s.cy}" r="3.2" fill="${col}"/><circle cx="${s.cx}" cy="${s.cy}" r="1.2" fill="#000" opacity=".5"/>`;
      g += `<g id="sd-${i}-sh" opacity=".3"><path d="M${s.cx - 1.6} ${s.cy + 7} L${s.cx} ${s.cy - L} L${s.cx + 1.6} ${s.cy + 7} Z" fill="#000"/></g><g id="sd-${i}">${body}</g>`;
    });
    return g;
  }
  function progressArc(face) {
    const c = (face.hands && face.hands.arc) || '#ffd21f';
    return `<circle id="h-arc-bg" cx="${CX}" cy="${CY}" r="150.5" fill="none" stroke="#000" stroke-opacity="0" stroke-width="4"/><path id="h-arc" d="" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round" opacity=".95"/>`;
  }
  function alarmPip(face) {
    return `<g id="h-alarm" opacity="0"><path d="M${CX - 5} ${CY - 157} L${CX + 5} ${CY - 157} L${CX} ${CY - 147} Z" fill="${(face.hands && face.hands.alarm) || '#ffd21f'}" stroke="#000" stroke-opacity=".5" stroke-width=".6"/></g>`;
  }

  /* ---------------- MOVEMENT (X-ray) ---------------- */
  function gearPath(cx, cy, teeth, ro, rr, windows, club) {
    let p = '';
    for (let i = 0; i < teeth; i++) {
      const a0 = i / teeth * 360, a1 = (i + .22) / teeth * 360, a2 = (i + (club ? .38 : .5)) / teeth * 360, a3 = (i + (club ? .45 : .72)) / teeth * 360;
      const P = (r, a) => SM.polar(cx, cy, r, a).map(f).join(' ');
      p += (i ? 'L' : 'M') + P(rr, a0) + ' L' + P(ro, a1) + ' L' + P(ro, a2) + ' L' + P(rr, a3) + ' ';
    }
    p += 'Z ';
    if (windows) {
      const r1 = ro * .32, r2 = rr - ro * .12;
      for (let i = 0; i < windows; i++) {
        const a = i / windows * 360 + 8, b = (i + 1) / windows * 360 - 8;
        const P = (r, an) => SM.polar(cx, cy, r, an).map(f).join(' ');
        p += `M${P(r2, a)} A${f(r2)} ${f(r2)} 0 0 1 ${P(r2, b)} L${P(r1, b)} A${f(r1)} ${f(r1)} 0 0 0 ${P(r1, a)} Z `;
      }
    }
    return p;
  }
  function jewel(x, y, s) {
    s = s || 1;
    return `<circle cx="${x}" cy="${y}" r="${5.2 * s}" fill="url(#mv-gold)" stroke="#5a3a08" stroke-width=".6"/><circle cx="${x}" cy="${y}" r="${3.2 * s}" fill="url(#mv-ruby)"/><circle cx="${x - 1 * s}" cy="${y - 1 * s}" r="${.9 * s}" fill="#fff" opacity=".85"/>`;
  }
  const MV = { barrel: [246, 346], center: [300, 400], third: [352, 352], fourth: [372, 412], escape: [352, 464], balance: [296, 486], pallet: [326, 474] };
  SM.MV = MV;
  /* ---------------- TOURBILLON (aperture at 6, 1 rpm cage, 4 Hz balance) ---------------- */
  const TB = SM.TB = { cx: CX, cy: 482, r: 36 };
  SM.tourbillonMarkup = function (finKey) {
    const p = FIN[finKey] || FIN.steel, { cx, cy, r } = TB;
    let spoke = '';
    for (let i = 0; i < 3; i++) spoke += `<path d="M${cx} ${cy} L${f(cx + Math.cos(i * 2.094) * (r - 8))} ${f(cy + Math.sin(i * 2.094) * (r - 8))}" stroke="url(#tb-pol)" stroke-width="3.2" stroke-linecap="round"/>`;
    let wheel = '';
    for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; wheel += `<path d="M${f(cx + Math.cos(a) * 9)} ${f(cy + 8 + Math.sin(a) * 9)} L${f(cx + Math.cos(a + .12) * 11.2)} ${f(cy + 8 + Math.sin(a + .12) * 11.2)}" stroke="#d9c07a" stroke-width="1"/>`; }
    let spiral = 'M' + cx + ' ' + cy; for (let k = 0; k <= 120; k++) { const a = k / 120 * Math.PI * 2 * 5, rr = 2 + k / 120 * 11; spiral += ` L${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`; }
    return `<defs>
      <radialGradient id="tb-well" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#1e2230"/><stop offset=".8" stop-color="#07080c"/><stop offset="1" stop-color="#000"/></radialGradient>
      <linearGradient id="tb-pol" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.hi}"/><stop offset=".45" stop-color="${p.lite}"/><stop offset=".55" stop-color="${p.dark}"/><stop offset="1" stop-color="${p.mid}"/></linearGradient>
      <linearGradient id="tb-bev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".8"/><stop offset=".5" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r + 3.5}" fill="url(#tb-pol)"/><circle cx="${cx}" cy="${cy}" r="${r + 1.5}" fill="url(#tb-bev)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#tb-well)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#p-perlage)" opacity=".35"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="3" transform="translate(.8 1.4)"/>
    <g id="tb-cage">
      <g id="tb-escape">${wheel}<circle cx="${cx}" cy="${cy + 8}" r="1.4" fill="#b0103a"/></g>
      <circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="url(#tb-pol)" stroke-width="2.6"/>${spoke}
      <g transform="translate(${cx - 7} ${cy - r + 1}) scale(.14)"><path d="${SM.SHIELD.OUT}" fill="url(#tb-pol)"/><path d="${SM.SHIELD.S}" fill="#c8102e"/></g>
      <path d="${spiral}" fill="none" stroke="#9fb8ff" stroke-opacity=".75" stroke-width=".45"/>
      <g id="tb-bal"><circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke="#e8c870" stroke-width="2.2"/><circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke="#fff5c8" stroke-opacity=".6" stroke-width=".5"/>
        <path d="M${cx - 15} ${cy} L${cx + 15} ${cy} M${cx} ${cy - 15} L${cx} ${cy + 15}" stroke="#d9b45a" stroke-width="1.3"/>
        ${[0, 90, 180, 270].map(a => { const [x, y] = SM.polar(cx, cy, 15, a + 45); return `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="#f6dc8a"/>`; }).join('')}</g>
      <circle cx="${cx}" cy="${cy}" r="3" fill="#b0103a"/><circle cx="${cx - .8}" cy="${cy - .8}" r="1" fill="#fff" opacity=".8"/>
    </g>
    <path d="${SM.arcPath(cx, cy, r + 2.6, 300, 60)}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/>`;
  };
  SM.updateTourbillon = function (root, t, secFrac) {
    const q = root._tb || (root._tb = { cage: root.querySelector('#tb-cage'), bal: root.querySelector('#tb-bal'), esc: root.querySelector('#tb-escape') });
    if (!q.cage) return;
    const { cx, cy } = TB, balA = 210 * Math.sin(t * Math.PI * 2 * 4);
    q.cage.setAttribute('transform', `rotate(${f(secFrac * 360)} ${cx} ${cy})`);
    q.bal.setAttribute('transform', `rotate(${f(balA)} ${cx} ${cy})`);
    q.esc.setAttribute('transform', `rotate(${f(Math.floor(t * 8) * 18)} ${cx} ${cy + 8})`);
  };
  SM.movementMarkup = function () {
    const wheel = (id, [x, y], t, ro, rr, w, fill, club) => `<g id="${id}"><path d="${gearPath(x, y, t, ro, rr, w, club)}" fill="${fill}" fill-rule="evenodd" stroke="#3a2604" stroke-width=".5"/><circle cx="${x}" cy="${y}" r="${ro * .2}" fill="url(#mv-steel)"/></g>`;
    let spiral = '';
    for (let i = 0; i <= 220; i++) { const a = i * .19, r = 3 + i * .09; spiral += (i ? 'L' : 'M') + f(MV.balance[0] + r * Math.cos(a)) + ' ' + f(MV.balance[1] + r * Math.sin(a)) + ' '; }
    let screws = '';
    for (let i = 0; i < 14; i++) { const [x, y] = SM.polar(MV.balance[0], MV.balance[1], 36.5, i * 360 / 14); screws += `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="url(#mv-gold)" stroke="#5a3a08" stroke-width=".4"/>`; }
    return `<defs>
      <clipPath id="mv-clip"><circle cx="${CX}" cy="${CY}" r="147"/></clipPath>
      <linearGradient id="mv-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".45" stop-color="#d8a847"/><stop offset="1" stop-color="#6c4a10"/></linearGradient>
      <linearGradient id="mv-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#9aa3ae"/><stop offset="1" stop-color="#3b424b"/></linearGradient>
      <radialGradient id="mv-ruby" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ff9ab0"/><stop offset=".5" stop-color="#d0103a"/><stop offset="1" stop-color="#5a0014"/></radialGradient>
      <linearGradient id="mv-bridge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9edf2"/><stop offset="1" stop-color="#7d8793"/></linearGradient>
    </defs>
    <g clip-path="url(#mv-clip)">
      <circle cx="${CX}" cy="${CY}" r="147" fill="#a9b0b8"/><circle cx="${CX}" cy="${CY}" r="147" fill="url(#p-perlage)" opacity=".75"/>
      <circle cx="${CX}" cy="${CY}" r="147" fill="url(#g-vig)"/>
      ${wheel('mv-barrel', MV.barrel, 96, 58, 54, 5, 'url(#mv-gold)')}
      <g id="mv-ratchet"><path d="${gearPath(MV.barrel[0], MV.barrel[1], 44, 36, 32, 0)}" fill="url(#mv-steel)"/><circle cx="${MV.barrel[0]}" cy="${MV.barrel[1]}" r="32" fill="url(#p-brushR)" opacity=".5"/></g>
      ${wheel('mv-center', MV.center, 80, 40, 37, 4, 'url(#mv-gold)')}
      ${wheel('mv-third', MV.third, 70, 30, 27.5, 4, 'url(#mv-gold)')}
      ${wheel('mv-fourth', MV.fourth, 64, 26, 23.5, 4, 'url(#mv-gold)')}
      ${wheel('mv-escape', MV.escape, 20, 17, 12, 4, 'url(#mv-steel)', true)}
      <path d="M150 300 Q220 250 300 262 Q330 268 330 300 Q300 330 250 318 Q200 310 186 360 Q170 380 150 360 Z" fill="#000" opacity=".45" transform="translate(4 6)" filter="url(#f-soft)"/><path d="M150 300 Q220 250 300 262 Q330 268 330 300 Q300 330 250 318 Q200 310 186 360 Q170 380 150 360 Z" fill="url(#mv-bridge)" opacity=".96"/>
      <path d="M150 300 Q220 250 300 262 Q330 268 330 300 Q300 330 250 318 Q200 310 186 360 Q170 380 150 360 Z" fill="url(#p-geneva)" opacity=".55" style="mix-blend-mode:multiply"/>
      <path d="M150 300 Q220 250 300 262 Q330 268 330 300 Q300 330 250 318 Q200 310 186 360 Q170 380 150 360 Z" fill="none" stroke="#fff" stroke-width="1.6" stroke-opacity=".8"/>
      <path d="M318 340 Q380 318 420 360 Q440 410 408 438 Q392 446 384 430 Q400 400 380 380 Q356 364 330 372 Q312 360 318 340 Z" fill="#000" opacity=".45" transform="translate(4 6)" filter="url(#f-soft)"/><path d="M318 340 Q380 318 420 360 Q440 410 408 438 Q392 446 384 430 Q400 400 380 380 Q356 364 330 372 Q312 360 318 340 Z" fill="url(#mv-bridge)"/>
      <path d="M318 340 Q380 318 420 360 Q440 410 408 438 Q392 446 384 430 Q400 400 380 380 Q356 364 330 372 Q312 360 318 340 Z" fill="url(#p-geneva)" opacity=".55" style="mix-blend-mode:multiply"/>
      <path d="M318 340 Q380 318 420 360 Q440 410 408 438 Q392 446 384 430 Q400 400 380 380 Q356 364 330 372 Q312 360 318 340 Z" fill="none" stroke="#fff" stroke-width="1.6" stroke-opacity=".8"/>
      <text x="236" y="292" font-size="7.5" fill="#1d2430" font-weight="700" letter-spacing="1.4" font-family="SMOswald, Oswald, Arial Narrow, sans-serif" transform="rotate(-8 236 292)">KRYPTON CAL. S-38 · 25 JEWELS</text>
      <text x="236" y="302" font-size="6" fill="#1d2430" letter-spacing="1.2" font-family="SMOswald, Oswald, Arial Narrow, sans-serif" transform="rotate(-8 236 302)">ADJUSTED 5 POSITIONS · NICK</text>
      <g id="mv-pallet"><path d="M${MV.pallet[0] - 16} ${MV.pallet[1] - 8} L${MV.pallet[0] + 16} ${MV.pallet[1] - 8} L${MV.pallet[0] + 3} ${MV.pallet[1] + 22} L${MV.pallet[0] - 3} ${MV.pallet[1] + 22} Z" fill="url(#mv-steel)" stroke="#222" stroke-width=".5"/>
        <rect x="${MV.pallet[0] - 17}" y="${MV.pallet[1] - 10}" width="4" height="6" fill="#d0103a"/><rect x="${MV.pallet[0] + 13}" y="${MV.pallet[1] - 10}" width="4" height="6" fill="#d0103a"/></g>
      <g id="mv-balance"><circle cx="${MV.balance[0]}" cy="${MV.balance[1]}" r="34" fill="none" stroke="url(#mv-gold)" stroke-width="5"/>${screws}
        <path d="M${MV.balance[0] - 33} ${MV.balance[1]} L${MV.balance[0] + 33} ${MV.balance[1]} M${MV.balance[0]} ${MV.balance[1] - 33} L${MV.balance[0]} ${MV.balance[1] + 33}" stroke="url(#mv-gold)" stroke-width="3"/>
        <path d="${spiral}" fill="none" stroke="#1d4fb8" stroke-width=".7" opacity=".95"/></g>
      <path d="M232 470 Q270 450 300 474 Q306 500 280 506 L250 520 Q226 506 232 470 Z" fill="#000" opacity=".45" transform="translate(4 6)" filter="url(#f-soft)"/><path d="M232 470 Q270 450 300 474 Q306 500 280 506 L250 520 Q226 506 232 470 Z" fill="url(#mv-bridge)"/><path d="M232 470 Q270 450 300 474 Q306 500 280 506 L250 520 Q226 506 232 470 Z" fill="url(#p-geneva)" opacity=".5" style="mix-blend-mode:multiply"/>
      <path d="M232 470 Q270 450 300 474 Q306 500 280 506 L250 520 Q226 506 232 470 Z" fill="none" stroke="#fff" stroke-width="1.4" stroke-opacity=".8"/>
      ${jewel(MV.barrel[0], MV.barrel[1], 1.3)}${jewel(MV.third[0], MV.third[1])}${jewel(MV.fourth[0], MV.fourth[1])}${jewel(MV.escape[0], MV.escape[1])}${jewel(MV.balance[0], MV.balance[1], 1.1)}${jewel(MV.pallet[0], MV.pallet[1] + 12, .8)}${jewel(CX, CY, 1.2)}
      ${screw(168, 330, 5, null, 30, true)}${screw(318, 290, 5, null, 70, true)}${screw(410, 420, 5, null, 10, true)}${screw(246, 510, 4.5, null, 50, true)}${screw(340, 336, 4.5, null, 100, true)}
      <circle cx="${CX}" cy="${CY}" r="147" fill="url(#p-scan)"/>
    </g>`;
  };
  SM.updateMovement = function (root, t) {
    if (!root) return;
    const rot = (id, [x, y], a) => { const e = root.querySelector('#' + id); if (e) e.setAttribute('transform', `rotate(${f(a)} ${x} ${y})`); };
    const beats = Math.floor(t * 6);
    rot('mv-barrel', MV.barrel, t * 1.2); rot('mv-ratchet', MV.barrel, t * 1.2);
    rot('mv-center', MV.center, t * 6); rot('mv-third', MV.third, -t * 24); rot('mv-fourth', MV.fourth, t * 45);
    rot('mv-escape', MV.escape, -beats * 9 - SM.ease(Math.min(1, (t * 6 - beats) * 4)) * 9);
    const bal = Math.sin(t * Math.PI * 2 * 3);
    rot('mv-balance', MV.balance, bal * 210); rot('mv-pallet', [MV.pallet[0], MV.pallet[1] + 12], bal > 0 ? 7 : -7);
  };
})(window.SM);
