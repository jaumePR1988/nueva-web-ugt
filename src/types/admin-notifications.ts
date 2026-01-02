export interface NotificationLogo {
    id: string;
    name: string;
    url: string;
    is_active: boolean;
    created_at: string;
    uploaded_by: string;
    file_size: number;
    format: string;
}

export interface NotificationPreference {
    admin_id: string;
    event_type: 'appointment_created' | 'appointment_cancelled' | 'appointment_updated' | 'appointment_status_changed';
    enabled: boolean;
    title_template: string;
    message_template: string;
}

export interface PushNotificationHistory {
    id: string;
    title: string;
    message: string;
    url?: string;
    status: 'success' | 'error' | 'pending';
    sent_count: number;
    error_details?: string;
    created_at: string;
    created_by: string;
    event_type: string;
}

export interface NotificationStats {
    totalSubscriptions: number;
    lastSent: string | null;
}
