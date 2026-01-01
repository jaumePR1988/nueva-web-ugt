import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface CommentWithDetails {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  author: {
    full_name: string;
    email: string;
  };
  communique: {
    title: string;
  };
}

export default function AdminComentarios() {
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, []);

  async function loadComments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_user_id_fkey(full_name, email),
        communique:communiques!comments_post_id_fkey(title)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar comentarios:', error);
      toast.error('Error al cargar comentarios');
    } else if (data) {
      setComments(data as any);
    }
    setLoading(false);
  }

  async function handleDelete(commentId: string, authorName: string) {
    if (!confirm(`¿Estás seguro de eliminar el comentario de ${authorName}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(commentId);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comentario eliminado correctamente');
      // Actualizar lista local sin recargar todo
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error: any) {
      console.error('Error al eliminar comentario:', error);
      toast.error('Error al eliminar el comentario: ' + (error.message || 'Error desconocido'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="flex items-center">
            <div className="p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mr-5">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Moderación de Noticias</p>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestión de Comentarios</h1>
            </div>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase leading-none">Total Comentarios</p>
              <p className="text-xl font-black text-red-600">{comments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 mb-8 flex items-start">
          <AlertCircle className="h-5 w-5 text-orange-600 mr-4 mt-1" />
          <div className="text-sm text-orange-800">
            <p className="font-bold mb-1 uppercase tracking-wider text-[10px]">Aviso de Moderación</p>
            <p className="font-medium opacity-80 leading-relaxed">Al eliminar un comentario, también se borrarán todas sus reacciones asociadas. Esta acción se aplica de forma permanente e irreversible.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cargando comentarios...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm px-8">
            <MessageSquare className="h-16 w-16 text-gray-100 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No hay comentarios en el sistema</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Comunicado / Autor
                    </th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Contenido del Comentario
                    </th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Fecha / Hora
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col mb-1">
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 truncate max-w-[200px]">
                            {comment.communique?.title || 'Sin título'}
                          </span>
                          <span className="text-gray-900 font-bold">{comment.author?.full_name || 'Desconocido'}</span>
                        </div>
                        <span className="text-gray-400 text-[10px] font-bold">{comment.author?.email || ''}</span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-600 font-medium leading-relaxed max-w-lg">
                          {comment.content}
                        </p>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {format(new Date(comment.created_at), "dd/MM/yyyy", { locale: es })}
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">
                          {format(new Date(comment.created_at), "HH:mm 'hs'", { locale: es })}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => handleDelete(comment.id, comment.author?.full_name || 'Usuario')}
                          disabled={deletingId === comment.id}
                          className="p-3 text-gray-400 hover:text-white hover:bg-red-600 rounded-xl transition-all shadow-sm group"
                          title="Eliminar comentario"
                        >
                          {deletingId === comment.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mx-auto"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
