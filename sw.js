const CACHE_NAME = 'nexus-v1';
const PRECACHE = ['/', '/index.html', '/icon.png'];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 요청 처리: 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase API는 캐시하지 않음 (항상 네트워크)
  if (url.hostname.includes('supabase')) return;

  // 외부 CDN도 캐시하지 않음
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 성공하면 캐시 업데이트
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
