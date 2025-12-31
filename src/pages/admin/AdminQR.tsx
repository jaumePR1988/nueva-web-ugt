import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { QrCode, Upload, Trash2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QrCodeData {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminQR() {
  const [qrCode, setQrCode] = useState<QrCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: 'QR Code Sugerencias Anonimas',
    description: 'Escanea para enviar sugerencias anonimas'
  });

  useEffect(() => {
    loadQrCode();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  async function loadQrCode() {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setQrCode(data);
    } catch (error) {
      console.error('Error cargando QR:', error);
      toast.error('Error al cargar el codigo QR');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Solo PNG, JPG, WEBP');
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Archivo demasiado grande. Maximo 5MB');
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    setUploading(true);
    toast.info('Subiendo codigo QR...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error('No autenticado');
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);

      const response = await fetch(
        'https://zaxdscclkeytakcowgww.supabase.co/functions/v1/upload-qr-code',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData
        }
      );

      const result = await response.json();

      if (result.data?.success) {
        toast.success('Codigo QR subido exitosamente');
        setSelectedFile(null);
        setPreviewUrl(null);
        loadQrCode();
      } else {
        toast.error(result.error?.message || 'Error al subir el codigo QR');
      }
    } catch (error) {
      console.error('Error subiendo QR:', error);
      toast.error('Error al subir el codigo QR');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!qrCode) return;
    
    if (!confirm('¿Estas seguro de eliminar el codigo QR actual?')) return;

    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: false })
        .eq('id', qrCode.id);

      if (error) throw error;

      toast.success('Codigo QR eliminado');
      setQrCode(null);
    } catch (error) {
      console.error('Error eliminando QR:', error);
      toast.error('Error al eliminar el codigo QR');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <QrCode className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Gestion QR</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Gestiona el codigo QR que se muestra en la seccion de sugerencias anonimas.
          </p>

          {/* QR Code Actual */}
          {qrCode && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Codigo QR Actual</h2>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={qrCode.image_url}
                    alt="QR Code"
                    className="w-full max-w-sm rounded-lg border-2 border-gray-200"
                  />
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titulo
                    </label>
                    <p className="text-gray-900">{qrCode.title}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripcion
                    </label>
                    <p className="text-gray-900">{qrCode.description || 'Sin descripcion'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <a 
                      href={qrCode.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {qrCode.image_url}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subir Nuevo QR */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {qrCode ? 'Actualizar Codigo QR' : 'Subir Codigo QR'}
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Instrucciones:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Formatos permitidos: PNG, JPG, WEBP</li>
                    <li>Tamano maximo: 5MB</li>
                    <li>Recomendado: Imagen cuadrada de alta resolucion</li>
                    <li>El QR se mostrara en la pagina de inicio</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titulo
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="QR Code Sugerencias Anonimas"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripcion (opcional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Escanea para enviar sugerencias anonimas"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen QR
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileSelect}
                className="w-full p-2 border rounded"
              />
            </div>

            {previewUrl && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vista Previa
                </label>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-w-sm rounded-lg border-2 border-gray-200"
                />
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  {qrCode ? 'Actualizar QR' : 'Subir QR'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
