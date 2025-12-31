Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const eventDate = formData.get('eventDate') as string;
    const displayOrder = formData.get('displayOrder') as string;

    if (!file || !title) {
      return new Response(
        JSON.stringify({ error: 'Se requiere archivo e información del evento' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'El archivo excede el tamaño máximo permitido de 5MB' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de archivo no permitido. Solo se permiten imágenes PNG, JPG, JPEG o WEBP' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = crypto.randomUUID().split('-')[0];
    const fileExtension = file.name.split('.').pop();
    const fileName = `event-${timestamp}-${randomString}.${fileExtension}`;

    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Obtener URL y Service Role Key desde variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Subir a Supabase Storage
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/event-images/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': file.type,
        },
        body: uint8Array,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Error al subir el archivo: ${errorText}`);
    }

    // Generar URL pública del archivo
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/event-images/${fileName}`;

    // Insertar registro en la base de datos
    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/event_images`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title: title,
          description: description || null,
          image_url: fileUrl,
          event_date: eventDate || null,
          display_order: parseInt(displayOrder) || 0,
          is_active: true
        })
      }
    );

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`Error al guardar en la base de datos: ${errorText}`);
    }

    const insertData = await insertResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        url: fileUrl,
        data: insertData[0]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error en upload-event-image:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error desconocido al subir la imagen',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
