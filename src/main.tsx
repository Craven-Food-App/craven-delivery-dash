import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'mapbox-gl/dist/mapbox-gl.css';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for Web Push notifications and PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New service worker available - refresh to update');
                // Optionally show a notification to user about update
              }
            });
          }
        });

        // Handle push notification permission for iOS
        if ('PushManager' in window) {
          console.log('✅ Push Manager available');
        }
      })
      .catch(err => {
        console.error('❌ Service Worker registration failed:', err);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'push_notification_received') {
        console.log('📬 Push notification received:', event.data.data);
        // Handle notification in app if needed
      }
    });
  });
}
