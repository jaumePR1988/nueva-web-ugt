import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Bell, Send, TestTube, Check, X, Smartphone, Upload, Image as ImageIcon, Trash2, CheckCircle, Settings, History, Calendar, Mail, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, NotificationPreference, PushNotificationHistory } from '@/lib/supabase';

interface NotificationLogo {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
  uploaded_by: string;
  file_size: number;
  format: string;
}

export default function AdminNotificaciones() {
  const navigate = useNavigate();
  
  // Estados existentes para notificaciones manuales
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('/');
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    lastSent: null as string | null
  });

  // Estados existentes para gestión de logos
  const [logos, setLogos] = useState<NotificationLogo[]>([]);
  const [activeLogo, setActiveLogo] = useState<NotificationLogo | null>(null);
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showLogoManagement, setShowLogoManagement] = useState(false);

  // Estados para pestañas
  const [activeTab, setActiveTab] = useState<'manual' | 'auto' | 'history'>('manual');

  // Estados para configuración automática
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Estados para historial
  const [history, setHistory] = useState<PushNotificationHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'success' | 'error'>('all');

  useEffect(() => {
    loadStats();
    loadLogos();
    if (activeTab === 'auto') {
      loadPreferences();
    } else if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Función para cargar preferencias de notificaciones automáticas
  const loadPreferences = async () => {
    try {
      setIsLoadingPreferences(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_notification_preferences')
        .select('*')
        .eq('admin_id', user.id);

      if (error) throw error;

      // Si no hay preferencias, crear valores por defecto
      if (!data || data.length === 0) {
        const defaultPreferences = [
          {
            admin_id: user.id,
            event_type: 'appointment_created',
            enabled: true,
            title_template: 'Nueva Cita Creada',
            message_template: 'Nueva cita de {user_name} para {appointment_type} el {date} a las {time}'
          },
          {
            admin_id: user.id,
            event_type: 'appointment_cancelled',
            enabled: true,
            title_template: 'Cita Cancelada',
            message_template: 'Cita de {user_name} cancelada del {date} a las {time} - {appointment_type}'
          },
          {
            admin_id: user.id,
            event_type: 'appointment_updated',
            enabled: true,
            title_template: 'Cita Modificada',
            message_template: 'Cita de {user_name} modificada para {appointment_type} el {date} a las {time}'
          },
          {
            admin_id: user.id,
            event_type: 'appointment_status_changed',
            enabled: false,
            title_template: 'Estado de Cita Actualizado',
            message_template: 'Cita de {user_name} cambió a estado: {status}'
          }
        ];

        const { data: insertedData, error: insertError } = await supabase
          .from('admin_notification_preferences')
          .insert(defaultPreferences)
          .select();

        if (insertError) throw insertError;
        setPreferences(insertedData || []);
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error cargando preferencias:', error);
      toast.error('Error al cargar preferencias de notificaciones');
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Función para cargar historial de notificaciones
  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('push_notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error('Error al cargar historial de notificaciones');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Función para guardar preferencias
  const savePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      const { error } = await supabase
        .from('admin_notification_preferences')
        .upsert(preferences, { 
          onConflict: 'admin_id,event_type' 
        });

      if (error) throw error;
      toast.success('Preferencias guardadas correctamente');
    } catch (error) {
      console.error('Error guardando preferencias:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Función para actualizar una preferencia específica
  const updatePreference = (index: number, field: keyof NotificationPreference, value: any) => {
    setPreferences(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const loadLogos = async () => {
    try {
      setIsLoadingLogos(true);
      const { data, error } = await supabase
        .from('notification_logos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLogos(data || []);
      const active = data?.find(logo => logo.is_active);
      setActiveLogo(active || null);
    } catch (error) {
      console.error('Error cargando logos:', error);
      toast.error('Error al cargar logos');
    } finally {
      setIsLoadingLogos(false);
    }
  };

  const loadStats = async () => {
    try {
      const { count } = await supabase
        .from('push_subscriptions')
        .select('id', { count: 'exact', head: true });
      
      setStats(prev => ({
        ...prev,
        totalSubscriptions: count || 0
      }));
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.includes('png') && !file.type.includes('svg')) {
      toast.error('Solo se permiten archivos PNG o SVG');
      return;
    }

    // Validar tamaño (1MB máximo)
    if (file.size > 1024 * 1024) {
      toast.error('El archivo debe ser menor a 1MB');
      return;
    }

    setSelectedFile(file);
    setLogoName(file.name.replace(/\.(png|svg)$/i, ''));

    // Crear vista previa
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!selectedFile || !logoName.trim()) {
      toast.error('Por favor selecciona un archivo y proporciona un nombre');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', logoName.trim());

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-notification-logo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: formData
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success('Logo subido exitosamente');
        setSelectedFile(null);
        setPreviewUrl(null);
        setLogoName('');
        await loadLogos();
      } else {
        throw new Error(result.error || 'Error al subir logo');
      }
    } catch (error: any) {
      console.error('Error subiendo logo:', error);
      toast.error(error.message || 'Error al subir logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleActivateLogo = async (logoId: string) => {
    try {
      // Primero desactivar todos los logos
      await supabase
        .from('notification_logos')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Activar el logo seleccionado
      const { error } = await supabase
        .from('notification_logos')
        .update({ is_active: true })
        .eq('id', logoId);

      if (error) throw error;

      toast.success('Logo activado correctamente');
      await loadLogos();
    } catch (error) {
      console.error('Error activando logo:', error);
      toast.error('Error al activar logo');
    }
  };

  const handleDeleteLogo = async (logoId: string, logoUrl: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este logo?')) {
      return;
    }

    try {
      // Eliminar archivo del storage
      const fileName = logoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('notification-logos')
          .remove([fileName]);
      }

      // Eliminar registro de la base de datos
      const { error } = await supabase
        .from('notification_logos')
        .delete()
        .eq('id', logoId);

      if (error) throw error;

      toast.success('Logo eliminado correctamente');
      await loadLogos();
    } catch (error) {
      console.error('Error eliminando logo:', error);
      toast.error('Error al eliminar logo');
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

  const handleSendToAll = async () => {
    if (!title || !message) {
      toast.error('Por favor completa título y mensaje');
      return;
    }

    setIsSending(true);
    try {
      // Llamar a la edge function para envío real
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ title, message, url })
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || `Notificación enviada a ${result.sent} usuarios`);
        setTitle('');
        setMessage('');
        setUrl('/');
        setStats(prev => ({
          ...prev,
          lastSent: new Date().toISOString()
        }));
      } else {
        throw new Error(result.error || 'Error al enviar notificación');
      }
    } catch (error: any) {
      console.error('Error enviando notificación:', error);
      toast.error(error.message || 'Error al enviar notificación');
    } finally {
      setIsSending(false);
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

  // Funciones auxiliares para el historial
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
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'manual'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Send className="w-4 h-4" />
                Manual
              </button>
              <button
                onClick={() => setActiveTab('auto')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'auto'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4" />
                Configuración Automática
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
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
                    onClick={handleSendToAll}
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
                            onClick={handleLogoUpload}
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
                          className={`border rounded-lg p-4 ${
                            logo.is_active
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex gap-4">
                            <img
                              src={logo.url}
                              alt={logo.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {logo.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {logo.format ? logo.format.toUpperCase() : 'N/A'} • {logo.file_size ? (logo.file_size / 1024).toFixed(0) : '0'} KB
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {logo.created_at ? new Date(logo.created_at).toLocaleDateString('es-ES') : 'N/A'}
                                  </p>
                                </div>
                                {logo.is_active && (
                                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded">
                                    <CheckCircle className="w-3 h-3" />
                                    Activo
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex gap-2 mt-2">
                                {!logo.is_active && (
                                  <button
                                    onClick={() => handleActivateLogo(logo.id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Activar
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteLogo(logo.id, logo.url)}
                                  className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mensajes predefinidos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Mensajes Predefinidos
              </h3>
              <div className="space-y-2">
                {predefinedMessages.map((msg, index) => (
                  <button
                    key={index}
                    onClick={() => loadPredefined(msg)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {msg.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {msg.message}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Estadísticas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Usuarios suscritos:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.totalSubscriptions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Con permisos:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.totalSubscriptions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Último envío:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {stats.lastSent 
                      ? new Date(stats.lastSent).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'
                    }
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                {stats.totalSubscriptions > 0
                  ? 'Sistema de notificaciones activo y operativo'
                  : 'Aún no hay usuarios suscritos. Instala la PWA para recibir notificaciones.'}
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Pestaña de Configuración Automática */}
        {activeTab === 'auto' && (
          <div className="space-y-6">
            {/* Información del sistema */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración de Notificaciones Automáticas
              </h3>
              <p className="text-blue-800 dark:text-blue-300 text-sm mb-3">
                El sistema enviará notificaciones push automáticamente cuando ocurran los siguientes eventos de citas.
              </p>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Variables disponibles:</strong> {'{user_name}'}, {'{appointment_type}'}, {'{date}'}, {'{time}'}, {'{status}'}
                </p>
              </div>
            </div>

            {isLoadingPreferences ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-4">
                {preferences.map((preference, index) => (
                  <div key={`${preference.admin_id}-${preference.event_type}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${preference.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {getEventTypeLabel(preference.event_type)}
                        </h4>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preference.enabled}
                          onChange={(e) => updatePreference(index, 'enabled', e.target.checked)}
                          className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {preference.enabled ? 'Activado' : 'Desactivado'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Título de la notificación
                        </label>
                        <input
                          type="text"
                          value={preference.title_template || ''}
                          onChange={(e) => updatePreference(index, 'title_template', e.target.value)}
                          placeholder="Ej: Nueva Cita Creada"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          disabled={!preference.enabled}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Mensaje de la notificación
                        </label>
                        <textarea
                          value={preference.message_template || ''}
                          onChange={(e) => updatePreference(index, 'message_template', e.target.value)}
                          placeholder="Ej: Nueva cita de {user_name} para {appointment_type}"
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                          disabled={!preference.enabled}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Botón guardar */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={savePreferences}
                    disabled={isSavingPreferences}
                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSavingPreferences ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Guardar Configuración
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pestaña de Historial */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filtros del historial */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-6 h-6 text-red-600" />
                Historial de Notificaciones ({filteredHistory.length})
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Filtrar:</span>
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value as 'all' | 'success' | 'error')}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">Todas</option>
                  <option value="success">Exitosas</option>
                  <option value="error">Con Error</option>
                </select>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay notificaciones en el historial
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {historyFilter === 'all' 
                    ? 'Aún no se han enviado notificaciones push'
                    : `No hay notificaciones ${historyFilter === 'success' ? 'exitosas' : 'con error'}`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                            {item.status === 'success' ? 'Enviada' : 'Error'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {getEventTypeLabel(item.event_type)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                          {item.message}
                        </p>
                        {item.error_message && (
                          <p className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            Error: {item.error_message}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString('es-ES')}
                        </div>
                        <div>
                          {new Date(item.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {item.recipients_count !== null && (
                          <div className="flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" />
                            {item.recipients_count} usuarios
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
