/* Boussole des émotions — service worker
   Objectif : l'application démarre sans réseau, et sans jamais attendre le réseau.
   Pour publier une mise à jour, incrémenter VERSION. */
const VERSION = "v4";
const CACHE = "boussole-" + VERSION;

const COQUILLE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", ev => {
  ev.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // Mise en cache une par une : un fichier manquant ne doit pas faire échouer
    // toute l'installation et laisser l'application sans mode hors ligne.
    await Promise.allSettled(COQUILLE.map(u =>
      fetch(u, { cache: "reload" }).then(r => r.ok ? c.put(u, r) : null)
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", ev => {
  ev.waitUntil((async () => {
    // On ne purge les anciens caches que si le nouveau contient bien l'application.
    // Sinon — mise à jour tentée pendant une panne du serveur — on garderait un
    // cache vide et l'application deviendrait inutilisable hors ligne.
    const c = await caches.open(CACHE);
    if(await c.match("./index.html")){
      const cles = await caches.keys();
      await Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k)));
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  // Navigation : on sert TOUJOURS le cache d'abord, puis on rafraîchit en tâche de
  // fond. Une connexion faible ou un portail captif ne peut plus bloquer le
  // démarrage — c'était le défaut de la stratégie « réseau d'abord ».
  if(req.mode === "navigate"){
    ev.respondWith((async () => {
      const c = await caches.open(CACHE);
      // Repli sur n'importe quel cache disponible, y compris celui d'une version
      // antérieure, plutôt que de servir une page d'erreur du serveur.
      const enCache = (await c.match("./index.html")) || (await caches.match("./index.html"));
      const reseau = fetch(req)
        .then(rep => { if(rep.ok) c.put("./index.html", rep.clone()); return rep; })
        .catch(() => null);
      if(enCache){ ev.waitUntil(reseau); return enCache; }
      return (await reseau) || new Response(
        '<!doctype html><meta charset=utf-8><p style="font:16px system-ui;padding:2rem">' +
        "Application indisponible hors ligne : ouvrez-la une première fois avec une connexion.",
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    })());
    return;
  }

  ev.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if(hit) return hit;
    try {
      const rep = await fetch(req);
      if(rep.ok) c.put(req, rep.clone());
      return rep;
    } catch(e){
      return new Response("", { status: 504, statusText: "Hors ligne" });
    }
  })());
});

// L'application peut demander l'état du cache pour l'afficher dans Réglages.
self.addEventListener("message", ev => {
  if(ev.data !== "etat-cache") return;
  ev.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const cles = await c.keys();
    ev.source.postMessage({
      type: "etat-cache",
      version: VERSION,
      fichiers: cles.length,
      attendus: COQUILLE.length,
      pret: cles.length >= COQUILLE.length - 1
    });
  })());
});
