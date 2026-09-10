const CACHE='alziyad-calendar-v3-fixed-1';
const CORE=['./','./index.html','./manifest.webmanifest','./logo.jpg','./icon-192.png','./icon-512.png','./work-interior.jpg','./work-garden.jpg','./work-hall.jpg','./work-exterior-night.jpg','./work-lighting.jpg','./work-villa.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{if(e.request.method==='GET'&&resp.ok&&new URL(e.request.url).origin===location.origin){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return resp;}).catch(()=>r)));});
