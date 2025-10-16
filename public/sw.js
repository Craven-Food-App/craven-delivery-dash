const CACHE_NAME = 'craven-v1';
const OFFLINE_URL = '/';

const STATIC_CACHE = [
  '/',
  '/index.html',
  '/craven-logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome extensions and dev tools
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request)
          .then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
      })
  );
});

// Handle incoming push messages with enhanced processing
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "Crave'N";
    const message = data.message || 'You have a new notification';
    const payload = data.data || {};

    // Enhanced notification options for better visibility
    const options = {
      body: message,
      icon: '/craven-logo.png',
      badge: '/craven-logo.png',
      data: payload,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      silent: false,
      tag: payload.type || 'general',
      renotify: true,
      actions: [
        { action: 'open', title: 'Open App', icon: '/craven-logo.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      // iOS specific settings
      sound: 'default'
    };

    // For order assignments, add more urgent settings
    if (payload.type === 'order_assignment' || payload.type === 'test_order_assignment') {
      options.vibrate = [200, 100, 200, 100, 200, 100, 200];
      options.requireInteraction = true;
      options.silent = false;
      options.tag = 'order-' + (payload.orderId || Date.now());
      options.renotify = true;
    }

    // Show the notification
    const showNotificationPromise = self.registration.showNotification(title, options);
    
    // Also try to play sound if possible (limited support)
    event.waitUntil(
      showNotificationPromise.then(() => {
        console.log('Push notification displayed successfully');
        
        // Try to wake up the app if it's minimized
        return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
          .then(clients => {
            if (clients.length > 0) {
              // Send message to app to play sound
              clients.forEach(client => {
                client.postMessage({
                  type: 'push_notification_received',
                  data: { title, message, payload }
                });
              });
            }
          });
      }).catch(err => {
        console.error('Error showing push notification:', err);
      })
    );
  } catch (err) {
    console.error('Push event error:', err);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Crave\'N', {
        body: 'You have a new notification',
        icon: '/craven-logo.png',
        badge: '/craven-logo.png',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      })
    );
  }
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'dismiss') {
    return;
  }
  
  // Handle notification click - focus or open app
  const urlToOpen = data.orderId ? `/?orderId=${data.orderId}` : '/';
  
  event.waitUntil(
    (async () => {
      try {
        const allClients = await self.clients.matchAll({ 
          includeUncontrolled: true, 
          type: 'window' 
        });
        
        let client = allClients.find(c => c.url.includes(self.location.origin));
        
        if (client) {
          // Focus existing window and send message
          await client.focus();
          client.postMessage({ 
            type: 'notification_click', 
            data,
            action 
          });
        } else {
          // Open new window
          await self.clients.openWindow(urlToOpen);
        }
      } catch (error) {
        console.error('Error handling notification click:', error);
        // Fallback - just open the app
        await self.clients.openWindow('/');
      }
    })()
  );
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event);
  
  event.waitUntil(
    (async () => {
      try {
        // Re-subscribe with new subscription
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // This will be replaced by the client
        });
        
        // Send new subscription to server
        // This would need to be implemented with proper user context
        console.log('New subscription:', subscription);
      } catch (error) {
        console.error('Error handling push subscription change:', error);
      }
    })()
  );
});