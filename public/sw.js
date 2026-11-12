// Service worker do Pequenos Discípulos: deixa o app funcionar offline (encontros, retiros, acampamentos).
// - Página (index.html): rede primeiro, cache se estiver offline → sempre pega a versão nova quando há internet.
// - Arquivos /assets/ (têm hash no nome, nunca mudam): cache primeiro.
// - Fontes do Google: cache, atualizando em segundo plano.

// Prefixo próprio: no GitHub Pages vários apps do mesmo usuário dividem a mesma origem
// (e o mesmo Cache Storage). Só apagamos caches nossos de versões antigas.
const PREFIX = 'pequenos-discipulos-';
const CACHE = `${PREFIX}v4`; // v4: ícone Cordeirinho Alegre
const MATCH = { ignoreVary: true, ignoreSearch: false };
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

/** Lista os arquivos /assets/ citados no index.html. */
function assetsIn(html) {
  return [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g)].map((m) => new URL(m[1], self.registration.scope).href);
}

/** Guarda o index.html novo + os assets dele, e apaga assets de versões antigas. */
async function cacheIndex(cache, response) {
  const html = await response.clone().text();
  const assets = assetsIn(html);
  await cache.put(new URL('./index.html', self.registration.scope).href, response.clone());
  await Promise.all(
    assets.map(async (url) => {
      if (!(await cache.match(url, MATCH))) {
        const r = await fetch(url);
        if (r.ok) await cache.put(url, r);
      }
    }),
  );
  const keep = new Set(assets);
  for (const req of await cache.keys()) {
    if (req.url.includes('/assets/') && !keep.has(req.url)) await cache.delete(req);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE);
      const index = await fetch('./index.html', { cache: 'no-cache' });
      if (index.ok) await cacheIndex(cache, index);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Verificação de versão nova (src/lib/update.ts): vai direto à rede, sem cache.
  if (req.cache === 'no-store') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          // "no-cache": revalida com o servidor, para não abrir uma versão velha do cache HTTP.
          const fresh = await fetch(new Request(req, { cache: 'no-cache' })).catch(() => fetch(req));
          if (fresh.ok) event.waitUntil(cacheIndex(cache, fresh.clone()));
          return fresh;
        } catch {
          return (await cache.match(new URL('./index.html', self.registration.scope).href, MATCH)) ?? Response.error();
        }
      })(),
    );
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, MATCH);
      const fromNetwork = () =>
        fetch(req)
          .then((r) => {
            if (r.ok || r.type === 'opaque') cache.put(req, r.clone());
            return r;
          })
          .catch(() => undefined);
      if (cached) {
        // Fontes: devolve o cache e atualiza em segundo plano. Assets com hash nunca mudam.
        if (isFont) event.waitUntil(fromNetwork());
        return cached;
      }
      return (await fromNetwork()) ?? Response.error();
    })(),
  );
});
