const CACHE='alziyad-calendar-v6-embedded';
const CORE=['./manifest.webmanifest','./logo.jpg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.mode==='navigate' || new URL(req.url).pathname.endsWith('/index.html')){
    e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{const c=r.clone();caches.open(CACHE).then(k=>k.put(req,c));return r;}).catch(()=>caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(resp=>{if(req.method==='GET'&&resp.ok&&new URL(req.url).origin===location.origin){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return resp;})));
});
