// Minimal service worker — sadece installability için.
// Offline cache yok; yeni sürüm deploy edilince eskiyi anında değiştir.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch handler bilerek pasif: tüm istekler ağa düşer, SW araya girmez.
// İleride offline desteği gerekirse Serwist veya elle cache stratejisi eklenir.
self.addEventListener('fetch', () => {});
