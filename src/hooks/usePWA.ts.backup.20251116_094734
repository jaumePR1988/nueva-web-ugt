import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  canUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
  isSubscribed: boolean;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    canUpdate: false,
    registration: null,
    isSubscribed: false
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Verificar si ya esta instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaState(prev => ({ ...prev, isInstalled: true }));
    }

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registrado:', registration.scope);
            setPwaState(prev => ({ ...prev, registration }));

            // Verificar actualizaciones
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] Nueva version disponible');
                    setPwaState(prev => ({ ...prev, canUpdate: true }));
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('[PWA] Error al registrar Service Worker:', error);
          });
      });
    }

    // Capturar evento de instalacion
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaState(prev => ({ ...prev, isInstallable: true }));
      console.log('[PWA] App instalable detectada');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar cuando se instala
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App instalada');
      setPwaState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No hay prompt de instalacion disponible');
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Usuario eligio:', outcome);

    setDeferredPrompt(null);
    setPwaState(prev => ({ ...prev, isInstallable: false }));

    return outcome === 'accepted';
  };

  const updateServiceWorker = () => {
    if (pwaState.registration && pwaState.registration.waiting) {
      pwaState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('[PWA] Notificaciones no soportadas');
      return false;
    }

    const permission = await Notification.requestPermission();
    console.log('[PWA] Permiso de notificaciones:', permission);
    return permission === 'granted';
  };

  const sendTestNotification = async () => {
    if (!pwaState.registration) {
      console.log('[PWA] Service Worker no registrado');
      return;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('[PWA] Sin permiso para notificaciones');
      return;
    }

    pwaState.registration.showNotification('UGT Towa', {
      body: 'Notificaciones activadas correctamente',
      icon: '/ugt-towa-icon-192.png',
      badge: '/ugt-towa-icon-96.png',
      tag: 'test-notification',
      requireInteraction: false
    } as any);
  };

  const subscribeToPush = async () => {
    if (!pwaState.registration) {
      console.log('[PWA] Service Worker no registrado');
      return false;
    }

    try {
      // Solicitar permiso
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return false;
      }

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[PWA] Usuario no autenticado');
        return false;
      }

      // Crear suscripción push (sin VAPID por ahora, solo para tracking)
      // En producción, aquí se usaría pushManager.subscribe() con VAPID keys
      
      // Por ahora, guardamos un placeholder para tracking de usuarios con PWA instalada
      const subscription = {
        endpoint: 'https://placeholder-endpoint.com/' + user.id,
        p256dh: 'placeholder-p256dh',
        auth: 'placeholder-auth'
      };

      // Guardar en Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          user_agent: navigator.userAgent
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[PWA] Error guardando suscripción:', error);
        return false;
      }

      console.log('[PWA] Suscripción guardada exitosamente');
      setPwaState(prev => ({ ...prev, isSubscribed: true }));
      return true;

    } catch (error) {
      console.error('[PWA] Error en subscribeToPush:', error);
      return false;
    }
  };

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setPwaState(prev => ({ ...prev, isSubscribed: !!data }));
    } catch (error) {
      console.error('[PWA] Error verificando suscripción:', error);
    }
  };

  // Verificar suscripción al montar
  useEffect(() => {
    checkSubscription();
  }, []);

  return {
    ...pwaState,
    promptInstall,
    updateServiceWorker,
    requestNotificationPermission,
    sendTestNotification,
    subscribeToPush,
    checkSubscription
  };
};
