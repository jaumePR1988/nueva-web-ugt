import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Document } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Upload, Trash2, Plus, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
}

export default function AdminDocumentos() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Otros',
    file_url: '',
    file_size: 0,
    file_type: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadDocuments();
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase
      .from('document_categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Error al cargar categorías');
      // Fallback a categorías por defecto si hay error
      setCategories([
        { id: '1', name: 'Nóminas', description: '' },
        { id: '2', name: 'Contratos', description: '' },
        { id: '3', name: 'Políticas', description: '' },
        { id: '4', name: 'Procedimientos', description: '' },
        { id: '5', name: 'Otros', description: '' }
      ]);
    } else if (data) {
      setCategories(data);
    }
  }

  async function loadDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploader:profiles(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar documentos');
    } else if (data) {
      setDocuments(data as any);
    }
  }

  async function handleFileUpload() {
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

      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);

      const response = await fetch('https://zaxdscclkeytakcowgww.supabase.co/functions/v1/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          file_url: result.url,
          file_size: result.fileSize,
          file_type: result.fileType
        }));
        toast.success('Archivo subido correctamente');
        setSelectedFile(null);
      } else {
        toast.error(result.error || 'Error al subir archivo');
      }
    } catch (error) {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.file_url) {
      toast.error('Debes subir un archivo primero');
      return;
    }

    if (!user) {
      toast.error('No autenticado');
      return;
    }

    const { error } = await supabase.from('documents').insert([{
      title: formData.title,
      description: formData.description,
      category: formData.category,
      file_url: formData.file_url,
      file_size: formData.file_size,
      file_type: formData.file_type,
      uploaded_by: user.id
    }]);

    if (error) {
      toast.error('Error al guardar documento');
    } else {
      toast.success('Documento agregado correctamente');
      resetForm();
      loadDocuments();
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      category: categories.length > 0 ? categories[0].name : 'Otros',
      file_url: '',
      file_size: 0,
      file_type: ''
    });
    setShowForm(false);
    setSelectedFile(null);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar el documento "${title}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Documento eliminado');
      loadDocuments();
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Gestionar Documentos</h1>
              <p className="text-gray-600 mt-2">Administra los documentos del portal</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Plus className="h-5 w-5" />
              Nuevo Documento
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Instrucciones:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Selecciona el archivo y súbelo primero</li>
                      <li>Completa el título y descripción</li>
                      <li>Elige la categoría adecuada</li>
                      <li>Haz clic en Guardar Documento</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo (PDF, Word, Excel, Imágenes - Max 10MB)
                </label>
                {formData.file_url ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">Archivo subido correctamente</p>
                      <p className="text-xs text-green-700">{formatFileSize(formData.file_size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, file_url: '', file_size: 0, file_type: '' }))}
                      className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={!selectedFile || uploading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Subir
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!formData.file_url}
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  Guardar Documento
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay documentos. Agrega el primero.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subido por</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{doc.title}</div>
                          {doc.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{doc.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatFileSize(doc.file_size || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {doc.uploader?.full_name || 'Desconocido'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {format(new Date(doc.created_at), "d MMM yyyy", { locale: es })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Ver
                            </a>
                            <button
                              onClick={() => handleDelete(doc.id, doc.title)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
