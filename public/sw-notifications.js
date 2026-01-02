// Service Worker para Notificaciones Push - UGT TOWA Portal
// Versión mejorada y más robusta

const CACHE_NAME = 'ugt-towa-v2.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/ugt-towa-icon-192.png',
  '/ugt-towa-icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[SW] Error durante la instalación:', error);
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activando service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver del cache si está disponible
        if (response) {
          return response;
        }
        // Si no está en cache, hacer fetch
        return fetch(event.request);
      })
  );
});

// Manejar notificaciones push
self.addEventListener('push', event => {
  console.log('[SW] Notificación push recibida:', event);

  let notificationData = {
    title: 'Nueva Notificación - UGT TOWA',
    body: 'Tienes una nueva notificación',
    icon: '/ugt-towa-icon-192.png',
    badge: '/ugt-towa-icon-192.png',
    tag: 'general',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Ver detalles' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  // Si hay datos en el push, usarlos
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('[SW] Datos del push:', pushData);
      
      notificationData = {
        title: pushData.title || notificationData.title,
        body: pushData.body || pushData.message || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        tag: pushData.tag || pushData.appointment_id || notificationData.tag,
        requireInteraction: true,
        data: pushData,
        actions: [
          { action: 'view', title: 'Ver cita' },
          { action: 'close', title: 'Cerrar' }
        ]
      };
    } catch (error) {
      console.error('[SW] Error procesando datos del push:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('[SW] Click en notificación:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  if (action === 'view' || !action) {
    // Abrir la aplicación en la página de administración
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Si hay una ventana abierta, enfocarla
          for (const client of clientList) {
            if (client.url.includes('/admin') && 'focus' in client) {
              return client.focus();
            }
          }
          // Si no hay ventana abierta, abrir una nueva
          if (clients.openWindow) {
            return clients.openWindow('/admin');
          }
        })
    );
  }
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  console.log('[SW] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Manejar errores globales
self.addEventListener('error', event => {
  console.error('[SW] Error global:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Promise rechazada no manejada:', event.reason);
});

console.log('[SW] Service Worker de notificaciones cargado correctamente');
