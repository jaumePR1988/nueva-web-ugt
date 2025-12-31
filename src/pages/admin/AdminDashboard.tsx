import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, FileText, Calendar, Vote, Users, MessageSquare, Tag, FolderOpen, Inbox, BarChart3, FolderTree, QrCode, Image, UserCheck, BookOpen, Gift, Shield, Bell } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    communiques: 0,
    appointments: 0,
    surveys: 0,
    delegates: 0,
    comments: 0,
    suggestions: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const [com, apt, srv, del, cmt, sug] = await Promise.all([
      supabase.from('communiques').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('surveys').select('id', { count: 'exact', head: true }),
      supabase.from('delegates').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('suggestions').select('id', { count: 'exact', head: true })
    ]);

    setStats({
      communiques: com.count || 0,
      appointments: apt.count || 0,
      surveys: srv.count || 0,
      delegates: del.count || 0,
      comments: cmt.count || 0,
      suggestions: sug.count || 0
    });
  }

  const menuItems = [
    { to: '/admin/notificaciones', icon: Bell, title: 'Notificaciones Push', desc: 'Enviar notificaciones a usuarios con PWA instalada' },
    { to: '/admin/quienes-somos', icon: Users, title: 'Quiénes Somos', desc: 'Gestionar delegados y contenido' },
    { to: '/admin/comunicados', icon: FileText, title: 'Comunicados', desc: 'Publicar y editar comunicados' },
    { to: '/admin/categorias', icon: Tag, title: 'Categorías', desc: 'Gestionar categorías de comunicados' },
    { to: '/admin/citas', icon: Calendar, title: 'Citas', desc: 'Ver y gestionar citas' },
    { to: '/admin/disponibilidad', icon: Calendar, title: 'Disponibilidad', desc: 'Configurar slots de citas' },
    { to: '/admin/encuestas', icon: Vote, title: 'Encuestas', desc: 'Crear y gestionar encuestas' },
    { to: '/admin/encuestas-analisis', icon: BarChart3, title: 'Análisis de Encuestas', desc: 'Ver estadísticas y exportar datos' },
    { to: '/admin/comentarios', icon: MessageSquare, title: 'Gestión de Comentarios', desc: 'Moderar y eliminar comentarios' },
    { to: '/admin/sugerencias', icon: Inbox, title: 'Buzón de Sugerencias', desc: 'Ver y gestionar sugerencias de usuarios' },
    { to: '/admin/documentos', icon: FolderOpen, title: 'Documentos', desc: 'Gestionar documentos relevantes' },
    { to: '/admin/categorias-documentos', icon: FolderTree, title: 'Categorías de Documentos', desc: 'Gestionar categorías de documentos' },
    { to: '/admin/qr', icon: QrCode, title: 'Gestion QR', desc: 'Gestionar codigo QR para sugerencias anonimas' },
    { to: '/admin/galeria', icon: Image, title: 'Galería de Eventos', desc: 'Gestionar imágenes del carrusel de eventos' },

    { to: '/admin/afiliados', icon: UserCheck, title: 'Gestión de Afiliados', desc: 'Marcar usuarios como afiliados UGT' },
    { to: '/admin/administradores', icon: Shield, title: 'Gestión de Administradores', desc: 'Crear y gestionar administradores del sistema' },
    { to: '/admin/documentos-sindicales', icon: BookOpen, title: 'Documentos Sindicales', desc: 'Gestionar documentos exclusivos para afiliados' },
    { to: '/admin/beneficios-ugt', icon: Gift, title: 'Beneficios UGT', desc: 'Gestionar descuentos para afiliados' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <LayoutDashboard className="h-8 w-8 text-red-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Panel de Administración</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="Comunicados" value={stats.communiques} icon={FileText} />
          <StatCard title="Citas" value={stats.appointments} icon={Calendar} />
          <StatCard title="Encuestas" value={stats.surveys} icon={Vote} />
          <StatCard title="Delegados" value={stats.delegates} icon={Users} />
          <StatCard title="Comentarios" value={stats.comments} icon={MessageSquare} />
          <StatCard title="Sugerencias" value={stats.suggestions} icon={MessageSquare} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <item.icon className="h-8 w-8 text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="h-12 w-12 text-red-600 opacity-20" />
      </div>
    </div>
  );
}
