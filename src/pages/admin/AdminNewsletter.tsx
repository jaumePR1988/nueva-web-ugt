import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import {
  FileText, BarChart3, FileDown, Mail, Trash2,
  Calendar, Image as ImageIcon, Users, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Import modular types and components
import { ContentType, NewsletterContent, NewsletterEdition, Subscriber } from '../../components/admin/newsletter/types';
import NewsletterDashboard from '../../components/admin/newsletter/NewsletterDashboard';
import ContentManagement from '../../components/admin/newsletter/ContentManagement';
import NewsletterList from '../../components/admin/newsletter/NewsletterList';
import NewsletterEditorModal from '../../components/admin/newsletter/NewsletterEditorModal';
import NewsletterPreviewModal from '../../components/admin/newsletter/NewsletterPreviewModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AdminNewsletter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'generated'>('dashboard');
  const [loading, setLoading] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalContent: 0,
    newslettersGenerated: 0,
    newThisMonth: 0,
    growthRate: 0
  });

  const [contents, setContents] = useState<NewsletterContent[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterEdition[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState({ labels: [] as string[], data: [] as number[] });
  const [autoGenEnabled, setAutoGenEnabled] = useState(false);
  const [lastGenDate, setLastGenDate] = useState<string | null>(null);

  // Content Form State
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingContent, setEditingContent] = useState<NewsletterContent | null>(null);
  const [contentForm, setContentForm] = useState({
    type: 'news' as ContentType,
    title: '',
    content: '',
    image_url: '',
    is_published: false
  });

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNewsletter, setEditingNewsletter] = useState<NewsletterEdition | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterEdition | null>(null);
  const [previewContent, setPreviewContent] = useState('');

  // Delete Subscriber State
  const [showDeleteSubscriberModal, setShowDeleteSubscriberModal] = useState(false);
  const [deleteSubscriberId, setDeleteSubscriberId] = useState<string | null>(null);
  const [deletingSubscriber, setDeletingSubscriber] = useState(false);

  useEffect(() => {
    loadDashboardStats();
    loadContents();
    loadNewsletters();
    loadSubscribers();
    // loadMonthlyGrowth is called within loadDashboardStats or we need to ensure data is ready.
    // The original code called it separately or as part of stats. Let's make sure.
    // In strict mode, useEffect might fire twice.
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setAutoGenEnabled(data.auto_generation_enabled !== false);
        setLastGenDate(data.last_generation_date);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const startThisMonth = startOfMonth(now);
      const startLastMonth = startOfMonth(subMonths(now, 1));
      const endLastMonth = endOfMonth(subMonths(now, 1));

      const [
        totalSubResult,
        activeSubResult,
        contentResult,
        generatedResult,
        newThisMonthResult,
        lastMonthResult
      ] = await Promise.all([
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('newsletter_content').select('id', { count: 'exact', head: true }),
        supabase.from('newsletter_editions').select('id', { count: 'exact', head: true }),
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).gte('subscribed_at', startThisMonth.toISOString()),
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).gte('subscribed_at', startLastMonth.toISOString()).lte('subscribed_at', endLastMonth.toISOString())
      ]);

      const totalSub = totalSubResult.count || 0;
      const activeSub = activeSubResult.count || 0;
      const totalCont = contentResult.count || 0;
      const totalNews = generatedResult.count || 0;
      const newThisMonth = newThisMonthResult.count || 0;
      const lastMonthSubs = lastMonthResult.count || 0;

      const growthRate = lastMonthSubs > 0
        ? Math.round(((newThisMonth - lastMonthSubs) / lastMonthSubs) * 100)
        : 0;

      setStats({
        totalSubscribers: totalSub,
        activeSubscribers: activeSub,
        totalContent: totalCont,
        newslettersGenerated: totalNews,
        newThisMonth: newThisMonth,
        growthRate: growthRate
      });

      // Fetch minimal data for chart, only subscribed_at
      const { data: subscribersDates } = await supabase.from('newsletter_subscribers').select('subscribed_at');
      if (subscribersDates) {
        calculateMonthlyGrowth(subscribersDates);
      }

    } catch (error) {
      console.error('Error stats:', error);
      toast.error('Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyGrowth = (subscribersData: any[]) => {
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const count = subscribersData.filter(s => {
        const d = new Date(s.subscribed_at);
        return d >= monthStart && d <= monthEnd;
      }).length;

      labels.push(format(monthDate, 'MMM yyyy', { locale: es }));
      data.push(count);
    }
    setMonthlyGrowth({ labels, data });
  };

  const loadContents = async () => {
    const { data } = await supabase.from('newsletter_content').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) setContents(data);
  };

  const loadNewsletters = async () => {
    // Exclude 'content' column to save bandwidth/memory
    const { data } = await supabase.from('newsletter_editions')
      .select('id, title, status, subscribers_count, created_at, sent_at, created_by, auto_generated')
      .order('created_at', { ascending: false });
    if (data) setNewsletters(data as any);
  };

  const loadSubscribers = async () => {
    // Limit to 20 for dashboard display
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }).limit(20);
    if (data) setSubscribers(data);
  };

  const toggleAutoGeneration = async () => {
    const newValue = !autoGenEnabled;
    try {
      const { data: configData } = await supabase.from('newsletter_config').select('id').limit(1).single();
      if (configData) {
        await supabase.from('newsletter_config').update({ auto_generation_enabled: newValue, updated_at: new Date().toISOString() }).eq('id', configData.id);
        setAutoGenEnabled(newValue);
        toast.success(newValue ? 'Generación automática activada' : 'Generación automática desactivada');
      } else {
        const { error } = await supabase.from('newsletter_config').insert({ auto_generation_enabled: newValue });
        if (!error) {
          setAutoGenEnabled(newValue);
          toast.success(newValue ? 'Generación automática activada' : 'Generación automática desactivada');
        }
      }
    } catch (error) {
      toast.error('Error al actualizar configuración');
    }
  };

  const handleGenerateDraft = async () => {
    try {
      setLoading(true);
      toast.info('Generando borrador...');

      const { data: latestNews } = await supabase.from('newsletter_content').select('*').eq('type', 'news').limit(5);
      const { data: latestEvents } = await supabase.from('newsletter_content').select('*').eq('type', 'events').limit(4);

      const title = `Newsletter ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;

      const { error } = await supabase
        .from('newsletter_editions')
        .insert({
          title,
          status: 'draft',
          auto_generated: false,
          subscribers_count: stats.activeSubscribers,
          content: {
            sections: {
              news: latestNews || [],
              events: latestEvents || [],
              surveys: []
            }
          }
        });

      if (error) throw error;
      toast.success('Borrador generado con éxito');
      loadNewsletters();
      setActiveTab('generated');
    } catch (error) {
      toast.error('Error al generar borrador');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingContent) {
        await supabase.from('newsletter_content').update({ ...contentForm }).eq('id', editingContent.id);
        toast.success('Contenido actualizado');
      } else {
        await supabase.from('newsletter_content').insert({ ...contentForm });
        toast.success('Contenido creado');
      }
      setShowContentForm(false);
      loadContents();
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (confirm('¿Eliminar este contenido?')) {
      await supabase.from('newsletter_content').delete().eq('id', id);
      toast.success('Contenido eliminado');
      loadContents();
    }
  };

  // Helper to fetch full newsletter data including 'content'
  const fetchFullNewsletter = async (id: string): Promise<NewsletterEdition | null> => {
    const { data, error } = await supabase.from('newsletter_editions').select('*').eq('id', id).single();
    if (error) {
      toast.error('Error al cargar detalles del newsletter');
      return null;
    }
    return data;
  };

  const handleEditNewsletter = async (partialNews: NewsletterEdition) => {
    setLoading(true);
    const fullNews = await fetchFullNewsletter(partialNews.id);
    setLoading(false);
    if (fullNews) {

      // Ensure items have UIDs when opening
      const safeSections = fullNews.content?.sections || {};
      const ensureUid = (items: any[]) => items?.map((item: any) => ({ ...item, uid: item.uid || crypto.randomUUID() })) || [];

      const processedNews = {
        ...fullNews,
        content: {
          ...fullNews.content,
          sections: {
            ...safeSections,
            news: ensureUid(safeSections.news),
            events: ensureUid(safeSections.events),
            statistics: ensureUid(safeSections.statistics),
            directives: ensureUid(safeSections.directives),
            suggestions: ensureUid(safeSections.suggestions),
          }
        }
      };

      setEditingNewsletter(processedNews);
      setShowEditModal(true);
    }
  };

  const handlePreviewNewsletter = async (partialNews: NewsletterEdition) => {
    setLoading(true);
    const fullNews = await fetchFullNewsletter(partialNews.id);
    setLoading(false);

    if (fullNews) {
      setSelectedNewsletter(fullNews);
      setPreviewContent(fullNews.content?.html || '<p class="p-8 text-center text-gray-500 italic">No hay contenido HTML generado para esta edición.</p>');
      setShowPreviewModal(true);
    }
  };

  const handleDeleteNewsletter = async (id: string) => {
    if (confirm('¿Eliminar este registro de newsletter?')) {
      await supabase.from('newsletter_editions').delete().eq('id', id);
      toast.success('Registro eliminado');
      loadNewsletters();
    }
  };

  const handleSaveEditedContentFromModal = async (data: { title: string; html: string; sections: any }) => {
    if (!editingNewsletter) return;
    const { error } = await supabase
      .from('newsletter_editions')
      .update({
        title: data.title,
        content: {
          ...editingNewsletter.content,
          html: data.html,
          sections: data.sections
        }
      })
      .eq('id', editingNewsletter.id);
    if (error) throw error;
    loadNewsletters();
  };

  const handleGeneratePDF = async (partialNews: NewsletterEdition) => {
    toast.info('Cargando datos para impresión...');
    const fullNews = await fetchFullNewsletter(partialNews.id);
    if (!fullNews) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${fullNews.title} - UGT Towa</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; color: #333; }
            h1, h2, h3, h4, h5, h6 { color: #e50000; break-after: avoid; }
            p { margin-bottom: 1em; line-height: 1.6; }
            img { max-width: 100%; height: auto; display: block; margin: 15px 0; break-inside: avoid; }
            ul, ol { margin-bottom: 1em; }
            li { margin-bottom: 0.5em; }
            div, article, section, .newsletter-section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 20px; }
            @media print { 
              @page { size: A4; margin: 1.5cm; }
              body { padding: 0; }
              div { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${fullNews.content?.html || 'Sin contenido'}
        </body>
      </html >
    `);

    setTimeout(() => {
      printWindow.print();
      // printWindow.close(); // Optional: Close after print
    }, 1000);

    if (fullNews.status === 'draft') {
      await supabase.from('newsletter_editions').update({ status: 'published' }).eq('id', fullNews.id);
      loadNewsletters(); // Refresh state
    }
  };

  const confirmDeleteSubscriber = (id: string) => {
    setDeleteSubscriberId(id);
    setShowDeleteSubscriberModal(true);
  };

  const deleteSubscriber = async () => {
    if (!deleteSubscriberId) return;
    setDeletingSubscriber(true);
    try {
      await supabase.from('newsletter_subscribers').delete().eq('id', deleteSubscriberId);
      toast.success('Suscriptor eliminado');
      loadSubscribers();
      loadDashboardStats();
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setDeletingSubscriber(false);
      setShowDeleteSubscriberModal(false);
    }
  };

  const exportSubscribersToExcel = async () => {
    toast.info('Exportando...');
    try {
      const { data: allSubscribers, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error || !allSubscribers) throw error;

      const data = allSubscribers.map(s => ({
        Email: s.email,
        Nombre: s.name || '-',
        Fecha: new Date(s.subscribed_at).toLocaleDateString(),
        Estado: s.is_active ? 'Activo' : 'Inactivo'
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Suscriptores");
      XLSX.writeFile(wb, "suscriptores-newsletter.xlsx");
      toast.success('Exportación completada');
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar');
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'news': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'events': return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'gallery': return <ImageIcon className="w-5 h-5 text-purple-500" />;
      case 'surveys': return <BarChart3 className="w-5 h-5 text-green-500" />;
      case 'statistics': return <BarChart3 className="w-5 h-5 text-indigo-500" />;
      case 'directives': return <Users className="w-5 h-5 text-teal-500" />;
      case 'suggestions': return <MessageSquare className="w-5 h-5 text-yellow-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getContentTypeName = (type: ContentType) => {
    const map: any = {
      news: 'Noticia',
      events: 'Evento',
      gallery: 'Galería',
      surveys: 'Encuesta',
      statistics: 'Estadística',
      directives: 'Directivo',
      suggestions: 'Sugerencia'
    };
    return map[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg shadow-red-200">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Newsletters</h1>
          </div>
          <p className="text-gray-600">Sistema centralizado para la comunicación mensual con los afiliados.</p>
        </div>

        {/* Pestañas de Navegación */}
        <div className="bg-white rounded-2xl shadow-sm mb-8 p-1.5 flex gap-1 border border-gray-100 max-w-2xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'dashboard' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'content' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileText className="w-4 h-4" /> Contenido
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'generated' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileDown className="w-4 h-4" /> Newsletters
          </button>
        </div>

        {/* Contenido de las Pestañas */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && (
            <NewsletterDashboard
              stats={stats}
              monthlyGrowth={monthlyGrowth}
              autoGenEnabled={autoGenEnabled}
              lastGenDate={lastGenDate}
              loading={loading}
              subscribers={subscribers}
              onToggleAutoGeneration={toggleAutoGeneration}
              onGenerateDraft={handleGenerateDraft}
              onCreateContent={() => {
                setActiveTab('content');
                setShowContentForm(true);
              }}
              onExportSubscribers={exportSubscribersToExcel}
              onConfirmDeleteSubscriber={confirmDeleteSubscriber}
            />
          )}

          {activeTab === 'content' && (
            <ContentManagement
              contents={contents}
              showContentForm={showContentForm}
              editingContent={editingContent}
              contentForm={contentForm}
              loading={loading}
              onSetShowContentForm={setShowContentForm}
              onSetEditingContent={setEditingContent}
              onSetContentForm={setContentForm}
              onSaveContent={handleSaveContent}
              onDeleteContent={handleDeleteContent}
              onGetContentTypeIcon={getContentTypeIcon}
              onGetContentTypeName={getContentTypeName}
            />
          )}

          {activeTab === 'generated' && (
            <NewsletterList
              newsletters={newsletters}
              loading={loading}
              onEdit={handleEditNewsletter}
              onPreview={handlePreviewNewsletter}
              onPdfPreview={handleGeneratePDF}
              onDelete={handleDeleteNewsletter}
            />
          )}
        </div>
      </div>

      {/* Modales Modulares */}
      <NewsletterEditorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingNewsletter(null);
        }}
        newsletter={editingNewsletter}
        libraryContents={contents}
        onSave={handleSaveEditedContentFromModal}
        onGetContentTypeIcon={getContentTypeIcon}
        onGetContentTypeName={getContentTypeName}
      />

      <NewsletterPreviewModal
        isOpen={showPreviewModal}
        title={selectedNewsletter?.title}
        html={previewContent}
        onClose={() => setShowPreviewModal(false)}
      />

      {/* Modal de confirmación para eliminar suscriptor */}
      {showDeleteSubscriberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¿Eliminar Suscriptor?</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Esta acción es irreversible. Se eliminará permanentemente de la lista de distribución.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    setShowDeleteSubscriberModal(false);
                    setDeleteSubscriberId(null);
                  }}
                  disabled={deletingSubscriber}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteSubscriber}
                  disabled={deletingSubscriber}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-100"
                >
                  {deletingSubscriber ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
