import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface PWAInstallPromptProps {
  onInstall?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onInstall }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installAttempts, setInstallAttempts] = useState(0);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showAlways, setShowAlways] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar si la app ya está instalada
  useEffect(() => {
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstallBlocked = localStorage.getItem('pwa-install-blocked') === 'true';
      const isInstallSuccess = localStorage.getItem('pwa-install-success') === 'true';
      
      setIsInstalled(isStandalone || isInstallSuccess);
      
      if (isStandalone || isInstallSuccess) {
        setShowPrompt(false);
        return;
      }
      
      const wasRejected = localStorage.getItem('pwa-install-rejected') === 'true';
      const dismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
      
      if (!wasRejected && !dismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
      
      if (wasRejected) {
        setShowAlways(true);
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    checkInstallStatus();
  }, []);

  // Escuchar eventos de instalación
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] beforeinstallprompt capturado');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App instalada exitosamente');
      setIsInstalled(true);
      setShowPrompt(false);
      setShowAlways(false);
      
      localStorage.setItem('pwa-install-success', 'true');
      localStorage.removeItem('pwa-install-rejected');
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-blocked');
      
      if (onInstall) onInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onInstall]);

  const handleInstall = async () => {
    if (isInstalled) {
      toast.success('La aplicación ya está instalada');
      return;
    }

    setInstallAttempts(prev => prev + 1);

    try {
      if (deferredPrompt) {
        console.log('[PWA] Usando deferred prompt');
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('[PWA] Usuario aceptó instalar');
          toast.success('¡Aplicación instalada correctamente!');
          localStorage.setItem('pwa-install-success', 'true');
          setIsInstalled(true);
          setShowPrompt(false);
          setShowAlways(false);
          
          if (onInstall) onInstall();
        } else if (outcome === 'dismissed') {
          console.log('[PWA] Usuario cerró el prompt');
          handleUserDismiss();
        }
        
        setDeferredPrompt(null);
      } else {
        console.log('[PWA] No hay deferredPrompt, usando método manual');
        handleManualInstall();
      }
    } catch (error) {
      console.error('[PWA] Error en instalación:', error);
      toast.error('Error al instalar la aplicación');
      handleManualInstall();
    }
  };

  const handleUserDismiss = (permanent = false) => {
    setShowPrompt(false);
    
    if (permanent) {
      localStorage.setItem('pwa-install-blocked', 'true');
      setShowAlways(false);
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
      if (showAlways) {
        timeoutRef.current = setTimeout(() => {
          setShowPrompt(true);
        }, 30000);
      }
    }
  };

  const handleUserReject = () => {
    setShowPrompt(false);
    setShowAlways(false);
    localStorage.setItem('pwa-install-rejected', 'true');
  };

  const handleManualInstall = () => {
    setInstallAttempts(prev => prev + 1);
    toast.info('Para instalar la aplicación:', {
      description: '📱 Safari (iPhone): Menú → "Añadir a pantalla de inicio"\n📱 Chrome (Android): Menú → "Instalar aplicación" o "Añadir a inicio"',
      duration: 8000,
    });
    
    // También intentar con el prompt del navegador si está disponible
    if (deferredPrompt) {
      deferredPrompt.prompt();
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {showPrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Portal UGT Towa</h3>
              </div>
              <button
                onClick={() => handleUserDismiss(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                📱 <strong>Instala la aplicación</strong> para acceso rápido y notificaciones
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Acceso rápido desde pantalla inicio
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Notificaciones automáticas
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Funciona sin internet
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                Instalar
              </button>
              <button
                onClick={handleManualInstall}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
              >
                Manual
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs">
                <button
                  onClick={() => handleUserDismiss(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  No mostrar más
                </button>
                <span className="text-gray-400">
                  Intentos: {installAttempts}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAlways && !showPrompt && !isInstalled && (
        <button
          onClick={() => {
            setInstallAttempts(prev => prev + 1);
            setShowPrompt(true);
          }}
          className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 animate-bounce"
          title="Instalar Portal UGT Towa"
        >
          <Download className="w-6 h-6" />
        </button>
      )}

      {/* Banner superior eliminado - solo popup de abajo */}
    </>
  );
};
