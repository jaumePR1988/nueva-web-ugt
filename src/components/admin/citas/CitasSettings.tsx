import React from 'react';
import { Bell, Clock, Users, Plus, Save, X, Minus, Edit3, User } from 'lucide-react';

interface Config {
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

interface CitasSettingsProps {
    config: Config | null;
    configLoading: boolean;
    updateConfig: (key: string, value: any) => void;
    showAddAdmin: boolean;
    setShowAddAdmin: (show: boolean) => void;
    newAdminEmail: string;
    setNewAdminEmail: (email: string) => void;
    addAdminUser: () => void;
    removeAdminUser: (email: string) => void;
    editingTemplate: string | null;
    setEditingTemplate: (template: string | null) => void;
    updateNotificationTemplate: (type: any, field: 'subject' | 'body', value: string) => void;
    updateAlertSetting: (setting: any, value: boolean) => void;
    saveConfig: () => void;
}

const daysOfWeek = [
    { label: 'Lunes', value: '1' },
    { label: 'Martes', value: '2' },
    { label: 'Miércoles', value: '3' },
    { label: 'Jueves', value: '4' },
    { label: 'Viernes', value: '5' },
    { label: 'Sábado', value: '6' },
    { label: 'Domingo', value: '0' }
];

export const CitasSettings: React.FC<CitasSettingsProps> = ({
    config,
    configLoading,
    updateConfig,
    showAddAdmin,
    setShowAddAdmin,
    newAdminEmail,
    setNewAdminEmail,
    addAdminUser,
    removeAdminUser,
    editingTemplate,
    setEditingTemplate,
    updateNotificationTemplate,
    updateAlertSetting,
    saveConfig
}) => {
    if (configLoading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando configuración...</p>
            </div>
        );
    }

    if (!config) return null;

    return (
        <div className="space-y-8">
            {/* Configuración de Recordatorios */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Configuración de Recordatorios</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { key: 'reminder_24h', label: 'Recordatorio 24 horas', desc: 'Enviar recordatorio un día antes' },
                        { key: 'reminder_2h', label: 'Recordatorio 2 horas', desc: 'Enviar recordatorio 2 horas antes' },
                        { key: 'custom_reminder', label: 'Recordatorio personalizado', desc: 'Configurar tiempo personalizado' }
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900">{item.label}</h4>
                                <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(config as any)[item.key]}
                                    onChange={(e) => updateConfig(item.key, e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Configuración de Horarios Preferidos */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Horarios Preferidos</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora de inicio</label>
                        <input
                            type="time"
                            value={config.preferred_start_time || ''}
                            onChange={(e) => updateConfig('preferred_start_time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora de fin</label>
                        <input
                            type="time"
                            value={config.preferred_end_time || ''}
                            onChange={(e) => updateConfig('preferred_end_time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Días de la semana preferidos</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {daysOfWeek.map(day => (
                            <label key={day.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={config.preferred_days.includes(day.value)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            updateConfig('preferred_days', [...config.preferred_days, day.value]);
                                        } else {
                                            updateConfig('preferred_days', config.preferred_days.filter(d => d !== day.value));
                                        }
                                    }}
                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gestión de Usuarios Administradores */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-purple-600" />
                        <h3 className="text-xl font-semibold text-gray-900">Gestión de Administradores</h3>
                    </div>
                    <button
                        onClick={() => setShowAddAdmin(!showAddAdmin)}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir Admin
                    </button>
                </div>

                {showAddAdmin && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex gap-3">
                            <input
                                type="email"
                                placeholder="Email del nuevo administrador"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <button
                                onClick={addAdminUser}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddAdmin(false);
                                    setNewAdminEmail('');
                                }}
                                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {config.admin_users.map((email, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="text-gray-900">{email}</span>
                            </div>
                            <button
                                onClick={() => removeAdminUser(email)}
                                className="text-red-600 hover:text-red-800 p-1"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {config.admin_users.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p>No hay administradores configurados</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Plantillas de Notificación */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Edit3 className="w-6 h-6 text-orange-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Plantillas de Notificación</h3>
                </div>

                <div className="space-y-6">
                    {[
                        { key: 'confirmation', label: 'Confirmación' },
                        { key: 'cancellation', label: 'Cancelación' },
                        { key: 'reminder', label: 'Recordatorio' }
                    ].map(({ key, label }) => {
                        const subject = (config.notification_templates as any)[`${key}_subject`];
                        const body = (config.notification_templates as any)[`${key}_body`];

                        return (
                            <div key={key} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-900">{label}</h4>
                                    <button
                                        onClick={() => setEditingTemplate(editingTemplate === key ? null : key)}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        {editingTemplate === key ? 'Cancelar' : 'Editar'}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => updateNotificationTemplate(key as any, 'subject', e.target.value)}
                                            disabled={editingTemplate !== key}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                                        <textarea
                                            value={body}
                                            onChange={(e) => updateNotificationTemplate(key as any, 'body', e.target.value)}
                                            disabled={editingTemplate !== key}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Configuración de Alertas */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-6 h-6 text-red-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Configuración de Alertas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { name: 'email_notifications', label: 'Email', description: 'Recibir notificaciones por correo electrónico' },
                        { name: 'browser_notifications', label: 'Navegador', description: 'Mostrar notificaciones en el navegador' },
                        { name: 'reminder_notifications', label: 'Recordatorios', description: 'Recordatorios automáticos de citas' },
                        { name: 'status_change_notifications', label: 'Estado', description: 'Notificar cambios de estado de citas' }
                    ].map((alert) => (
                        <div key={alert.name} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900">{alert.label}</h4>
                                <p className="text-sm text-gray-600">{alert.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(config.alert_settings as any)[alert.name]}
                                    onChange={(e) => updateAlertSetting(alert.name, e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Botón de Guardar */}
            <div className="flex justify-end">
                <button
                    onClick={saveConfig}
                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition"
                >
                    <Save className="w-4 h-4" />
                    Guardar Configuración
                </button>
            </div>
        </div>
    );
};
