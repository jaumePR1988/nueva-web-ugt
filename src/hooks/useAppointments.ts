import { useState, useEffect } from 'react';
import { supabase, Appointment } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, parseISO, subDays, eachDayOfInterval, getHours } from 'date-fns';
import {
    Notification,
    AppointmentStats,
    UserOption,
    DailyStats,
    PeakHours,
    UserStats,
    AttendanceRate,
    ConfirmationRate
} from '@/types/appointments';

export function useAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<AppointmentStats>({ today: 0, upcoming: 0, pending: 0, completed: 0 });
    const [users, setUsers] = useState<UserOption[]>([]);

    // Advanced Stats State
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [peakHours, setPeakHours] = useState<PeakHours[]>([]);
    const [userStats, setUserStats] = useState<UserStats[]>([]);
    const [attendanceRate, setAttendanceRate] = useState<AttendanceRate>({ completed: 0, total: 0, percentage: 0 });
    const [confirmationRate, setConfirmationRate] = useState<ConfirmationRate>({ confirmed: 0, pending: 0, percentage: 0 });

    // Blocked Slots State
    const [blockedSlots, setBlockedSlots] = useState<any[]>([]);

    useEffect(() => {
        loadAppointments();
        loadNotifications();
        loadUsers();
        calculateStats();
        loadAdvancedStats();

        // Real-time subscription
        const notificationsSubscription = supabase
            .channel('notifications_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                loadNotifications();
            })
            .subscribe();

        return () => {
            notificationsSubscription.unsubscribe();
        };
    }, []);

    async function loadAppointments() {
        const { data } = await supabase
            .from('appointments')
            .select('*, user:profiles(id, full_name, email)')
            .order('start_time');
        if (data) setAppointments(data as any);
    }

    async function loadNotifications() {
        const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (data) setNotifications(data);
    }

    async function loadUsers() {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .order('full_name');
        if (data) {
            setUsers(data.map(user => ({
                id: user.id,
                full_name: user.full_name || 'Sin nombre',
                email: user.email
            })));
        }
    }

    async function calculateStats() {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));

        // Citas hoy
        const { count: todayCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .gte('start_time', todayStart.toISOString())
            .lte('start_time', todayEnd.toISOString());

        // Citas próximas (próximos 7 días)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const { count: upcomingCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .gte('start_time', new Date().toISOString())
            .lte('start_time', nextWeek.toISOString());

        // Citas pendientes
        const { count: pendingCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // Citas completadas
        const { count: completedCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        setStats({
            today: todayCount || 0,
            upcoming: upcomingCount || 0,
            pending: pendingCount || 0,
            completed: completedCount || 0
        });
    }

    async function loadAdvancedStats() {
        // Cargar estadísticas de los últimos 30 días
        const thirtyDaysAgo = subDays(new Date(), 30);
        const today = new Date();

        const { data: allAppointmentsWithProfiles } = await supabase
            .from('appointments')
            .select(`
        start_time, 
        status, 
        user_id,
        profiles!appointments_user_id_fkey(full_name, email)
      `)
            .gte('start_time', thirtyDaysAgo.toISOString())
            .lte('start_time', today.toISOString());

        if (allAppointmentsWithProfiles) {
            // Generar datos para gráfico de líneas
            const dateInterval = eachDayOfInterval({
                start: thirtyDaysAgo,
                end: today
            });

            const dailyData: DailyStats[] = dateInterval.map(date => {
                const dateString = format(date, 'yyyy-MM-dd');
                const dayAppointments = allAppointmentsWithProfiles.filter(apt =>
                    format(parseISO(apt.start_time), 'yyyy-MM-dd') === dateString
                );

                return {
                    date: format(date, 'dd/MM'),
                    appointments: dayAppointments.length
                };
            });

            setDailyStats(dailyData);

            // Generar datos para horarios pico
            const hoursCount: { [key: number]: number } = {};
            allAppointmentsWithProfiles.forEach(apt => {
                const hour = getHours(parseISO(apt.start_time));
                hoursCount[hour] = (hoursCount[hour] || 0) + 1;
            });

            const peakHoursData: PeakHours[] = [];
            for (let hour = 8; hour <= 20; hour++) {
                peakHoursData.push({
                    hour,
                    count: hoursCount[hour] || 0
                });
            }
            setPeakHours(peakHoursData);

            // Calcular usuarios más activos
            const userCounts: { [key: string]: { count: number; name: string; email: string; lastAppointment: string } } = {};

            allAppointmentsWithProfiles.forEach((apt: any) => {
                const userId = apt.user_id;
                const profile = apt.profiles;

                if (userId && profile && Array.isArray(profile) && profile.length > 0) {
                    const profileData = profile[0];
                    if (!userCounts[userId]) {
                        userCounts[userId] = {
                            count: 0,
                            name: profileData.full_name || 'Sin nombre',
                            email: profileData.email,
                            lastAppointment: apt.start_time
                        };
                    }
                    userCounts[userId].count++;
                    if (apt.start_time > userCounts[userId].lastAppointment) {
                        userCounts[userId].lastAppointment = apt.start_time;
                    }
                }
            });

            const topUsers: UserStats[] = Object.entries(userCounts)
                .map(([id, data]) => ({
                    id,
                    full_name: data.name,
                    email: data.email,
                    appointment_count: data.count,
                    last_appointment: data.lastAppointment
                }))
                .sort((a, b) => b.appointment_count - a.appointment_count)
                .slice(0, 5);

            setUserStats(topUsers);

            // Calcular porcentajes
            const { count: completedCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed');

            const { count: totalCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true });

            const completed = completedCount || 0;
            const total = totalCount || 0;
            const attendancePercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            setAttendanceRate({
                completed,
                total,
                percentage: attendancePercentage
            });

            const { count: confirmedCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed');

            const { count: pendingCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const confirmed = confirmedCount || 0;
            const pending = pendingCount || 0;
            const confirmationPercentage = (confirmed + pending) > 0 ? Math.round((confirmed / (confirmed + pending)) * 100) : 0;

            setConfirmationRate({
                confirmed,
                pending,
                percentage: confirmationPercentage
            });
        }
    }

    async function loadBlockedSlots(date: Date, type: string) {
        const dateStr = format(date, 'yyyy-MM-dd');
        const { data } = await supabase
            .from('appointment_slots')
            .select('*')
            .eq('appointment_date', dateStr)
            .eq('delegate_type', type)
            .eq('status', 'blocked');
        if (data) setBlockedSlots(data);
        else setBlockedSlots([]);
    }

    async function toggleBlockSlot(time: string, date: Date, type: string) {
        const dateStr = format(date, 'yyyy-MM-dd');
        const existing = blockedSlots.find(s => s.start_time.includes(time));

        if (existing) {
            const { error } = await supabase
                .from('appointment_slots')
                .delete()
                .eq('id', existing.id);

            if (!error) {
                toast.success(`Hueco ${time} desbloqueado`);
                loadBlockedSlots(date, type);
            }
        } else {
            const startIso = `${dateStr}T${time}:00`;
            const endHour = parseInt(time.split(':')[0]) + 1;
            const endIso = `${dateStr}T${endHour.toString().padStart(2, '0')}:${time.split(':')[1]}:00`;

            const { error } = await supabase
                .from('appointment_slots')
                .insert([{
                    appointment_date: dateStr,
                    delegate_type: type,
                    start_time: startIso,
                    end_time: endIso,
                    status: 'blocked',
                    block_reason: 'Bloqueo manual por administrador'
                }]);

            if (!error) {
                toast.success(`Hueco ${time} bloqueado`);
                loadBlockedSlots(date, type);
            }
        }
    }

    return {
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
    };
}
