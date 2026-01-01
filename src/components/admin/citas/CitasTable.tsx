import React from 'react';
import { Trash2, User, FileText, Download, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
    id: string;
    start_time: string;
    delegate_type: string;
    status: string;
    user_id: string;
    comments?: string;
    questions?: string;
    documents?: any[];
    user?: {
        full_name: string;
        email: string;
    };
}

interface CitasTableProps {
    appointments: Appointment[];
    filteredAppointments: Appointment[];
    updateStatus: (id: string, status: string) => void;
    confirmDeleteAppointment: (id: string) => void;
}

export const CitasTable: React.FC<CitasTableProps> = ({
    appointments,
    filteredAppointments,
    updateStatus,
    confirmDeleteAppointment
}) => {
    if (filteredAppointments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-4 text-center py-12 text-gray-500">
                {appointments.length === 0 ? 'No hay citas registradas' : 'No se encontraron citas con los filtros aplicados'}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow space-y-4 p-4">
            {filteredAppointments.map(apt => (
                <div key={apt.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Fecha y Hora</p>
                                <p className="font-semibold">{new Date(apt.start_time).toLocaleString('es-ES')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Tipo de Delegado</p>
                                <p className="font-semibold capitalize">{apt.delegate_type}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Estado</p>
                                <select
                                    value={apt.status}
                                    onChange={e => updateStatus(apt.id, e.target.value)}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-semibold"
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="confirmed">Confirmada</option>
                                    <option value="cancelled">Cancelada</option>
                                    <option value="completed">Completada</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {apt.user && apt.user.full_name && (
                                <button
                                    onClick={() => {
                                        const dateStr = new Date(apt.start_time).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
                                        const text = `Hola ${apt.user?.full_name}, le contacto de la Sección Sindical de UGT acerca de su cita programada para el ${dateStr}.`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                    }}
                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                    title="Contactar por WhatsApp"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={() => confirmDeleteAppointment(apt.id)}
                                className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
                                aria-label="Eliminar cita"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="text-sm font-medium">Eliminar</span>
                            </button>
                        </div>
                    </div>

                    {apt.user && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <p className="text-xs text-blue-600 font-semibold mb-2">RESERVADO POR</p>
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="font-semibold text-gray-900">{apt.user.full_name || 'Sin nombre'}</p>
                                    <p className="text-sm text-gray-600">{apt.user.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {apt.comments && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="text-xs text-gray-600 font-semibold mb-2">COMENTARIOS</p>
                            <p className="text-sm text-gray-700">{apt.comments}</p>
                        </div>
                    )}

                    {apt.questions && (
                        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                            <p className="text-xs text-yellow-700 font-semibold mb-2">PREGUNTAS / TEMAS A TRATAR</p>
                            <p className="text-sm text-gray-700">{apt.questions}</p>
                        </div>
                    )}

                    {apt.documents && apt.documents.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-xs text-green-700 font-semibold mb-3">DOCUMENTOS ADJUNTOS ({apt.documents.length})</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {apt.documents.map((doc: any, idx: number) => (
                                    <a
                                        key={idx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 bg-white rounded border border-green-200 hover:bg-green-100 transition text-sm"
                                    >
                                        <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{doc.fileName}</p>
                                            <p className="text-xs text-gray-500">
                                                {(doc.fileSize / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <Download className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
