import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Communique, Category } from '@/lib/supabase';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para extraer texto plano del HTML y truncarlo de manera segura
function getTextPreview(html: string, maxLength: number = 200): string {
  // Crear un elemento temporal para parsear el HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Obtener solo el texto sin etiquetas HTML
  const text = temp.textContent || temp.innerText || '';
  
  // Truncar el texto si es muy largo
  if (text.length > maxLength) {
    return text.substring(0, maxLength).trim() + '...';
  }
  
  return text;
}


export default function ComunicadosPage() {
  const [communiques, setCommuniques] = useState<Communique[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadCommuniques();
  }, [selectedCategory]);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (data) setCategories(data);
  }

  async function loadCommuniques() {
    setLoading(true);
    let query = supabase
      .from('communiques')
      .select('*, category:categories(*)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    const { data } = await query;
    if (data) setCommuniques(data as any);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Comunicados</h1>
          </div>
        </div>

        {/* Filtros de categoría */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Filtrar por categoría:</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
            >
              Todas las categorías
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === cat.id
                    ? 'text-white shadow-md'
                    : 'bg-white text-gray-700 border-2 hover:shadow'
                }`}
                style={
                  selectedCategory === cat.id
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : { borderColor: cat.color, color: cat.color }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          </div>
        ) : communiques.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No hay comunicados en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {communiques.map(com => {
              const category = com.category;
              return (
                <Link
                  key={com.id}
                  to={`/comunicados/${com.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-2xl font-semibold text-gray-900 flex-1">{com.title}</h2>
                    {category && (
                      <span
                        className="ml-4 px-3 py-1 text-white rounded-full text-sm font-semibold"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {getTextPreview(com.content, 200)}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{format(new Date(com.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
