import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
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
    const toastId = toast.loading(currentStatus ? 'Ocultando imagen...' : 'Activando imagen...');
    try {
      const { error } = await supabase
        .from('event_images')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(
        currentStatus ? 'Imagen ocultada correctamente' : 'Imagen activada correctamente',
        { id: toastId }
      );
      loadImages();
    } catch (error: any) {
      console.error('Toggle error:', error);
      toast.error(`Error: ${error.message || 'No se pudo cambiar el estado'}`, { id: toastId });
    }
  }

  async function deleteImage(image: EventImage) {
    console.log('Solicitando eliminación de imagen:', image.id);

    toast.warning(`¿Eliminar "${image.title}"?`, {
      description: "Esta acción es permanente.",
      action: {
        label: "Confirmar Borrado",
        onClick: () => executeDelete(image)
      },
      duration: 5000,
    });
  }

  async function executeDelete(image: EventImage) {
    const toastId = toast.loading('Eliminando de forma permanente...');
    const previousImages = [...images];

    try {
      // 1. Eliminar de la base de datos primero para asegurar permisos
      const { error: dbError } = await supabase
        .from('event_images')
        .delete()
        .eq('id', image.id);

      if (dbError) {
        console.error('Error DB al borrar:', dbError);
        throw new Error(`Error de base de datos: ${dbError.message}`);
      }

      // 2. Extraer el nombre del archivo de la URL e intentar eliminar de Storage
      try {
        const urlParts = image.image_url.split('/');
        // Supabase URLs usually follow: .../public/bucket-name/filename
        const fileName = urlParts[urlParts.length - 1];

        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('event-images')
            .remove([fileName]);

          if (storageError) {
            console.warn('Error no crítico al borrar de Storage:', storageError);
          }
        }
      } catch (storageError) {
        console.error('Excepción al borrar de storage:', storageError);
      }

      // Feedback exitoso: actualizar estado local
      setImages(prev => prev.filter(img => img.id !== image.id));
      toast.success('Imagen eliminada correctamente', { id: toastId });
    } catch (error: any) {
      console.error('Error fatal detectado al borrar:', error);
      toast.error(`No se pudo eliminar: ${error.message || 'Error desconocido'}`, { id: toastId });
      // Recargar para sincronizar estado real si falló
      loadImages();
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="flex items-center">
            <div className="p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mr-5">
              <ImageIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Gestión Visual</p>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Galería de Eventos</h1>
            </div>
          </div>
        </div>

        {/* Formulario de subida */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Upload className="h-5 w-5 mr-3 text-red-600" />
            Subir Nueva Imagen
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 font-medium text-gray-900"
                  placeholder="Ej: Asamblea General 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Fecha del Evento
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 font-medium text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Breve Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 font-medium text-gray-900"
                placeholder="Describe brevemente lo ocurrido en el evento..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Posición (Orden)
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 font-medium text-gray-900"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Seleccionar Archivo *
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 font-medium text-gray-900 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  required
                />
              </div>
            </div>

            {previewUrl && (
              <div className="p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Vista Previa
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-800 transition bg-red-50 px-3 py-1 rounded-full"
                  >
                    Eliminar Selección
                  </button>
                </div>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 rounded-2xl shadow-lg border-4 border-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-200 text-white font-black uppercase tracking-widest text-xs py-5 px-8 rounded-2xl transition-all shadow-xl shadow-red-200 flex items-center justify-center group"
            >
              {uploading ? (
                <>Subiendo imagen...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-3 group-hover:-translate-y-1 transition-transform" />
                  Publicar en Galería
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de imágenes */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center px-4">
            <ImageIcon className="h-5 w-5 mr-3 text-red-600" />
            Archivo de Imágenes ({images.length})
          </h2>

          {loading ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cargando galería...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm px-8">
              <ImageIcon className="h-16 w-16 text-gray-100 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No hay imágenes subidas aún</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`bg-white rounded-[2rem] overflow-hidden border transition-all duration-300 ${image.is_active
                    ? 'border-gray-100 shadow-xl shadow-gray-200/50'
                    : 'border-gray-200 opacity-60 grayscale'
                    }`}
                >
                  <div className="relative h-56">
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {!image.is_active && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Oculta del público</span>
                      </div>
                    )}
                  </div>

                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-black text-gray-900 text-lg mb-1 leading-tight">
                          {image.title}
                        </h3>
                        {image.event_date && (
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                            <Calendar className="h-3 w-3 mr-2 text-red-600" />
                            {new Date(image.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>

                    {image.description && (
                      <p className="text-sm text-gray-500 mb-6 line-clamp-2 font-medium leading-relaxed">
                        {image.description}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActive(image.id, image.is_active);
                        }}
                        className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center shadow-sm z-10 ${image.is_active
                          ? 'bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white'
                          : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'
                          }`}
                      >
                        {image.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Activar
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(image);
                        }}
                        className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm z-10"
                        title="Eliminar permanentemente"
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
      <Footer />
    </div>
  );
}
