const CACHE='alziyad-calendar-v16';
const CORE=['./additional-photos.js?v=16','./calendar-content.js?v=16','./user-photos.js?v=16','./photo-engine.js?v=16','./photo-catalog.js?v=16','./','./index.html','./manifest.webmanifest','./logo.jpg','./icon-192.png','./icon-512.png','./riyadh-city.jpg','./riyadh-work.jpg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('alziyad-calendar-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return r}).catch(()=>caches.match(e.request)))});
