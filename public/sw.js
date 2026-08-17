// sw.js — der Service Worker. Sein einziger Zweck: die App startet ohne Netz.
//
// Bewusst KEIN Zwischenspeicher für Daten — die liegen ohnehin auf dem Gerät.
// Zwischengespeichert wird nur die Hülle (HTML, Bundle, Icons), und zwar nach
// dem Muster „erst aus dem Netz, sonst aus dem Speicher":
//
//   · Netz zuerst, weil eine neue Fassung sonst tagelang nicht ankäme. Wer den
//     Speicher zuerst fragt, sieht bis zum nächsten Zufall die alte App.
//   · Speicher als Rückfall, denn genau dafür ist der Service Worker da: im
//     Supermarkt mit einem Balken muss die App aufgehen.
//
// Die Fassung im Namen ist der Schalter: eine neue Zahl heißt neuer Speicher,
// und der alte wird beim Aktivieren abgeräumt.
const FASSUNG = 'bring-home-v1';

// Wo die App liegt. NICHT hart „/" — auf GitHub Pages ist es „/Bring-home/".
// `registration.scope` weiß es, ohne dass es jemand doppelt pflegen muss.
const WURZEL = new URL(self.registration ? self.registration.scope : './', self.location.href);
const unter = (pfad) => new URL(pfad, WURZEL).toString();

self.addEventListener('install', (e) => {
  // Sofort übernehmen — sonst liefe nach einem Update bis zum Schließen aller
  // Fenster weiterhin die alte Fassung.
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(FASSUNG)
      .then((c) => c.addAll([unter('./'), unter('manifest.json'), unter('icons/icon-192.png')]))
      .catch(() => undefined),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name !== FASSUNG) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (e) => {
  const anfrage = e.request;
  // Nur GET und nur eigene Adressen. Alles andere (später: Supabase) geht
  // ungefiltert durch — ein zwischengespeicherter Datenabruf wäre ein Fehler,
  // kein Merkmal.
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;

  e.respondWith(
    (async () => {
      try {
        const antwort = await fetch(anfrage);
        const speicher = await caches.open(FASSUNG);
        speicher.put(anfrage, antwort.clone());
        return antwort;
      } catch {
        const treffer = await caches.match(anfrage);
        if (treffer) return treffer;
        // Eine Unterseite ohne eigenen Eintrag: die Hülle tut es auch, der
        // Router findet den Rest.
        const huelle = await caches.match(unter('./'));
        if (huelle) return huelle;
        throw new Error('offline und nichts im Speicher');
      }
    })(),
  );
});
