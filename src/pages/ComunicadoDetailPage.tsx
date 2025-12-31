import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShareButtons from '@/components/ShareButtons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Communique, Comment as CommentType, CommentReaction, CommentReply } from '@/lib/supabase';
import { Calendar, MessageSquare, ThumbsUp, ThumbsDown, Trash2, Reply, FileText, Download, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';


export default function ComunicadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [communique, setCommunique] = useState<Communique | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replies, setReplies] = useState<Record<string, CommentReply[]>>({});
  const [reactions, setReactions] = useState<Record<string, CommentReaction[]>>({});
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCommunique();
      loadComments();
      subscribeToComments();
      subscribeToReplies();
    }
  }, [id]);

  useEffect(() => {
    if (comments.length > 0) {
      loadReactions();
      loadReplies();
    }
  }, [comments]);

  async function loadCommunique() {
    const { data } = await supabase
      .from('communiques')
      .select('*, category:categories(*)')
      .eq('id', id)
      .maybeSingle();
    if (data) setCommunique(data as any);
    setLoading(false);
  }

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles(full_name)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: false });
    
    if (data) setComments(data);
  }

  async function loadReplies() {
    if (comments.length === 0) return;
    
    const { data } = await supabase
      .from('comment_replies')
      .select(`
        *,
        author:profiles(full_name)
      `)
      .in('comment_id', comments.map(c => c.id))
      .order('created_at', { ascending: true });
    
    if (data) {
      const grouped = data.reduce((acc, reply) => {
        if (!acc[reply.comment_id]) acc[reply.comment_id] = [];
        acc[reply.comment_id].push(reply);
        return acc;
      }, {} as Record<string, CommentReply[]>);
      setReplies(grouped);
    }
  }

  async function loadReactions() {
    if (comments.length === 0) return;
    
    const { data } = await supabase
      .from('comment_reactions')
      .select('*')
      .in('comment_id', comments.map(c => c.id));
    
    if (data) {
      const grouped = data.reduce((acc, reaction) => {
        if (!acc[reaction.comment_id]) acc[reaction.comment_id] = [];
        acc[reaction.comment_id].push(reaction);
        return acc;
      }, {} as Record<string, CommentReaction[]>);
      setReactions(grouped);
    }
  }

  async function handleReaction(commentId: string, reactionType: 'like' | 'dislike') {
    if (!user) {
      toast.error('Debes iniciar sesión para reaccionar');
      return;
    }

    const existingReaction = reactions[commentId]?.find(r => r.user_id === user.id);

    if (existingReaction) {
      const { error } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (!error) {
        toast.success('Reacción eliminada');
        loadReactions();
      }
    } else {
      const { error } = await supabase
        .from('comment_reactions')
        .insert([{
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType
        }]);

      if (!error) {
        toast.success('Reacción agregada');
        loadReactions();
      }
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('¿Estás seguro de eliminar este comentario? Esta acción no se puede deshacer.')) {
      return;
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('Error al eliminar comentario');
    } else {
      toast.success('Comentario eliminado');
      loadComments();
    }
  }

  async function handleDeleteReply(replyId: string) {
    if (!confirm('¿Estás seguro de eliminar esta respuesta?')) {
      return;
    }

    const { error } = await supabase
      .from('comment_replies')
      .delete()
      .eq('id', replyId);

    if (error) {
      toast.error('Error al eliminar respuesta');
    } else {
      toast.success('Respuesta eliminada');
      loadReplies();
    }
  }

  function subscribeToComments() {
    const channel = supabase
      .channel(`comments:${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${id}`
      }, () => {
        loadComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function subscribeToReplies() {
    const channel = supabase
      .channel(`replies:${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comment_replies'
      }, () => {
        loadReplies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          content: newComment,
          post_id: id,
          user_id: user.id
        }]);

      if (error) throw error;

      setNewComment('');
      toast.success('Comentario publicado');
    } catch (error) {
      toast.error('Error al publicar comentario');
    }
  }

  async function handleSubmitReply(commentId: string) {
    if (!user || !replyContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comment_replies')
        .insert([{
          comment_id: commentId,
          user_id: user.id,
          content: replyContent
        }]);

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      toast.success('Respuesta publicada');
    } catch (error) {
      toast.error('Error al publicar respuesta');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!communique) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Comunicado no encontrado</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{communique.title}</h1>
            <div className="flex items-center text-gray-500 mb-6">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{format(new Date(communique.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
              {communique.category && (
                <span 
                  className="ml-4 px-3 py-1 text-white rounded-full text-sm font-semibold"
                  style={{ backgroundColor: communique.category.color }}
                >
                  {communique.category.name}
                </span>
              )}
            </div>
            
            {/* Botones de compartir en redes sociales */}
            <ShareButtons 
              url={window.location.href}
              title={communique.title}
              description={communique.content.replace(/<[^>]*>/g, '').substring(0, 150)}
            />
            
            <div className="prose max-w-none mt-6">
              {communique.image_url && (
                <img 
                  src={communique.image_url} 
                  alt={communique.title}
                  className="w-full h-auto rounded-lg mb-6"
                />
              )}
              <div 
                className="prose prose-lg max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: communique.content }}
              />
            </div>

            {communique.attachments && communique.attachments.length > 0 && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="flex items-center mb-4">
                  <Paperclip className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Archivos Adjuntos ({communique.attachments.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {communique.attachments.map((attachment: any, index: number) => {
                    const isImage = attachment.fileType?.startsWith('image/');
                    const isPDF = attachment.fileType === 'application/pdf';
                    const fileSize = attachment.fileSize ? 
                      (attachment.fileSize < 1024 ? `${attachment.fileSize} B` :
                       attachment.fileSize < 1024 * 1024 ? `${(attachment.fileSize / 1024).toFixed(1)} KB` :
                       `${(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB`) : '';

                    return (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-300 hover:border-red-500 hover:shadow-md transition group"
                      >
                        <FileText className="h-8 w-8 text-red-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate group-hover:text-red-600">
                            {attachment.fileName}
                          </p>
                          {fileSize && (
                            <p className="text-sm text-gray-500">{fileSize}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {isImage ? 'Imagen' : isPDF ? 'Documento PDF' : 'Documento'}
                          </p>
                        </div>
                        <Download className="h-5 w-5 text-red-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </article>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <MessageSquare className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">
                Comentarios ({comments.length})
              </h2>
            </div>

            {user && (
              <form onSubmit={handleSubmitComment} className="mb-8">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 resize-none"
                  rows={3}
                />
                <button
                  type="submit"
                  className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Publicar
                </button>
              </form>
            )}

            <div className="space-y-4">
              {comments.map(comment => {
                const commentReactions = reactions[comment.id] || [];
                const likes = commentReactions.filter(r => r.reaction_type === 'like').length;
                const dislikes = commentReactions.filter(r => r.reaction_type === 'dislike').length;
                const userReaction = commentReactions.find(r => r.user_id === user?.id);
                const commentReplies = replies[comment.id] || [];

                return (
                  <div key={comment.id} className="border-l-4 border-red-600 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-700">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-sm font-medium text-gray-900">
                            {comment.author?.full_name || 'Usuario'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(comment.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {user && (
                          <>
                            <button
                              onClick={() => handleReaction(comment.id, 'like')}
                              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${
                                userReaction?.reaction_type === 'like' ? 'text-red-600' : 'text-gray-500'
                              }`}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span className="text-sm">{likes}</span>
                            </button>
                            <button
                              onClick={() => handleReaction(comment.id, 'dislike')}
                              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${
                                userReaction?.reaction_type === 'dislike' ? 'text-red-600' : 'text-gray-500'
                              }`}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              <span className="text-sm">{dislikes}</span>
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="Eliminar comentario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {user && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="mt-2 flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <Reply className="h-3 w-3" />
                        Responder
                      </button>
                    )}

                    {replyingTo === comment.id && (
                      <div className="mt-3 ml-4">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Escribe una respuesta..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 resize-none text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSubmitReply(comment.id)}
                            className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Enviar
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                            className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {commentReplies.length > 0 && (
                      <div className="mt-3 ml-8 space-y-2">
                        {commentReplies.map(reply => (
                          <div key={reply.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">{reply.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs font-medium text-gray-900">
                                    {reply.author?.full_name || 'Usuario'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(reply.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                                  </p>
                                </div>
                              </div>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteReply(reply.id)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition ml-2"
                                  title="Eliminar respuesta"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
