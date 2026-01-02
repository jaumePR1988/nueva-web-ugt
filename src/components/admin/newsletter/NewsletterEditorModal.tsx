import React, { useState, useEffect } from 'react';
import {
    X, Plus, FileText, Trash2, Eye, Layout,
    Settings, ChevronUp, ChevronDown, CheckCircle,
    Clock, Share2, Printer, FileDown, RotateCcw
} from 'lucide-react';
import { NewsletterEdition, NewsletterContent, ContentType } from './types';
import LibraryModal from './LibraryModal';
import { toast } from 'sonner';

interface NewsletterEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    newsletter: NewsletterEdition | null;
    libraryContents: NewsletterContent[];
    onSave: (data: { title: string; html: string; sections: any }) => Promise<void>;
    onGetContentTypeIcon: (type: ContentType) => React.ReactNode;
    onGetContentTypeName: (type: ContentType) => string;
}

const NewsletterEditorModal: React.FC<NewsletterEditorModalProps> = ({
    isOpen,
    onClose,
    newsletter,
    libraryContents,
    onSave,
    onGetContentTypeIcon,
    onGetContentTypeName
}) => {
    const [activeTab, setActiveTab] = useState<'modules' | 'visual'>('modules');
    const [title, setTitle] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [visualHtml, setVisualHtml] = useState('');
    const [showLibrary, setShowLibrary] = useState(false);
    const [saving, setSaving] = useState(false);

    // Inicializar estado cuando se abre para un newsletter específico
    useEffect(() => {
        if (isOpen && newsletter) {
            setTitle(newsletter.title);
            setVisualHtml(newsletter.content?.html || '');

            const sections = newsletter.content?.sections || {};
            const initialItems: any[] = [];

            const mapItem = (item: any, section: string) => ({
                ...item,
                section,
                uid: 'item_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
            });

            if (sections.news) initialItems.push(...sections.news.map((i: any) => mapItem(i, 'news')));
            if (sections.events) initialItems.push(...sections.events.map((i: any) => mapItem(i, 'events')));
            if (sections.surveys) initialItems.push(...sections.surveys.map((i: any) => mapItem(i, 'surveys')));

            // Deep copy to ensure no reference issues and force re-render
            setItems(JSON.parse(JSON.stringify(initialItems)));
            setActiveTab('modules');
        }
    }, [isOpen, newsletter]);

    const generateHtml = (currentItems: any[]) => {
        const siteUrl = 'https://ugttowa.com';
        const included = currentItems.filter(i => i.include !== false);

        const newsHtml = included.filter(i => i.section === 'news').map(item => `
      <div style="margin-bottom: 25px; padding: 20px; background-color: #f9f9f9; border-left: 5px solid #e50000; border-radius: 4px;">
          <h3 style="margin: 0 0 12px 0; color: #333; font-size: 20px;">${item.title}</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">
              ${item.show_full ? item.content : (item.excerpt || (typeof item.content === 'string' ? item.content.substring(0, 200) + '...' : ''))}
          </p>
          ${!item.show_full && item.id ? `
              <div style="margin-top: 15px;">
                  <a href="${siteUrl}/comunicados/${item.id}" style="color: #e50000; font-weight: bold; text-decoration: none; font-size: 14px;">
                      → Más información / Leer noticia completa
                  </a>
              </div>
          ` : ''}
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" style="max-width: 100%; height: auto; margin-top: 15px; border-radius: 6px; display: block;" />` : ''}
      </div>
    `).join('');

        const eventsHtml = included.filter(i => i.section === 'events').map(item => `
        <div style="margin-bottom: 25px; padding: 20px; background-color: #f9f9f9; border-left: 5px solid #e50000; border-radius: 4px;">
            <h3 style="margin: 0 0 12px 0; color: #333; font-size: 20px;">${item.title}</h3>
            <p style="margin: 0; color: #555; font-size: 15px;">${item.content}</p>
            ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" style="max-width: 100%; height: auto; margin-top: 15px; border-radius: 6px; display: block;" />` : ''}
        </div>
    `).join('');

        const surveysHtml = included.filter(i => i.section === 'surveys').map(item => `
        <div style="margin-bottom: 25px; padding: 20px; background-color: #f9f9f9; border-left: 5px solid #e50000; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 20px;">${item.title}</h3>
            <p style="margin: 0 0 15px 0; color: #666;"><strong>Total de participantes:</strong> ${item.totalResponses || 0}</p>
            ${item.statistics?.options ? `
                <div style="margin-top: 15px;">
                    ${item.statistics.options.map((option: any) => `
                        <div style="margin-bottom: 12px; background-color: #ffffff; padding: 12px; border: 1px solid #eee; border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-weight: bold; color: #444;">${option.text}</span>
                                <span style="color: #e50000; font-weight: bold;">${option.percentage}%</span>
                            </div>
                            <div style="background-color: #eee; height: 10px; border-radius: 5px; overflow: hidden;">
                                <div style="background-color: #e50000; height: 100%; width: ${option.percentage}%; border-radius: 5px;"></div>
                            </div>
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">${option.votes} votos registrados</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');

        const qrCode = newsletter?.content?.qrCode;

        return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #ffffff; padding: 20px; border-radius: 8px;">
        <div style="background-color: #e50000; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px;">Newsletter UGT Towa</h1>
        </div>
        ${newsHtml ? `<div style="margin-bottom: 40px;"><h2 style="color: #e50000; font-size: 22px; font-weight: bold; border-bottom: 2px solid #e50000; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase;">Noticias y Comunicados</h2>${newsHtml}</div>` : ''}
        ${eventsHtml ? `<div style="margin-bottom: 40px;"><h2 style="color: #e50000; font-size: 22px; font-weight: bold; border-bottom: 2px solid #e50000; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase;">Galería de Eventos</h2>${eventsHtml}</div>` : ''}
        ${surveysHtml ? `<div style="margin-bottom: 40px;"><h2 style="color: #e50000; font-size: 22px; font-weight: bold; border-bottom: 2px solid #e50000; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase;">Resultados de Encuestas</h2>${surveysHtml}</div>` : ''}
        ${qrCode ? `
        <div style="text-align: center; margin-top: 50px; padding: 30px; background-color: #fdf2f2; border: 2px dashed #e50000; border-radius: 12px;">
            <h2 style="color: #e50000; font-size: 24px; font-weight: bold; margin-bottom: 20px;">¡SÚMATE A UGT!</h2>
            <div style="display: inline-block; padding: 15px; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <img src="${qrCode.image_url}" alt="QR Afiliación" style="max-width: 180px; width: 100%; height: auto; display: block;" />
            </div>
            <p style="margin-top: 15px; color: #e50000; font-weight: bold;">Escanea este código o contacta con tu delegado</p>
        </div>` : ''}
    </div>`.trim();
    };

    const syncHtml = () => {
        const newHtml = generateHtml(items);
        setVisualHtml(newHtml);
        return newHtml;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Sincronizar HTML final antes de guardar
            const finalHtml = activeTab === 'modules' ? generateHtml(items) : visualHtml;

            const sections = {
                news: items.filter(i => i.section === 'news'),
                events: items.filter(i => i.section === 'events'),
                surveys: items.filter(i => i.section === 'surveys')
            };

            await onSave({
                title,
                html: finalHtml,
                sections
            });
            toast.success('Cambios guardados correctamente');
            onClose();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleAddItem = (libraryItem: any) => {
        const newItem = {
            ...libraryItem,
            section: libraryItem.type === 'news' ? 'news' : libraryItem.type === 'events' ? 'events' : 'surveys',
            include: true,
            show_full: false,
            uid: 'item_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
        };
        setItems(prev => [...prev, newItem]);
        toast.success('Añadido al newsletter');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header con Título Editable */}
                <div className="p-4 border-b flex items-center justify-between bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-red-600 p-2 rounded-lg text-white">
                                <Layout className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 whitespace-nowrap">Editor:</h3>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="flex-1 w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none font-bold text-gray-800 bg-white transition-all shadow-sm"
                            placeholder="Ej: Newsletter Enero 2026..."
                        />
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        <div className="flex bg-gray-200/50 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('modules')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'modules' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <Settings className="w-4 h-4" /> Módulos
                            </button>
                            <button
                                onClick={() => {
                                    syncHtml();
                                    setActiveTab('visual');
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'visual' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <Eye className="w-4 h-4" /> Visual
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Cuerpo del Editor */}
                <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
                    {activeTab === 'modules' ? (
                        <div className="flex-1 overflow-auto p-6">
                            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                                {/* Herramientas de Estructura */}
                                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 leading-tight">Estructura de Contenidos</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Define qué se incluirá en esta edición del newsletter.</p>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => setShowLibrary(true)}
                                            className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> Añadir de Biblioteca
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('¿Vaciar toda la estructura actual?')) {
                                                    setItems([]);
                                                    toast.success('Newsletter reiniciado');
                                                }
                                            }}
                                            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                        >
                                            <RotateCcw className="w-4 h-4" /> Reiniciar
                                        </button>
                                    </div>
                                </div>

                                {/* Listado de Módulos por Secciones */}
                                {['news', 'events', 'surveys'].map(section => {
                                    const sectionItems = items.filter(i => i.section === section);
                                    if (sectionItems.length === 0 && section !== 'news') return null;

                                    return (
                                        <div key={section} className="space-y-4">
                                            <h5 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">
                                                {section === 'news' ? '📑 Noticias y Comunicados' : section === 'events' ? '📸 Galería de Eventos' : '📊 Encuestas'}
                                                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{sectionItems.length}</span>
                                            </h5>

                                            {sectionItems.length === 0 ? (
                                                <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                                                    <p className="text-xs text-gray-400 italic">No hay módulos en esta sección</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {sectionItems.map((item) => (
                                                        <div
                                                            key={item.uid}
                                                            className={`bg-white p-4 rounded-2xl border-l-4 transition-all duration-300 flex items-start gap-4 shadow-sm group ${item.include === false ? 'border-gray-200 opacity-60' : 'border-red-600'}`}
                                                        >
                                                            <div className="pt-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.include !== false}
                                                                    onChange={(e) => {
                                                                        setItems(prev => prev.map(i => i.uid === item.uid ? { ...i, include: e.target.checked } : i));
                                                                    }}
                                                                    className="w-5 h-5 text-red-600 rounded-lg border-gray-300 focus:ring-red-600 cursor-pointer"
                                                                />
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <h6 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors truncate">{item.title}</h6>
                                                                {item.excerpt && <p className="text-xs text-gray-500 line-clamp-1 italic mt-0.5">{item.excerpt}</p>}

                                                                <div className="mt-4 flex items-center justify-between">
                                                                    <div className="flex items-center gap-4">
                                                                        {section === 'news' && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setItems(prev => prev.map(i => i.uid === item.uid ? { ...i, show_full: !item.show_full } : i));
                                                                                }}
                                                                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-red-600 transition-colors"
                                                                            >
                                                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${item.show_full ? 'bg-red-600' : 'bg-gray-300'}`}>
                                                                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${item.show_full ? 'left-4.5' : 'left-0.5'}`} />
                                                                                </div>
                                                                                {item.show_full ? 'Texto Completo' : 'Resumen'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setItems(prev => prev.filter(i => i.uid !== item.uid))}
                                                                        className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {item.image_url && (
                                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900">Vista Previa del Newsletter</h4>
                                    <p className="text-xs text-gray-500">Este es el aspecto exacto que tendrá el correo y el PDF.</p>
                                </div>
                                <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                                    <span>Modo Edición HTML Activado</span>
                                </div>
                            </div>
                            <textarea
                                value={visualHtml}
                                onChange={(e) => setVisualHtml(e.target.value)}
                                className="flex-1 p-6 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-100 outline-none font-mono text-sm leading-relaxed bg-white shadow-inner resize-none"
                                placeholder="El código HTML aparecerá aquí..."
                            />
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-700 leading-normal">
                                    <strong>Aviso:</strong> Si realizas cambios manuales en el código HTML y luego vuelves a la pestaña de "Módulos" y reconstruyes, se perderán tus modificaciones manuales. Usa el editor visual solo para los retoques finales.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con Acciones */}
                <div className="p-4 border-t bg-gray-50/80 backdrop-blur-md flex justify-between items-center sticky bottom-0 z-10">
                    <p className="text-[10px] text-gray-400 font-medium">
                        Módulos: <span className="text-gray-900 font-bold">{items.length}</span> |
                        Incluidos: <span className="text-red-600 font-bold">{items.filter(i => i.include !== false).length}</span>
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors uppercase tracking-wider"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-100 transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Guardando...' : 'Guardar Newsletter'}
                        </button>
                    </div>
                </div>
            </div>

            <LibraryModal
                isOpen={showLibrary}
                onClose={() => setShowLibrary(false)}
                contents={libraryContents}
                onAddToNewsletter={handleAddItem}
                onGetContentTypeIcon={onGetContentTypeIcon}
                onGetContentTypeName={onGetContentTypeName}
            />
        </div>
    );
};

// SVG icons as components for convenience inside the editor if needed, or use Lucide
const AlertCircle = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Save = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);

export default NewsletterEditorModal;
