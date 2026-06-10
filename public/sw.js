// Service Worker — Web Push bildirimleri + temel offline fallback

const CACHE_NAME = "ozel-ders-v1";
const OFFLINE_URL = "/";

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Push ─────────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Bildirim", body: event.data.text(), url: "/" };
  }

  const options = {
    body:     data.body  ?? "",
    icon:     data.icon  ?? "/icons/icon-192.png",
    badge:    data.badge ?? "/icons/icon-192.png",
    tag:      data.tag   ?? "default",
    renotify: true,
    data: {
      url:       data.url ?? "/",
      timestamp: data.timestamp ?? Date.now(),
    },
    actions: [
      { action: "open",    title: "Aç" },
      { action: "dismiss", title: "Kapat" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Özel Ders Pro", options)
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Fetch (network-first, offline fallback) ───────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((r) => r ?? caches.match(OFFLINE_URL))
    )
  );
});
