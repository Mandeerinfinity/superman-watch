/* Original rendition of the diamond S shield, with bevels, metallic trim and embossing. */
(function (SM) {
  'use strict';
  const OUT = 'M42 4 H158 L196 48 L100 166 L4 48 Z';
  const IN = 'M46 11 H154 L187 49 L100 155 L13 49 Z';
  const TRIM = 'M39.6 0 H160.4 L201.5 48 L100 172 L-1.5 48 Z';
  const S = 'M46 18 L152 18 L176 46 L149 37 L88 37 C66 37 64 56 90 57 L142 61 C163 64 159 99 133 110 C112 118 86 118 62 102 C88 104 106 96 116 89 C127 81 122 76 106 75 L52 70 C20 66 18 30 46 18 Z';
  SM.SHIELD = { OUT, IN, S, TRIM };

  const GOLD = ['#fff4c2', '#e2b347', '#6e4a0e'];
  const STEEL = ['#ffffff', '#b9c1cc', '#454c56'];
  const P = {
    classic: { trim: GOLD, border: ['#ef2b45', '#8c0a1c'], field: ['#ffe872', '#f0ad00'], s: ['#ec2a42', '#8e0a1c'], gloss: .38 },
    chrome: { trim: STEEL, border: ['#f4f7fa', '#6b7480'], field: ['#2c3139', '#08090b'], fieldTex: 'p-brushL', s: ['#ffffff', '#7d8794'], gloss: .45, sStroke: '#20242a' },
    gold: { trim: GOLD, border: ['#f9df8e', '#946417'], field: ['#1a1a1a', '#000'], fieldTex: 'p-noise', s: ['#fff1b3', '#b07f22'], gloss: .35 },
    ice: { trim: ['#ffffff', '#cfe9ff', '#5f8fbf'], border: ['#a9dcff', '#2d6cb0'], field: ['#fbfdff', '#c3e3f8'], s: ['#4b8ee0', '#123c7a'], gloss: .5 },
    crystal: { trim: ['#f2fdff', '#86deff', '#23628e'], border: ['#9ae8ff', '#1a5c8e'], field: ['#c9f4ff', '#2c8fc4'], fieldOpacity: .55, s: ['#f2fdff', '#7fd3ff'], glow: '#62d4ff', gloss: .5 },
    heat: { trim: ['#ffe2b0', '#ff7a1a', '#5a1000'], border: ['#ff6a1f', '#6a0800'], field: ['#ffe066', '#ff4a00'], s: ['#7a0000', '#220000'], glow: '#ff4a14', gloss: .3 },
    kryptonite: { trim: ['#e6fff0', '#5de681', '#0b5222'], border: ['#44ff85', '#0a5a22'], field: ['#c4ffd4', '#20c055'], fieldOpacity: .85, s: ['#07401a', '#021a09'], glow: '#39ff6a', gloss: .4 },
    ink: { border: ['#b3262f', '#8f1c24'], field: ['#efcf5b', '#dcae2e'], fieldTex: 'p-halftone', s: ['#b3262f', '#8f1c24'], gloss: 0, flat: true },
    carbon: { trim: STEEL, border: ['#e3263c', '#760a16'], field: ['#1a1b1e', '#050506'], fieldTex: 'p-carbon', fieldTexOpacity: 1, s: ['#ff3a50', '#a00c1e'], gloss: .32, sStroke: '#e8ecf1' },
    lex: { trim: ['#9aa1a8', '#3d4349', '#0e1012'], border: ['#30363c', '#0d0f11'], field: ['#16191c', '#060708'], fieldTex: 'p-hex', fieldTexOpacity: 1, s: ['#4dff88', '#0d8a35'], glow: '#39ff7a', gloss: .25, cracks: true },
    playful: { trim: ['#ffffff', '#f3f7ff', '#98a6c0'], border: ['#ff5277', '#d4163f'], field: ['#fff08a', '#ffc21a'], s: ['#ff5277', '#d4163f'], gloss: .55, outline: '#ffffff' },
    solar: { trim: ['#fff6c8', '#ffb300', '#6a3d00'], border: ['#2a1400', '#000'], field: ['#150a00', '#000'], s: ['#3b1d00', '#050200'], gloss: .15 },
    glyph: { etched: '#7fe8ff' },
    ruby: { trim: STEEL, border: ['#ff3b55', '#8a0014'], field: ['#1b2a5c', '#070f2a'], fieldTex: 'p-guilloche', fieldTexOpacity: .7, s: ['#ffffff', '#b8c4d6'], gloss: .4, sStroke: '#1b2a5c' }
  };
  SM.SHIELD_STYLES = P;

  function lg(id, c, x2, y2) { return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 || 0}" y2="${y2 === undefined ? 1 : y2}"><stop offset="0" stop-color="${c[0]}"/>${c.length > 2 ? `<stop offset=".5" stop-color="${c[1]}"/>` : ''}<stop offset="1" stop-color="${c[c.length - 1]}"/></linearGradient>`; }

  /* cx, cy = visual centre; w = width in user units */
  SM.shield = function (cx, cy, w, styleName, opts) {
    opts = opts || {};
    const st = typeof styleName === 'string' ? (P[styleName] || P.classic) : styleName;
    const k = w / 200, h = 172 * k, u = SM.uid('sh');
    const tx = SM.f(cx - w / 2), ty = SM.f(cy - h / 2 - 2 * k);
    if (st.etched) {
      const c = st.etched;
      return `<g transform="translate(${tx} ${ty}) scale(${SM.f(k)})" class="${opts.cls || ''}">
        <path d="${OUT}" fill="${c}" fill-opacity=".06" stroke="${c}" stroke-width="3.5" stroke-opacity=".9"/>
        <path d="${IN}" fill="none" stroke="${c}" stroke-width="1.2" stroke-opacity=".6"/>
        <path d="${S}" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-width="2.4"/>
        <path d="${S}" fill="none" stroke="#fff" stroke-width=".8" stroke-opacity=".8"/>
      </g>`;
    }
    let d = `<defs>
      ${st.trim ? lg(u + 't', st.trim, .6, 1) : ''}
      ${lg(u + 'b', st.border)}${lg(u + 'f', st.field, .3, 1)}${lg(u + 's', st.s, .25, 1)}
      <linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${st.gloss || 0}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="${u}cs"><path d="${S}"/></clipPath>
      <clipPath id="${u}ci"><path d="${IN}"/></clipPath>
      <clipPath id="${u}cb"><path d="${OUT} ${IN}" clip-rule="evenodd"/></clipPath>
      <clipPath id="${u}co"><path d="${OUT}"/></clipPath>
      ${st.glow ? `<radialGradient id="${u}h"><stop offset="0" stop-color="${st.glow}" stop-opacity=".75"/><stop offset=".55" stop-color="${st.glow}" stop-opacity=".25"/><stop offset="1" stop-color="${st.glow}" stop-opacity="0"/></radialGradient>` : ''}
    </defs>`;
    let g = '';
    if (st.glow) g += `<ellipse class="shield-halo" cx="100" cy="86" rx="150" ry="132" fill="url(#${u}h)"/>`;
    if (!st.flat) g += `<path d="${TRIM}" fill="#000" opacity=".45" transform="translate(3 6)"/>`;
    if (st.outline) g += `<path d="${TRIM}" fill="none" stroke="${st.outline}" stroke-width="10" stroke-linejoin="round"/>`;
    if (st.trim) {
      g += `<path d="${TRIM}" fill="url(#${u}t)"/>`;
      g += `<path d="${TRIM}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1" transform="translate(-.4 -.4)"/>`;
    }
    g += `<path d="${OUT}" fill="url(#${u}b)"/>`;
    if (!st.flat) g += `<g clip-path="url(#${u}cb)"><path d="${OUT}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" transform="translate(1.6 1.6)"/><path d="${IN}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3" transform="translate(1.2 1.2)"/><path d="${OUT}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3" transform="translate(-1.4 -1.4)"/></g>`;
    g += `<path d="${IN}" fill="url(#${u}f)" ${st.fieldOpacity ? `fill-opacity="${st.fieldOpacity}"` : ''}/>`;
    if (st.fieldTex) g += `<path d="${IN}" fill="url(#${st.fieldTex})" opacity="${st.fieldTexOpacity || .35}" style="mix-blend-mode:${st.fieldTex === 'p-halftone' || st.fieldTex === 'p-hex' ? 'normal' : 'overlay'}"/>`;
    if (!st.flat) g += `<g clip-path="url(#${u}ci)"><path d="${IN}" fill="none" stroke="#000" stroke-opacity=".38" stroke-width="7" transform="translate(2 2.6)"/><path d="${S}" fill="#000" opacity=".32" transform="translate(2.4 3.4)"/></g>`;
    g += `<path d="${S}" fill="url(#${u}s)"/>`;
    if (!st.flat) g += `<g clip-path="url(#${u}cs)"><path d="${S}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" transform="translate(1.5 1.7)"/><path d="${S}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="3.2" transform="translate(-1.5 -1.7)"/></g>`;
    if (st.sStroke) g += `<path d="${S}" fill="none" stroke="${st.sStroke}" stroke-width="1.1" stroke-opacity=".8"/>`;
    if (st.cracks) g += `<path d="M58 40 L74 58 L68 72 L88 96 M140 30 L128 52 L136 66 M100 150 L96 128 L108 116 L101 100 M30 52 L50 60" fill="none" stroke="#5dff95" stroke-width="1.6" opacity=".9"/><path d="M58 40 L74 58 L68 72 L88 96 M140 30 L128 52 L136 66 M100 150 L96 128 L108 116 L101 100" fill="none" stroke="#000" stroke-width=".6" opacity=".6" transform="translate(.8 .8)"/>`;
    if (st.gloss) g += `<g clip-path="url(#${u}co)"><path d="M-10 0 H210 V52 Q100 86 -10 58 Z" fill="url(#${u}g)"/></g>`;
    return `<g transform="translate(${tx} ${ty}) scale(${SM.f(k)})" class="${opts.cls || ''}">${d}${g}</g>`;
  };
  /* Standalone <svg> for UI use */
  SM.shieldSVG = function (style, cls) {
    return `<svg class="${cls || ''}" viewBox="-12 -12 224 200" aria-hidden="true">${SM.shield(100, 88, 200, style)}</svg>`;
  };
})(window.SM);
