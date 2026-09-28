/* Nick's Superman Watch v2 — utilities */
window.SM = window.SM || {};
(function (SM) {
  'use strict';
  SM.$ = (s, el = document) => el.querySelector(s);
  SM.$$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  SM.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  SM.pad = (n, l = 2) => String(n).padStart(l, '0');
  SM.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  SM.lerp = (a, b, t) => a + (b - a) * t;
  SM.ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  SM.rad = d => d * Math.PI / 180;
  /* point on circle, 0deg = 12 o'clock, clockwise */
  SM.polar = (cx, cy, r, deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  SM.f = n => (Math.round(n * 100) / 100);
  SM.arcPath = (cx, cy, r, a0, a1) => {
    const [x0, y0] = SM.polar(cx, cy, r, a0), [x1, y1] = SM.polar(cx, cy, r, a1);
    const large = ((a1 - a0) % 360 + 360) % 360 > 180 ? 1 : 0;
    return `M${SM.f(x0)} ${SM.f(y0)} A${r} ${r} 0 ${large} 1 ${SM.f(x1)} ${SM.f(y1)}`;
  };
  let uidN = 0;
  SM.uid = p => (p || 'u') + (++uidN).toString(36);
  SM.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  SM.DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  SM.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  SM.fmtClock = function (d, fmt24, withSec) {
    let h = d.getHours(); const m = SM.pad(d.getMinutes()), s = SM.pad(d.getSeconds());
    if (fmt24) return SM.pad(h) + ':' + m + (withSec ? ':' + s : '');
    const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return h + ':' + m + (withSec ? ':' + s : '') + ' ' + ap;
  };
  SM.fmtDur = function (ms, hundredths) {
    ms = Math.max(0, ms);
    const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    const cs = Math.floor(ms / 10) % 100;
    let out = (h ? h + ':' + SM.pad(m) : SM.pad(m)) + ':' + SM.pad(s);
    if (hundredths) out += '.' + SM.pad(cs);
    return out;
  };

  /* persistent settings */
  const KEY = 'nickSupermanWatchV2';
  SM.store = {
    data: {},
    load() { try { this.data = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { this.data = {}; } return this.data; },
    get(k, d) { return this.data[k] !== undefined ? this.data[k] : d; },
    set(k, v) { this.data[k] = v; this._save(); },
    _t: 0,
    _save() { clearTimeout(this._t); this._t = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* quota / private mode */ } }, 120); },
    flush() { clearTimeout(this._t); try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { } },
    reset() { this.data = {}; try { localStorage.removeItem(KEY); } catch (e) { } }
  };
  SM.store.load();

  /* tiny event bus */
  const handlers = {};
  SM.on = (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); };
  SM.emit = (ev, data) => { (handlers[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); };

  SM.toast = function (msg, ms) {
    const t = SM.$('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms || 2600);
  };
  SM.el = function (html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  SM.reducedMotion = () => SM.store.get('reduceMotion', false);
})(window.SM);
