// Service worker for Plural Unit push notifications.
// Registered by src/lib/services/pushSubscription.ts.

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
