import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from 'serwist';

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const precacheEntries = self.__SW_MANIFEST;
const homeCachePrefix = 'memox-home-v1-';

// Tie HTML snapshots to the precached build so a new release cannot hydrate
// an old page with a different set of client chunks.
const homeStrategy: Promise<NetworkFirst> = crypto.subtle
  .digest('SHA-256', new Uint8Array(new TextEncoder().encode(JSON.stringify(precacheEntries))).buffer)
  .then((digest) => new NetworkFirst({
    cacheName: homeCachePrefix + Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0')).join(''),
    networkTimeoutSeconds: 2,
    plugins: [
      new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 }),
      {
        async cacheWillUpdate({ request, response }) {
          // Navigation preload can expose a redirect as status 0 instead of
          // a visible 3xx response. Neither form may retain a private snapshot.
          if (response.redirected || response.type === 'opaqueredirect' ||
            (response.status >= 300 && response.status < 400) ||
            response.status === 401 || response.status === 403) {
            await caches.delete((await homeStrategy).cacheName);
            return null;
          }
          return response.status === 200 && response.headers.get('Content-Type')?.includes('text/html')
            ? response : null;
        },
        cachedResponseWillBeUsed({ cachedResponse }) {
          if (!cachedResponse) return;
          const headers = new Headers(cachedResponse.headers);
          // Navigation Timing exposes this marker even if React mounts after
          // the worker has already finished responding. See OfflineMemoSync.
          headers.append('Server-Timing', 'memox-cache;desc="hit"');
          return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers,
          });
        },
      },
    ],
  }));

const serwist: Serwist = new Serwist({
  precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin && request.mode === 'navigate' && url.pathname === '/',
      async handler(options) {
        const strategy = await homeStrategy;
        let deadline: ReturnType<typeof setTimeout> | undefined;
        try {
          // NetworkFirst only bounds the wait when a cache entry exists.
          // Keep its background cache update (including navigation preload),
          // but also bound this response when there is no usable snapshot.
          return await Promise.race([
            strategy.handle(options),
            new Promise<never>((_, reject) => {
              deadline = setTimeout(() => reject(new Error('Home navigation timed out')), 6000);
            }),
          ]);
        } catch (error) {
          const fallback = await serwist.matchPrecache('/offline.html');
          if (fallback) return fallback;
          throw error;
        } finally {
          clearTimeout(deadline);
        }
      },
    },
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname === '/login',
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  // Keep Serwist's default recent-page and static-asset caches. When neither
  // can answer a navigation, use this precached page instead of a network error.
  fallbacks: {
    entries: [
      {
        url: '/offline.html',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const { cacheName } = await homeStrategy;
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) =>
        (name.startsWith(homeCachePrefix) && name !== cacheName) ||
        ['pages', 'pages-rsc', 'pages-rsc-prefetch', 'others'].includes(name))
      .map((name) => caches.delete(name)));
  })());
});

serwist.addEventListeners();
