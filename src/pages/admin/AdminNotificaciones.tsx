import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Bell, Send, TestTube, Check, X, Smartphone, Upload, Image as ImageIcon, History, Settings, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';

export default function AdminNotificaciones() {
  const navigate = useNavigate();

  // Custom Hook
  const {
    // State
    stats,
    isSending,
    logos,
    activeLogo,
    isLoadingLogos,
    isUploading,
    preferences,
    isLoadingPreferences,
    isSavingPreferences,
    history,
    isLoadingHistory,

    // Actions
    loadPreferences,
    savePreferences,
    updatePreference,
    loadHistory,
    handleLogoUpload,
    handleActivateLogo,
    handleDeleteLogo,
    handleSendToAll,
  } = useAdminNotifications();

  // Estados UI locales (formularios)
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('/');

  // Estados UI visuales
  const [activeTab, setActiveTab] = useState<'manual' | 'auto' | 'history'>('manual');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState('');
  const [showLogoManagement, setShowLogoManagement] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'success' | 'error'>('all');

  useEffect(() => {
    if (activeTab === 'auto') {
      loadPreferences();
    } else if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('svg')) {
      toast.error('Solo se permiten archivos PNG o SVG');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('El archivo debe ser menor a 1MB');
      return;
    }

    setSelectedFile(file);
    setLogoName(file.name.replace(/\.(png|svg)$/i, ''));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onUploadClick = async () => {
    if (!selectedFile || !logoName.trim()) {
      toast.error('Por favor selecciona un archivo y proporciona un nombre');
      return;
    }

    const success = await handleLogoUpload(selectedFile, logoName);
    if (success) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setLogoName('');
    }
  };

  const onSendClick = async () => {
    if (!title || !message) {
      toast.error('Por favor completa título y mensaje');
      return;
    }
    const success = await handleSendToAll(title, message, url);
    if (success) {
      setTitle('');
      setMessage('');
      setUrl('/');
    }
  };

  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      toast.error('Este navegador no soporta notificaciones');
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(title || 'UGT Towa - Prueba', {
          body: message || 'Esta es una notificación de prueba',
          icon: '/ugt-towa-icon-192.png',
          badge: '/ugt-towa-icon-96.png',
          tag: 'test-notification',
          requireInteraction: false,
          actions: [
            {
              action: 'view',
              title: 'Ver ahora'
            }
          ]
        } as any);

        toast.success('Notificación de prueba enviada');
      }
    } else {
      toast.error('Permiso de notificaciones denegado');
    }
  };

  const predefinedMessages = [
    {
      title: 'Nuevo Comunicado Urgente',
      message: 'Se ha publicado un nuevo comunicado importante. Consúltalo ahora.',
      url: '/comunicados'
    },
    {
      title: 'Encuesta Activa',
      message: 'Nueva encuesta disponible. Tu opinión es importante.',
      url: '/encuestas'
    },
    {
      title: 'Recordatorio de Cita',
      message: 'Tienes una cita pendiente con los delegados sindicales.',
      url: '/citas'
    },
    {
      title: 'Actualización de Beneficios',
      message: 'Nuevos beneficios disponibles para afiliados.',
      url: '/afiliados/beneficios'
    }
  ];

  const loadPredefined = (msg: typeof predefinedMessages[0]) => {
    setTitle(msg.title);
    setMessage(msg.message);
    setUrl(msg.url);
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: { [key: string]: string } = {
      'appointment_created': 'Cita Creada',
      'appointment_cancelled': 'Cita Cancelada',
      'appointment_updated': 'Cita Modificada',
      'appointment_status_changed': 'Estado Cambiado',
      'manual': 'Envío Manual'
    };
    return labels[eventType] || eventType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredHistory = history.filter(item =>
    historyFilter === 'all' || item.status === historyFilter
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header con navegación por pestañas */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-red-600 hover:text-red-700 mb-4 flex items-center gap-2"
          >
            ← Volver al Dashboard
          </button>

          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sistema de Notificaciones Push
            </h1>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Gestiona notificaciones automáticas y manuales para administradores
          </p>

          {/* Navegación por pestañas */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'manual'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Send className="w-4 h-4" />
                Manual
              </button>
              <button
                onClick={() => setActiveTab('auto')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'auto'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Settings className="w-4 h-4" />
                Configuración Automática
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <History className="w-4 h-4" />
                Historial
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido dinámico basado en la pestaña activa */}
        {activeTab === 'manual' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Formulario de envío */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Nueva Notificación
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Nuevo Comunicado Urgente"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {title.length}/50 caracteres
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mensaje
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe el contenido de la notificación..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {message.length}/200 caracteres
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL de destino (opcional)
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="/comunicados"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Página a la que se redirigirá al hacer clic
                    </p>
                  </div>

                  {/* Vista previa */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Vista previa:
                      </p>
                      <button
                        onClick={() => setShowLogoManagement(!showLogoManagement)}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        {showLogoManagement ? 'Ocultar' : 'Gestionar'} logos
                      </button>
                    </div>
                    <div className="flex gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <img
                        src={activeLogo?.url || '/ugt-towa-icon-96.png'}
                        alt="Icon"
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {title || 'Título de la notificación'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
                          {message || 'Mensaje de la notificación'}
                        </p>
                      </div>
                    </div>
                    {activeLogo && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Logo activo: {activeLogo.name}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleTestNotification}
                      className="flex items-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      <TestTube className="w-4 h-4" />
                      Enviar Prueba
                    </button>

                    <button
                      onClick={onSendClick}
                      disabled={isSending || !title || !message}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar a Todos
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Información importante */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Información Importante
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Solo recibirán notificaciones los usuarios que tengan la PWA instalada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Los usuarios deben haber aceptado los permisos de notificaciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Las notificaciones funcionan incluso cuando la app está cerrada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                    <span>No abuses de las notificaciones para no molestar a los usuarios</span>
                  </li>
                </ul>
              </div>

              {/* Gestión de logos */}
              {showLogoManagement && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-red-600" />
                    Gestión de Logos de Notificaciones
                  </h2>

                  {/* Subir nuevo logo */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Subir Nuevo Logo
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre del logo
                        </label>
                        <input
                          type="text"
                          value={logoName}
                          onChange={(e) => setLogoName(e.target.value)}
                          placeholder="Ej: Logo Navidad 2025"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Archivo de imagen
                        </label>
                        <input
                          type="file"
                          accept=".png,.svg"
                          onChange={handleFileSelect}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Formato: PNG o SVG | Tamaño máximo: 1MB | Recomendado: 512x512px
                        </p>
                      </div>

                      {previewUrl && (
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Vista previa:
                            </p>
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                            />
                          </div>
                          <div className="flex-1">
                            <button
                              onClick={onUploadClick}
                              disabled={isUploading}
                              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              {isUploading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Subir Logo
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista de logos */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Logos Disponibles ({logos.length})
                    </h3>

                    {isLoadingLogos ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
                      </div>
                    ) : logos.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No hay logos subidos. Sube el primer logo para personalizar las notificaciones.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {logos.map((logo) => (
                          <div
                            key={logo.id}
                            className={`border rounded-lg p-4 ${logo.is_active
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                              }`}
                          >
                            <div className="flex gap-4">
                              <img
                                src={logo.url}
                                alt={logo.name}
                                className="w-16 h-16 rounded object-cover border border-gray-200 dark:border-gray-600"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {logo.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {(logo.file_size / 1024).toFixed(1)} KB
                                  </span>
                                  {logo.is_active && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Activo
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              {!logo.is_active && (
                                <button
                                  onClick={() => handleActivateLogo(logo.id)}
                                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                                >
                                  Activar
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteLogo(logo.id, logo.url)}
                                className="text-red-500 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Eliminar logo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Panel lateral: Plantillas y Estadísticas */}
            <div className="space-y-6">
              {/* Estadísticas rápidas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-600" />
                  Estadísticas
                </h3>
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-1">Total Suscripciones</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.totalSubscriptions}
                    </p>
                  </div>
                  {stats.lastSent && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Último Envío</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(stats.lastSent).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(stats.lastSent).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Plantillas rápidas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-purple-600" />
                  Mensajes Predefinidos
                </h3>
                <div className="space-y-2">
                  {predefinedMessages.map((msg, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadPredefined(msg)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 group"
                    >
                      <p className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-red-600 transition-colors">
                        {msg.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {msg.message}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Configuración Automática */}
        {activeTab === 'auto' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Reglas de Notificación Automática
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Configura qué eventos disparan notificaciones push a los usuarios
                  </p>
                </div>
                <button
                  onClick={savePreferences}
                  disabled={isSavingPreferences}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingPreferences ? (
                    'Guardando...'
                  ) : (
                    <>
                      <Settings className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>

              {isLoadingPreferences ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent mx-auto" />
                  <p className="mt-4 text-gray-500">Cargando preferencias...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {preferences.map((pref, index) => (
                    <div key={pref.event_type} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${pref.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                              {getEventTypeLabel(pref.event_type)}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Evento: {pref.event_type}
                            </p>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={pref.enabled}
                            onChange={(e) => updatePreference(index, 'enabled', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      {pref.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12 animate-fadeIn">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Plantilla de Título
                            </label>
                            <input
                              type="text"
                              value={pref.title_template}
                              onChange={(e) => updatePreference(index, 'title_template', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Plantilla de Mensaje
                            </label>
                            <input
                              type="text"
                              value={pref.message_template}
                              onChange={(e) => updatePreference(index, 'message_template', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pestaña: Historial */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Historial de Envíos
              </h2>

              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${historyFilter === 'all'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setHistoryFilter('success')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${historyFilter === 'success'
                    ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  Exitosos
                </button>
                <button
                  onClick={() => setHistoryFilter('error')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${historyFilter === 'error'
                    ? 'bg-white dark:bg-gray-600 text-red-600 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  Errores
                </button>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent mx-auto" />
                <p className="mt-4 text-gray-500">Cargando historial...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No hay notificaciones registradas con los filtros actuales</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Evento</th>
                      <th className="px-6 py-3">Título / Mensaje</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Enviados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            {getEventTypeLabel(item.event_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {item.message}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                            {item.status === 'success' ? 'Enviado' : 'Error'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {item.sent_count} usuarios
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
