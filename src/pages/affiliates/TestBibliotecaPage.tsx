import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, SyndicalDocument } from '@/lib/supabase';
import { Search, Download, FileText, Filter, User, BookOpen, Gift, Vote } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TestBibliotecaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SyndicalDocument[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<SyndicalDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'todas', label: 'Todas las Categorías' },
    { value: 'convenios', label: 'Convenios' },
    { value: 'protocolos', label: 'Protocolos' },
    { value: 'normativa', label: 'Normativa' },
    { value: 'formularios', label: 'Formularios' },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDocuments();
  }, [navigate]);

  useEffect(() => {
    filterDocuments();
  }, [searchTerm, selectedCategory, documents]);

  async function loadDocuments() {
    try {
      const { data, error } = await supabase
        .from('syndical_documents')
        .select('*')
        .eq('is_active', true)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
      setFilteredDocs(data || []);
    } finally {
      setLoading(false);
    }
  }

  function filterDocuments() {
    let filtered = documents;

    // Filtrar por categoría
    if (selectedCategory !== 'todas') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredDocs(filtered);
  }

  const menuItems = [
    { icon: User, label: 'Dashboard', path: '/afiliados/dashboard' },
    { icon: BookOpen, label: 'Biblioteca', path: '/afiliados/biblioteca' },
    { icon: Vote, label: 'Encuestas', path: '/afiliados/encuestas' },
    { icon: Gift, label: 'Beneficios', path: '/afiliados/beneficios' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navegación Lateral */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Menú de Afiliado</h2>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 transition"
                  >
                    <item.icon className="h-5 w-5 text-red-600" />
                    <span className="text-gray-700">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="md:col-span-3 space-y-6">
            {/* Encabezado */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-6">
                <BookOpen className="h-8 w-8 text-red-600" />
                <h1 className="text-3xl font-bold text-gray-900">Biblioteca de Documentos Sindicales</h1>
              </div>
              <p className="text-gray-600">
                Accede a convenios, protocolos, normativa y formularios exclusivos para afiliados UGT.
              </p>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>

                {/* Filtro por Categoría */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de Documentos */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Cargando documentos...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron documentos con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="h-5 w-5 text-red-600" />
                          <h3 className="text-xl font-semibold text-gray-900">{doc.title}</h3>
                        </div>
                        {doc.description && (
                          <p className="text-gray-600 mb-3">{doc.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                            {doc.category}
                          </span>
                          {doc.file_type && (
                            <span>{doc.file_type.toUpperCase()}</span>
                          )}
                          {doc.file_size_mb && (
                            <span>{doc.file_size_mb.toFixed(1)} MB</span>
                          )}
                          {doc.upload_date && (
                            <span>{format(new Date(doc.upload_date), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                          )}
                        </div>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        <Download className="h-4 w-4" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Estos documentos son de uso exclusivo para afiliados UGT. 
                Por favor, no compartas estos archivos fuera de la organización.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}