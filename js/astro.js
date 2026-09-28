/* Sun & moon calculations (NOAA solar equations, synodic moon) + dotted day/night world map */
(function (SM) {
  'use strict';
  const d2r = Math.PI / 180, r2d = 180 / Math.PI;
  const A = SM.astro = {};
  A.solar = function (date) {
    const jd = date.getTime() / 86400000 + 2440587.5, T = (jd - 2451545) / 36525;
    const L0 = ((280.46646 + T * (36000.76983 + T * .0003032)) % 360 + 360) % 360;
    const M = 357.52911 + T * (35999.05029 - .0001537 * T), e = .016708634 - T * (.000042037 + .0000001267 * T);
    const C = Math.sin(M * d2r) * (1.914602 - T * (.004817 + .000014 * T)) + Math.sin(2 * M * d2r) * (.019993 - .000101 * T) + Math.sin(3 * M * d2r) * .000289;
    const om = 125.04 - 1934.136 * T, lam = L0 + C - .00569 - .00478 * Math.sin(om * d2r);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (.00059 - T * .001813))) / 60) / 60, eps = eps0 + .00256 * Math.cos(om * d2r);
    const decl = Math.asin(Math.sin(eps * d2r) * Math.sin(lam * d2r)) * r2d;
    const y = Math.pow(Math.tan(eps * d2r / 2), 2);
    const eq = 4 * r2d * (y * Math.sin(2 * L0 * d2r) - 2 * e * Math.sin(M * d2r) + 4 * e * y * Math.sin(M * d2r) * Math.cos(2 * L0 * d2r) - .5 * y * y * Math.sin(4 * L0 * d2r) - 1.25 * e * e * Math.sin(2 * M * d2r));
    return { decl, eq };
  };
  A.subsolar = function (date) {
    const s = A.solar(date), utcH = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    let lon = -15 * (utcH - 12 + s.eq / 60); lon = ((lon + 540) % 360) - 180;
    return { lat: s.decl, lon };
  };
  A.altitude = function (date, lat, lon) {
    const ss = A.subsolar(date);
    const c = Math.sin(lat * d2r) * Math.sin(ss.lat * d2r) + Math.cos(lat * d2r) * Math.cos(ss.lat * d2r) * Math.cos((lon - ss.lon) * d2r);
    return Math.asin(Math.max(-1, Math.min(1, c))) * r2d;
  };
  A.sunTimes = function (date, lat, lon) {
    const base = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    const s = A.solar(new Date(base));
    const noonMin = 720 - 4 * lon - s.eq;
    const cosH = (Math.cos(90.833 * d2r) / (Math.cos(lat * d2r) * Math.cos(s.decl * d2r))) - Math.tan(lat * d2r) * Math.tan(s.decl * d2r);
    const day0 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const res = { noon: new Date(day0 + noonMin * 60000), polar: null };
    if (cosH > 1) { res.polar = 'night'; return res; }
    if (cosH < -1) { res.polar = 'day'; return res; }
    const H = Math.acos(cosH) * r2d;
    res.rise = new Date(day0 + (noonMin - 4 * H) * 60000); res.set = new Date(day0 + (noonMin + 4 * H) * 60000);
    res.length = (res.set - res.rise);
    const decl = s.decl; res.maxAlt = 90 - Math.abs(lat - decl);
    return res;
  };
  const SYN = 29.530588853;
  A.moon = function (date) {
    const jd = date.getTime() / 86400000 + 2440587.5;
    const age = (((jd - 2451550.26) % SYN) + SYN) % SYN, phase = age / SYN;
    const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    const names = [[.0339, 'New Moon'], [.216, 'Waxing Crescent'], [.284, 'First Quarter'], [.466, 'Waxing Gibbous'], [.534, 'Full Moon'], [.716, 'Waning Gibbous'], [.784, 'Last Quarter'], [.966, 'Waning Crescent'], [1.01, 'New Moon']];
    const name = names.find(n => phase < n[0])[1];
    const toFull = ((.5 - phase + 1) % 1) * SYN, toNew = ((1 - phase) % 1) * SYN;
    return { phase, illum, age, name, nextFull: new Date(date.getTime() + toFull * 86400000), nextNew: new Date(date.getTime() + toNew * 86400000) };
  };
  /* yellow-sun charge: fun "solar power" reserve */
  A.solarCharge = function (date, lat, lon) {
    const alt = A.altitude(date, lat, lon);
    const t = A.sunTimes(date, lat, lon);
    let charge;
    if (t.polar === 'day') charge = 100; else if (t.polar === 'night') charge = 12;
    else {
      const now = date.getTime();
      if (now < t.rise) charge = 30 - 18 * Math.min(1, (t.rise - now) / (6 * 3600000));
      else if (now > t.set) charge = 100 - 70 * Math.min(1, (now - t.set) / (8 * 3600000));
      else charge = 30 + 70 * ((now - t.rise) / t.length);
    }
    return { charge: Math.max(0, Math.min(100, charge)), alt, input: Math.max(0, Math.sin(alt * d2r)) };
  };

  /* ---------- land mask ---------- */
  let bits = null;
  function landBits() {
    if (bits) return bits;
    const s = atob(SM.LAND_B64); bits = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bits[i] = s.charCodeAt(i);
    return bits;
  }
  SM.isLand = function (lat, lon) {
    const b = landBits(); const row = Math.min(179, Math.max(0, Math.floor(90 - lat))), col = ((Math.floor(lon + 180) % 360) + 360) % 360;
    const i = row * 360 + col; return (b[i >> 3] >> (7 - (i & 7))) & 1;
  };

  /* dotted day/night map */
  SM.drawWorldMap = function (canvas, date, cities, sel) {
    const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#081634'); bg.addColorStop(1, '#040b1d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,160,255,.08)'; ctx.lineWidth = 1;
    for (let lo = -150; lo <= 180; lo += 30) { const x = (lo + 180) / 360 * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let la = -60; la <= 60; la += 30) { const y = (90 - la) / 180 * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const ss = SM.astro.subsolar(date), sl = ss.lat * d2r, cosSl = Math.cos(sl), sinSl = Math.sin(sl);
    const step = 2, dotR = W / 180 * .42;
    for (let la = 89; la > -90; la -= step) {
      const lr = la * d2r, sL = Math.sin(lr), cL = Math.cos(lr);
      for (let lo = -179; lo < 180; lo += step) {
        const alt = Math.asin(sL * sinSl + cL * cosSl * Math.cos((lo - ss.lon) * d2r)) * r2d;
        const x = (lo + 180) / 360 * W, y = (90 - la) / 180 * H;
        if (SM.isLand(la, lo)) {
          const t = Math.max(0, Math.min(1, (alt + 8) / 14));
          const r = Math.round(40 + t * 215), g = Math.round(80 + t * 130), b = Math.round(170 - t * 90);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.beginPath(); ctx.arc(x, y, dotR * (0.8 + t * .35), 0, Math.PI * 2); ctx.fill();
          if (alt < -6 && ((la * 7 + lo * 13) % 11 === 0)) { ctx.fillStyle = 'rgba(255,214,120,.9)'; ctx.fillRect(x - .7, y - .7, 1.4, 1.4); }
        } else if (alt < 0) {
          ctx.fillStyle = `rgba(0,0,20,${Math.min(.35, -alt / 30)})`; ctx.fillRect(x - step / 360 * W / 2, y - step / 180 * H / 2, step / 360 * W + .5, step / 180 * H + .5);
        }
      }
    }
    const sx = (ss.lon + 180) / 360 * W, sy = (90 - ss.lat) / 180 * H;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * .05); sg.addColorStop(0, 'rgba(255,240,170,1)'); sg.addColorStop(.3, 'rgba(255,200,60,.7)'); sg.addColorStop(1, 'rgba(255,160,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, W * .05, 0, Math.PI * 2); ctx.fill();
    ctx.font = `600 ${Math.round(W / 60)}px SMRajdhani, Rajdhani, sans-serif`;
    (cities || []).forEach(c => {
      const x = (c.lon + 180) / 360 * W, y = (90 - c.lat) / 180 * H, on = sel === c.name;
      ctx.fillStyle = on ? '#ff3b50' : '#ffffff'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, on ? W / 150 : W / 240, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
      if (on || c.label) { ctx.fillStyle = on ? '#ffd76a' : 'rgba(255,255,255,.85)'; ctx.strokeText(c.name, x + 5, y - 4); ctx.fillText(c.name, x + 5, y - 4); }
    });
  };

  /* orthographic Earth for the space background */
  SM.drawEarth = function (ctx, N, rotLon, sun) {
    const img = ctx.createImageData(N, N), d = img.data, R = N / 2, tilt = 23 * d2r;
    const L = sun || [-.6, -.35, .72]; const ll = Math.hypot(...L); const lx = L[0] / ll, ly = L[1] / ll, lz = L[2] / ll;
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const nx = (px - R + .5) / R, ny = (py - R + .5) / R, rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      const y2 = ny * Math.cos(tilt) - nz * Math.sin(tilt), z2 = ny * Math.sin(tilt) + nz * Math.cos(tilt);
      const lat = -Math.asin(Math.max(-1, Math.min(1, y2))) * r2d; let lon = Math.atan2(nx, z2) * r2d + rotLon; lon = ((lon + 540) % 360) - 180;
      const land = SM.isLand(lat, lon), ice = Math.abs(lat) > 72;
      let r, g, b;
      if (ice) { r = 235; g = 242; b = 250; } else if (land) { const t = Math.abs(lat) / 60; r = 70 + t * 60; g = 120 - t * 20; b = 60; if (Math.abs(lat) < 30 && (lon > -20 && lon < 60)) { r = 170; g = 145; b = 90; } } else { r = 20; g = 70; b = 150; }
      const cl = Math.sin(lat * .31 + lon * .07) * Math.sin(lon * .19 - lat * .05) + Math.sin(lat * .9 + lon * .4) * .4;
      if (cl > .55) { const k = Math.min(1, (cl - .55) * 3); r += (255 - r) * k * .85; g += (255 - g) * k * .85; b += (255 - b) * k * .85; }
      const diff = Math.max(0, nx * lx + ny * ly + nz * lz), light = .08 + diff * .95;
      const spec = !land && !ice ? Math.pow(Math.max(0, diff), 30) * 90 : 0;
      const i = (py * N + px) * 4;
      d[i] = Math.min(255, r * light + spec); d[i + 1] = Math.min(255, g * light + spec); d[i + 2] = Math.min(255, b * light + spec * 1.1);
      d[i + 3] = rr > .985 ? (1 - rr) / .015 * 255 : 255;
      if (diff < .02 && land && ((px * 7 + py * 13) % 9 === 0)) { d[i] = 255; d[i + 1] = 200; d[i + 2] = 110; }
    }
    return img;
  };
})(window.SM);
