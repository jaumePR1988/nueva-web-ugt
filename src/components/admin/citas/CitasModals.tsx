import React from 'react';
import { X, FileSpreadsheet, Download, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface CitasModalsProps {
    showExportModal: boolean;
    setShowExportModal: (show: boolean) => void;
    reportFilters: any;
    setReportFilters: (filters: any) => void;
    exportToPDF: () => void;
    exportCompleteReport: () => void;
    exportToCSV: (data: any[], filename: string) => void;
    exporting: boolean;
    filteredNotifications: any[];
    filteredAppointments: any[];
    showDeleteModal: boolean;
    setShowDeleteModal: (show: boolean) => void;
    setDeleteAppointmentId: (id: string | null) => void;
    deleteAppointment: () => void;
    deleting: boolean;
}

export const CitasModals: React.FC<CitasModalsProps> = ({
    showExportModal,
    setShowExportModal,
    reportFilters,
    setReportFilters,
    exportToPDF,
    exportCompleteReport,
    exportToCSV,
    exporting,
    filteredNotifications,
    filteredAppointments,
    showDeleteModal,
    setShowDeleteModal,
    setDeleteAppointmentId,
    deleteAppointment,
    deleting
}) => {
    return (
        <>
            {/* Modal de Configuración de Exportación */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Configurar Exportación de Datos</h3>
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Período de reporte */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Período de Reporte
                                </label>
                                <select
                                    value={reportFilters.period}
                                    onChange={(e) => setReportFilters((prev: any) => ({ ...prev, period: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="all">Todos los datos</option>
                                    <option value="week">Esta semana</option>
                                    <option value="month">Este mes</option>
                                    <option value="quarter">Este trimestre</option>
                                    <option value="year">Este año</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                            </div>

                            {/* Fechas personalizadas */}
                            {reportFilters.period === 'custom' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fecha de inicio
                                        </label>
                                        <input
                                            type="date"
                                            value={reportFilters.startDate ? format(new Date(reportFilters.startDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setReportFilters((prev: any) => ({
                                                ...prev,
                                                startDate: e.target.value ? new Date(e.target.value) : undefined
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fecha de fin
                                        </label>
                                        <input
                                            type="date"
                                            value={reportFilters.endDate ? format(new Date(reportFilters.endDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setReportFilters((prev: any) => ({
                                                ...prev,
                                                endDate: e.target.value ? new Date(e.target.value) : undefined
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Tipo de exportación */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Formato de Exportación
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            value="excel"
                                            checked={reportFilters.exportType === 'excel'}
                                            onChange={(e) => setReportFilters((prev: any) => ({ ...prev, exportType: e.target.value as any }))}
                                            className="mr-2"
                                        />
                                        <FileSpreadsheet className="w-5 h-5 text-green-600 mr-2" />
                                        <span className="text-sm">Excel</span>
                                    </label>
                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            value="csv"
                                            checked={reportFilters.exportType === 'csv'}
                                            onChange={(e) => setReportFilters((prev: any) => ({ ...prev, exportType: e.target.value as any }))}
                                            className="mr-2"
                                        />
                                        <Download className="w-5 h-5 text-blue-600 mr-2" />
                                        <span className="text-sm">CSV</span>
                                    </label>
                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            value="pdf"
                                            checked={reportFilters.exportType === 'pdf'}
                                            onChange={(e) => setReportFilters((prev: any) => ({ ...prev, exportType: e.target.value as any }))}
                                            className="mr-2"
                                        />
                                        <FileText className="w-5 h-5 text-red-600 mr-2" />
                                        <span className="text-sm">PDF</span>
                                    </label>
                                </div>
                            </div>

                            {/* Incluir en el reporte */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Incluir en el Reporte
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={reportFilters.includeCharts}
                                            onChange={(e) => setReportFilters((prev: any) => ({ ...prev, includeCharts: e.target.checked }))}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                                        />
                                        <span className="text-sm">Incluir gráficos y estadísticas visuales</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={reportFilters.attendanceReport}
                                            onChange={(e) => setReportFilters((prev: any) => ({ ...prev, attendanceReport: e.target.checked }))}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                                        />
                                        <span className="text-sm">Reporte de asistencia por usuario</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={reportFilters.notificationReport}
                                            onChange={(e) => setReportFilters((prev: any) => ({ ...prev, notificationReport: e.target.checked }))}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                                        />
                                        <span className="text-sm">Historial completo de notificaciones</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={reportFilters.userReport}
                                            onChange={(e) => setReportFilters((prev: any) => ({ ...prev, userReport: e.target.checked }))}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                                        />
                                        <span className="text-sm">Detalles de citas por usuario</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (reportFilters.exportType === 'pdf') {
                                        exportToPDF();
                                    } else if (reportFilters.exportType === 'excel') {
                                        exportCompleteReport();
                                    } else {
                                        const csvData: any[] = [];
                                        if (reportFilters.notificationReport && filteredNotifications.length > 0) {
                                            csvData.push({ Seccion: 'Notificaciones', ...filteredNotifications[0] });
                                        }
                                        if (reportFilters.userReport && filteredAppointments.length > 0) {
                                            csvData.push({ Seccion: 'Citas', ...filteredAppointments[0] });
                                        }
                                        if (csvData.length > 0) {
                                            exportToCSV(csvData, `reporte_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                                        }
                                    }
                                    setShowExportModal(false);
                                }}
                                disabled={exporting}
                                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                            >
                                {exporting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {exporting ? 'Generando...' : 'Exportar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para eliminar cita */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
                                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-6">
                            Estás a punto de eliminar esta cita. Se eliminará permanentemente de la base de datos junto con todas las notificaciones asociadas.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteAppointmentId(null);
                                }}
                                disabled={deleting}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={deleteAppointment}
                                disabled={deleting}
                                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-medium disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {deleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Eliminando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        <span>Eliminar Cita</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
