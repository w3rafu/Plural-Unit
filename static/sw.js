// Service worker for Plural Unit push notifications and offline caching.
// Registered by src/lib/services/pushSubscription.ts.

const CACHE_NAME = 'plural-unit-v1';
const APP_SHELL = ['/', '/logo-white.png'];

// ── Install: cache the app shell ──

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
	);
	self.skipWaiting();
});

// ── Activate: clean old caches ──

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
		)
	);
	self.clients.claim();
});

// ── Fetch: network-first with cache fallback for navigations ──

self.addEventListener('fetch', (event) => {
	if (event.request.mode !== 'navigate') return;

	event.respondWith(
		fetch(event.request).catch(() =>
			caches.match('/').then((cached) => cached || new Response('Offline', { status: 503 }))
		)
	);
});

// ── Push: show notification ──

self.addEventListener('push', (event) => {
	if (!event.data) return;

	let payload;
	try {
		payload = event.data.json();
	} catch {
		payload = { title: 'Plural Unit', body: event.data.text() };
	}

	const title = payload.title || 'Plural Unit';
	const options = {
		body: payload.body || '',
		icon: '/logo-white.png',
		badge: '/logo-white.png',
		data: { url: payload.url || '/' }
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	const url = event.notification.data?.url || '/';
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			for (const client of clients) {
				if (client.url.includes(self.location.origin) && 'focus' in client) {
					client.navigate(url);
					return client.focus();
				}
			}
			return self.clients.openWindow(url);
		})
	);
});
