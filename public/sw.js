// Service Worker para UGT Towa PWA
// Version 1.0.0

const CACHE_NAME = 'ugt-towa-v1';
const OFFLINE_URL = '/';

// Recursos criticos para cachear
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/UGT-logo.jpg',
  '/ugt-towa-icon-192.png',
  '/ugt-towa-icon-512.png',
  '/manifest.json'
];

// Instalacion del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando recursos criticos');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activacion del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network First, fallback a Cache
self.addEventListener('fetch', (event) => {
  // Solo interceptar GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requests de Supabase (siempre deben ser en tiempo real)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es valida, cachearla
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Si es navegacion y no hay cache, mostrar pagina offline
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            return new Response('Contenido no disponible offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[Service Worker] Cache limpiado');
      })
    );
  }
});

// Notificaciones Push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recibido');
  
  const options = {
    body: event.data ? event.data.text() : 'Nuevo comunicado disponible',
    icon: '/ugt-towa-icon-192.png',
    badge: '/ugt-towa-icon-96.png',
    vibrate: [200, 100, 200],
    tag: 'ugt-towa-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Ver ahora'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('UGT Towa', options)
  );
});

// Click en notificacion
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Click en notificacion');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[Service Worker] Registrado correctamente');
