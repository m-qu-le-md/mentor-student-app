const CACHE = 'studymed-project-001-v1';
const SHELL = ['/', '/student/today', '/manifest.webmanifest', '/project-001-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))));
});

self.addEventListener('push', (event) => {
  const payload = event.data?.json() || { title: 'StudyMed', body: 'Bạn có một nhắc nhở mới.' };
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/project-001-icon.svg',
    badge: '/project-001-icon.svg',
    tag: payload.tag,
    data: { url: payload.url || '/student/today' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || '/student/today'));
});
