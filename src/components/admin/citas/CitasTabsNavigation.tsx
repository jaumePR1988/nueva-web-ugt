import React from 'react';
import { BarChart3, Bell, Settings, Calendar } from 'lucide-react';

type TabType = 'appointments' | 'notifications' | 'stats' | 'config' | 'availability';

interface CitasTabsNavigationProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    unreadCount: number;
}

export const CitasTabsNavigation: React.FC<CitasTabsNavigationProps> = ({
    activeTab,
    setActiveTab,
    unreadCount
}) => {
    return (
        <div className="mb-6 border-b">
            <div className="flex space-x-8">
                <button
                    onClick={() => setActiveTab('appointments')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'appointments'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    Citas
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'stats'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Estadísticas
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'notifications'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <Bell className="w-4 h-4 mr-2" />
                    Notificaciones
                    {unreadCount > 0 && (
                        <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                            {unreadCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'config'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                </button>
                <button
                    onClick={() => setActiveTab('availability')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'availability'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <Calendar className="w-4 h-4 mr-2" />
                    Disponibilidad
                </button>
            </div>
        </div>
    );
};
