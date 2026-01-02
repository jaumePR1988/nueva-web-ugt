import { DateRange } from 'react-day-picker';

export interface Notification {
    id: string;
    appointment_id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    read: boolean;
    user_email: string | null;
    user_full_name: string | null;
    delegate_type: string | null;
    appointment_time: string | null;
}

export interface AppointmentStats {
    today: number;
    upcoming: number;
    pending: number;
    completed: number;
}

export interface UserOption {
    id: string;
    full_name: string;
    email: string;
}

export interface AdvancedFilters {
    searchTerm: string;
    selectedUser: UserOption | null;
    dateRange: DateRange | undefined;
    timeFilter: 'all' | 'morning' | 'afternoon';
    showDatePicker: boolean;
}

export interface DailyStats {
    date: string;
    appointments: number;
}

export interface PeakHours {
    hour: number;
    count: number;
}

export interface UserStats {
    id: string;
    full_name: string;
    email: string;
    appointment_count: number;
    last_appointment: string;
}

export interface AttendanceRate {
    completed: number;
    total: number;
    percentage: number;
}

export interface ConfirmationRate {
    confirmed: number;
    pending: number;
    percentage: number;
}

export interface AppointmentConfig {
    id: number;
    user_id: string;
    reminder_24h: boolean;
    reminder_2h: boolean;
    custom_reminder: boolean;
    preferred_start_time: string | null;
    preferred_end_time: string | null;
    preferred_days: string[];
    admin_users: string[];
    notification_templates: {
        confirmation_subject: string;
        confirmation_body: string;
        cancellation_subject: string;
        cancellation_body: string;
        reminder_subject: string;
        reminder_body: string;
    };
    alert_settings: {
        email_notifications: boolean;
        browser_notifications: boolean;
        reminder_notifications: boolean;
        status_change_notifications: boolean;
    };
}

export interface NotificationTemplate {
    name: string;
    subject: string;
    body: string;
}

export interface AlertSetting {
    name: string;
    enabled: boolean;
    description: string;
}

export interface ReportFilters {
    period: 'all' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
    startDate?: Date;
    endDate?: Date;
    exportType: 'csv' | 'excel' | 'pdf';
    includeCharts: boolean;
    userReport: boolean;
    attendanceReport: boolean;
    notificationReport: boolean;
}

export interface AttendanceReport {
    user_id: string;
    user_name: string;
    user_email: string;
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    pending_appointments: number;
    attendance_rate: number;
    last_appointment: string;
    period_start: string;
    period_end: string;
}

export interface NotificationExport {
    id: string;
    type: string;
    title: string;
    message: string;
    user_full_name: string;
    user_email: string;
    delegate_type: string;
    created_at: string;
    read: boolean;
    appointment_time: string;
}

export interface AppointmentExport {
    id: string;
    start_time: string;
    delegate_type: string;
    status: string;
    user_name: string;
    user_email: string;
    created_at: string;
}

export interface ReportSummary {
    total_appointments: number;
    total_notifications: number;
    total_users: number;
    average_attendance_rate: number;
    top_delegate_type: string;
    period_description: string;
}
