self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push messages
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "Crave'N";
    const message = data.message || 'You have a new notification';
    const payload = data.data || {};

    const options = {
      body: message,
      icon: '/craven-logo.png',
      badge: '/craven-logo.png',
      data: payload,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Open' }
      ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Push event error:', err);
  }
});

// Focus or open app on click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      let client = allClients.find(c => c.url.includes(self.location.origin));
      if (client) {
        await client.focus();
        client.postMessage({ type: 'notification_click', data: event.notification.data });
      } else {
        await self.clients.openWindow(url);
      }
    })()
  );
});