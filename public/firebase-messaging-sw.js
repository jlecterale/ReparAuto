importScripts('https://www.gstatic.com/firebasejs/11.7.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.7.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDQC9m8SYHsZbeEG-G-b708JFbtUV9knq8',
  authDomain: 'reparauto-site.firebaseapp.com',
  projectId: 'reparauto-site',
  storageBucket: 'reparauto-site.firebasestorage.app',
  messagingSenderId: '707836120678',
  appId: '1:707836120678:web:4c18eee236e955a75767a7',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'ReparAuto';
  const options = {
    body: payload.notification?.body || '',
    icon: '/pwa-icon.svg',
    badge: '/pwa-icon.svg',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
