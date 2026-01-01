// Edge Function: send-push-notification
// Envia notificaciones push a todos los usuarios suscritos con logo personalizado

import webpush from "https://esm.sh/web-push@3.6.6";

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

    // Configurar VAPID
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@ugttowa.es';

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured in environment');
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // Crear cliente Supabase simple
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    };

    // Obtener logo activo para las notificaciones
    let iconUrl = 'https://ugt-towa.vercel.app/ugt-towa-icon-192.png'; // Usar URL absoluta

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
      console.log('Usando logo por defecto:', logoError);
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

    const notificationPayload = JSON.stringify({
      title,
      body: message,
      icon: iconUrl,
      badge: iconUrl,
      data: { url }
    });

    let sentCount = 0;
    const failedSubs = [];

    // Enviar a cada suscripción
    const sendPromises = subscriptions.map(async (sub: any) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);
        sentCount++;
      } catch (error: any) {
        console.error(`Error enviando a suscripción ${sub.id}:`, error);
        // Si el endpoint ya no es válido (410 Gone o 404), marcar para eliminar
        if (error.statusCode === 410 || error.statusCode === 404) {
          failedSubs.push(sub.id);
        }
      }
    });

    await Promise.all(sendPromises);

    // Limpiar suscripciones fallidas
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
        message: `Notificación enviada a ${sentCount} usuarios`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
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
