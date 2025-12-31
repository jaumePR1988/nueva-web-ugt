import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase, SyndicalDocument } from '@/lib/supabase';
import { FileText, Upload, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDocumentosSindicales() {
  const [documents, setDocuments] = useState<SyndicalDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('convenios');
  const [file, setFile] = useState<File | null>(null);

  const categories = [
    { value: 'convenios', label: 'Convenios' },
    { value: 'protocolos', label: 'Protocolos' },
    { value: 'normativa', label: 'Normativa' },
    { value: 'formularios', label: 'Formularios' },
  ];

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const { data, error } = await supabase
        .from('syndical_documents')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!file || !title.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setUploading(true);

    try {
      // Subir archivo al storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('syndical-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('syndical-documents')
        .getPublicUrl(filePath);

      // Insertar registro en la base de datos
      const { error: insertError } = await supabase
        .from('syndical_documents')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category,
          file_url: publicUrl,
          file_type: fileExt?.toUpperCase(),
          file_size_mb: file.size / (1024 * 1024),
          is_active: true,
        });

      if (insertError) throw insertError;

      toast.success('Documento subido correctamente');
      
      // Limpiar formulario
      setTitle('');
      setDescription('');
      setCategory('convenios');
      setFile(null);
      (document.getElementById('file-input') as HTMLInputElement).value = '';

      loadDocuments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, fileUrl: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;

    try {
      // Extraer el nombre del archivo de la URL
      const fileName = fileUrl.split('/').pop();

      // Eliminar archivo del storage
      if (fileName) {
        await supabase.storage
          .from('syndical-documents')
          .remove([fileName]);
      }

      // Eliminar registro de la base de datos
      const { error } = await supabase
        .from('syndical_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Documento eliminado');
      loadDocuments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el documento');
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('syndical_documents')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(!currentStatus ? 'Documento activado' : 'Documento desactivado');
      loadDocuments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el documento');
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Documentos Sindicales</h1>
          </div>
          <p className="text-gray-600">
            Gestiona documentos exclusivos para afiliados: convenios, protocolos, normativa y formularios.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Subida */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Subir Documento</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Archivo * (Máx. 10 MB)
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: PDF, DOC, DOCX, XLS, XLSX
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                >
                  {uploading ? (
                    <>Subiendo...</>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Subir Documento</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Lista de Documentos */}
          <div className="lg:col-span-2">
            {/* Búsqueda */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Documentos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Documentos ({filteredDocuments.length})
              </h2>

              {loading ? (
                <p className="text-center text-gray-600 py-8">Cargando...</p>
              ) : filteredDocuments.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No hay documentos.</p>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                          {doc.description && (
                            <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                          )}
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                              {doc.category}
                            </span>
                            {doc.file_type && <span>{doc.file_type}</span>}
                            {doc.file_size_mb && <span>{doc.file_size_mb.toFixed(1)} MB</span>}
                            {doc.upload_date && (
                              <span>{format(new Date(doc.upload_date), "d MMM yyyy", { locale: es })}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={doc.is_active}
                              onChange={() => toggleActive(doc.id, doc.is_active)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                            />
                            <span className="ml-1 text-xs text-gray-700">Activo</span>
                          </label>
                          <button
                            onClick={() => handleDelete(doc.id, doc.file_url)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
