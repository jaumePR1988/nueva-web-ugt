import React from 'react';
import { Bell, BellOff, Settings, Smartphone } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

interface NotificationSetupProps {
  userId: string;
  role: string;
  className?: string;
}

export default function NotificationSetup({ userId, role, className = '' }: NotificationSetupProps) {
  const {
    isPermissionGranted,
    subscription,
    isRegistered,
    requestPermission,
    registerPushSubscription,
    unregisterPushSubscription
  } = useNotifications(userId, role);

  const handleToggleNotifications = async () => {
    if (isRegistered) {
      await unregisterPushSubscription();
    } else {
      const permissionGranted = await requestPermission();
      if (permissionGranted) {
        await registerPushSubscription();
      }
    }
  };

  // Solo mostrar a administradores
  if (role !== 'admin') {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${isRegistered ? 'bg-green-100' : 'bg-orange-100'}`}>
            {isRegistered ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : (
              <BellOff className="h-5 w-5 text-orange-600" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Notificaciones de Citas
            </h3>
            <p className="text-xs text-gray-500">
              {isRegistered 
                ? 'Recibirás alertas en tiempo real cuando se agenden nuevas citas'
                : 'Activa las notificaciones para recibir alertas de nuevas citas'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleNotifications}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isRegistered
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isRegistered ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      {!isRegistered && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Smartphone className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs text-blue-800 font-medium">
                💡 Consejo para mejor experiencia:
              </p>
              <p className="text-xs text-blue-700 mt-1">
                • Instala la app como PWA para notificaciones más confiables<br/>
                • Mantén el navegador abierto para recibir notificaciones en tiempo real<br/>
                • Permisos de notificaciones son necesarios para las alertas
              </p>
            </div>
          </div>
        </div>
      )}

      {isRegistered && subscription && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Settings className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-xs text-green-800 font-medium">
                ✅ Notificaciones activas
              </p>
              <p className="text-xs text-green-700 mt-1">
                Recibirás alertas inmediatamente cuando se agenden nuevas citas.
                El sistema procesa notificaciones cada minuto.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
