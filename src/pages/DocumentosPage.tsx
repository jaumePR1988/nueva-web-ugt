import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Document } from '@/lib/supabase';
import { FileText, Download, Calendar, User, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const CATEGORIES = ['Todos', 'Nóminas', 'Contratos', 'Políticas', 'Procedimientos', 'Otros'];

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'Todos') {
      setFilteredDocs(documents);
    } else {
      setFilteredDocs(documents.filter(doc => doc.category === selectedCategory));
    }
  }, [selectedCategory, documents]);

  async function loadDocuments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploader:profiles(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar documentos');
      console.error(error);
    } else if (data) {
      setDocuments(data as any);
      setFilteredDocs(data as any);
    }
    setLoading(false);
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return 'Desconocido';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      'Nóminas': 'bg-green-100 text-green-700',
      'Contratos': 'bg-blue-100 text-blue-700',
      'Políticas': 'bg-purple-100 text-purple-700',
      'Procedimientos': 'bg-orange-100 text-orange-700',
      'Otros': 'bg-gray-100 text-gray-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Documentos Relevantes</h1>
            <p className="text-gray-600">Accede a documentos importantes del sindicato</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Filtrar por categoría</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedCategory === category
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando documentos...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {selectedCategory === 'Todos'
                  ? 'No hay documentos disponibles'
                  : `No hay documentos en la categoría "${selectedCategory}"`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="h-8 w-8 text-red-600 flex-shrink-0" />
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {doc.title}
                  </h3>
                  
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {doc.description}
                    </p>
                  )}
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(doc.created_at), "d MMM yyyy", { locale: es })}
                    </div>
                    {doc.uploader && (
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        {doc.uploader.full_name}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Tamaño: {formatFileSize(doc.file_size)}
                    </div>
                  </div>
                  
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
