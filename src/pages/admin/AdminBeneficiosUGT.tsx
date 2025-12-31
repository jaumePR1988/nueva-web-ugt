import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase, AffiliateBenefit } from '@/lib/supabase';
import { Gift, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBeneficiosUGT() {
  const [benefits, setBenefits] = useState<AffiliateBenefit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Formulario
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [conditions, setConditions] = useState('');
  const [category, setCategory] = useState('otros');
  const [partnerLogoUrl, setPartnerLogoUrl] = useState('');

  const categories = [
    { value: 'deporte', label: 'Deporte y Gimnasios' },
    { value: 'salud', label: 'Salud y Bienestar' },
    { value: 'cultura', label: 'Cultura y Ocio' },
    { value: 'restauracion', label: 'Restauración' },
    { value: 'otros', label: 'Otros' },
  ];

  useEffect(() => {
    loadBenefits();
  }, []);

  async function loadBenefits() {
    try {
      const { data, error } = await supabase
        .from('affiliate_benefits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBenefits(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim() || !description.trim()) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      const { error } = await supabase
        .from('affiliate_benefits')
        .insert({
          company_name: companyName.trim(),
          description: description.trim(),
          discount_code: discountCode.trim() || null,
          discount_percentage: discountPercentage ? parseInt(discountPercentage) : null,
          conditions: conditions.trim() || null,
          category,
          partner_logo_url: partnerLogoUrl.trim() || null,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Beneficio creado correctamente');
      
      // Limpiar formulario
      setCompanyName('');
      setDescription('');
      setDiscountCode('');
      setDiscountPercentage('');
      setConditions('');
      setCategory('otros');
      setPartnerLogoUrl('');
      setShowForm(false);

      loadBenefits();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear el beneficio');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este beneficio?')) return;

    try {
      const { error } = await supabase
        .from('affiliate_benefits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Beneficio eliminado');
      loadBenefits();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el beneficio');
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('affiliate_benefits')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(!currentStatus ? 'Beneficio activado' : 'Beneficio desactivado');
      loadBenefits();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el beneficio');
    }
  }

  const filteredBenefits = benefits.filter(benefit =>
    benefit.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <Link to="/admin/dashboard" className="text-red-600 hover:text-red-700 mb-4 inline-block">
            Volver al Panel de Administración
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Gift className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Beneficios UGT</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Beneficio</span>
            </button>
          </div>
          <p className="text-gray-600">
            Gestiona descuentos y beneficios exclusivos para afiliados en establecimientos colaboradores.
          </p>
        </div>

        {/* Formulario de Nuevo Beneficio */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Crear Nuevo Beneficio</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="Ej: Gimnasio FitLife"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="Describe el beneficio..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Descuento
                  </label>
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="Ej: UGT2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porcentaje de Descuento
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="Ej: 20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condiciones
                </label>
                <textarea
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="Condiciones y restricciones del beneficio..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del Logo (opcional)
                </label>
                <input
                  type="url"
                  value={partnerLogoUrl}
                  onChange={(e) => setPartnerLogoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Crear Beneficio
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar beneficios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Beneficios */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Beneficios ({filteredBenefits.length})
          </h2>

          {loading ? (
            <p className="text-center text-gray-600 py-8">Cargando...</p>
          ) : filteredBenefits.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No hay beneficios creados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBenefits.map((benefit) => (
                <div key={benefit.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{benefit.company_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={benefit.is_active}
                          onChange={() => toggleActive(benefit.id, benefit.is_active)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                        />
                        <span className="ml-1 text-xs text-gray-700">Activo</span>
                      </label>
                      <button
                        onClick={() => handleDelete(benefit.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {benefit.discount_percentage && (
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-red-600">{benefit.discount_percentage}% de descuento</span>
                      </div>
                    )}
                    {benefit.discount_code && (
                      <div>
                        <span className="text-gray-600">Código: </span>
                        <span className="font-mono font-semibold">{benefit.discount_code}</span>
                      </div>
                    )}
                    {benefit.category && (
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                        {benefit.category}
                      </span>
                    )}
                    {benefit.conditions && (
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>Condiciones:</strong> {benefit.conditions}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
