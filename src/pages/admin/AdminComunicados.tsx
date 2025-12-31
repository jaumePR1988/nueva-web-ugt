import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SimpleTextEditor from '@/components/SimpleTextEditor';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Communique, Category, AttachmentFile } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Upload, X, FileText, Loader2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

// Función auxiliar para extraer texto plano de HTML
function stripHtml(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export default function AdminComunicados() {
  const { user } = useAuth();
  const [communiques, setCommuniques] = useState<Communique[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    content: '', 
    category_id: '', 
    image_url: '',
    attachments: [] as AttachmentFile[]
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  useEffect(() => {
    loadCommuniques();
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (data) setCategories(data);
  }

  async function loadCommuniques() {
    const { data } = await supabase
      .from('communiques')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    if (data) setCommuniques(data as any);
  }

  async function handleImageUpload() {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      // Validar tipo y tamaño
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Tipo de archivo no permitido. Use JPEG, PNG o WebP.');
        setUploading(false);
        return;
      }

      if (selectedFile.size > 5242880) {
        toast.error('Archivo demasiado grande. Máximo 5MB.');
        setUploading(false);
        return;
      }

      // Generar nombre único
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = selectedFile.name.split('.').pop();
      const fileName = `img_${timestamp}_${randomStr}.${extension}`;

      // Subir directamente a Storage
      const { data, error } = await supabase.storage
        .from('communique-images')
        .upload(fileName, selectedFile);

      if (error) {
        console.error('Error uploading image:', error);
        toast.error(`Error al subir imagen: ${error.message}`);
        setUploading(false);
        return;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('communique-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success('Imagen subida correctamente');
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      toast.error(`Error al subir imagen: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleAttachmentsUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingAttachments(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`El archivo ${file.name} excede el tamaño máximo de 5MB`);
        continue;
      }

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`El archivo ${file.name} no es de un tipo permitido`);
        continue;
      }

      try {
        // Generar nombre único
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = file.name.split('.').pop();
        const fileName = `doc_${timestamp}_${randomStr}.${extension}`;

        // Subir directamente a Storage
        const { data, error } = await supabase.storage
          .from('communique-attachments')
          .upload(fileName, file);

        if (error) {
          console.error('Error uploading file:', error);
          toast.error(`Error al subir ${file.name}: ${error.message}`);
          continue;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('communique-attachments')
          .getPublicUrl(fileName);

        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, {
            url: urlData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          }]
        }));
        toast.success(`Archivo ${file.name} subido correctamente`);
      } catch (error: any) {
        console.error('Error al subir archivo:', error);
        toast.error(`Error al subir ${file.name}: ${error.message}`);
      }
    }

    setUploadingAttachments(false);
    event.target.value = '';
  }

  function removeAttachment(index: number) {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const submitData = {
      title: formData.title,
      content: formData.content,
      category_id: formData.category_id,
      image_url: formData.image_url || null,
      attachments: formData.attachments.length > 0 ? formData.attachments : null,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('communiques').update(submitData).eq('id', editingId);
        if (error) {
          console.error('Error al actualizar comunicado:', error);
          toast.error(`Error al actualizar: ${error.message || 'Error desconocido'}`);
        } else { 
          toast.success('Comunicado actualizado correctamente');
          resetForm(); 
          loadCommuniques(); 
        }
      } else {
        console.log('Intentando insertar comunicado:', { ...submitData, author_id: user?.id, is_published: true });
        
        const { data, error } = await supabase.from('communiques').insert([{ 
          ...submitData, 
          author_id: user?.id, 
          is_published: true 
        }]).select();
        
        if (error) {
          console.error('Error al publicar comunicado:', error);
          toast.error(`Error al publicar: ${error.message || 'Error desconocido'}`);
          toast.error(`Detalles: ${JSON.stringify(error)}`);
        } else { 
          console.log('Comunicado creado exitosamente:', data);
          toast.success('Comunicado publicado correctamente');
          resetForm(); 
          loadCommuniques(); 
        }
      }
    } catch (error: any) {
      console.error('Error inesperado:', error);
      toast.error(`Error inesperado: ${error.message || 'Error desconocido'}`);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar este comunicado?')) {
      const { error } = await supabase.from('communiques').delete().eq('id', id);
      if (error) toast.error('Error al eliminar');
      else { toast.success('Eliminado'); loadCommuniques(); }
    }
  }

  function handleEdit(com: Communique) {
    setFormData({ 
      title: com.title, 
      content: com.content, 
      category_id: com.category_id || '', 
      image_url: com.image_url || '',
      attachments: com.attachments || []
    });
    setEditingId(com.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({ 
      title: '', 
      content: '', 
      category_id: '', 
      image_url: '',
      attachments: []
    });
    setEditingId(null);
    setShowForm(false);
    setSelectedFile(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between mb-8">
          <h1 className="text-3xl font-bold">Gestionar Comunicados</h1>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Plus className="inline h-5 w-5 mr-1" /> Nuevo
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Comunicado' : 'Nuevo Comunicado'}</h2>
            <input 
              type="text" 
              placeholder="Título" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              className="w-full p-3 border rounded mb-4" 
              required 
            />
            <select 
              value={formData.category_id} 
              onChange={e => setFormData({...formData, category_id: e.target.value})} 
              className="w-full p-3 border rounded mb-4"
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido
              </label>
              <SimpleTextEditor 
                value={formData.content}
                onChange={(content) => setFormData({...formData, content})}
                placeholder="Escribe el contenido del comunicado..."
                minHeight={450}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagen destacada (opcional)</label>
              {formData.image_url ? (
                <div className="relative inline-block">
                  <img src={formData.image_url} alt="Preview" className="h-32 w-auto rounded border" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
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
                    onClick={handleImageUpload}
                    disabled={!selectedFile || uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {uploading ? 'Subiendo...' : <><Upload className="inline h-4 w-4 mr-1" /> Subir</>}
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivos Adjuntos (opcional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Puedes adjuntar documentos relevantes (PDF, imágenes, Word). Máximo 5MB por archivo.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                <Paperclip className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <label className="cursor-pointer">
                  <span className="text-sm text-red-600 hover:text-red-700 font-semibold">
                    Seleccionar archivos
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleAttachmentsUpload}
                    className="hidden"
                    disabled={uploadingAttachments}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>

              {uploadingAttachments && (
                <div className="flex items-center justify-center text-sm text-gray-600 mb-3">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Subiendo archivos...
                </div>
              )}

              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Archivos adjuntos ({formData.attachments.length})
                  </p>
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="ml-3 text-red-600 hover:text-red-700 flex-shrink-0"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                {editingId ? 'Actualizar' : 'Publicar'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
            </div>
          </form>
        )}
        <div className="space-y-4">
          {communiques.map(com => {
            const category = com.category;
            return (
              <div key={com.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{com.title}</h3>
                    {category && (
                      <span 
                        className="inline-block px-3 py-1 text-white rounded-full text-xs mb-2 font-semibold"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                    )}
                    <p className="text-gray-600">{stripHtml(com.content).substring(0,200)}...</p>
                    {com.attachments && com.attachments.length > 0 && (
                      <p className="text-sm text-blue-600 mt-2 flex items-center">
                        <Paperclip className="h-4 w-4 mr-1" />
                        {com.attachments.length} archivo(s) adjunto(s)
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">{new Date(com.created_at).toLocaleString('es-ES')}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => handleEdit(com)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(com.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}