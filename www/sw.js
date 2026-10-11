const CACHE = 'lernspiel-v1';
const FILES = ['./','./index.html','./manifest.json','./icons/icon.svg','./css/style.css',
  './js/native.js','./js/data.js','./js/speech.js','./js/ui.js','./js/reading.js','./js/numbers.js','./js/writing.js','./js/story.js','./js/app.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
