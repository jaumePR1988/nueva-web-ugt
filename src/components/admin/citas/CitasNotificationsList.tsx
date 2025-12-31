import React from 'react';
import { Bell, Check, Trash2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    read: boolean;
    user_full_name?: string;
    user_email?: string;
}

interface CitasNotificationsListProps {
    notifications: Notification[];
    filterType: string;
    setFilterType: (type: string) => void;
    filterRead: string;
    setFilterRead: (read: string) => void;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
    onMarkAllAsRead: () => void;
    getTypeColor: (type: string) => string;
    exportToExcel: () => void;
}

export const CitasNotificationsList: React.FC<CitasNotificationsListProps> = ({
    notifications,
    filterType,
    setFilterType,
    filterRead,
    setFilterRead,
    onMarkAsRead,
    onDelete,
    onMarkAllAsRead,
    getTypeColor,
    exportToExcel
}) => {
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
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-1 border rounded-md text-sm"
                    >
                        <option value="all">Todos los tipos</option>
                        <option value="delegate_notification">Nuevas Citas</option>
                        <option value="confirmation">Confirmaciones</option>
                        <option value="cancellation">Cancelaciones</option>
                        <option value="reminder">Recordatorios</option>
                    </select>
                    <select
                        value={filterRead}
                        onChange={(e) => setFilterRead(e.target.value)}
                        className="px-3 py-1 border rounded-md text-sm"
                    >
                        <option value="all">Todas</option>
                        <option value="unread">No leídas</option>
                        <option value="read">Leídas</option>
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={exportToExcel}
                        className="text-sm border border-gray-300 px-3 py-1 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        Exportar Excel
                    </button>
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Marcar todas como leídas
                    </button>
                </div>
            </div>

            <div className="divide-y">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No tienes notificaciones</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 transition ${!notification.read ? 'bg-blue-50/30' : ''
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className={`mt-1 p-2 rounded-full ${getTypeColor(notification.type)}`}>
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getTypeColor(notification.type)}`}>
                                                {getTypeLabel(notification.type)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {format(parseISO(notification.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                        <h4 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {notification.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                                        {(notification.user_full_name || notification.user_email) && (
                                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    {notification.user_full_name} ({notification.user_email})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!notification.read && (
                                        <button
                                            onClick={() => onMarkAsRead(notification.id)}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                            title="Marcar como leída"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDelete(notification.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
