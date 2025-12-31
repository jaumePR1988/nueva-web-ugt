import React, { useState } from 'react';
import { Download, Smartphone, Chrome, Monitor, X, CheckCircle, AlertCircle } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PWAInstallGuide({ isOpen, onClose }: PWAInstallGuideProps) {
  const { isInstallable, promptInstall, deferredPrompt } = usePWA();
  const [installStep, setInstallStep] = useState<'detect' | 'chrome' | 'firefox' | 'safari'>('detect');

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        const success = await promptInstall();
        if (success) {
          // Usar alert como alternativa al toast
          alert('¡App instalada exitosamente!');
          onClose();
        }
      } catch (error) {
        console.error('Error installing PWA:', error);
        alert('Error al instalar la app. Por favor, intenta manualmente.');
      }
    }
  };

  const detectBrowser = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      setInstallStep('chrome');
    } else if (userAgent.includes('Firefox')) {
      setInstallStep('firefox');
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      setInstallStep('safari');
    } else {
      setInstallStep('chrome');
    }
  };

  React.useEffect(() => {
    detectBrowser();
  }, []);

  const getInstallInstructions = () => {
    switch (installStep) {
      case 'chrome':
        return {
          icon: <Chrome className="h-8 w-8 text-blue-500" />,
          title: 'Instalar en Google Chrome',
          steps: [
            'Busca el icono "Instalar" en la barra de dirección',
            'Haz clic en "Instalar UGT TOWA Portal"',
            'Confirma la instalación haciendo clic en "Instalar"',
            'La app aparecerá en tu escritorio y menú de aplicaciones'
          ]
        };
      case 'firefox':
        return {
          icon: <Monitor className="h-8 w-8 text-orange-500" />,
          title: 'Instalar en Firefox',
          steps: [
            'Busca el icono "Instalar" en la barra de dirección',
            'Haz clic en "Instalar" cuando aparezca la opción',
            'Confirma la instalación',
            'La app se instalará como aplicación independiente'
          ]
        };
      case 'safari':
        return {
          icon: <Smartphone className="h-8 w-8 text-gray-500" />,
          title: 'Instalar en Safari (iOS)',
          steps: [
            'Toca el botón "Compartir" en la parte inferior de la pantalla',
            'Selecciona "Agregar a pantalla de inicio"',
            'Confirma tocando "Agregar"',
            'La app aparecerá en tu pantalla de inicio'
          ]
        };
      default:
        return {
          icon: <Download className="h-8 w-8 text-blue-500" />,
          title: 'Instalar App',
          steps: ['Detectando navegador...']
        };
    }
  };

  const instructions = getInstallInstructions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Instalar App UGT TOWA</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              {instructions.icon}
              <h3 className="text-lg font-semibold">{instructions.title}</h3>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    ¿Por qué instalar la app?
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Notificaciones más confiables</li>
                    <li>• Acceso más rápido a tus herramientas</li>
                    <li>• Experiencia optimizada</li>
                    <li>• Funciona sin conexión (parcialmente)</li>
                  </ul>
                </div>
              </div>
            </div>

            <ol className="space-y-3">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col space-y-3">
            {deferredPrompt && isInstallable && (
              <button
                onClick={handleInstallClick}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Instalar Automáticamente</span>
              </button>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setInstallStep('chrome')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  installStep === 'chrome'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Chrome
              </button>
              <button
                onClick={() => setInstallStep('firefox')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  installStep === 'firefox'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Firefox
              </button>
              <button
                onClick={() => setInstallStep('safari')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  installStep === 'safari'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Safari
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-800">
                <strong>Consejo:</strong> Una vez instalada, la app aparecerá en tu escritorio 
                o pantalla de inicio como una aplicación nativa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
