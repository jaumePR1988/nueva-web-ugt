import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Calendar, FileText, Award, BookOpen, Gift, Vote } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TestAffiliateDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    documentsDownloaded: 0,
    benefitsAvailable: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadStats();
  }, [navigate, user]);

  async function loadStats() {
    try {
      // Obtener número de beneficios disponibles
      const { count: benefitsCount } = await supabase
        .from('affiliate_benefits')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        documentsDownloaded: 0, // No rastreamos descargas actualmente
        benefitsAvailable: benefitsCount || 0,
      });
    } finally {
      setLoading(false);
    }
  }

  const menuItems = [
    { icon: User, label: 'Dashboard', path: '/afiliados/dashboard' },
    { icon: BookOpen, label: 'Biblioteca', path: '/afiliados/biblioteca' },
    { icon: Vote, label: 'Encuestas', path: '/afiliados/encuestas' },
    { icon: Gift, label: 'Beneficios', path: '/afiliados/beneficios' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navegación Lateral */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Menú de Afiliado</h2>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 transition"
                  >
                    <item.icon className="h-5 w-5 text-red-600" />
                    <span className="text-gray-700">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="md:col-span-3 space-y-6">
            {/* Bienvenida */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-lg p-8">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-full p-4">
                  <Award className="h-12 w-12" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Bienvenido/a, {profile?.full_name || 'Usuario'}</h1>
                  <p className="text-red-100">Afiliado/a UGT Towa</p>
                </div>
              </div>
            </div>

            {/* Información del Usuario */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Información Personal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  <p className="text-lg font-semibold text-gray-900">{profile?.full_name || 'No disponible'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{profile?.email || user?.email || 'No disponible'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Empresa</p>
                  <p className="text-lg font-semibold text-gray-900">Towa Pharmaceutical Europe</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Registro</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.created_at ? format(new Date(profile.created_at), "d 'de' MMMM 'de' yyyy", { locale: es }) : 'No disponible'}
                  </p>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Beneficios Disponibles</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.benefitsAvailable}</p>
                  </div>
                  <Gift className="h-12 w-12 text-red-200" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Documentos Disponibles</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">+10</p>
                  </div>
                  <BookOpen className="h-12 w-12 text-red-200" />
                </div>
              </div>
            </div>

            {/* Accesos Rápidos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/afiliados/biblioteca"
                  className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-600 hover:bg-red-50 transition"
                >
                  <BookOpen className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Biblioteca</p>
                    <p className="text-sm text-gray-600">Documentos sindicales</p>
                  </div>
                </Link>

                <Link
                  to="/afiliados/beneficios"
                  className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-600 hover:bg-red-50 transition"
                >
                  <Gift className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Beneficios</p>
                    <p className="text-sm text-gray-600">Descuentos exclusivos</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}