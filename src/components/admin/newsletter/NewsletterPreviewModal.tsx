import React from 'react';
import { X, ExternalLink, Mail, ArrowLeft } from 'lucide-react';

interface NewsletterPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    html: string;
    title?: string;
}

const NewsletterPreviewModal: React.FC<NewsletterPreviewModalProps> = ({
    isOpen,
    onClose,
    html,
    title
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{title || 'Vista Previa'}</h3>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none">Simulación de Correo Electrónico</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                    >
                        <span>Cerrar</span>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto bg-gray-200/30 p-4 md:p-8">
                    <div className="max-w-[700px] mx-auto bg-white shadow-xl rounded-xl overflow-hidden min-h-full">
                        <div
                            className="newsletter-preview-content"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    </div>
                    <div className="mt-8 text-center pb-8">
                        <p className="text-xs text-gray-400 italic">Este es un entorno de pruebas. Las imágenes pueden tardar un momento en cargar.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsletterPreviewModal;
