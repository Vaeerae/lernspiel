const CACHE = 'lernspiel-v2';
const FILES = ['./','./index.html','./manifest.json','./icons/icon.svg','./css/style.css',
  './audio/clips.js','./js/native.js','./js/data.js','./js/speech.js','./js/ui.js','./js/reading.js','./js/numbers.js','./js/writing.js','./js/story.js','./js/app.js'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Audiodateien beim ersten Abruf zwischenspeichern, damit die Web-Version offline funktioniert
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
  if (resp.ok && e.request.url.includes('/audio/')) { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
  return resp;
}))));
