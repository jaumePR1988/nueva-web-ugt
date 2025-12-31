import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener el token de autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No se proporcionó token de autenticación');
    }

    // Verificar que el usuario es admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('No autenticado');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('No autorizado: se requiere rol de administrador');
    }

    // Parsear form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const logoName = formData.get('logoName') as string;
    const setActive = formData.get('setActive') === 'true';

    if (!file) {
      throw new Error('No se proporcionó archivo');
    }

    if (!logoName) {
      throw new Error('No se proporcionó nombre del logo');
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo PNG, JPEG, SVG o WEBP');
    }

    // Validar tamaño (máximo 1MB)
    if (file.size > 1048576) {
      throw new Error('El archivo excede el tamaño máximo de 1MB');
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Subir archivo al storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('notification-logos')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('notification-logos')
      .getPublicUrl(filePath);

    // Guardar registro en la base de datos
    const { data: logoData, error: dbError } = await supabase
      .from('notification_logos')
      .insert({
        logo_name: logoName,
        logo_url: publicUrl,
        is_active: setActive,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (dbError) {
      // Si falla la inserción en BD, eliminar el archivo subido
      await supabase.storage
        .from('notification-logos')
        .remove([filePath]);
      
      throw new Error(`Error al guardar en base de datos: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        logo: logoData,
        message: 'Logo subido exitosamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error en upload-notification-logo:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido al subir logo'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
