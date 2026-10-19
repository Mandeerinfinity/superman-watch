/* Nick's Superman Watch: offline cache (cache-first, refreshed in the background) */
const CACHE = 'nick-superman-watch-v3.0.0';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/util.js', 'js/quality.js', 'js/landmask.js', 'js/textures.js', 'js/shield.js', 'js/audio.js', 'js/astro.js', 'js/complications.js', 'js/watch.js', 'js/faces.js', 'js/backgrounds.js', 'js/powers.js', 'js/game.js', 'js/app.js', 'js/ui.js',
  'js/holo.mjs', 'vendor/three-holo.module.min.js',
  'fonts/oswald.woff2', 'fonts/cinzel.woff2', 'fonts/playfair.woff2', 'fonts/rajdhani-bold.woff2', 'fonts/rajdhani-medium.woff2', 'fonts/unifraktur.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
