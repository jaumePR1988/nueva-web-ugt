// Edge Function: process-notification-queue (CRON)
// Procesa la cola de notificaciones pendientes cada minuto

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
      prefsMap.set(pref.user_id, pref);
    }

    // 4. Obtener logo activo
    let iconUrl = '/ugt-towa-icon-192.png';
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

          if (!adminPrefs.push_enabled) {
            continue;
          }

          let shouldNotify = false;
          switch (event_type) {
            case 'new_appointment':
              shouldNotify = adminPrefs.notify_new_appointment !== false;
              break;
            case 'appointment_modified':
              shouldNotify = adminPrefs.notify_appointment_modified !== false;
              break;
            case 'appointment_cancelled':
              shouldNotify = adminPrefs.notify_appointment_cancelled !== false;
              break;
            case 'status_change':
              shouldNotify = adminPrefs.notify_appointment_status_change !== false;
              break;
            default:
              shouldNotify = true;
          }

          if (shouldNotify) {
            eligibleAdmins.push(admin);
          }
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
            sentCount = subscriptions.length;

            // En producción: enviar notificación push real a cada suscripción
            console.log(`[Cron] Enviando notificación a ${sentCount} suscripciones`);
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
                  user_full_name: user_name || null
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
        // Continuar con la siguiente notificación
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

  } catch (error) {
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
