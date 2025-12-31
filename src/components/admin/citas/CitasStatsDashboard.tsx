import React from 'react';
import { Target, CheckCircle, TrendingUp, Clock, Users, FileSpreadsheet, User } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface AttendanceRate {
    percentage: number;
    completed: number;
    total: number;
}

interface ConfirmationRate {
    percentage: number;
    confirmed: number;
    pending: number;
}

interface DailyStat {
    date: string;
    appointments: number;
}

interface PeakHour {
    hour: number;
    count: number;
}

interface UserStat {
    id: string;
    full_name: string;
    email: string;
    appointment_count: number;
    last_appointment: string;
}

interface AttendanceReport {
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

interface ReportSummary {
    total_appointments: number;
    total_notifications: number;
    total_users: number;
    average_attendance_rate: number;
    top_delegate_type: string;
    period_description: string;
}

interface CitasStatsDashboardProps {
    statsRef: React.RefObject<HTMLDivElement>;
    attendanceRate: AttendanceRate;
    confirmationRate: ConfirmationRate;
    dailyStats: DailyStat[];
    peakHours: PeakHour[];
    userStats: UserStat[];
    attendanceReportData: AttendanceReport[];
    reportSummary: ReportSummary | null;
    exporting: boolean;
    generateAttendanceReport: () => void;
    exportToExcel: (data: any[], filename: string, sheetName: string) => void;
}

export const CitasStatsDashboard: React.FC<CitasStatsDashboardProps> = ({
    statsRef,
    attendanceRate,
    confirmationRate,
    dailyStats,
    peakHours,
    userStats,
    attendanceReportData,
    reportSummary,
    exporting,
    generateAttendanceReport,
    exportToExcel
}) => {
    return (
        <div ref={statsRef} className="space-y-6">
            {/* Botones de exportación para estadísticas */}
            <div className="flex justify-end space-x-3">
                <button
                    onClick={generateAttendanceReport}
                    disabled={exporting}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 text-sm"
                >
                    {exporting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <Users className="w-4 h-4" />
                    )}
                    {exporting ? 'Generando...' : 'Reporte de Asistencia'}
                </button>
            </div>

            {/* Métricas de Rendimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Porcentaje de Asistencia */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Porcentaje de Asistencia</h3>
                        <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            <Doughnut
                                data={{
                                    datasets: [{
                                        data: [attendanceRate.percentage, 100 - attendanceRate.percentage],
                                        backgroundColor: ['#3b82f6', '#e5e7eb'],
                                        borderWidth: 0,
                                    }]
                                }}
                                options={{
                                    cutout: '80%',
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: { enabled: false }
                                    }
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">{attendanceRate.percentage}%</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            {attendanceRate.completed} de {attendanceRate.total} citas completadas
                        </p>
                    </div>
                </div>

                {/* Tasa de Confirmación */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Tasa de Confirmación</h3>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            <Doughnut
                                data={{
                                    datasets: [{
                                        data: [confirmationRate.percentage, 100 - confirmationRate.percentage],
                                        backgroundColor: ['#10b981', '#e5e7eb'],
                                        borderWidth: 0,
                                    }]
                                }}
                                options={{
                                    cutout: '80%',
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: { enabled: false }
                                    }
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">{confirmationRate.percentage}%</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            {confirmationRate.confirmed} confirmadas de {confirmationRate.confirmed + confirmationRate.pending} pendientes
                        </p>
                    </div>
                </div>
            </div>

            {/* Gráfico de Citas por Día (Últimos 30 días) */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Citas por Día (Últimos 30 días)</h3>
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="h-80">
                    <Line
                        data={{
                            labels: dailyStats.map(stat => stat.date),
                            datasets: [{
                                label: 'Citas',
                                data: dailyStats.map(stat => stat.appointments),
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                borderWidth: 3,
                                pointBackgroundColor: '#3b82f6',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 2,
                                pointRadius: 5,
                                pointHoverRadius: 7,
                                tension: 0.4
                            }]
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#fff',
                                    titleColor: '#374151',
                                    bodyColor: '#374151',
                                    borderColor: '#e5e7eb',
                                    borderWidth: 1,
                                    cornerRadius: 8,
                                    displayColors: false,
                                    callbacks: {
                                        title: (context: any) => `Fecha: ${context[0].label}`,
                                        label: (context: any) => `Citas: ${context.parsed.y}`
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                                    ticks: { color: '#6b7280', font: { size: 12 } }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { color: '#6b7280', font: { size: 12 }, maxRotation: 45 }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Horarios Pico */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Horarios Pico (8:00 - 20:00)</h3>
                    <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="h-80">
                    <Bar
                        data={{
                            labels: peakHours.map(stat => `${stat.hour}:00`),
                            datasets: [{
                                label: 'Citas',
                                data: peakHours.map(stat => stat.count),
                                backgroundColor: '#10b981',
                                borderColor: '#10b981',
                                borderWidth: 1,
                                borderRadius: 4,
                                borderSkipped: false,
                            }]
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#fff',
                                    titleColor: '#374151',
                                    bodyColor: '#374151',
                                    borderColor: '#e5e7eb',
                                    borderWidth: 1,
                                    cornerRadius: 8,
                                    displayColors: false,
                                    callbacks: {
                                        title: (context: any) => `Hora: ${context[0].label}`,
                                        label: (context: any) => `Citas: ${context.parsed.y}`
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                                    ticks: { color: '#6b7280', font: { size: 12 } }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { color: '#6b7280', font: { size: 12 } }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Top 5 Usuarios Más Activos */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Top 5 Usuarios Más Activos</h3>
                    <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ranking</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Usuario</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Citas</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Última Cita</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {userStats.map((user, index) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                            index === 1 ? 'bg-gray-100 text-gray-800' :
                                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                                <User className="w-4 h-4 text-red-600" />
                                            </div>
                                            <span className="font-medium text-gray-900">{user.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                                    <td className="py-3 px-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                            {user.appointment_count} citas
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {format(parseISO(user.last_appointment), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {userStats.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p>No hay datos de usuarios para mostrar</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reporte de Asistencia por Usuario */}
            {attendanceReportData.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Reporte de Asistencia por Usuario</h3>
                        <button
                            onClick={() => exportToExcel(attendanceReportData, `asistencia_${format(new Date(), 'yyyy-MM-dd')}.xlsx`, 'Asistencia')}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Exportar Excel
                        </button>
                    </div>

                    {reportSummary && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-3">Resumen del Período</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Período:</span>
                                    <span className="ml-2 font-medium">{reportSummary.period_description}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Total Citas:</span>
                                    <span className="ml-2 font-medium">{reportSummary.total_appointments}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Usuarios Activos:</span>
                                    <span className="ml-2 font-medium">{reportSummary.total_users}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Tasa Promedio:</span>
                                    <span className="ml-2 font-medium">{reportSummary.average_attendance_rate}%</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Total Notificaciones:</span>
                                    <span className="ml-2 font-medium">{reportSummary.total_notifications}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Tipo Popular:</span>
                                    <span className="ml-2 font-medium">{reportSummary.top_delegate_type}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Usuario</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Total Citas</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Completadas</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Canceladas</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Pendientes</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">% Asistencia</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Última Cita</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendanceReportData.map((report) => (
                                    <tr key={report.user_id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                                    <User className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">{report.user_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{report.user_email}</td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                                {report.total_appointments}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                {report.completed_appointments}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                                {report.cancelled_appointments}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                                {report.pending_appointments}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                    <div
                                                        className={`h-2 rounded-full ${report.attendance_rate >= 80 ? 'bg-green-500' :
                                                            report.attendance_rate >= 60 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                        style={{ width: `${report.attendance_rate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium">{report.attendance_rate}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 text-sm">
                                            {format(parseISO(report.last_appointment), 'dd/MM/yyyy', { locale: es })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
