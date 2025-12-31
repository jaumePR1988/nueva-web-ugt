import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Trash2, Calendar } from 'lucide-react';
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
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todas

    if (error) {
      console.error('Error al eliminar sugerencias:', error);
      toast.error('Error al eliminar las sugerencias');
    } else {
      toast.success('Todas las sugerencias han sido eliminadas');
      loadSuggestions();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Buzón de Sugerencias</h1>
          </div>
          {suggestions.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Todas
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">Cargando sugerencias...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No hay sugerencias en el buzón</p>
            <p className="text-gray-400 mt-2">Las sugerencias enviadas por los usuarios aparecerán aquí</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensaje
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {suggestions.map((suggestion) => (
                    <tr key={suggestion.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {format(new Date(suggestion.created_at), "d 'de' MMM, yyyy HH:mm", { locale: es })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 max-w-2xl">
                          {suggestion.content}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(suggestion.id)}
                          className="text-red-600 hover:text-red-900 transition"
                          title="Eliminar sugerencia"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Total de sugerencias: <span className="font-semibold">{suggestions.length}</span>
              </p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
