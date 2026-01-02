import React, { useEffect, useState, useRef, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Appointment } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, parseISO, subDays, startOfDay, endOfDay, isWithinInterval, getHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportToExcel, exportToPDF, exportToCSV } from '@/lib/utils';
import { useAppointments } from '@/hooks/useAppointments';
import {
  Notification,
  UserOption,
  AdvancedFilters,
  AppointmentConfig,
  ReportFilters,
  AttendanceReport,
  ReportSummary,
  AlertSetting
} from '@/types/appointments';

export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
];

// Modular Components
import { CitasStatsCards } from '@/components/admin/citas/CitasStatsCards';
import { CitasTabsNavigation } from '@/components/admin/citas/CitasTabsNavigation';
import { CitasExportButtons } from '@/components/admin/citas/CitasExportButtons';
import { CitasFilters } from '@/components/admin/citas/CitasFilters';
import { CitasTable } from '@/components/admin/citas/CitasTable';
import { CitasStatsDashboard } from '@/components/admin/citas/CitasStatsDashboard';
import { CitasNotificationsList } from '@/components/admin/citas/CitasNotificationsList';
import { CitasSettings } from '@/components/admin/citas/CitasSettings';
import { CitasModals } from '@/components/admin/citas/CitasModals';

import {
  Calendar, Clock, AlertCircle, TrendingUp, BarChart3, Bell, Settings,
  Download, FileText, FileSpreadsheet, Filter, RefreshCcw, Search,
  User, Trash2, CheckCircle, XCircle, Save, Plus, Minus, Edit3, X,
  Users, Target, Activity, Mail, CalendarDays, Clock3, TrendingDown
} from 'lucide-react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';


export default function AdminCitas() {
  // Use Custom Hook
  const {
    appointments,
    notifications,
    stats,
    users,
    dailyStats,
    peakHours,
    userStats,
    attendanceRate,
    confirmationRate,
    blockedSlots,
    loadAppointments,
    loadNotifications,
    loadUsers,
    calculateStats,
    loadAdvancedStats,
    loadBlockedSlots,
    toggleBlockSlot
  } = useAppointments();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'appointments' | 'notifications' | 'stats' | 'config' | 'availability'>('appointments');
  const [availabilityDate, setAvailabilityDate] = useState<Date>(new Date());
  const [availabilityType, setAvailabilityType] = useState<'sindical' | 'prevencion'>('sindical');

  // Estados para filtros avanzados
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    searchTerm: '',
    selectedUser: null,
    dateRange: undefined,
    timeFilter: 'all',
    showDatePicker: false
  });

  // Estados para configuración
  const [config, setConfig] = useState<AppointmentConfig | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [showAddAdmin, setShowAddAdmin] = useState<boolean>(false);

  // Estados para eliminar citas
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Estados para exportación y reportes
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    period: 'month',
    exportType: 'excel',
    includeCharts: true,
    userReport: false,
    attendanceReport: true,
    notificationReport: true
  });
  const [exporting, setExporting] = useState<boolean>(false);
  const [attendanceReportData, setAttendanceReportData] = useState<AttendanceReport[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);

  const statsRef = useRef<HTMLDivElement>(null);
  const appointmentsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'availability') {
      loadBlockedSlots(availabilityDate, availabilityType);
    }
  }, [activeTab, availabilityDate, availabilityType, loadBlockedSlots]);

  const handleToggleBlockSlot = (time: string) => {
    toggleBlockSlot(time, availabilityDate, availabilityType);
  };

  // Funciones para configuración
  async function loadConfig() {
    setConfigLoading(true);
    const { data } = await supabase.from('appointments_config').select('*').limit(1).single();
    if (data) {
      setConfig(data);
    } else {
      // Crear configuración por defecto
      const defaultConfig: AppointmentConfig = {
        id: 0,
        user_id: 'default',
        reminder_24h: true,
        reminder_2h: true,
        custom_reminder: false,
        preferred_start_time: null,
        preferred_end_time: null,
        preferred_days: [],
        admin_users: [],
        notification_templates: {
          confirmation_subject: 'Confirmación de Cita - UGT TOWA',
          confirmation_body: 'Su cita ha sido confirmada para el {{fecha}} a las {{hora}}.',
          cancellation_subject: 'Cancelación de Cita - UGT TOWA',
          cancellation_body: 'Su cita programada para el {{fecha}} a las {{hora}} ha sido cancelada.',
          reminder_subject: 'Recordatorio de Cita - UGT TOWA',
          reminder_body: 'Le recordamos que tiene una cita programada para el {{fecha}} a las {{hora}}.'
        },
        alert_settings: {
          email_notifications: true,
          browser_notifications: true,
          reminder_notifications: true,
          status_change_notifications: true
        }
      };
      setConfig(defaultConfig);
    }
    setConfigLoading(false);
  }

  async function saveConfig() {
    if (!config) return;

    setConfigLoading(true);
    const { error } = await supabase.from('appointments_config').upsert({
      id: config.id,
      user_id: config.user_id,
      reminder_24h: config.reminder_24h,
      reminder_2h: config.reminder_2h,
      custom_reminder: config.custom_reminder,
      preferred_start_time: config.preferred_start_time,
      preferred_end_time: config.preferred_end_time,
      preferred_days: config.preferred_days,
      admin_users: config.admin_users,
      notification_templates: config.notification_templates,
      alert_settings: config.alert_settings,
      updated_at: new Date().toISOString()
    });

    if (error) {
      toast.error('Error al guardar la configuración');
    } else {
      toast.success('Configuración guardada correctamente');
      loadConfig();
    }
    setConfigLoading(false);
  }

  function updateConfig(field: keyof AppointmentConfig, value: any) {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  }

  function updateNotificationTemplate(templateType: keyof AppointmentConfig['notification_templates'], field: 'subject' | 'body', value: string) {
    if (!config) return;
    const currentTemplate = config.notification_templates[templateType];
    const templateObj = (currentTemplate as any) as { subject: string; body: string };

    setConfig({
      ...config,
      notification_templates: {
        ...config.notification_templates,
        [templateType]: {
          subject: templateObj.subject,
          body: templateObj.body,
          [field]: value
        }
      }
    });
  }

  function updateAlertSetting(setting: keyof AppointmentConfig['alert_settings'], value: boolean) {
    if (!config) return;
    setConfig({
      ...config,
      alert_settings: {
        ...config.alert_settings,
        [setting]: value
      }
    });
  }

  async function addAdminUser() {
    if (!config || !newAdminEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('Por favor, introduce un email válido');
      return;
    }

    if (config.admin_users.includes(newAdminEmail)) {
      toast.error('Este usuario ya es administrador');
      return;
    }

    const updatedAdmins = [...config.admin_users, newAdminEmail];
    updateConfig('admin_users', updatedAdmins);
    setNewAdminEmail('');
    setShowAddAdmin(false);
    toast.success('Administrador añadido');
  }

  function removeAdminUser(email: string) {
    if (!config) return;
    const updatedAdmins = config.admin_users.filter(admin => admin !== email);
    updateConfig('admin_users', updatedAdmins);
    toast.success('Administrador eliminado');
  }

  const daysOfWeek = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  // Funciones de exportación de datos
  const exportNotificationsToExcel = async () => {
    setExporting(true);
    try {
      const data = filteredNotifications.map(notif => ({
        ID: notif.id,
        Tipo: getTypeLabel(notif.type),
        Título: notif.title,
        Mensaje: notif.message,
        Usuario: notif.user_full_name || 'Sin usuario',
        Email: notif.user_email || 'Sin email',
        'Fecha Creación': format(parseISO(notif.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
        Leída: notif.read ? 'Sí' : 'No',
        'Tipo Cita': notif.delegate_type || 'Sin tipo'
      }));

      const filename = `notificaciones_${format(new Date(), 'yyyy-MM-dd')}`;
      exportToExcel(data, filename, 'Notificaciones');
      toast.success('Notificaciones exportadas');
    } catch (error) {
      toast.error('Error al exportar');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const exportAppointmentsToExcel = async () => {
    setExporting(true);
    try {
      const data = filteredAppointments.map(apt => {
        const user = users.find(u => u.id === apt.user_id);
        return {
          ID: apt.id,
          Fecha: format(parseISO(apt.start_time), 'dd/MM/yyyy HH:mm', { locale: es }),
          'Tipo Cita': apt.delegate_type || 'Sin tipo',
          Estado: apt.status,
          Usuario: user?.full_name || 'Sin usuario',
          Email: user?.email || 'Sin email'
        };
      });

      const filename = `citas_${format(new Date(), 'yyyy-MM-dd')}`;
      exportToExcel(data, filename, 'Citas');
      toast.success('Citas exportadas');
    } catch (error) {
      toast.error('Error al exportar');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const internalExportToPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF('stats-dashboard', `reporte_general_${format(new Date(), 'yyyy-MM-dd')}`);
      toast.success('PDF generado correctamente');
    } catch (error) {
      toast.error('Error al generar PDF');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const calculateReportPeriod = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;
    let description = '';

    switch (reportFilters.period) {
      case 'week':
        startDate = subDays(now, 7);
        description = 'Esta Semana';
        break;
      case 'month':
        startDate = subDays(now, 30);
        description = 'Este Mes';
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        description = 'Este Trimestre';
        break;
      case 'year':
        startDate = subDays(now, 365);
        description = 'Este Año';
        break;
      default:
        startDate = subDays(now, 30);
        description = 'Histórico';
    }

    return { startDate, endDate, description };
  };

  const generateAttendanceReport = async () => {
    setExporting(true);
    try {
      const { startDate, endDate, description } = calculateReportPeriod();

      // Consultar citas en el periodo
      const { data: reportAppointments } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          status,
          user_id,
          profiles!appointments_user_id_fkey(id, full_name, email)
        `)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (!reportAppointments) return;

      // Agrupar por usuario
      const reportByUser: { [key: string]: AttendanceReport } = {};

      reportAppointments.forEach((apt: any) => {
        const userId = apt.user_id;
        const profile = apt.profiles && Array.isArray(apt.profiles) && apt.profiles.length > 0 ? apt.profiles[0] : null;
        if (!userId || !profile) return;

        if (!reportByUser[userId]) {
          reportByUser[userId] = {
            user_id: userId,
            user_name: profile.full_name || 'Sin nombre',
            user_email: profile.email || 'Sin email',
            total_appointments: 0,
            completed_appointments: 0,
            cancelled_appointments: 0,
            pending_appointments: 0,
            attendance_rate: 0,
            last_appointment: apt.start_time,
            period_start: startDate.toISOString(),
            period_end: endDate.toISOString()
          };
        }

        const userReport = reportByUser[userId];
        userReport.total_appointments++;

        if (apt.status === 'completed') userReport.completed_appointments++;
        else if (apt.status === 'cancelled') userReport.cancelled_appointments++;
        else if (apt.status === 'pending') userReport.pending_appointments++;

        if (apt.start_time > userReport.last_appointment) {
          userReport.last_appointment = apt.start_time;
        }
      });

      // Calcular tasas
      const finalReport = Object.values(reportByUser).map(user => ({
        ...user,
        attendance_rate: user.total_appointments > 0
          ? Math.round((user.completed_appointments / user.total_appointments) * 100)
          : 0
      }));

      setAttendanceReportData(finalReport);

      // Calcular resumen
      const totalApts = finalReport.reduce((acc, curr) => acc + curr.total_appointments, 0);
      const avgRate = finalReport.length > 0
        ? Math.round(finalReport.reduce((acc, curr) => acc + curr.attendance_rate, 0) / finalReport.length)
        : 0;

      setReportSummary({
        total_appointments: totalApts,
        total_notifications: notifications.length,
        total_users: finalReport.length,
        average_attendance_rate: avgRate,
        top_delegate_type: 'No disponible',
        period_description: description
      });

      toast.success('Reporte generado correctamente');
    } catch (error) {
      toast.error('Error');
    } finally {
      setExporting(false);
    }
  };

  const exportCompleteReport = async () => {
    setExporting(true);
    try {
      const data = appointments.map(apt => {
        const user = users.find(u => u.id === apt.user_id);
        return {
          ID: apt.id,
          Fecha: format(parseISO(apt.start_time), 'dd/MM/yyyy HH:mm', { locale: es }),
          'Tipo Cita': apt.delegate_type || 'Sin tipo',
          Estado: apt.status,
          Usuario: user?.full_name || 'Sin usuario',
          Email: user?.email || 'Sin email'
        };
      });

      const notifData = notifications.map(notif => ({
        ID: notif.id,
        Tipo: getTypeLabel(notif.type),
        Título: notif.title,
        Usuario: notif.user_full_name || 'Sin usuario',
        'Fecha Creación': format(parseISO(notif.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
      }));

      // Usar XLSX directamente si es necesario o un helper que soporte múltiples hojas
      // Por ahora exportamos dos archivos o consolidamos.
      // uisng the centralized exportToExcel helper
      exportToExcel(data, `reporte_completo_${format(new Date(), 'yyyy-MM-dd')}`, 'Citas');
      toast.success('Reporte completo exportado');
    } catch (error) {
      toast.error('Error al exportar reporte completo');
    } finally {
      setExporting(false);
    }
  };

  const alertSettings: AlertSetting[] = [
    { name: 'email_notifications', enabled: config?.alert_settings?.email_notifications || false, description: 'Notificaciones por email' },
    { name: 'browser_notifications', enabled: config?.alert_settings?.browser_notifications || false, description: 'Notificaciones en el navegador' },
    { name: 'reminder_notifications', enabled: config?.alert_settings?.reminder_notifications || false, description: 'Recordatorios de citas' },
    { name: 'status_change_notifications', enabled: config?.alert_settings?.status_change_notifications || false, description: 'Cambios de estado' }
  ];

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) toast.error('Error al actualizar');
    else {
      toast.success('Estado actualizado');
      loadAppointments();
      calculateStats();

      // Crear notificación según el nuevo estado
      const appointment = appointments.find(apt => apt.id === id);
      if (appointment && (status === 'confirmed' || status === 'cancelled')) {
        const notificationType = status === 'confirmed' ? 'confirmation' : 'cancellation';
        await supabase.functions.invoke('send-notifications', {
          body: {
            appointment_id: id,
            type: notificationType,
            delegate_type: appointment.delegate_type
          }
        });
      }
    }
  }

  function confirmDeleteAppointment(id: string) {
    setDeleteAppointmentId(id);
    setShowDeleteModal(true);
  }

  async function deleteAppointment() {
    if (!deleteAppointmentId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', deleteAppointmentId);

      if (error) throw error;

      toast.success('Cita eliminada correctamente');
      setShowDeleteModal(false);
      setDeleteAppointmentId(null);
      loadAppointments();
      loadNotifications();
      calculateStats();
      loadAdvancedStats();
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      toast.error('Error al eliminar la cita');
    } finally {
      setDeleting(false);
    }
  }

  async function markAsRead(id: string) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) toast.error('Error al marcar como leída');
    else {
      toast.success('Notificación marcada como leída');
      loadNotifications();
    }
  }

  async function markAllAsRead() {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
    if (error) toast.error('Error al marcar todas como leídas');
    else {
      toast.success('Todas las notificaciones marcadas como leídas');
      loadNotifications();
    }
  }

  async function deleteNotification(id: string) {
    if (!confirm('¿Eliminar esta notificación?')) return;
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) toast.error('Error al eliminar');
    else {
      toast.success('Notificación eliminada');
      loadNotifications();
    }
  }

  // Funciones para filtros avanzados
  const clearAllFilters = () => {
    setAdvancedFilters({
      searchTerm: '',
      selectedUser: null,
      dateRange: undefined,
      timeFilter: 'all',
      showDatePicker: false
    });
    setFilterType('all');
    setFilterRead('all');
  };

  const updateAdvancedFilters = (updates: Partial<AdvancedFilters>) => {
    setAdvancedFilters(prev => ({ ...prev, ...updates }));
  };

  const filterByTimeOfDay = (date: string, timeFilter: string) => {
    if (timeFilter === 'all') return true;
    const hour = getHours(parseISO(date));
    if (timeFilter === 'morning') return hour >= 8 && hour < 14;
    if (timeFilter === 'afternoon') return hour >= 14 && hour < 20;
    return false;
  };

  const isWithinDateRange = (date: string, dateRange: DateRange | undefined) => {
    if (!dateRange?.from && !dateRange?.to) return true;
    const itemDate = parseISO(date);
    if (dateRange.from && dateRange.to) {
      return isWithinInterval(itemDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    }
    if (dateRange.from) {
      return itemDate >= startOfDay(dateRange.from);
    }
    if (dateRange.to) {
      return itemDate <= endOfDay(dateRange.to);
    }
    return true;
  };

  // Lógica de filtrado mejorada con useMemo
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Filtro por búsqueda de texto
      if (advancedFilters.searchTerm) {
        const searchLower = advancedFilters.searchTerm.toLowerCase();
        const matchesSearch =
          appointment.delegate_type?.toLowerCase().includes(searchLower) ||
          appointment.status.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por usuario (requiere user_id en appointments)
      if (advancedFilters.selectedUser) {
        if (appointment.user_id !== advancedFilters.selectedUser.id) return false;
      }

      // Filtro por rango de fechas
      if (!isWithinDateRange(appointment.start_time, advancedFilters.dateRange)) {
        return false;
      }

      // Filtro por horario
      if (!filterByTimeOfDay(appointment.start_time, advancedFilters.timeFilter)) {
        return false;
      }

      return true;
    });
  }, [appointments, advancedFilters]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filtros básicos existentes
      if (filterType !== 'all' && notification.type !== filterType) return false;
      if (filterRead === 'unread' && notification.read) return false;
      if (filterRead === 'read' && !notification.read) return false;

      // Filtro por búsqueda de texto
      if (advancedFilters.searchTerm) {
        const searchLower = advancedFilters.searchTerm.toLowerCase();
        const matchesSearch =
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower) ||
          (notification.user_full_name?.toLowerCase().includes(searchLower)) ||
          (notification.user_email?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Filtro por usuario
      if (advancedFilters.selectedUser) {
        const matchesUser =
          notification.user_full_name === advancedFilters.selectedUser.full_name ||
          notification.user_email === advancedFilters.selectedUser.email;
        if (!matchesUser) return false;
      }

      // Filtro por rango de fechas
      if (!isWithinDateRange(notification.created_at, advancedFilters.dateRange)) {
        return false;
      }

      // Filtro por horario de la cita (si existe)
      if (notification.appointment_time && !filterByTimeOfDay(notification.appointment_time, advancedFilters.timeFilter)) {
        return false;
      }

      return true;
    });
  }, [notifications, filterType, filterRead, advancedFilters]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder': return 'bg-yellow-100 text-yellow-800';
      case 'confirmation': return 'bg-green-100 text-green-800';
      case 'cancellation': return 'bg-red-100 text-red-800';
      case 'delegate_notification': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'reminder': return 'Recordatorio';
      case 'confirmation': return 'Confirmación';
      case 'cancellation': return 'Cancelación';
      case 'delegate_notification': return 'Nueva Cita';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Citas</h1>
            <p className="text-gray-500 mt-1">Administra citas, estadísticas y notificaciones</p>
          </div>
          <CitasExportButtons
            exporting={exporting}
            setShowExportModal={setShowExportModal}
            exportToPDF={internalExportToPDF}
            exportCompleteReport={exportCompleteReport}
          />
        </header>

        <CitasStatsCards stats={stats} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <CitasTabsNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadCount={unreadCount}
          />

          <div className="p-6">
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <CitasFilters
                  advancedFilters={advancedFilters}
                  updateAdvancedFilters={updateAdvancedFilters}
                  clearAllFilters={clearAllFilters}
                  users={users}
                />
                <CitasTable
                  appointments={appointments}
                  filteredAppointments={filteredAppointments}
                  updateStatus={updateStatus}
                  confirmDeleteAppointment={confirmDeleteAppointment}
                />
              </div>
            )}

            {activeTab === 'stats' && (
              <CitasStatsDashboard
                statsRef={statsRef}
                attendanceRate={attendanceRate}
                confirmationRate={confirmationRate}
                dailyStats={dailyStats}
                peakHours={peakHours}
                userStats={userStats}
                attendanceReportData={attendanceReportData}
                reportSummary={reportSummary}
                exporting={exporting}
                generateAttendanceReport={generateAttendanceReport}
                exportToExcel={exportToExcel}
              />
            )}

            {activeTab === 'notifications' && (
              <CitasNotificationsList
                notifications={filteredNotifications}
                filterType={filterType}
                setFilterType={setFilterType}
                filterRead={filterRead}
                setFilterRead={setFilterRead}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onMarkAllAsRead={markAllAsRead}
                getTypeColor={getTypeColor}
                exportToExcel={exportNotificationsToExcel}
              />
            )}

            {activeTab === 'config' && (
              <CitasSettings
                config={config}
                configLoading={configLoading}
                updateConfig={updateConfig}
                showAddAdmin={showAddAdmin}
                setShowAddAdmin={setShowAddAdmin}
                newAdminEmail={newAdminEmail}
                setNewAdminEmail={setNewAdminEmail}
                addAdminUser={addAdminUser}
                removeAdminUser={removeAdminUser}
                editingTemplate={editingTemplate}
                setEditingTemplate={setEditingTemplate}
                updateNotificationTemplate={updateNotificationTemplate}
                updateAlertSetting={updateAlertSetting}
                saveConfig={saveConfig}
              />
            )}

            {activeTab === 'availability' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center flex flex-col items-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Seleccionar Día</h3>
                    <DayPicker
                      mode="single"
                      selected={availabilityDate}
                      onSelect={(day) => day && setAvailabilityDate(day)}
                      locale={es}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">Horarios del {format(availabilityDate, "d 'de' MMMM", { locale: es })}</h3>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                          onClick={() => setAvailabilityType('sindical')}
                          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${availabilityType === 'sindical' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
                        >
                          Sindical
                        </button>
                        <button
                          onClick={() => setAvailabilityType('prevencion')}
                          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${availabilityType === 'prevencion' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
                        >
                          Prevención
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map(time => {
                        const isBlocked = blockedSlots.some(s => s.start_time.includes(time));
                        return (
                          <button
                            key={time}
                            onClick={() => handleToggleBlockSlot(time)}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isBlocked
                              ? 'border-red-100 bg-red-50 text-red-600'
                              : 'border-gray-100 bg-white hover:border-red-200 text-gray-700'
                              }`}
                          >
                            <span className="font-black text-lg">{time}</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest">
                              {isBlocked ? 'Bloqueado' : 'Disponible'}
                            </span>
                            {isBlocked ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        <strong>Nota:</strong> Haz clic en un horario para alternar entre disponible y bloqueado. Los horarios bloqueados no aparecerán como opción para los compañeros en la página de reservas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CitasModals
        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
        reportFilters={reportFilters}
        setReportFilters={setReportFilters}
        exportToPDF={internalExportToPDF}
        exportCompleteReport={exportCompleteReport}
        exportToCSV={exportToCSV}
        exporting={exporting}
        filteredNotifications={filteredNotifications}
        filteredAppointments={filteredAppointments}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        setDeleteAppointmentId={setDeleteAppointmentId}
        deleteAppointment={deleteAppointment}
        deleting={deleting}
      />
      <Footer />
    </div>
  );
}

