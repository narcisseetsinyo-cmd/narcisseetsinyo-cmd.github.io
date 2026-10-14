/* CIC'ART — service hors ligne. Changez VERSION à chaque mise à jour de l'application. */
const VERSION = "cicart-fb-v2";
const SHELL = [
  "./",
  "./index.html",
  "./installer.html",
  "./app.js",
  "./firebase-config.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];
const LIBS = "cicart-libs";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== LIBS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Bibliothèque Firebase et polices : gardées en cache pour démarrer sans Internet
  const isLib = (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/"))
    || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (isLib) {
    e.respondWith(caches.open(LIBS).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }
      catch (err) { return new Response("", { status: 504 }); }
    }));
    return;
  }

  // Les échanges avec Firebase (authentification, base de données) ne passent jamais par le cache
  if (url.origin !== self.location.origin) return;

  // Fichiers de l'application : réseau d'abord pour rester à jour, cache si hors ligne
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});
