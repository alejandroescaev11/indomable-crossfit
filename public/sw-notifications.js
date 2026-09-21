// sw-notifications.js - Soporte de notificaciones en segundo plano y pantalla bloqueada para INDOMABLE
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {
  console.warn('[SW] No se pudo cargar OneSignalSDK.sw.js:', e);
}

// 1. Manejo del evento PUSH (Web Push)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'INDOMABLE', body: event.data.text() };
    }
  }

  // Si el push ya proviene de OneSignal, OneSignalSDK.sw.js se encarga de mostrarla con sonido y estilo
  if (data.custom || data.onesignal || data.headings || data.contents) {
    return;
  }

  const title = data.title || '📢 INDOMABLE';
  const options = {
    body: data.body || 'Nuevo aviso publicado en INDOMABLE.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || `indomable_announcement_${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Manejo del clic en la notificación (desde la barra de tareas, pantalla de bloqueo o bandeja de avisos)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si la ventana ya existe, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no existe ninguna ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 3. Recepción de mensajes directos desde la app principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
