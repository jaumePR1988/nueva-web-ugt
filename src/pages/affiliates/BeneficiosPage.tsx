import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, AffiliateBenefit } from '@/lib/supabase';
import { Gift, User, BookOpen, Copy, Check, Tag, Filter, Vote } from 'lucide-react';
import { toast } from 'sonner';

export default function BeneficiosPage() {
  const { user, isAffiliate } = useAuth();
  const navigate = useNavigate();
  const [benefits, setBenefits] = useState<AffiliateBenefit[]>([]);
  const [filteredBenefits, setFilteredBenefits] = useState<AffiliateBenefit[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'todas', label: 'Todas las Categorías' },
    { value: 'deporte', label: 'Deporte y Gimnasios' },
    { value: 'salud', label: 'Salud y Bienestar' },
    { value: 'cultura', label: 'Cultura y Ocio' },
    { value: 'restauracion', label: 'Restauración' },
    { value: 'otros', label: 'Otros' },
  ];

  useEffect(() => {
    if (!isAffiliate) {
      navigate('/');
      return;
    }
    loadBenefits();
  }, [isAffiliate, navigate]);

  useEffect(() => {
    filterBenefits();
  }, [selectedCategory, benefits]);

  async function loadBenefits() {
    try {
      const { data, error } = await supabase
        .from('affiliate_benefits')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBenefits(data || []);
      setFilteredBenefits(data || []);
    } finally {
      setLoading(false);
    }
  }

  function filterBenefits() {
    if (selectedCategory === 'todas') {
      setFilteredBenefits(benefits);
    } else {
      setFilteredBenefits(benefits.filter(b => b.category === selectedCategory));
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Error al copiar el código');
    }
  }

  const menuItems = [
    { icon: User, label: 'Dashboard', path: '/afiliados/dashboard' },
    { icon: BookOpen, label: 'Biblioteca', path: '/afiliados/biblioteca' },
    { icon: Vote, label: 'Encuestas', path: '/afiliados/encuestas' },
    { icon: Gift, label: 'Beneficios', path: '/afiliados/beneficios' },
  ];

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
            {/* Encabezado */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Gift className="h-8 w-8 text-red-600" />
                <h1 className="text-3xl font-bold text-gray-900">Beneficios y Descuentos</h1>
              </div>
              <p className="text-gray-600">
                Disfruta de descuentos exclusivos en establecimientos colaboradores con UGT.
              </p>
            </div>

            {/* Filtro por Categoría */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid de Beneficios */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Cargando beneficios...</p>
              </div>
            ) : filteredBenefits.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No hay beneficios disponibles en esta categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBenefits.map((benefit) => (
                  <div key={benefit.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    {/* Logo o Placeholder */}
                    <div className="mb-4">
                      {benefit.partner_logo_url ? (
                        <img 
                          src={benefit.partner_logo_url} 
                          alt={benefit.company_name}
                          className="h-16 w-auto object-contain"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-red-100 rounded-lg flex items-center justify-center">
                          <Gift className="h-8 w-8 text-red-600" />
                        </div>
                      )}
                    </div>

                    {/* Información del Beneficio */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.company_name}</h3>
                    <p className="text-gray-600 mb-4">{benefit.description}</p>

                    {/* Descuento */}
                    {benefit.discount_percentage && (
                      <div className="flex items-center space-x-2 mb-3">
                        <Tag className="h-5 w-5 text-red-600" />
                        <span className="text-2xl font-bold text-red-600">
                          {benefit.discount_percentage}% de descuento
                        </span>
                      </div>
                    )}

                    {/* Código de Descuento */}
                    {benefit.discount_code && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Código de descuento:</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 px-4 py-2 bg-gray-100 rounded-lg font-mono font-bold text-lg text-gray-900">
                            {benefit.discount_code}
                          </div>
                          <button
                            onClick={() => copyCode(benefit.discount_code!)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                          >
                            {copiedCode === benefit.discount_code ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Copy className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Condiciones */}
                    {benefit.conditions && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          <strong>Condiciones:</strong> {benefit.conditions}
                        </p>
                      </div>
                    )}

                    {/* Categoría */}
                    {benefit.category && (
                      <div className="mt-3">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          {benefit.category}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Presenta tu carnet de afiliado UGT o menciona tu afiliación 
                al solicitar el descuento. Algunos beneficios pueden requerir verificación.
              </p>
            </div>

            {/* Estadísticas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Beneficios</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{benefits.length}</p>
                  <p className="text-sm text-gray-600">Total de Beneficios</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {benefits.filter(b => b.discount_percentage).reduce((sum, b) => sum + (b.discount_percentage || 0), 0) / benefits.filter(b => b.discount_percentage).length || 0}%
                  </p>
                  <p className="text-sm text-gray-600">Descuento Promedio</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {[...new Set(benefits.map(b => b.category).filter(Boolean))].length}
                  </p>
                  <p className="text-sm text-gray-600">Categorías</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
