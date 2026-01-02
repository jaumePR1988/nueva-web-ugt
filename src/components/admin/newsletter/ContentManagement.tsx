import React from 'react';
import {
    Plus, Edit2, Trash2, Globe, Lock, Search, Filter,
    ChevronLeft, Image as ImageIcon, FileText, Calendar,
    BarChart2, Users, Lightbulb, Save, X
} from 'lucide-react';
import { NewsletterContent, ContentType } from './types';

interface ContentManagementProps {
    contents: NewsletterContent[];
    showContentForm: boolean;
    editingContent: NewsletterContent | null;
    contentForm: {
        type: ContentType;
        title: string;
        content: string;
        image_url: string;
        is_published: boolean;
    };
    loading: boolean;
    onSetShowContentForm: (show: boolean) => void;
    onSetEditingContent: (content: NewsletterContent | null) => void;
    onSetContentForm: (form: any) => void;
    onSaveContent: (e: React.FormEvent) => void;
    onDeleteContent: (id: string) => void;
    onGetContentTypeIcon: (type: ContentType) => React.ReactNode;
    onGetContentTypeName: (type: ContentType) => string;
}

const ContentManagement: React.FC<ContentManagementProps> = ({
    contents,
    showContentForm,
    editingContent,
    contentForm,
    loading,
    onSetShowContentForm,
    onSetEditingContent,
    onSetContentForm,
    onSaveContent,
    onDeleteContent,
    onGetContentTypeIcon,
    onGetContentTypeName
}) => {
    if (showContentForm) {
        return (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {editingContent ? 'Editar Contenido' : 'Nuevo Contenido'}
                    </h2>
                    <button
                        onClick={() => onSetShowContentForm(false)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={onSaveContent} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contenido</label>
                                <select
                                    value={contentForm.type}
                                    onChange={(e) => onSetContentForm({ ...contentForm, type: e.target.value as ContentType })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    required
                                >
                                    <option value="news">Noticia / Comunicado</option>
                                    <option value="events">Evento</option>
                                    <option value="gallery">Galería de Imágenes</option>
                                    <option value="surveys">Encuesta</option>
                                    <option value="statistics">Estadística</option>
                                    <option value="directives">Directivo / Representante</option>
                                    <option value="suggestions">Sugerencia</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={contentForm.title}
                                    onChange={(e) => onSetContentForm({ ...contentForm, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    placeholder="Título descriptivo..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <ImageIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="url"
                                            value={contentForm.image_url}
                                            onChange={(e) => onSetContentForm({ ...contentForm, image_url: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                            placeholder="https://ejemplo.com/imagen.jpg"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Se recomienda una imagen horizontal de 800x400px.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo del Mensaje (Markdown o Texto)</label>
                                <textarea
                                    value={contentForm.content}
                                    onChange={(e) => onSetContentForm({ ...contentForm, content: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none min-h-[200px] transition-all"
                                    placeholder="Escribe aquí el contenido..."
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_published"
                                    checked={contentForm.is_published}
                                    onChange={(e) => onSetContentForm({ ...contentForm, is_published: e.target.checked })}
                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                />
                                <label htmlFor="is_published" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Publicar inmediatamente
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t font-bold uppercase tracking-wider text-xs">
                        <button
                            type="button"
                            onClick={() => onSetShowContentForm(false)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <Save className="w-5 h-5" />
                            {editingContent ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Contenido del Newsletter</h2>
                        <p className="text-sm text-gray-500 mt-1">Gestiona las noticias y eventos que aparecerán en la biblioteca del editor.</p>
                    </div>
                    <button
                        onClick={() => {
                            onSetShowContentForm(true);
                            onSetEditingContent(null);
                            onSetContentForm({
                                type: 'news',
                                title: '',
                                content: '',
                                image_url: '',
                                is_published: false
                            });
                        }}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-sm transition-colors font-bold uppercase tracking-wider text-xs"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Contenido
                    </button>
                </div>

                {contents.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-20" />
                        <p className="text-gray-500">No hay contenido disponible. Empieza creando uno nuevo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contents.map((content) => (
                            <div key={content.id} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                                <div className="relative h-48 overflow-hidden bg-gray-100">
                                    {content.image_url ? (
                                        <img
                                            src={content.image_url}
                                            alt={content.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon className="w-12 h-12 opacity-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                                            {onGetContentTypeIcon(content.type)}
                                            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                                {onGetContentTypeName(content.type)}
                                            </span>
                                        </div>
                                    </div>
                                    {content.is_published && (
                                        <div className="absolute top-3 right-3">
                                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                                Publicado
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                                        {content.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1 italic">
                                        {content.content}
                                    </p>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-auto">
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {new Date(content.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    onSetEditingContent(content);
                                                    onSetContentForm({
                                                        type: content.type,
                                                        title: content.title,
                                                        content: content.content,
                                                        image_url: content.image_url || '',
                                                        is_published: content.is_published
                                                    });
                                                    onSetShowContentForm(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteContent(content.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentManagement;
