import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface PWAInstallPromptProps {
  onInstall: () => Promise<boolean>;
  isInstallable: boolean;
}

export const PWAInstallPrompt = ({ onInstall, isInstallable }: PWAInstallPromptProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verificar si ya fue instalada o descartada previamente
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!wasDismissed && !isStandalone && isInstallable) {
      // Mostrar prompt después de 5 segundos
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    const success = await onInstall();
    if (success) {
      setShowPrompt(false);
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || isDismissed || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <img 
                  src="/ugt-towa-icon-192.png" 
                  alt="UGT Towa" 
                  className="w-10 h-10"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg">UGT Towa</h3>
                <p className="text-sm text-red-100">Instalar aplicación</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Instala la aplicación en tu dispositivo para acceder más rápido y recibir notificaciones de comunicados importantes.
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
              <span className="text-gray-700 dark:text-gray-300">Acceso instantáneo desde la pantalla de inicio</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
              <span className="text-gray-700 dark:text-gray-300">Funciona sin conexión a internet</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
              <span className="text-gray-700 dark:text-gray-300">Notificaciones push de comunicados urgentes</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Instalar ahora
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
