import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NotificationSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string;
  created_at: string;
}

export function useNotifications(userId?: string, role?: string) {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [subscription, setSubscription] = useState<NotificationSubscription | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (role !== 'admin' || !userId) return;
    
    checkPermission();
    checkExistingSubscription();
    setupNotificationListener();
  }, [userId, role]);

  const checkPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.permission;
      setIsPermissionGranted(permission === 'granted');
    }
  };

  const checkExistingSubscription = async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setSubscription(data);
      setIsRegistered(true);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Las notificaciones no están soportadas en este navegador');
      return false;
    }

    const permission = await Notification.requestPermission();
    setIsPermissionGranted(permission === 'granted');
    
    if (permission === 'granted') {
      await registerPushSubscription();
      return true;
    } else {
      toast.error('Permiso de notificaciones denegado');
      return false;
    }
  };

  const registerPushSubscription = async () => {
    if (!userId || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/sw-notifications.js', {
        scope: '/'
      });
      
      console.log('[Notifications] Service Worker registrado:', registration);
      
      // Esperar a que el service worker esté activo
      await navigator.serviceWorker.ready;
      
      // Crear suscripción push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
          ? urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY)
          : undefined
      });

      // Enviar suscripción al servidor
      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error registering push subscription:', error);
        toast.error('Error al registrar suscripciones de notificación');
        return false;
      }

      setSubscription(data);
      setIsRegistered(true);
      toast.success('¡Notificaciones activadas! Recibirás alertas de nuevas citas.');
      return true;

    } catch (error) {
      console.error('Error setting up push notifications:', error);
      toast.error('Error al configurar notificaciones push');
      return false;
    }
  };

  const unregisterPushSubscription = async () => {
    if (!subscription) return;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error unregistering push subscription:', error);
        return false;
      }

      // Cancelar suscripción del navegador
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      setSubscription(null);
      setIsRegistered(false);
      toast.success('Notificaciones desactivadas');
      return true;

    } catch (error) {
      console.error('Error unregistering push subscription:', error);
      return false;
    }
  };

  const setupNotificationListener = () => {
    if (!userId) return;

    // Escuchar cambios en tiempo real en la tabla notifications
    const subscription = supabase
      .channel('admin_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload) => {
        const notification = payload.new;
        showNotification(notification);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const showNotification = (notification: any) => {
    if (!isPermissionGranted) return;

    const icon = '/ugt-towa-icon-192.png';
    
    new Notification(notification.title, {
      body: notification.message,
      icon: icon,
      badge: icon,
      tag: `appointment-${notification.appointment_id}`,
      requireInteraction: true
    });

    // También mostrar toast
    toast.success(notification.title, {
      description: notification.message,
      duration: 8000
    });
  };

  return {
    isPermissionGranted,
    subscription,
    isRegistered,
    requestPermission,
    registerPushSubscription,
    unregisterPushSubscription
  };
}

// Utilidad para convertir clave VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
