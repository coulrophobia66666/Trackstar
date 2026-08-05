// Minimaler Service Worker fuer die PWA-Installierbarkeit (Android/Chrome "App installieren").
// Netzwerk-first fuer die App-Shell: Nutzer bekommen bei bestehender Verbindung immer die
// aktuellste Version - wichtig, weil sich Code hier haeufig aendert. Der Cache dient nur als
// Fallback, wenn wirklich kein Netz da ist. Alles ausserhalb der Shell (API-Calls an den Worker,
// Stripe, das Whisper-Modell vom CDN) wird gar nicht erst abgefangen.
const CACHE_NAME = "overhertz-v1";
const APP_SHELL = ["/", "/index.html", "/style.css", "/app.js", "/logo.svg", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!APP_SHELL.includes(url.pathname)) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
