const CACHE='alziyad-calendar-v15';
const CORE=['./additional-photos.js?v=15','./calendar-content.js?v=15','./user-photos.js?v=15','./photo-engine.js?v=15','./photo-catalog.js?v=15','./','./index.html','./manifest.webmanifest','./logo.jpg','./icon-192.png','./icon-512.png','./riyadh-city.jpg','./riyadh-work.jpg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('alziyad-calendar-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return r}).catch(()=>caches.match(e.request)))});
