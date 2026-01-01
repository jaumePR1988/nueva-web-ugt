// Edge Function: process-notification-queue (CRON)
// Procesa la cola de notificaciones pendientes cada minuto

import webpush from "https://esm.sh/web-push@3.6.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    };

    // Configurar VAPID
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@ugttowa.es';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }

    console.log('[Cron] Iniciando procesamiento de cola de notificaciones');

    // 1. Obtener notificaciones pendientes (límite 50 por ejecución)
    const queueResponse = await fetch(
      `${supabaseUrl}/rest/v1/notification_queue?processed=eq.false&order=created_at.asc&limit=50`,
      { headers }
    );

    if (!queueResponse.ok) {
      throw new Error('Error al obtener cola de notificaciones');
    }

    const pendingNotifications = await queueResponse.json();

    if (pendingNotifications.length === 0) {
      console.log('[Cron] No hay notificaciones pendientes');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No hay notificaciones pendientes' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Cron] Procesando ${pendingNotifications.length} notificaciones`);

    // 2. Obtener todos los administradores
    const adminsResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?role=eq.admin&select=id,email,full_name`,
      { headers }
    );

    if (!adminsResponse.ok) {
      throw new Error('Error al obtener administradores');
    }

    const admins = await adminsResponse.json();

    if (admins.length === 0) {
      console.log('[Cron] No hay administradores registrados');

      // Marcar todas como procesadas (sin destinatarios)
      for (const notif of pendingNotifications) {
        await fetch(
          `${supabaseUrl}/rest/v1/notification_queue?id=eq.${notif.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              processed: true,
              processed_at: new Date().toISOString()
            })
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, processed: pendingNotifications.length, sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Obtener preferencias de notificación
    const prefsResponse = await fetch(
      `${supabaseUrl}/rest/v1/admin_notification_preferences?select=*`,
      { headers }
    );

    const prefs = prefsResponse.ok ? await prefsResponse.json() : [];
    const prefsMap = new Map();
    for (const pref of prefs) {
      prefsMap.set(pref.admin_id, pref);
    }

    // 4. Obtener logo activo
    let iconUrl = 'https://ugt-towa.vercel.app/ugt-towa-icon-192.png';
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
      console.log('[Cron] Usando logo por defecto');
    }

    let totalSent = 0;
    let totalProcessed = 0;

    // 5. Procesar cada notificación pendiente
    for (const notification of pendingNotifications) {
      try {
        const { id, event_type, title, message, appointment_id, user_name, user_email } = notification;

        // Filtrar administradores según preferencias
        const eligibleAdmins = [];
        for (const admin of admins) {
          const adminPrefs = prefsMap.get(admin.id);

          if (!adminPrefs) {
            eligibleAdmins.push(admin);
            continue;
          }

          if (adminPrefs.enabled === false) {
            continue;
          }

          // En la tabla admin_notification_preferences, event_type es el slug del evento
          // Por ahora, si está habilitado en general para ese admin, lo enviamos
          eligibleAdmins.push(admin);
        }

        // Obtener suscripciones push de los admins elegibles
        let sentCount = 0;
        if (eligibleAdmins.length > 0) {
          const adminIds = eligibleAdmins.map(a => a.id).join(',');
          const subsResponse = await fetch(
            `${supabaseUrl}/rest/v1/push_subscriptions?user_id=in.(${adminIds})&select=*`,
            { headers }
          );

          if (subsResponse.ok) {
            const subscriptions = await subsResponse.json();

            if (subscriptions.length > 0 && vapidPublicKey && vapidPrivateKey) {
              const notificationPayload = JSON.stringify({
                title: title,
                body: message,
                icon: iconUrl,
                badge: iconUrl,
                data: { url: `/admin/citas?id=${appointment_id}` }
              });

              const sendPromises = subscriptions.map(async (sub: any) => {
                try {
                  const pushSub = {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                  };
                  await webpush.sendNotification(pushSub, notificationPayload);
                  sentCount++;
                } catch (err: any) {
                  console.error(`[Cron] Error enviando push a ${sub.id}:`, err);
                  if (err.statusCode === 410 || err.statusCode === 404) {
                    await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${sub.id}`, {
                      method: 'DELETE',
                      headers
                    });
                  }
                }
              });
              await Promise.all(sendPromises);
            }
          }

          // Crear notificación en tabla notifications para cada admin
          for (const admin of eligibleAdmins) {
            await fetch(
              `${supabaseUrl}/rest/v1/notifications`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  appointment_id,
                  type: event_type,
                  title,
                  message,
                  read: false,
                  user_email: user_email || null,
                  user_full_name: user_name || null,
                  admin_id: admin.id
                })
              }
            );
          }
        }

        // Registrar en historial
        await fetch(
          `${supabaseUrl}/rest/v1/push_notification_history`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              appointment_id,
              event_type,
              title,
              message,
              recipients_count: sentCount,
              status: sentCount > 0 ? 'sent' : 'skipped'
            })
          }
        );

        // Marcar como procesada
        await fetch(
          `${supabaseUrl}/rest/v1/notification_queue?id=eq.${id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              processed: true,
              processed_at: new Date().toISOString()
            })
          }
        );

        totalSent += sentCount;
        totalProcessed++;
        console.log(`[Cron] Notificación ${id} procesada (${sentCount} destinatarios)`);

      } catch (error) {
        console.error(`[Cron] Error procesando notificación ${notification.id}:`, error);
      }
    }

    console.log(`[Cron] Procesamiento completo: ${totalProcessed} notificaciones, ${totalSent} envíos`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        sent: totalSent,
        message: `Procesadas ${totalProcessed} notificaciones`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[Cron] Error en process-notification-queue:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Error al procesar cola de notificaciones'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
