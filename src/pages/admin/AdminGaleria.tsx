import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import { Upload, Trash2, Eye, EyeOff, Image as ImageIcon, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface EventImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  event_date: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminGaleria() {
  const { user } = useAuth();
  const [images, setImages] = useState<EventImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Formulario de subida
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_images')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Error al cargar imágenes');
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes PNG, JPG, JPEG o WEBP');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede superar 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Vista previa
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedFile || !title.trim()) {
      toast.error('Completa el título y selecciona una imagen');
      return;
    }

    try {
      setUploading(true);

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `event_${timestamp}_${randomStr}.${fileExt}`;

      // Subir archivo directamente a Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      // Crear registro en la base de datos
      const { error: dbError } = await supabase
        .from('event_images')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          image_url: urlData.publicUrl,
          event_date: eventDate || null,
          display_order: parseInt(displayOrder) || 0,
          is_active: true
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Intentar eliminar el archivo subido si falla la DB
        await supabase.storage.from('event-images').remove([fileName]);
        throw new Error(dbError.message);
      }

      toast.success('Imagen subida exitosamente');
      
      // Resetear formulario
      setTitle('');
      setDescription('');
      setEventDate('');
      setDisplayOrder('0');
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Recargar imágenes
      loadImages();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('event_images')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(
        currentStatus ? 'Imagen ocultada' : 'Imagen activada'
      );
      loadImages();
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Error al cambiar estado');
    }
  }

  async function deleteImage(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta imagen permanentemente?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('event_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Imagen eliminada');
      loadImages();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error al eliminar imagen');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Galería de Eventos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra las imágenes que se muestran en el carrusel de la página principal
          </p>
        </div>

        {/* Formulario de subida */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Subir Nueva Imagen
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  placeholder="Nombre del evento"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha del evento
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                placeholder="Descripción del evento (opcional)"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Menor número aparece primero
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Imagen *
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, WEBP (máx. 5MB)
                </p>
              </div>
            </div>

            {previewUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vista previa:
                </p>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 rounded-lg shadow-md"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>Subiendo...</>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Subir Imagen
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de imágenes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Imágenes Subidas ({images.length})
          </h2>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">Cargando...</p>
          ) : images.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No hay imágenes subidas aún
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`border rounded-lg overflow-hidden ${
                    image.is_active
                      ? 'border-green-500 dark:border-green-400'
                      : 'border-gray-300 dark:border-gray-600 opacity-60'
                  }`}
                >
                  <div className="relative h-48">
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {!image.is_active && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">Oculta</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {image.title}
                    </h3>
                    {image.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {image.description}
                      </p>
                    )}
                    {image.event_date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(image.event_date).toLocaleDateString('es-ES')}
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(image.id, image.is_active)}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center ${
                          image.is_active
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200'
                        }`}
                      >
                        {image.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Activar
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => deleteImage(image.id)}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 rounded text-sm font-medium transition-colors"
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
  );
}
