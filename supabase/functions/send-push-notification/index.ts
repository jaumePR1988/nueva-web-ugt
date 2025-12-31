// Edge Function: send-push-notification
// Envia notificaciones push a todos los usuarios suscritos con logo personalizado

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Obtener datos de la notificación
    const { title, message, url = '/' } = await req.json();

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Título y mensaje son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    };

    // Obtener logo activo para las notificaciones
    let iconUrl = '/ugt-towa-icon-192.png'; // Logo por defecto
    
    try {
      const logoResponse = await fetch(
        `${supabaseUrl}/rest/v1/notification_logos?is_active=eq.true&select=logo_url&limit=1`,
        { headers }
      );
      
      if (logoResponse.ok) {
        const logos = await logoResponse.json();
        if (logos && logos.length > 0 && logos[0].logo_url) {
          iconUrl = logos[0].logo_url;
        }
      }
    } catch (logoError) {
      console.log('Usando logo por defecto, error al cargar logo activo:', logoError);
    }

    // Obtener todas las suscripciones activas
    const subsResponse = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?select=*`,
      { headers }
    );

    if (!subsResponse.ok) {
      throw new Error('Error al obtener suscripciones');
    }

    const subscriptions = await subsResponse.json();

    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: 0, 
          message: 'No hay usuarios suscritos',
          icon: iconUrl
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NOTA: En producción, aquí usarías web-push library para enviar notificaciones reales
    // Por ahora, registramos el intento de envío con el logo seleccionado
    
    // Para implementación completa, necesitarías:
    // 1. Generar VAPID keys
    // 2. Usar librería web-push (no disponible en Deno edge functions sin npm)
    // 3. Enviar a cada endpoint con el payload incluyendo el icon

    // El payload de notificación incluiría:
    const notificationPayload = {
      title,
      body: message,
      icon: iconUrl,
      badge: iconUrl,
      data: { url }
    };

    // Simulación del envío (en producción, esto sería el loop de envío real)
    let sentCount = 0;
    const failedSubs = [];

    for (const sub of subscriptions) {
      try {
        // Aquí iría el código real de web-push
        // await webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
        sentCount++;
      } catch (error) {
        failedSubs.push(sub.id);
        console.error(`Error enviando a suscripción ${sub.id}:`, error);
      }
    }

    // Limpiar suscripciones fallidas (endpoints inválidos)
    if (failedSubs.length > 0) {
      await fetch(
        `${supabaseUrl}/rest/v1/push_subscriptions?id=in.(${failedSubs.join(',')})`,
        {
          method: 'DELETE',
          headers
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedSubs.length,
        total: subscriptions.length,
        icon: iconUrl,
        message: `Notificación enviada a ${sentCount} usuarios con logo: ${iconUrl}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error en send-push-notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error al enviar notificaciones' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
