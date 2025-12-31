import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Delegate } from '@/lib/supabase';
import { Plus, Trash2, Upload, X, User, Edit2, Mail, Phone, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminQuienesSomos() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    full_name: '', 
    role_type: 'comite', 
    bio: '', 
    photo_url: '',
    position: '',
    email: '',
    phone: '',
    description: '',
    active: true
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadDelegates();
  }, []);

  async function loadDelegates() {
    const { data } = await supabase
      .from('delegates')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false });
    if (data) setDelegates(data);
  }

  async function handlePhotoUpload() {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error('No autenticado');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('https://zaxdscclkeytakcowgww.supabase.co/functions/v1/upload-delegate-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({ ...prev, photo_url: result.url }));
        toast.success('Foto subida correctamente');
        setSelectedFile(null);
      } else {
        toast.error('Error al subir foto');
      }
    } catch (error) {
      toast.error('Error al subir foto');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const submitData = {
      full_name: formData.full_name,
      role_type: formData.role_type,
      bio: formData.bio,
      photo_url: formData.photo_url,
      position: formData.position || null,
      email: formData.email || null,
      phone: formData.phone || null,
      description: formData.description || formData.bio,
      active: formData.active
    };

    if (editingId) {
      const { error } = await supabase
        .from('delegates')
        .update(submitData)
        .eq('id', editingId);
      if (error) toast.error('Error al actualizar');
      else { toast.success('Perfil actualizado'); resetForm(); loadDelegates(); }
    } else {
      const { error } = await supabase.from('delegates').insert([submitData]);
      if (error) toast.error('Error al crear perfil');
      else { toast.success('Perfil añadido'); resetForm(); loadDelegates(); }
    }
  }

  function resetForm() {
    setFormData({ 
      full_name: '', 
      role_type: 'comite', 
      bio: '', 
      photo_url: '',
      position: '',
      email: '',
      phone: '',
      description: '',
      active: true
    });
    setEditingId(null);
    setShowForm(false);
    setSelectedFile(null);
  }

  function handleEdit(delegate: Delegate) {
    setFormData({
      full_name: delegate.full_name,
      role_type: delegate.role_type,
      bio: delegate.bio,
      photo_url: delegate.photo_url || delegate.image_url || '',
      position: delegate.position || '',
      email: delegate.email || '',
      phone: delegate.phone || '',
      description: delegate.description || delegate.bio,
      active: delegate.active !== false
    });
    setEditingId(delegate.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar?')) {
      const { error } = await supabase.from('delegates').delete().eq('id', id);
      if (error) toast.error('Error');
      else { toast.success('Eliminado'); loadDelegates(); }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between mb-8">
          <h1 className="text-3xl font-bold">Gestionar Perfiles</h1>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Plus className="inline h-5 w-5 mr-1" /> Añadir Perfil
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Perfil' : 'Nuevo Perfil'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  placeholder="Nombre completo" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  className="w-full p-3 border rounded" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo/Posición</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Ej: Delegado Sindical Principal" 
                    value={formData.position} 
                    onChange={e => setFormData({...formData, position: e.target.value})} 
                    className="w-full p-3 pl-10 border rounded" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input 
                    type="email" 
                    placeholder="correo@ejemplo.com" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full p-3 pl-10 border rounded" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input 
                    type="tel" 
                    placeholder="+34 XXX XXX XXX" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full p-3 pl-10 border rounded" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Rol *</label>
              <select 
                value={formData.role_type} 
                onChange={e => setFormData({...formData, role_type: e.target.value as any})} 
                className="w-full p-3 border rounded"
              >
                <option value="comite">Comité de Empresa</option>
                <option value="sindical">Delegado Sindical</option>
                <option value="prevencion">Prevención de Riesgos</option>
              </select>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Biografía Breve *</label>
              <textarea 
                placeholder="Descripción breve para la tarjeta de perfil" 
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})} 
                className="w-full p-3 border rounded" 
                rows={2}
                required 
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Completa</label>
              <textarea 
                placeholder="Descripción detallada, experiencia, responsabilidades..." 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full p-3 border rounded" 
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">Si se deja vacío, se usará la biografía breve</p>
            </div>
            
            <div className="mt-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={formData.active} 
                  onChange={e => setFormData({...formData, active: e.target.checked})} 
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Perfil activo (visible en la página pública)</span>
              </label>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto del Perfil (opcional)</label>
              {formData.photo_url ? (
                <div className="relative inline-block">
                  <img src={formData.photo_url} alt="Preview" className="h-32 w-32 rounded-full object-cover border-4 border-gray-200" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    disabled={!selectedFile || uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {uploading ? 'Subiendo...' : <><Upload className="inline h-4 w-4 mr-1" /> Subir</>}
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                {editingId ? 'Actualizar' : 'Crear Perfil'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
            </div>
          </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {delegates.map(del => (
            <div key={del.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {del.photo_url ? (
                    <img 
                      src={del.photo_url} 
                      alt={del.full_name}
                      className="h-20 w-20 rounded-full object-cover border-4 border-red-100 mr-4"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                      <User className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{del.full_name}</h3>
                    <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded capitalize">
                      {del.role_type}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{del.bio}</p>
                <button 
                  onClick={() => handleDelete(del.id)} 
                  className="text-red-600 hover:bg-red-50 px-3 py-1 rounded transition"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
