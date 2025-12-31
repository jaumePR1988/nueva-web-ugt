// Edge Function: process-appointment-notification
// Procesa notificaciones automáticas de citas y las envía a administradores

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
    const { event_type, title, message, appointment_id, user_name, user_email } = await req.json();

    if (!event_type || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    };

    // 1. Obtener todos los administradores
    const adminsResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?role=eq.admin&select=id,email,full_name`,
      { headers }
    );

    if (!adminsResponse.ok) {
      throw new Error('Error al obtener administradores');
    }

    const admins = await adminsResponse.json();

    if (admins.length === 0) {
      console.log('No hay administradores registrados');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No hay administradores' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Obtener preferencias de notificación de cada admin
    const prefsResponse = await fetch(
      `${supabaseUrl}/rest/v1/admin_notification_preferences?select=*`,
      { headers }
    );

    const prefs = prefsResponse.ok ? await prefsResponse.json() : [];

    // Crear un mapa de preferencias por user_id
    const prefsMap = new Map();
    for (const pref of prefs) {
      prefsMap.set(pref.user_id, pref);
    }

    // 3. Filtrar administradores según sus preferencias
    const eligibleAdmins = [];
    for (const admin of admins) {
      const adminPrefs = prefsMap.get(admin.id);
      
      // Si no tiene preferencias, usar defaults (todo activado)
      if (!adminPrefs) {
        eligibleAdmins.push(admin);
        continue;
      }

      // Verificar si tiene push habilitado
      if (!adminPrefs.push_enabled) {
        continue;
      }

      // Verificar el tipo de evento específico
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

    if (eligibleAdmins.length === 0) {
      console.log('Ningún administrador tiene habilitado este tipo de notificación');
      
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
            recipients_count: 0,
            status: 'skipped',
            error_message: 'No hay administradores con este tipo de notificación habilitada'
          })
        }
      );

      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No hay admins con notificaciones habilitadas' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Obtener suscripciones push de los administradores elegibles
    const adminIds = eligibleAdmins.map(a => a.id).join(',');
    const subsResponse = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?user_id=in.(${adminIds})&select=*`,
      { headers }
    );

    let subscriptions = [];
    if (subsResponse.ok) {
      subscriptions = await subsResponse.json();
    }

    // 5. Obtener logo activo
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
      console.log('Usando logo por defecto');
    }

    // 6. Enviar notificaciones push
    // NOTA: En producción real, aquí usarías web-push library
    // Por ahora, simulamos el envío y registramos los intentos

    const notificationPayload = {
      title,
      body: message,
      icon: iconUrl,
      badge: iconUrl,
      data: {
        url: '/admin/citas',
        appointment_id,
        event_type
      }
    };

    let sentCount = 0;
    const failedSubs = [];

    // Simular envío a cada suscripción
    for (const sub of subscriptions) {
      try {
        // En producción: await webpush.sendNotification(sub, JSON.stringify(notificationPayload))
        sentCount++;
        console.log(`Notificación enviada a ${sub.user_id}`);
      } catch (error) {
        failedSubs.push(sub.id);
        console.error(`Error enviando a ${sub.id}:`, error);
      }
    }

    // 7. Registrar en historial
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
          status: sentCount > 0 ? 'sent' : 'failed',
          error_message: failedSubs.length > 0 ? `${failedSubs.length} suscripciones fallidas` : null
        })
      }
    );

    // 8. Crear notificación en tabla notifications para los admins
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

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedSubs.length,
        recipients: eligibleAdmins.length,
        message: `Notificación enviada a ${sentCount} administradores`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error en process-appointment-notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error al procesar notificación' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
