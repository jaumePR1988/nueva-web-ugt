import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { Tag, Plus, Edit2, Trash2, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

const COLOR_PALETTE = [
  { name: 'Rojo', value: '#DC2626' },
  { name: 'Naranja', value: '#EA580C' },
  { name: 'Amarillo', value: '#CA8A04' },
  { name: 'Verde', value: '#059669' },
  { name: 'Azul', value: '#2563EB' },
  { name: 'Índigo', value: '#4F46E5' },
  { name: 'Violeta', value: '#7C3AED' },
  { name: 'Rosa', value: '#DB2777' },
  { name: 'Gris', value: '#6B7280' },
];

export default function AdminCategorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#6B7280' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setCategories(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: formData.name, color: formData.color })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ name: formData.name, color: formData.color }]);

        if (error) throw error;
      }

      setFormData({ name: '', color: '#6B7280' });
      setEditingCategory(null);
      setShowForm(false);
      loadCategories();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(categoryId: string) {
    if (!confirm('¿Eliminar esta categoría? Los comunicados asociados quedarán sin categoría.')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (!error) loadCategories();
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setFormData({ name: category.name, color: category.color });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({ name: '', color: '#6B7280' });
    setEditingCategory(null);
    setShowForm(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Gestión de Categorías</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Categoría
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Color de la Categoría
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition ${
                          formData.color === color.value
                            ? 'border-gray-900 shadow-md'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-full mb-2"
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-xs text-gray-600">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear Categoría'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Categorías Existentes</h2>
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay categorías creadas todavía.</p>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-lg font-semibold text-gray-900">{category.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
