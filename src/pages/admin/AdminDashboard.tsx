import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, FileText, Calendar, Vote, Users, MessageSquare,
  Tag, FolderOpen, Inbox, BarChart3, FolderTree, QrCode,
  Image, UserCheck, BookOpen, Gift, Shield, Bell,
  CheckCircle, AlertCircle, TrendingUp, ArrowRight, Clock, Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const { isEditor } = useAuth();
  const [stats, setStats] = useState({
    communiques: 0,
    appointments: 0,
    surveys: 0,
    delegates: 0,
    comments: 0,
    suggestions: 0,
    pendingAppointments: 0,
    recentSuggestions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [com, apt, srv, del, cmt, sug, pendingApt, recentSug] = await Promise.all([
      supabase.from('communiques').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('surveys').select('id', { count: 'exact', head: true }),
      supabase.from('delegates').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('suggestions').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('date', today).eq('status', 'confirmed'),
      supabase.from('suggestions').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    setStats({
      communiques: com.count || 0,
      appointments: apt.count || 0,
      surveys: srv.count || 0,
      delegates: del.count || 0,
      comments: cmt.count || 0,
      suggestions: sug.count || 0,
      pendingAppointments: pendingApt.count || 0,
      recentSuggestions: recentSug.count || 0
    });
    setLoading(false);
  }

  const [activeCategory, setActiveCategory] = useState<'all' | 'content' | 'users' | 'engagement' | 'config'>('all');

  const menuItems = [
    // Contenido
    { to: '/admin/comunicados', icon: FileText, title: 'Noticias / Comunicados', desc: 'Publicación de contenido', category: 'content' },
    { to: '/admin/galeria', icon: Image, title: 'Galería de Eventos', desc: 'Gestión de fotos y eventos', category: 'content' },
    { to: '/admin/newsletter', icon: BookOpen, title: 'Revista / Newsletter', desc: 'Envíos y boletines', category: 'content' },
    { to: '/admin/notificaciones', icon: Bell, title: 'Notificaciones Push', desc: 'Comunicación directa PWA', category: 'content' },

    // Usuarios
    { to: '/admin/afiliados', icon: UserCheck, title: 'Censo Afiliados', desc: 'Validación de usuarios', category: 'users' },
    { to: '/admin/administradores', icon: Shield, title: 'Gestión Admins', desc: 'Control de acceso', category: 'users' },
    { to: '/admin/quienes-somos', icon: Users, title: 'Equipo / Delegados', desc: 'Gestión de representantes', category: 'users' },

    // Participación / Operativo
    { to: '/admin/citas', icon: Calendar, title: 'Gestión de Citas', desc: 'Calendario y solicitudes', category: 'engagement' },
    { to: '/admin/encuestas', icon: Vote, title: 'Encuestas', desc: 'Participación y votos', category: 'engagement' },
    { to: '/admin/encuestas-analisis', icon: BarChart3, title: 'Análisis Encuestas', desc: 'Resultados detallados', category: 'engagement' },
    { to: '/admin/sugerencias', icon: MessageSquare, title: 'Buzón Ético', desc: 'Mensajes anónimos', category: 'engagement' },
    { to: '/admin/comentarios', icon: MessageSquare, title: 'Comentarios', desc: 'Moderación de noticias', category: 'engagement' },

    // Gestión / Configuración
    { to: '/admin/documentos', icon: FolderOpen, title: 'Archivo Digital', desc: 'Documentos y actas', category: 'config' },
    { to: '/admin/beneficios-ugt', icon: Gift, title: 'Convenios / Ayudas', desc: 'Ventajas para afiliados', category: 'config' },
    { to: '/admin/qr', icon: QrCode, title: 'Generador QR', desc: 'Afiliación y eventos', category: 'config' },
    { to: '/admin/categorias', icon: Tag, title: 'Categorías Noticias', desc: 'Organización de contenido', category: 'config' }
  ];

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const finalItems = isEditor
    ? filteredItems.filter(item =>
      (item.category === 'content' || item.category === 'config') &&
      item.to !== '/admin/notificaciones'
    )
    : filteredItems;

  const categories = [
    { id: 'all', label: 'Todo', icon: LayoutDashboard },
    { id: 'content', label: 'Contenido', icon: FileText },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'engagement', label: 'Participación', icon: MessageSquare },
    { id: 'config', label: 'Gestión', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Header con Contexto */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="flex items-center">
            <div className="p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mr-5">
              <LayoutDashboard className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Centro de Control</p>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Administración UGT</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="px-4 py-2 text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Estado Sistema</p>
              <p className="text-sm font-bold text-green-600 flex items-center justify-end">
                <CheckCircle className="h-3 w-3 mr-1" /> En línea
              </p>
            </div>
            <button
              onClick={loadStats}
              className="p-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-red-600"
              title="Actualizar datos"
            >
              <TrendingUp className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Widgets de Acción Inmediata */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Alerta Citas */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-blue-900/5 border border-blue-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
              <Calendar className="h-24 w-24 text-blue-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center text-blue-600 font-bold text-sm mb-4">
                <Clock className="h-4 w-4 mr-2" /> Próximas Citas
              </div>
              <p className="text-4xl font-black text-gray-900 mb-2">{stats.pendingAppointments}</p>
              <p className="text-gray-500 text-sm mb-6">Citas pendientes de atender hoy y próximos días.</p>
              <Link to="/admin/citas" className="inline-flex items-center text-blue-600 font-bold text-sm hover:underline">
                Gestionar Agenda <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Alerta Sugerencias */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-orange-900/5 border border-orange-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-24 w-24 text-orange-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center text-orange-600 font-bold text-sm mb-4">
                <AlertCircle className="h-4 w-4 mr-2" /> Buzón Ético
              </div>
              <p className="text-4xl font-black text-gray-900 mb-2">{stats.recentSuggestions}</p>
              <p className="text-gray-500 text-sm mb-6">Nuevas sugerencias recibidas en los últimos 7 días.</p>
              <Link to="/admin/sugerencias" className="inline-flex items-center text-orange-600 font-bold text-sm hover:underline">
                Revisar Buzón <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Access Grid Summary */}
          <div className="bg-gray-900 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Acceso Rápido</h3>
                <p className="text-gray-400 text-sm mb-6">Accesos directos a las funciones más utilizadas cada día.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin/comunicados" className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition text-center text-xs font-bold">Nuevo Comunicado</Link>
                <Link to="/admin/notificaciones" className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition text-center text-xs font-bold">Enviar Aviso</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Menú de Gestión con Pestañas */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-black text-gray-900 px-2 flex-shrink-0">Gestión de Módulos</h2>
          <div className="flex overflow-x-auto pb-2 md:pb-0 space-x-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shadow-sm border ${activeCategory === cat.id
                  ? 'bg-red-600 text-white border-red-600 shadow-red-200'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-red-200 hover:text-red-600'
                  }`}
              >
                <cat.icon className="h-4 w-4" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
          {finalItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-red-50 transition-colors">
                    <item.icon className="h-6 w-6 text-gray-400 group-hover:text-red-600 transition-colors" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-200 group-hover:text-red-600 translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <Icon className="h-6 w-6 text-red-600 opacity-40" />
        </div>
      </div>
    </div>
  );
}
