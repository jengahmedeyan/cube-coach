// Offline support when you host Cube Tutor yourself. The app is one HTML file, so caching it (plus icons) is enough;
// fonts are cached the first time they load, and the page falls back to system fonts if they're missing.
const CACHE = "cube-tutor-v3";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // The page itself: try the network first so updates arrive, fall back to the cached copy offline. Only a good page
  // replaces the cached one: a 404 or 500 from the host (or a captive-portal page) must not overwrite the working copy,
  // and while the host is failing the cached page is shown instead.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            e.waitUntil(caches.open(CACHE).then((c) => c.put("./index.html", copy)));
            return res;
          }
          return caches.match("./index.html").then((hit) => hit || res);
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }
  // Everything else (icons, Google Fonts): cache first, then network. Only good responses are kept.
  if (url.origin === location.origin || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
            }
            return res;
          }),
      ),
    );
  }
});
