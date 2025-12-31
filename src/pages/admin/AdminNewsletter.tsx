import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import { 
  Mail, FileDown, Users, BarChart3, Plus, Trash2, Edit, Eye, 
  FileText, Calendar, TrendingUp, MessageSquare, Lightbulb,
  AlertCircle, CheckCircle, Clock, Download
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type ContentType = 'news' | 'events' | 'statistics' | 'directives' | 'suggestions';

interface NewsletterContent {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  is_published: boolean;
  published_at: string | null;
}

interface NewsletterEdition {
  id: string;
  title: string;
  content: any;
  status: 'draft' | 'sent' | 'published';
  subscribers_count: number;
  created_at: string;
  sent_at: string | null;
  created_by: string | null;
  auto_generated: boolean;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  is_active: boolean;
}

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
  
  const [monthlyGrowth, setMonthlyGrowth] = useState<{labels: string[], data: number[]}>({
    labels: [],
    data: []
  });

  // Content management
  const [contents, setContents] = useState<NewsletterContent[]>([]);
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingContent, setEditingContent] = useState<NewsletterContent | null>(null);
  const [contentForm, setContentForm] = useState({
    type: 'news' as ContentType,
    title: '',
    content: '',
    image_url: '',
    is_published: false
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Newsletters
  const [newsletters, setNewsletters] = useState<NewsletterEdition[]>([]);
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterEdition | null>(null);
  const [autoGenEnabled, setAutoGenEnabled] = useState(true);
  const [lastGenDate, setLastGenDate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editingNewsletter, setEditingNewsletter] = useState<NewsletterEdition | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');


  // Subscribers
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  
  // Estados para eliminar suscriptores
  const [deleteSubscriberId, setDeleteSubscriberId] = useState<string | null>(null);
  const [showDeleteSubscriberModal, setShowDeleteSubscriberModal] = useState<boolean>(false);
  const [deletingSubscriber, setDeletingSubscriber] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardStats();
    loadContents();
    loadNewsletters();
    loadSubscribers();
    loadConfig();
    
    // Auto-actualización cada 30 segundos
    const interval = setInterval(() => {
      loadDashboardStats();
      loadSubscribers();
      loadConfig();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Función auxiliar para crear HTML limpio del newsletter (solo contenido)
  const createProfessionalNewsletterHTML = (subject: string, content: string) => {
    // HTML optimizado para PDF con mejor compatibilidad para códigos QR y contenido largo
    return `
      <div style="width: 800px; min-height: 1100px; background: white; color: #2c3e50; line-height: 1.6; padding: 40px; font-family: Georgia, serif; box-sizing: border-box;">
        <div style="clear: both; overflow: visible; position: relative;">
          ${content}
        </div>
      </div>
    `;
  };

  const loadDashboardStats = async () => {
    try {
      const [subsResult, contentResult, generatedResult] = await Promise.all([
        supabase.from('newsletter_subscribers').select('id, is_active, subscribed_at'),
        supabase.from('newsletter_content').select('id'),
        supabase.from('newsletter_editions').select('id')
      ]);

      const totalSubs = subsResult.data?.length || 0;
      const activeSubs = subsResult.data?.filter(s => s.is_active).length || 0;
      
      // Calcular nuevos suscriptores este mes
      const now = new Date();
      const startThisMonth = startOfMonth(now);
      const newThisMonth = subsResult.data?.filter(s => {
        const subDate = parseISO(s.subscribed_at);
        return subDate >= startThisMonth;
      }).length || 0;
      
      // Calcular tasa de crecimiento (comparado con mes anterior)
      const startLastMonth = startOfMonth(subMonths(now, 1));
      const endLastMonth = endOfMonth(subMonths(now, 1));
      const lastMonthSubs = subsResult.data?.filter(s => {
        const subDate = parseISO(s.subscribed_at);
        return subDate >= startLastMonth && subDate <= endLastMonth;
      }).length || 0;
      
      const growthRate = lastMonthSubs > 0 
        ? Math.round(((newThisMonth - lastMonthSubs) / lastMonthSubs) * 100)
        : 0;

      setStats({
        totalSubscribers: totalSubs,
        activeSubscribers: activeSubs,
        totalContent: contentResult.data?.length || 0,
        newslettersGenerated: generatedResult.data?.length || 0,
        newThisMonth,
        growthRate
      });
      
      // Calcular crecimiento mensual para gráfico (últimos 12 meses)
      calculateMonthlyGrowth(subsResult.data || []);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  const calculateMonthlyGrowth = (subscribers: any[]) => {
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const count = subscribers.filter(s => {
        const subDate = parseISO(s.subscribed_at);
        return subDate >= monthStart && subDate <= monthEnd;
      }).length;
      
      labels.push(format(monthDate, 'MMM yyyy', { locale: es }));
      data.push(count);
    }
    
    setMonthlyGrowth({ labels, data });
  };

  const loadContents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error loading contents:', error);
      toast.error('Error cargando contenido');
    } finally {
      setLoading(false);
    }
  };

  const loadNewsletters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_editions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsletters(data || []);
    } catch (error) {
      console.error('Error loading newsletters:', error);
      toast.error('Error cargando newsletters');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false});

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    }
  };

  function confirmDeleteSubscriber(id: string) {
    setDeleteSubscriberId(id);
    setShowDeleteSubscriberModal(true);
  }

  async function deleteSubscriber() {
    if (!deleteSubscriberId) return;
    
    setDeletingSubscriber(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', deleteSubscriberId);

      if (error) throw error;

      toast.success('Suscriptor eliminado correctamente');
      setShowDeleteSubscriberModal(false);
      setDeleteSubscriberId(null);
      loadSubscribers();
      loadDashboardStats();
    } catch (error) {
      console.error('Error al eliminar suscriptor:', error);
      toast.error('Error al eliminar el suscriptor');
    } finally {
      setDeletingSubscriber(false);
    }
  }

  const loadConfig = async () => {
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
      console.error('Error loading config:', error);
    }
  };

  const toggleAutoGeneration = async () => {
    setLoading(true);
    try {
      const { data: configData } = await supabase
        .from('newsletter_config')
        .select('id')
        .limit(1)
        .single();

      if (!configData) {
        toast.error('Configuración no encontrada');
        return;
      }

      const newValue = !autoGenEnabled;
      const { error } = await supabase
        .from('newsletter_config')
        .update({ 
          auto_generation_enabled: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', configData.id);

      if (error) throw error;

      setAutoGenEnabled(newValue);
      toast.success(newValue ? 'Generación automática activada' : 'Generación automática desactivada');
    } catch (error) {
      console.error('Error toggling auto generation:', error);
      toast.error('Error actualizando configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5242880) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const { data, error } = await supabase.functions.invoke('upload-newsletter-image', {
          body: {
            imageData: base64Data,
            fileName: file.name
          }
        });

        if (error) throw error;

        setContentForm(prev => ({ ...prev, image_url: data.data.publicUrl }));
        toast.success('Imagen subida exitosamente');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error subiendo imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveContent = async () => {
    if (!contentForm.title.trim() || !contentForm.content.trim()) {
      toast.error('Título y contenido son requeridos');
      return;
    }

    setLoading(true);

    try {
      if (editingContent) {
        const { error } = await supabase
          .from('newsletter_content')
          .update({
            ...contentForm,
            published_at: contentForm.is_published ? new Date().toISOString() : null
          })
          .eq('id', editingContent.id);

        if (error) throw error;
        toast.success('Contenido actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('newsletter_content')
          .insert({
            ...contentForm,
            created_by: user?.id,
            published_at: contentForm.is_published ? new Date().toISOString() : null
          });

        if (error) throw error;
        toast.success('Contenido creado exitosamente');
      }

      setShowContentForm(false);
      setEditingContent(null);
      setContentForm({
        type: 'news',
        title: '',
        content: '',
        image_url: '',
        is_published: false
      });
      loadContents();
      loadDashboardStats();
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Error guardando contenido');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este contenido?')) return;

    try {
      const { error } = await supabase
        .from('newsletter_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Contenido eliminado');
      loadContents();
      loadDashboardStats();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Error eliminando contenido');
    }
  };

  const handleGenerateDraft = async () => {
    if (!confirm('¿Generar borrador del newsletter con el contenido publicado del mes actual?')) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-monthly-draft', {});

      if (error) throw error;

      toast.success(data.data.message);
      loadNewsletters();
    } catch (error) {
      console.error('Error generating draft:', error);
      toast.error('Error generando borrador');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewNewsletter = async (newsletter: NewsletterEdition) => {
    setSelectedNewsletter(newsletter);
    // Extraer HTML del content JSONB
    const htmlContent = newsletter.content?.html || '';
    const cleanHtml = createProfessionalNewsletterHTML(newsletter.title, htmlContent);
    setPreviewHtml(cleanHtml);
    setShowPreview(true);
  };

  const handleEditNewsletter = (newsletter: NewsletterEdition) => {
    setEditingNewsletter(newsletter);
    const htmlContent = newsletter.content?.html || '';
    setEditedContent(htmlContent);
    
    // Esperar un momento para que el DOM se actualice, luego establecer el contenido
    setTimeout(() => {
      const editor = document.getElementById('newsletter-editor') as HTMLElement;
      if (editor && htmlContent) {
        editor.innerHTML = htmlContent;
      }
    }, 100);
    
    setShowEditModal(true);
  };



  const handleSaveEditedContent = async () => {
    if (!editingNewsletter) return;

    setLoading(true);
    try {
      // Actualizar el content JSONB con el HTML editado
      const updatedContent = {
        ...editingNewsletter.content,
        html: editedContent
      };
      
      const { error } = await supabase
        .from('newsletter_editions')
        .update({ content: updatedContent })
        .eq('id', editingNewsletter.id);

      if (error) throw error;

      toast.success('Contenido actualizado exitosamente');
      setShowEditModal(false);
      setEditingNewsletter(null);
      setEditedContent('');

      loadNewsletters();
    } catch (error) {
      console.error('Error updating newsletter:', error);
      toast.error('Error actualizando contenido');
    } finally {
      setLoading(false);
    }
  };

  // Editor visual functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    setEditedContent(getCurrentContent());
  };

  const getCurrentContent = () => {
    const editor = document.getElementById('newsletter-editor') as HTMLElement;
    return editor ? editor.innerHTML : editedContent;
  };

  const setContent = (content: string) => {
    const editor = document.getElementById('newsletter-editor') as HTMLElement;
    if (editor) {
      editor.innerHTML = content;
    }
    setEditedContent(content);
  };

  const addParagraph = () => {
    const editor = document.getElementById('newsletter-editor') as HTMLElement;
    if (editor) {
      editor.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        range.insertNode(p);
        range.setStart(p, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    setEditedContent(getCurrentContent());
  };

  const insertLink = () => {
    const url = prompt('Ingrese la URL del enlace:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const showVisualPreview = () => {
    const content = getCurrentContent();
    setPreviewContent(content);
    setShowPreviewModal(true);
  };

  const handleGeneratePDF = async (newsletter: NewsletterEdition) => {
    console.log('=== GENERANDO PDF PROFESIONAL ===');
    console.log('Newsletter ID:', newsletter.id);
    console.log('Newsletter Title:', newsletter.title);
    
    setLoading(true);
    toast.info('Generando vista optimizada para PDF...');

    try {
      // CARGAR EL CONTENIDO MÁS RECIENTE
      const { data: newsletterData, error: loadError } = await supabase
        .from('newsletter_editions')
        .select('content')
        .eq('id', newsletter.id)
        .single();

      if (loadError) {
        console.error('Error cargando newsletter:', loadError);
        throw loadError;
      }

      const htmlContent = editingNewsletter?.id === newsletter.id ? editedContent : (newsletterData?.content?.html || newsletter.content?.html || '');
      
      if (!htmlContent || htmlContent.trim() === '') {
        throw new Error('El contenido del newsletter está vacío');
      }

      console.log('Contenido HTML cargado, longitud:', htmlContent.length);
      
      // Llamar a la Edge Function para obtener HTML optimizado para PDF
      const { data, error } = await supabase.functions.invoke('generate-newsletter-pdf', {
        body: { newsletterId: newsletter.id }
      });

      if (error) {
        console.error('Error llamando a Edge Function:', error);
        throw error;
      }

      const optimizedHtml = data?.data?.htmlContent;
      
      if (!optimizedHtml) {
        throw new Error('No se recibió HTML optimizado del servidor');
      }

      console.log('HTML profesional recibido del servidor');
      
      // Abrir en nueva ventana para impresión
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Por favor, permite las ventanas emergentes para generar el PDF');
      }

      printWindow.document.write(optimizedHtml);
      printWindow.document.close();

      // Esperar que se cargue el contenido
      printWindow.onload = function() {
        console.log('Contenido cargado en ventana de impresión');
        
        // Abrir diálogo de impresión automáticamente
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      // Actualizar base de datos
      const { error: updateError } = await supabase
        .from('newsletter_editions')
        .update({
          status: 'published'
        })
        .eq('id', newsletter.id);

      if (updateError) {
        console.error('Error actualizando stats:', updateError);
      }

      toast.success('Vista PDF abierta. Use Ctrl+P o Cmd+P para guardar como PDF');
      loadNewsletters();
      loadDashboardStats();

    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error generando PDF: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const exportSubscribersToExcel = () => {
    try {
      toast.info('Generando archivo Excel...');

      // Preparar datos para Excel
      const excelData = subscribers.map((sub, index) => ({
        '#': index + 1,
        'Email': sub.email,
        'Nombre': sub.name || 'Sin nombre',
        'Estado': sub.is_active ? 'Activo' : 'Inactivo',
        'Fecha de Suscripción': format(new Date(sub.subscribed_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })
      }));

      // Crear workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Suscriptores');

      // Ajustar anchos de columnas
      const colWidths = [
        { wch: 5 },   // #
        { wch: 35 },  // Email
        { wch: 25 },  // Nombre
        { wch: 10 },  // Estado
        { wch: 30 }   // Fecha
      ];
      worksheet['!cols'] = colWidths;

      // Generar archivo
      const fileName = `suscriptores-newsletter-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Archivo Excel descargado: ${fileName}`);
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      toast.error('Error al exportar a Excel');
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'news': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'events': return <Calendar className="w-5 h-5 text-green-600" />;
      case 'statistics': return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'directives': return <MessageSquare className="w-5 h-5 text-orange-600" />;
      case 'suggestions': return <Lightbulb className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getContentTypeName = (type: ContentType) => {
    const names = {
      news: 'Noticia',
      events: 'Evento',
      statistics: 'Estadística',
      directives: 'Comunicado',
      suggestions: 'Sugerencia'
    };
    return names[type];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'draft': return <Clock className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Newsletter</h1>
          <p className="text-gray-600">Sistema de newsletter mensual sindical - Generación de PDF</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'dashboard'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Dashboard
                </div>
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'content'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contenido
                </div>
              </button>
              <button
                onClick={() => setActiveTab('generated')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'generated'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileDown className="w-5 h-5" />
                  Newsletters Generados
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Suscriptores Totales</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalSubscribers}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Suscriptores Activos</p>
                    <p className="text-3xl font-bold text-green-600">{stats.activeSubscribers}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Contenido Creado</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalContent}</p>
                  </div>
                  <FileText className="w-12 h-12 text-purple-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">PDFs Generados</p>
                    <p className="text-3xl font-bold text-red-600">{stats.newslettersGenerated}</p>
                  </div>
                  <FileDown className="w-12 h-12 text-red-600" />
                </div>
              </div>
            </div>
            
            {/* Configuración de Generación Automática */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Generación Automática Mensual</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {autoGenEnabled ? 'Activada - Se ejecuta el día 1 de cada mes a las 9:00 AM' : 'Desactivada - No se generarán newsletters automáticamente'}
                  </p>
                  {lastGenDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Última generación: {new Date(lastGenDate).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={toggleAutoGeneration}
                  disabled={loading}
                  className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
                    autoGenEnabled ? 'bg-green-600' : 'bg-gray-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                      autoGenEnabled ? 'translate-x-10' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>Funcionamiento:</strong> El sistema extrae automáticamente los últimos 5 comunicados y 4 eventos de la galería para crear el newsletter mensual.
              </div>
            </div>
            
            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Nuevos Este Mes</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.newThisMonth}</p>
                    {stats.growthRate !== 0 && (
                      <p className={`text-sm mt-1 flex items-center ${stats.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}% vs mes anterior
                      </p>
                    )}
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Tasa de Actividad</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.totalSubscribers > 0 
                        ? Math.round((stats.activeSubscribers / stats.totalSubscribers) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.activeSubscribers} de {stats.totalSubscribers} activos
                    </p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-green-600" />
                </div>
              </div>
            </div>
            
            {/* Growth Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Crecimiento de Suscriptores (Últimos 12 Meses)
              </h2>
              <div className="h-80">
                <Line
                  data={{
                    labels: monthlyGrowth.labels,
                    datasets: [
                      {
                        label: 'Nuevos Suscriptores',
                        data: monthlyGrowth.data,
                        borderColor: 'rgb(220, 38, 38)',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        tension: 0.4,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top' as const,
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleGenerateDraft}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Generar Borrador Mensual
                </button>
                <button
                  onClick={() => {
                    setShowContentForm(true);
                    setEditingContent(null);
                    setContentForm({
                      type: 'news',
                      title: '',
                      content: '',
                      image_url: '',
                      is_published: false
                    });
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Crear Contenido
                </button>
              </div>
            </div>

            {/* Recent Subscribers */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Suscriptores Recientes</h2>
                <button
                  onClick={exportSubscribersToExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Exportar a Excel
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subscribers.slice(0, 10).map((sub) => (
                      <tr key={sub.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{sub.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{sub.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(sub.subscribed_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {sub.is_active ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Activo</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Inactivo</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <button
                            onClick={() => confirmDeleteSubscriber(sub.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                            aria-label="Eliminar suscriptor"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {!showContentForm ? (
              <>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Contenido del Newsletter</h2>
                    <button
                      onClick={() => {
                        setShowContentForm(true);
                        setEditingContent(null);
                        setContentForm({
                          type: 'news',
                          title: '',
                          content: '',
                          image_url: '',
                          is_published: false
                        });
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Nuevo Contenido
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contents.map((content) => (
                      <div key={content.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getContentTypeIcon(content.type)}
                            <span className="text-sm font-medium text-gray-700">
                              {getContentTypeName(content.type)}
                            </span>
                          </div>
                          {content.is_published && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Publicado
                            </span>
                          )}
                        </div>

                        {content.image_url && (
                          <img src={content.image_url} alt={content.title} className="w-full h-32 object-cover rounded mb-3" />
                        )}

                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{content.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{content.content}</p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingContent(content);
                              setContentForm({
                                type: content.type,
                                title: content.title,
                                content: content.content,
                                image_url: content.image_url || '',
                                is_published: content.is_published
                              });
                              setShowContentForm(true);
                            }}
                            className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteContent(content.id)}
                            className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {contents.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No hay contenido creado todavía
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-6">
                  {editingContent ? 'Editar Contenido' : 'Nuevo Contenido'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Contenido
                    </label>
                    <select
                      value={contentForm.type}
                      onChange={(e) => setContentForm({ ...contentForm, type: e.target.value as ContentType })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    >
                      <option value="news">Noticia</option>
                      <option value="events">Evento</option>
                      <option value="statistics">Estadística</option>
                      <option value="directives">Comunicado</option>
                      <option value="suggestions">Sugerencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={contentForm.title}
                      onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Título del contenido"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenido
                    </label>
                    <textarea
                      value={contentForm.content}
                      onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      rows={6}
                      placeholder="Descripción del contenido"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagen (opcional)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                      />
                      {uploadingImage && <span className="text-sm text-gray-500">Subiendo...</span>}
                    </div>
                    {contentForm.image_url && (
                      <div className="mt-3">
                        <img src={contentForm.image_url} alt="Preview" className="w-full max-w-md h-48 object-cover rounded" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={contentForm.is_published}
                      onChange={(e) => setContentForm({ ...contentForm, is_published: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="is_published" className="text-sm text-gray-700">
                      Publicar inmediatamente (incluir en próximo newsletter)
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveContent}
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {editingContent ? 'Actualizar' : 'Crear'} Contenido
                    </button>
                    <button
                      onClick={() => {
                        setShowContentForm(false);
                        setEditingContent(null);
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generated Newsletters Tab */}
        {activeTab === 'generated' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Newsletters Generados</h2>

              <div className="space-y-4">
                {newsletters.map((newsletter) => (
                  <div key={newsletter.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(newsletter.status)}
                          <h3 className="font-semibold text-gray-900">{newsletter.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                          {newsletter.status === 'sent' 
                            ? `Enviado el ${newsletter.sent_at ? new Date(newsletter.sent_at).toLocaleDateString('es-ES') : 'N/A'}`
                            : newsletter.status === 'published'
                            ? 'Publicado'
                            : 'Borrador'
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreviewNewsletter(newsletter)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Vista Previa
                        </button>
                        <button
                          onClick={() => handleEditNewsletter(newsletter)}
                          className="px-4 py-2 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(newsletter)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
                        >
                          <FileDown className="w-4 h-4" />
                          Generar PDF
                        </button>
                      </div>
                    </div>

                    {newsletter.status === 'sent' && (
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{newsletter.subscribers_count}</p>
                          <p className="text-sm text-gray-500">Suscriptores</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{newsletter.auto_generated ? 'Automático' : 'Manual'}</p>
                          <p className="text-sm text-gray-500">Tipo</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {newsletters.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No hay newsletters todavía
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && selectedNewsletter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedNewsletter.title}</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        )}

        {/* Edit Content Modal with Visual Editor */}
        {showEditModal && editingNewsletter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Editar Newsletter: {editingNewsletter.title}</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingNewsletter(null);
                    setEditedContent('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-auto">
                {/* Editor Toolbar */}
                <div className="border-b bg-gray-50 p-3">
                  <div className="flex flex-wrap gap-2">
                    {/* Format buttons */}
                    <div className="flex gap-1 border-r pr-3">
                      <button
                        type="button"
                        onClick={() => formatText('bold')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Negrita"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        onClick={() => formatText('italic')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Cursiva"
                      >
                        <em>I</em>
                      </button>
                      <button
                        type="button"
                        onClick={() => formatText('underline')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Subrayado"
                      >
                        <u>U</u>
                      </button>
                    </div>

                    {/* List buttons */}
                    <div className="flex gap-1 border-r pr-3">
                      <button
                        type="button"
                        onClick={() => formatText('insertUnorderedList')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Lista con viñetas"
                      >
                        • Lista
                      </button>
                      <button
                        type="button"
                        onClick={() => formatText('insertOrderedList')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Lista numerada"
                      >
                        1. Lista
                      </button>
                    </div>

                    {/* Alignment buttons */}
                    <div className="flex gap-1 border-r pr-3">
                      <button
                        type="button"
                        onClick={() => formatText('justifyLeft')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Alinear izquierda"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => formatText('justifyCenter')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Centrar"
                      >
                        ↔
                      </button>
                      <button
                        type="button"
                        onClick={() => formatText('justifyRight')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Alinear derecha"
                      >
                        →
                      </button>
                    </div>

                    {/* Content buttons */}
                    <div className="flex gap-1 border-r pr-3">
                      <button
                        type="button"
                        onClick={addParagraph}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Nuevo párrafo"
                      >
                        + Párrafo
                      </button>
                      <button
                        type="button"
                        onClick={insertLink}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                        title="Insertar enlace"
                      >
                        🔗 Enlace
                      </button>
                    </div>

                    {/* Preview button */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={showVisualPreview}
                        className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Vista Previa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Editor Area */}
                <div className="p-6">
                  <div className="border border-gray-300 rounded-lg min-h-96 bg-white">
                    <div
                      id="newsletter-editor"
                      contentEditable
                      className="p-4 outline-none min-h-96"
                      style={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#333'
                      }}
                      onInput={(e) => setEditedContent((e.target as HTMLElement).innerHTML)}
                      dangerouslySetInnerHTML={{ __html: editedContent }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Consejos:</strong> Use los botones de arriba para dar formato al texto, o escriba directamente. 
                    El contenido se guardará con formato automático.
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingNewsletter(null);
                    setEditedContent('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditedContent}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visual Preview Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Vista Previa del Newsletter</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <div 
                  className="bg-white border rounded-lg p-6"
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#000',
                    minHeight: '400px'
                  }}
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar suscriptor */}
        {showDeleteSubscriberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
                  <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Estás a punto de eliminar este suscriptor. Se eliminará permanentemente de la base de datos y no recibirá más newsletters.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteSubscriberModal(false);
                    setDeleteSubscriberId(null);
                  }}
                  disabled={deletingSubscriber}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteSubscriber}
                  disabled={deletingSubscriber}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-medium disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  {deletingSubscriber ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar Suscriptor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
