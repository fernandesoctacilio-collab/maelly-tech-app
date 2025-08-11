
const CACHE='maelly-front-v1';
const APP=[ './','./index.html','./styles.css','./app.js',
  './modules/db.js','./modules/crypto.js','./modules/bncc.js','./modules/files.js','./modules/attendance.js','./modules/exercises.js',
  './agents/story.js','./agents/lesson.js','./manifest.webmanifest','./data/bncc.json','./data/bncc_map.json',
  './icons/icon-192.png','./icons/icon-512.png','./icons/logo-app.png','./icons/app-icon-original.png','./media/logo-anim.mp4' ];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{ const ks=await caches.keys(); await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))); await self.clients.claim(); })()));
const CACHE_STRATEGIES={
  'stale-while-revalidate': [/\/modules\//,/\/agents\//],
  'cache-first': [/\/icons\//,/\/media\//],
  'network-first': [/\/data\//]
};
function matchStrategy(pathname){
  for(const r of CACHE_STRATEGIES['cache-first']) if(r.test(pathname)) return 'cache-first';
  for(const r of CACHE_STRATEGIES['network-first']) if(r.test(pathname)) return 'network-first';
  for(const r of CACHE_STRATEGIES['stale-while-revalidate']) if(r.test(pathname)) return 'stale-while-revalidate';
  return 'swr-cdn';
}
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.mode==='navigate'){ e.respondWith((async()=>{ try{ const f=await fetch(e.request); (await caches.open(CACHE)).put('./',f.clone()); return f; }catch{ return (await caches.open(CACHE)).match('./'); } })()); return; }
  if(APP.some(p=>url.pathname.endsWith(p.replace('./','/')))){ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); return; }
  if(/cdn.jsdelivr.net|unpkg.com|cdnjs.cloudflare.com/.test(url.hostname)){
    e.respondWith((async()=>{ const c=await caches.open(CACHE); const cached=await c.match(e.request); const fp=fetch(e.request).then(r=>{c.put(e.request,r.clone());return r;}).catch(()=>null); return cached||fp||fetch(e.request); })());
  }
});
