import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Trash2, Calendar, Share2, Inbox, ArrowRight, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Suggestion {
  id: string;
  content: string;
  created_at: string;
}

export default function AdminSugerencias() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar sugerencias:', error);
      toast.error('Error al cargar las sugerencias');
    } else {
      setSuggestions(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sugerencia?')) {
      return;
    }

    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar sugerencia:', error);
      toast.error('Error al eliminar la sugerencia');
    } else {
      toast.success('Sugerencia eliminada correctamente');
      loadSuggestions();
    }
  }

  async function handleDeleteAll() {
    if (!confirm('¿Estás seguro de que quieres eliminar TODAS las sugerencias? Esta acción no se puede deshacer.')) {
      return;
    }

    const { error } = await supabase
      .from('suggestions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error al eliminar sugerencias:', error);
      toast.error('Error al eliminar las sugerencias');
    } else {
      toast.success('Todas las sugerencias han sido eliminadas');
      loadSuggestions();
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="flex items-center">
            <div className="p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mr-5">
              <Inbox className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Feedback de Usuarios</p>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Buzón de Sugerencias</h1>
            </div>
          </div>
          {suggestions.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-6 py-3 bg-white text-red-600 border border-red-100 rounded-2xl font-bold hover:bg-red-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Vaciar Buzón
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2rem] p-8 animate-pulse border border-gray-100 h-32" />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-20 text-center border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-2xl font-black text-gray-900 mb-2">Buzón vacío</p>
            <p className="text-gray-500 font-medium">No hay sugerencias nuevas en este momento.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 p-8 group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-50 rounded-xl">
                        <Calendar className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {format(new Date(suggestion.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </span>
                    </div>
                    <p className="text-gray-900 text-base leading-relaxed font-medium">
                      {suggestion.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-end md:self-start">
                    <button
                      onClick={() => {
                        const text = `📬 *Sugerencia recibida en el Portal UGT*\n\n"${suggestion.content}"\n\n_Recibida el ${format(new Date(suggestion.created_at), "d/MM/yyyy")}_`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="p-4 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all duration-300"
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(suggestion.id)}
                      className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all duration-300"
                      title="Eliminar sugerencia"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-8 flex items-center justify-center">
              <div className="px-6 py-2 bg-gray-100 rounded-full text-gray-500 text-xs font-bold uppercase tracking-widest">
                Total: {suggestions.length} sugerencias
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
