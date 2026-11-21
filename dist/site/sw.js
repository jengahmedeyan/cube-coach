// Retires the old Cube coach service worker that used to live at the site root.
// The app now lives in app/ with its own service worker; this one replaces the old root worker
// on its next update check, deletes the old caches, unregisters itself, and reloads open pages.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("cube-coach-")).map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => Promise.all(clients.map((c) => c.navigate(c.url).catch(() => {})))),
  );
});
