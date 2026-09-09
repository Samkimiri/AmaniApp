// Amani service worker — makes the installed PWA work fully offline,
// not just "offline if you happened to have visited that exact page
// before". The entire app (all screens, the full offline KJV text, and
// the note editor) lives inside one JS bundle referenced from index.html
// — Metro inlines the bundled Bible JSON straight into it — so caching
// that one bundle plus the HTML shell is enough for the whole app to
// work with zero connection. Bump CACHE_NAME on any change here to drop
// stale caches from previously installed versions.
const CACHE_NAME = "amani-cache-v2";
const CORE_ASSETS = ["/manifest.json", "/icon.png", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        CORE_ASSETS.map((url) =>
          fetch(url, { cache: "no-store" })
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => {})
        )
      );

      // The JS bundle's filename is content-hashed and changes on every
      // deploy, so it can't be hardcoded here — read it out of the HTML
      // instead, then precache it explicitly. Without this, that ~5MB
      // bundle (which contains the entire app and the whole Bible) would
      // only get cached the first time the *runtime* fetch handler below
      // happened to see it, which usually works but isn't guaranteed
      // (e.g. the page closes right after loading).
      try {
        const res = await fetch("/", { cache: "no-store" });
        const htmlForCache = res.clone();
        const html = await res.text();
        await cache.put("/", htmlForCache);
        const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
        await Promise.all(
          scriptSrcs.map((src) =>
            fetch(src)
              .then((r) => (r.ok ? cache.put(src, r) : null))
              .catch(() => {})
          )
        );
      } catch {}

      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // Page navigations: try the network first so users get fresh content
  // when online, falling back to the cached shell when offline. Every
  // route serves the same HTML shell here (client-side routing), so a
  // single cache entry covers all of them.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/").then((cached) => cached || caches.match(request)))
    );
    return;
  }

  // Static assets (JS bundle, fonts, images): cache-first, filling the
  // cache in the background as new hashed files are requested. This is
  // the fallback path for anything the install-time precache above
  // missed (e.g. font files, or a bundle from a build before this
  // service worker existed).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
