import webpush from "https://esm.sh/web-push@3.6.6";

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { appointmentId, action } = await req.json();

    if (!appointmentId || !action) {
      throw new Error('appointmentId y action son requeridos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@ugttowa.es';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuración de Supabase no disponible');
    }

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }

    const headers = {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    };

    // Obtener datos de la cita con información del usuario
    const appointmentResponse = await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}&select=*,user:profiles!appointments_user_id_fkey(id,full_name,email),slot:appointment_slots(*)`,
      { headers }
    );

    if (!appointmentResponse.ok) {
      throw new Error('Error al obtener datos de la cita');
    }

    const appointments = await appointmentResponse.json();
    if (!appointments || appointments.length === 0) {
      throw new Error('Cita no encontrada');
    }

    const appointment = appointments[0];
    const user = appointment.user;

    // Formatear detalles para la notificación
    const startDate = new Date(appointment.start_time);
    const dateStr = startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    const timeStr = startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    let pushTitle = '';
    let pushMessage = '';

    if (action === 'confirmed') {
      pushTitle = 'Cita Confirmada';
      pushMessage = `Tu cita del ${dateStr} a las ${timeStr} ha sido confirmada.`;
    } else if (action === 'cancelled') {
      pushTitle = 'Cita Cancelada';
      pushMessage = `Tu cita del ${dateStr} a las ${timeStr} ha sido cancelada.`;
    }

    // Enviar notificación push si tenemos claves y el usuario tiene suscripciones
    if (pushTitle && vapidPublicKey && vapidPrivateKey && user?.id) {
      const subsResponse = await fetch(
        `${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${user.id}&select=*`,
        { headers }
      );

      if (subsResponse.ok) {
        const subscriptions = await subsResponse.json();
        const notificationPayload = JSON.stringify({
          title: pushTitle,
          body: pushMessage,
          icon: 'https://ugt-towa.vercel.app/ugt-towa-icon-192.png',
          data: { url: '/citas' }
        });

        for (const sub of subscriptions) {
          try {
            const pushSub = {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            };
            await webpush.sendNotification(pushSub, notificationPayload);
          } catch (err: any) {
            console.error(`Error enviando push a ${sub.id}:`, err);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Notificación procesada',
      action
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en notificación de cita:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
