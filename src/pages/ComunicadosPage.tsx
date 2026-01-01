import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Communique, Category } from '@/lib/supabase';
import { FileText, Calendar, Inbox, ArrowRight } from 'lucide-react';
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
    setCommuniques(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-[#dc2626] text-white pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-6">
              <FileText className="h-3 w-3 mr-2" />
              Noticias y Actualidad
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
              Comunicados de la <br />
              Sección Sindical
            </h1>
            <p className="text-lg text-red-50 font-medium leading-relaxed opacity-90">
              Mantente al día con las últimas noticias, acuerdos y avisos oficiales de UGT en Towa Pharmaceutical.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 -mt-8 pb-20">
        {/* Navigation / Filters */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-4 mb-12 border border-gray-100 sticky top-20 z-30">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === 'all'
                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              Todos
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id
                  ? 'shadow-lg'
                  : 'bg-transparent text-gray-500 hover:bg-gray-50'
                  }`}
                style={
                  selectedCategory === cat.id
                    ? { backgroundColor: cat.color, color: 'white', boxShadow: `0 10px 15px -3px ${cat.color}40` }
                    : { color: cat.color }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-4"></div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Cargando noticias...</p>
          </div>
        ) : communiques.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
            <Inbox className="h-16 w-16 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay comunicados</h3>
            <p className="text-gray-500 max-w-sm mx-auto">No se han encontrado noticias en esta categoría o para este criterio de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {communiques.map((com, index) => {
              const isFirst = index === 0 && selectedCategory === 'all';
              const category = com.category;
              const dateObj = new Date(com.created_at);
              const formattedDate = format(dateObj, "d 'de' MMMM, yyyy", { locale: es });
              const isNew = (Date.now() - dateObj.getTime()) < 1000 * 60 * 60 * 24 * 3; // 3 dias

              return (
                <Link
                  key={com.id}
                  to={`/comunicados/${com.id}`}
                  className={`group bg-white rounded-[2rem] overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col ${isFirst ? 'md:col-span-2 lg:col-span-2 md:flex-row' : ''
                    }`}
                >
                  {/* Image/Preview Section */}
                  <div className={`relative overflow-hidden bg-gray-100 ${isFirst ? 'md:w-1/2 min-h-[300px]' : 'aspect-[16/10]'
                    }`}>
                    <img
                      src={com.image_url || 'https://images.unsplash.com/photo-1585829365234-781fcd96c81b?q=80&w=800&auto=format&fit=crop'}
                      alt={com.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />

                    {/* Badge de Categoría */}
                    {category && (
                      <div
                        className="absolute top-6 left-6 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur-md"
                        style={{ backgroundColor: `${category.color}dd` }}
                      >
                        {category.name}
                      </div>
                    )}

                    {isNew && (
                      <div className="absolute top-6 right-6 px-3 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                        Nuevo
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className={`p-8 lg:p-10 flex flex-col justify-between ${isFirst ? 'md:w-1/2' : 'flex-1'}`}>
                    <div>
                      <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        <Calendar className="h-3 w-3 mr-2 text-red-600" />
                        {formattedDate}
                      </div>
                      <h2 className={`${isFirst ? 'text-2xl lg:text-3xl' : 'text-xl'} font-black text-gray-900 group-hover:text-red-600 transition-colors mb-4 line-clamp-2 leading-tight`}>
                        {com.title}
                      </h2>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 font-medium">
                        {getTextPreview(com.content, isFirst ? 300 : 150)}
                      </p>
                    </div>

                    <div className="flex items-center text-xs font-black uppercase tracking-widest text-red-600 group/btn">
                      Saber más
                      <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
