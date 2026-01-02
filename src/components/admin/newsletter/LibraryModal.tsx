import React, { useState } from 'react';
import {
    X, Search, Filter, Plus, FileText, Image as ImageIcon,
    BarChart2, Users, Lightbulb, Calendar
} from 'lucide-react';
import { NewsletterContent, ContentType } from './types';

interface LibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    contents: NewsletterContent[];
    onAddToNewsletter: (item: any) => void;
    onGetContentTypeIcon: (type: ContentType) => React.ReactNode;
    onGetContentTypeName: (type: ContentType) => string;
}

const LibraryModal: React.FC<LibraryModalProps> = ({
    isOpen,
    onClose,
    contents,
    onAddToNewsletter,
    onGetContentTypeIcon,
    onGetContentTypeName
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<ContentType | 'all'>('all');

    if (!isOpen) return null;

    const filteredContents = contents.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
                <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Biblioteca de Contenidos</h3>
                        <p className="text-sm text-gray-500">Añade noticias, eventos o encuestas al newsletter actual.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 bg-white border-b flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar contenido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-600 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-2 text-[10px] items-center">
                        <Filter className="w-4 h-4 text-gray-400 mr-2" />
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1.5 rounded-full font-bold uppercase transition-all ${filterType === 'all' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterType('news')}
                            className={`px-3 py-1.5 rounded-full font-bold uppercase transition-all ${filterType === 'news' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Noticias
                        </button>
                        <button
                            onClick={() => setFilterType('events')}
                            className={`px-3 py-1.5 rounded-full font-bold uppercase transition-all ${filterType === 'events' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Eventos
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                    {filteredContents.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-20" />
                            <p className="text-gray-500">No se encontraron contenidos con esos filtros.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredContents.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-red-200 hover:shadow-md transition-all group flex gap-4"
                                >
                                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-[10px]">
                                                ugt
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {onGetContentTypeIcon(item.type)}
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                                {onGetContentTypeName(item.type)}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight flex-1">
                                            {item.title}
                                        </h4>
                                        <button
                                            onClick={() => onAddToNewsletter(item)}
                                            className="mt-2 flex items-center justify-center gap-1.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            <Plus className="w-3 h-3" /> Añadir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibraryModal;
