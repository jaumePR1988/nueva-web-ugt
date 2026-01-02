import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    NotificationLogo,
    NotificationPreference,
    PushNotificationHistory,
    NotificationStats
} from '@/types/admin-notifications';

export function useAdminNotifications() {
    // Estados para notificación manual
    const [isSending, setIsSending] = useState(false);
    const [stats, setStats] = useState<NotificationStats>({
        totalSubscriptions: 0,
        lastSent: null
    });

    // Estados para gestión de logos
    const [logos, setLogos] = useState<NotificationLogo[]>([]);
    const [activeLogo, setActiveLogo] = useState<NotificationLogo | null>(null);
    const [isLoadingLogos, setIsLoadingLogos] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Estados para configuración automática
    const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
    const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);

    // Estados para historial
    const [history, setHistory] = useState<PushNotificationHistory[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Carga inicial
    useEffect(() => {
        loadStats();
        loadLogos();
    }, []);

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

    const updatePreference = (index: number, field: keyof NotificationPreference, value: any) => {
        setPreferences(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleLogoUpload = async (file: File, name: string) => {
        if (!file || !name.trim()) return;

        setIsUploading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', name.trim());

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
                await loadLogos();
                return true;
            } else {
                throw new Error(result.error || 'Error al subir logo');
            }
        } catch (error: any) {
            console.error('Error subiendo logo:', error);
            toast.error(error.message || 'Error al subir logo');
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const handleActivateLogo = async (logoId: string) => {
        try {
            await supabase
                .from('notification_logos')
                .update({ is_active: false })
                .neq('id', '00000000-0000-0000-0000-000000000000');

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
        try {
            const fileName = logoUrl.split('/').pop();
            if (fileName) {
                await supabase.storage
                    .from('notification-logos')
                    .remove([fileName]);
            }

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

    const handleSendToAll = async (title: string, message: string, url: string) => {
        setIsSending(true);
        try {
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
                setStats(prev => ({
                    ...prev,
                    lastSent: new Date().toISOString()
                }));
                return true;
            } else {
                throw new Error(result.error || 'Error al enviar notificación');
            }
        } catch (error: any) {
            console.error('Error enviando notificación:', error);
            toast.error(error.message || 'Error al enviar notificación');
            return false;
        } finally {
            setIsSending(false);
        }
    };

    return {
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
        loadStats
    };
}
