import React from 'react';
import {
    Users, CheckCircle, FileText, FileDown,
    TrendingUp, BarChart3, Plus, Download, Trash2
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Subscriber } from './types';

interface NewsletterDashboardProps {
    stats: {
        totalSubscribers: number;
        activeSubscribers: number;
        totalContent: number;
        newslettersGenerated: number;
        newThisMonth: number;
        growthRate: number;
    };
    monthlyGrowth: {
        labels: string[];
        data: number[];
    };
    autoGenEnabled: boolean;
    lastGenDate: string | null;
    loading: boolean;
    subscribers: Subscriber[];
    onToggleAutoGeneration: () => void;
    onGenerateDraft: () => void;
    onCreateContent: () => void;
    onExportSubscribers: () => void;
    onConfirmDeleteSubscriber: (id: string) => void;
}

const NewsletterDashboard: React.FC<NewsletterDashboardProps> = ({
    stats,
    monthlyGrowth,
    autoGenEnabled,
    lastGenDate,
    loading,
    subscribers,
    onToggleAutoGeneration,
    onGenerateDraft,
    onCreateContent,
    onExportSubscribers,
    onConfirmDeleteSubscriber
}) => {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Suscriptores Totales</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalSubscribers}</p>
                        </div>
                        <Users className="w-12 h-12 text-blue-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Suscriptores Activos</p>
                            <p className="text-3xl font-bold text-green-600">{stats.activeSubscribers}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Contenido Creado</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.totalContent}</p>
                        </div>
                        <FileText className="w-12 h-12 text-purple-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">PDFs Generados</p>
                            <p className="text-3xl font-bold text-red-600">{stats.newslettersGenerated}</p>
                        </div>
                        <FileDown className="w-12 h-12 text-red-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Configuración de Generación Automática */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Generación Automática Mensual</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {autoGenEnabled ? 'Activada - Se ejecuta el día 1 de cada mes a las 9:00 AM' : 'Desactivada - No se generarán newsletters automáticamente'}
                        </p>
                        {lastGenDate && (
                            <p className="text-xs text-gray-400 mt-1">
                                Última generación: {new Date(lastGenDate).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onToggleAutoGeneration}
                        disabled={loading}
                        className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${autoGenEnabled ? 'bg-green-600' : 'bg-gray-300'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span
                            className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${autoGenEnabled ? 'translate-x-10' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>Funcionamiento:</strong> El sistema extrae automáticamente los comunicados y eventos para crear el newsletter mensual.
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Nuevos Este Mes</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.newThisMonth}</p>
                            {stats.growthRate !== 0 && (
                                <p className={`text-sm mt-1 flex items-center ${stats.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}% vs mes anterior
                                </p>
                            )}
                        </div>
                        <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Tasa de Actividad</p>
                            <p className="text-3xl font-bold text-green-600">
                                {stats.totalSubscribers > 0
                                    ? Math.round((stats.activeSubscribers / stats.totalSubscribers) * 100)
                                    : 0}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.activeSubscribers} de {stats.totalSubscribers} activos
                            </p>
                        </div>
                        <BarChart3 className="w-12 h-12 text-green-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Growth Chart */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Crecimiento de Suscriptores (Últimos 12 Meses)
                </h2>
                <div className="h-80">
                    <Line
                        data={{
                            labels: monthlyGrowth.labels,
                            datasets: [
                                {
                                    label: 'Nuevos Suscriptores',
                                    data: monthlyGrowth.data,
                                    borderColor: 'rgba(239, 68, 68, 1)',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    tension: 0.4,
                                    fill: true,
                                },
                            ],
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top' as const,
                                },
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        precision: 0,
                                    },
                                },
                            },
                        }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={onGenerateDraft}
                        disabled={loading}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Generar Borrador Mensual
                    </button>
                    <button
                        onClick={onCreateContent}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Contenido
                    </button>
                </div>
            </div>

            {/* Recent Subscribers */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Suscriptores Recientes</h2>
                    <button
                        onClick={onExportSubscribers}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm shadow-sm transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Exportar a Excel
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {subscribers.slice(0, 10).map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-900">{sub.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{sub.name || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(sub.subscribed_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {sub.is_active ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase tracking-wider">Activo</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-[10px] font-bold uppercase tracking-wider">Inactivo</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <button
                                            onClick={() => onConfirmDeleteSubscriber(sub.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            aria-label="Eliminar suscriptor"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NewsletterDashboard;
