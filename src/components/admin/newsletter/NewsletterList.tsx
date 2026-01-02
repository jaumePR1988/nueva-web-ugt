import React from 'react';
import {
    FileDown, FileText, Calendar, Users, Edit2,
    Trash2, Eye, Share2, Printer, CheckCircle,
    Clock, AlertCircle, Search, Filter, Mail
} from 'lucide-react';
import { NewsletterEdition } from './types';

interface NewsletterListProps {
    newsletters: NewsletterEdition[];
    loading: boolean;
    onEdit: (news: NewsletterEdition) => void;
    onPreview: (news: NewsletterEdition) => void;
    onPdfPreview: (news: NewsletterEdition) => void;
    onDelete: (id: string) => void;
}

const NewsletterList: React.FC<NewsletterListProps> = ({
    newsletters,
    loading,
    onEdit,
    onPreview,
    onPdfPreview,
    onDelete
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Historial de Newsletters</h2>
                        <p className="text-sm text-gray-500 mt-1">Todas las ediciones generadas y enviadas hasta la fecha.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por título..."
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                {newsletters.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                        <FileDown className="w-16 h-16 text-gray-300 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No hay newsletters generados</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">Configura la generación automática o crea un borrador desde el Dashboard.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Edición</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Impacto</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {newsletters.map((news) => (
                                    <tr key={news.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold group-hover:bg-red-600 group-hover:text-white transition-colors uppercase text-center py-1">
                                                    <span className="text-[10px] leading-tight flex flex-col items-center">
                                                        PDF
                                                        <FileText className="w-4 h-4" />
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-gray-900">{news.title}</div>
                                                    <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mt-0.5 tracking-widest">
                                                        {news.auto_generated ? (
                                                            <span className="flex items-center gap-1 text-blue-500">
                                                                <Clock className="w-3 h-3" /> Auto-generado
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-purple-500">
                                                                <Users className="w-3 h-3" /> Manual
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {new Date(news.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(news.created_at).getFullYear()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {news.status === 'sent' || news.status === 'published' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200">
                                                    <CheckCircle className="w-3 h-3" /> Enviado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] font-bold uppercase tracking-wider border border-yellow-200">
                                                    <Clock className="w-3 h-3" /> Borrador
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-bold text-gray-700">{news.subscribers_count}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">Lectores</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onEdit(news)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Editar estructura"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onPreview(news)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    title="Vista previa HTML"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onPdfPreview(news)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Ver PDF Final"
                                                >
                                                    <FileDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(news.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsletterList;
