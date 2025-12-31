import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOffline: boolean;
  needsUpdate: boolean;
  installAttempts: number;
  userChoice: 'accepted' | 'dismissed' | 'pending' | null;
}

interface PWAReturn {
  state: PWAState;
  install: () => Promise<boolean>;
  dismiss: (permanent?: boolean) => void;
  reset: () => void;
  checkUpdate: () => void;
}

export const usePWA_Inteligente = (): PWAReturn => {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOffline: !navigator.onLine,
    needsUpdate: false,
    installAttempts: 0,
    userChoice: null
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const initializePWA = useCallback(() => {
    console.log('[PWA] Inicializando...');
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const installSuccess = localStorage.getItem('pwa-install-success') === 'true';
    const isInstalled = isStandalone || installSuccess;
    
    const installBlocked = localStorage.getItem('pwa-install-blocked') === 'true';
    const installRejected = localStorage.getItem('pwa-install-rejected') === 'true';
    const installDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    
    const attempts = parseInt(localStorage.getItem('pwa-install-attempts') || '0', 10);
    
    let userChoice: PWAState['userChoice'] = null;
    if (installBlocked) userChoice = 'dismissed';
    else if (installRejected) userChoice = 'dismissed';
    else if (installDismissed) userChoice = 'dismissed';
    else if (isInstalled) userChoice = 'accepted';

    setState(prev => ({
      ...prev,
      isInstalled,
      userChoice,
      installAttempts: attempts,
      isInstallable: !isInstalled && !installBlocked && !installRejected
    }));

    console.log('[PWA] Estado inicial:', {
      isInstalled,
      installBlocked,
      installRejected,
      installDismissed,
      attempts,
      userChoice
    });
  }, []);

  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    console.log('[PWA] beforeinstallprompt capturado');
    
    setDeferredPrompt(e);
    setState(prev => ({
      ...prev,
      isInstallable: true
    }));
  }, []);

  const handleAppInstalled = useCallback(() => {
    console.log('[PWA] App instalada exitosamente');
    
    setState(prev => ({
      ...prev,
      isInstalled: true,
      isInstallable: false,
      userChoice: 'accepted'
    }));

    localStorage.setItem('pwa-install-success', 'true');
    localStorage.removeItem('pwa-install-rejected');
    localStorage.removeItem('pwa-install-dismissed');
    localStorage.removeItem('pwa-install-blocked');
  }, []);

  // Función de dismiss - debe estar antes de install para evitar hoisting
  const dismiss = useCallback((permanent = false) => {
    console.log('[PWA] Usuario dismiss', { permanent });
    
    setState(prev => ({
      ...prev,
      isInstallable: !permanent,
      userChoice: 'dismissed'
    }));

    if (permanent) {
      localStorage.setItem('pwa-install-blocked', 'true');
      localStorage.setItem('pwa-install-rejected', 'true');
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
    
    setDeferredPrompt(null);
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({
        ...prev,
        installAttempts: prev.installAttempts + 1
      }));

      const currentAttempts = parseInt(localStorage.getItem('pwa-install-attempts') || '0', 10) + 1;
      localStorage.setItem('pwa-install-attempts', currentAttempts.toString());

      if (deferredPrompt) {
        console.log('[PWA] Mostrando prompt nativo');
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('[PWA] Instalación aceptada');
          setState(prev => ({
            ...prev,
            isInstalled: true,
            isInstallable: false,
            userChoice: 'accepted'
          }));
          
          localStorage.setItem('pwa-install-success', 'true');
          localStorage.removeItem('pwa-install-rejected');
          localStorage.removeItem('pwa-install-dismissed');
          localStorage.removeItem('pwa-install-blocked');
          
          return true;
        } else {
          console.log('[PWA] Instalación rechazada');
          dismiss(false);
          return false;
        }
      } else {
        console.log('[PWA] No hay prompt disponible, intentando fallback');
        
        const url = new URL(window.location.href);
        url.searchParams.set('forcePWA', 'true');
        url.searchParams.set('t', Date.now().toString());
        
        window.open(url.toString(), '_blank');
        
        setTimeout(() => {
          alert('Se ha abierto una nueva ventana con opciones de instalación. Si no aparece el popup, usa: Menú del navegador → "Añadir a pantalla de inicio"');
        }, 1000);
        
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error en instalación:', error);
      return false;
    }
  }, [deferredPrompt, dismiss]);

  const reset = useCallback(() => {
    console.log('[PWA] Reseteando estado PWA');
    
    const keys = [
      'pwa-install-success',
      'pwa-install-rejected',
      'pwa-install-dismissed',
      'pwa-install-blocked',
      'pwa-install-attempts',
      'beforeinstallprompt'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    
    initializePWA();
    
    window.dispatchEvent(new Event('beforeinstallprompt'));
  }, [initializePWA]);

  const checkUpdate = useCallback(() => {
    if (registration) {
      registration.update();
      console.log('[PWA] Verificando actualizaciones...');
    }
  }, [registration]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado:', reg);
          setRegistration(reg);
          
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] Nueva versión disponible');
                  setState(prev => ({ ...prev, needsUpdate: true }));
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Error registrando Service Worker:', error);
        });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', () => setState(prev => ({ ...prev, isOffline: false })));
    window.addEventListener('offline', () => setState(prev => ({ ...prev, isOffline: true })));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', () => setState(prev => ({ ...prev, isOffline: false })));
      window.removeEventListener('offline', () => setState(prev => ({ ...prev, isOffline: true })));
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled]);

  useEffect(() => {
    initializePWA();
  }, [initializePWA]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('forcePWA') === 'true') {
      console.log('[PWA] URL con forcePWA, limpiando estados...');
      setTimeout(() => {
        reset();
      }, 1000);
    }
  }, [reset]);

  return {
    state,
    install,
    dismiss,
    reset,
    checkUpdate
  };
};
