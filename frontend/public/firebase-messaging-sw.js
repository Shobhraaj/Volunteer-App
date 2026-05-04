/**
 * Firebase Cloud Messaging Service Worker
 *
 * SETUP:
 * 1. Copy this file to frontend/public/firebase-messaging-sw.js
 * 2. Replace the firebaseConfig values with your actual project config
 * 3. Replace VAPID_KEY in index.html with your FCM Web Push key
 *    (Firebase Console → Project Settings → Cloud Messaging → Web Push certificates)
 *
 * This enables background push notifications when the app is not in focus.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ── Replace with your Firebase config ─────────────────────────────────
const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT_ID.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId:             'YOUR_APP_ID',
};
// ───────────────────────────────────────────────────────────────────────

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'EcoPulse', {
    body:  body  || 'You have a new notification.',
    icon:  icon  || '/vite.svg',
    badge: '/vite.svg',
    data:  payload.data || {},
    actions: [
      { action: 'open',    title: 'Open App'  },
      { action: 'dismiss', title: 'Dismiss'   },
    ],
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
