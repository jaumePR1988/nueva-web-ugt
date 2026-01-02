import React, { useState, useEffect, useRef } from 'react';
import {
    X, Plus, FileText, Trash2, Eye, Layout,
    Settings, ChevronUp, ChevronDown, CheckCircle,
    Clock, Share2, Printer, FileDown, RotateCcw,
    GripVertical, Image as ImageIcon, MessageSquare,
    BarChart2, ArrowRight, Copy
} from 'lucide-react';
import { NewsletterEdition, NewsletterContent, ContentType } from './types';
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
    const [title, setTitle] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ContentType | 'all'>('all');
    const previewRef = useRef<HTMLDivElement>(null);

    // Initialize state
    useEffect(() => {
        if (isOpen && newsletter) {
            setTitle(newsletter.title);
            const sections = newsletter.content?.sections || {};
            const initialItems: any[] = [];
            const mapItem = (item: any, type: string) => ({
                ...item,
                type,
                show_full: item.show_full !== false, // Default to true if existing
                uid: item.uid || 'item_' + Math.random().toString(36).substr(2, 9)
            });

            if (sections.news) initialItems.push(...sections.news.map((i: any) => mapItem(i, 'news')));
            if (sections.events) initialItems.push(...sections.events.map((i: any) => mapItem(i, 'events')));
            if (sections.gallery) initialItems.push(...sections.gallery.map((i: any) => mapItem(i, 'gallery')));
            if (sections.surveys) initialItems.push(...sections.surveys.map((i: any) => mapItem(i, 'surveys')));

            setItems(initialItems);
        } else if (isOpen) {
            setTitle('Newsletter ' + new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
            setItems([]);
        }
    }, [isOpen, newsletter]);

    const handleAddItem = (content: NewsletterContent) => {
        const newItem = {
            ...content,
            show_full: false, // Default to excerpt for new items
            uid: 'item_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
            include: true
        };
        setItems(prev => [...prev, newItem]);
        toast.success('Añadido: ' + content.title);
    };

    const handleRemoveItem = (uid: string) => {
        setItems(prev => prev.filter(i => i.uid !== uid));
    };

    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === items.length - 1) return;

        const newItems = [...items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setItems(newItems);
    };

    const handleToggleFull = (index: number) => {
        const newItems = [...items];
        newItems[index].show_full = !newItems[index].show_full;
        setItems(newItems);
    };

    // --- HTML GENERATORS ---
    const generateItemHtml = (item: any) => {
        const siteUrl = 'https://ugt.towa.cat';

        switch (item.type) {
            case 'news':
                const isFull = item.show_full;
                // LOGIC: 
                // - if show_full = false (default/summary): Show Title + Image + Link to Web. NO TEXT BODY.
                // - if show_full = true: Show Title + Image + Full Text + Link.

                const displayContent = isFull ? item.content : '';

                return `
                <div class="newsletter-item" style="margin-bottom: 30px; padding: 25px; background-color: #f8f9fa; border-left: 5px solid #e50000; border-radius: 4px;">
                    <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 20px; font-weight: bold; font-family: 'Segoe UI', sans-serif;">${item.title}</h3>
                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" style="width: 100%; height: auto; border-radius: 6px; margin-bottom: 20px; display: block;" />` : ''}
                    
                    ${isFull ? `<div style="color: #444; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">${displayContent}</div>` : ''}
                    
                    <div style="margin-top: 15px; text-align: ${isFull ? 'right' : 'left'};">
                            <a href="${siteUrl}/comunicados/${item.id || '#'}" style="display: inline-block; padding: 10px 20px; background-color: #e50000; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">LEER NOTICIA EN LA WEB &rarr;</a>
                    </div>
                </div>`;

            case 'gallery':
            case 'events':
                return `
                <div class="newsletter-item" style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #e50000; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 8px;">${item.title}</h3>
                    ${item.image_url ? `<img src="${item.image_url}" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />` : ''}
                    <p style="margin-top: 10px; color: #666; font-style: italic;">${item.content}</p>
                </div>`;

            case 'surveys':
                return `
                <div class="newsletter-item" style="margin-bottom: 30px; padding: 25px; background-color: #fff; border: 1px solid #eee; border-radius: 8px; text-align: center;">
                     <h3 style="color: #e50000; font-size: 20px; margin-bottom: 10px;">📊 ${item.title}</h3>
                     <p style="color: #666; margin-bottom: 20px;">Participa en nuestra encuesta oficial</p>
                     <a href="${siteUrl}/encuestas/${item.id}" style="display: inline-block; padding: 10px 25px; background-color: #1a1a1a; color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">Votar Ahora</a>
                </div>`;

            default:
                return `<div style="padding: 20px; background: #eee;">${item.title}</div>`;
        }
    };

    const getFullHtml = () => {
        const bodyContent = items.map(generateItemHtml).join('');
        const qrCode = newsletter?.content?.qrCode;

        return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
             body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 0; background: #fff; color: #333; }
             .container { max-width: 800px; margin: 0 auto; padding: 20px; }
             .header { background: #e50000; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
             .footer { margin-top: 50px; padding: 30px; background: #fdf2f2; border: 2px dashed #e50000; border-radius: 8px; text-align: center; }
             img { max-width: 100%; }
             @media print {
               body { padding: 0; }
               .container { width: 100%; max-width: none; }
               .newsletter-item { break-inside: avoid; page-break-inside: avoid; }
             }
          </style>
        </head>
        <body>
           <div class="container">
               <div class="header">
                   <h1 style="margin:0; font-size: 32px; letter-spacing: -1px;">Newsletter UGT Towa</h1>
                   <p style="margin: 10px 0 0 0; opacity: 0.9;">${title}</p>
               </div>
               
               <div style="padding: 40px 0; min-height: 400px;">
                   ${bodyContent || '<p style="text-align:center; color:#999; margin-top: 50px;">Añade contenido desde la biblioteca...</p>'}
               </div>

               ${qrCode ? `
               <div class="footer">
                   <h2 style="color: #e50000; margin: 0 0 20px 0;">¡SÓLO FALTAS TÚ!</h2>
                   <img src="${qrCode.image_url}" style="width: 150px; height: 150px;" />
                   <p style="color: #e50000; font-weight: bold; margin-top: 15px;">Escanea para afiliarte</p>
               </div>
               ` : ''}
               
               <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
                   &copy; ${new Date().getFullYear()} Unión General de Trabajadores - Sección Sindical Towa
               </div>
           </div>
        </body>
        </html>`;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Group by sections for DB
            const sections = {
                news: items.filter(i => i.type === 'news'),
                events: items.filter(i => i.type === 'events'),
                gallery: items.filter(i => i.type === 'gallery'),
                surveys: items.filter(i => i.type === 'surveys')
            };

            await onSave({
                title,
                html: getFullHtml(),
                sections
            });
            toast.success('Newsletter guardado y generado');
            onClose();
        } catch (e) {
            console.error(e);
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(getFullHtml());
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        }
    };

    const handleCopyHtml = async () => {
        try {
            const html = getFullHtml();
            const blobHtml = new Blob([html], { type: 'text/html' });
            const blobText = new Blob([html], { type: 'text/plain' });
            const data = [new ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText
            })];
            await navigator.clipboard.write(data);
            toast.success('Diseño copiado. Pégalo en el cuerpo del email (Gmail/Outlook).');
        } catch (err) {
            console.error('Copy failed', err);
            toast.error('No se pudo copiar el enriquecido. Intenta usar Ctrl+A y Ctrl+C en la vista previa PDF.');
        }
    };

    if (!isOpen) return null;

    // Filter content library
    const filteredLibrary = libraryContents.filter(c => selectedCategory === 'all' || c.type === selectedCategory);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-gray-100 w-full h-full max-w-[1600px] rounded-2xl overflow-hidden flex flex-col shadow-2xl">

                {/* TOP BAR */}
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-red-600 rounded text-white"><Layout className="w-5 h-5" /></div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Constructor de Newsletter</h2>
                            <p className="text-xs text-gray-500">Arrastra o haz clic para añadir módulos</p>
                        </div>
                        <div className="h-8 w-px bg-gray-200 mx-4"></div>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="text-lg font-bold bg-gray-50 border-transparent hover:bg-white hover:border-gray-200 border rounded px-3 py-1 focus:ring-2 focus:ring-red-600 outline-none w-96 transition-all"
                            placeholder="Título del Newsletter..."
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleCopyHtml} className="px-4 py-2 text-white bg-gray-900 hover:bg-black rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-gray-200 transition-transform active:scale-95">
                            <Copy className="w-4 h-4" /> COPIAR EMAIL
                        </button>
                        <button onClick={handlePrint} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-sm flex items-center gap-2">
                            <Printer className="w-4 h-4" /> PDF
                        </button>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-200">
                            {saving ? 'GUARDANDO...' : 'GUARDAR Y SALIR'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT: LIBRARY */}
                    <div className="w-80 bg-white border-r flex flex-col z-10">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Biblioteca
                            </h3>
                            <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
                                {['all', 'news', 'surveys', 'gallery'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat as any)}
                                        className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${selectedCategory === cat ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        {cat === 'all' ? 'Todo' : cat === 'news' ? 'Noticias' : cat === 'gallery' ? 'Galería' : 'Enc.'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filteredLibrary.map(content => (
                                <div
                                    key={content.id}
                                    onClick={() => handleAddItem(content)}
                                    className="group bg-white border border-gray-100 p-3 rounded-xl hover:border-red-500 hover:shadow-md cursor-pointer transition-all active:scale-95"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {content.image_url ?
                                                <img src={content.image_url} className="w-full h-full object-cover" /> :
                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-6 h-6" /></div>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{onGetContentTypeName(content.type)}</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{content.title}</h4>
                                        </div>
                                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-red-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: BUILDER CANVAS */}
                    <div className="flex-1 bg-gray-200 overflow-y-auto p-8 flex justify-center">
                        <div className="w-full max-w-[800px] bg-white min-h-[1122px] shadow-2xl relative flex flex-col" ref={previewRef}>

                            {/* PDF HEADER */}
                            <div className="bg-[#e50000] text-white py-8 px-6 text-center">
                                <h1 className="text-3xl font-bold tracking-tight m-0">Newsletter UGT Towa</h1>
                                <p className="opacity-90 mt-2 text-sm">{title}</p>
                            </div>

                            {/* DYNAMIC CONTENT */}
                            <div className="flex-1 p-8 space-y-6">
                                {items.length === 0 && (
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                                        <Layout className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-400">Lienzo Vacío</h3>
                                        <p className="text-gray-400">Selecciona contenidos de la bibliotea (izquierda) para empezar a construir.</p>
                                    </div>
                                )}

                                {items.map((item, idx) => (
                                    <div key={item.uid} className="group relative border border-transparent hover:border-red-400 hover:bg-gray-50 rounded-lg transition-all">
                                        {/* HOVER CONTROLS */}
                                        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.type === 'news' && (
                                                <button
                                                    onClick={() => handleToggleFull(idx)}
                                                    className={`p-2 shadow rounded-full mb-2 transition-colors ${item.show_full ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:text-blue-600'}`}
                                                    title={item.show_full ? "Mostrar resumen" : "Mostrar completo"}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleMoveItem(idx, 'up')} className="p-2 bg-white shadow rounded-full text-gray-500 hover:text-black"><ChevronUp className="w-4 h-4" /></button>
                                            <button onClick={() => handleMoveItem(idx, 'down')} className="p-2 bg-white shadow rounded-full text-gray-500 hover:text-black mt-1"><ChevronDown className="w-4 h-4" /></button>
                                            <button onClick={() => handleRemoveItem(item.uid)} className="p-2 bg-red-100 shadow rounded-full text-red-600 hover:bg-red-600 hover:text-white mt-1"><Trash2 className="w-4 h-4" /></button>
                                        </div>

                                        {/* ITEM PREVIEW */}
                                        <div dangerouslySetInnerHTML={{ __html: generateItemHtml(item) }} />
                                    </div>
                                ))}
                            </div>

                            {/* PDF FOOTER (Preview Only) */}
                            {newsletter?.content?.qrCode && (
                                <div className="p-8 mt-auto">
                                    <div className="bg-red-50 border-2 border-dashed border-red-500 rounded-2xl p-6 text-center">
                                        <h2 className="text-2xl font-bold text-red-600 mb-4">¡SÚMATE A UGT!</h2>
                                        <div className="inline-block bg-white p-4 shadow-lg rounded-xl">
                                            <img src={newsletter.content.qrCode.image_url} className="w-32 h-32 object-contain" />
                                        </div>
                                        <p className="mt-4 text-red-700 font-bold">Escanea este código para afiliarte</p>
                                    </div>
                                    <div className="text-center mt-6 py-4 border-t text-sm text-gray-400">
                                        &copy; {new Date().getFullYear()} UGT Towa. Todos los derechos reservados.
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NewsletterEditorModal;
