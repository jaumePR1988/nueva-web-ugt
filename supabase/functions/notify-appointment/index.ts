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

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuración de Supabase no disponible');
    }

    // Obtener datos de la cita con información del usuario
    const appointmentResponse = await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}&select=*,user:profiles!appointments_user_id_fkey(full_name,email),slot:appointment_slots(*)`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
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
    const slot = appointment.slot;

    // Formatear fecha y hora
    const startDate = new Date(appointment.start_time);
    const endDate = new Date(appointment.end_time);
    const dateStr = startDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = `${startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

    const delegateTypeNames = {
      'comite': 'Comité de Empresa',
      'sindical': 'Delegados Sindicales',
      'prevencion': 'Prevención de Riesgos Laborales'
    };

    const delegateTypeName = delegateTypeNames[appointment.delegate_type] || appointment.delegate_type;

    // Preparar contenido del email
    let emailSubject = '';
    let emailBodyUser = '';
    let emailBodyDelegate = '';

    if (action === 'confirmed') {
      emailSubject = 'Confirmación de Cita - UGT Towa';
      emailBodyUser = `
        <h2>Cita Confirmada</h2>
        <p>Hola ${user.full_name},</p>
        <p>Tu cita ha sido confirmada con los siguientes detalles:</p>
        <ul>
          <li><strong>Tipo de delegado:</strong> ${delegateTypeName}</li>
          <li><strong>Fecha:</strong> ${dateStr}</li>
          <li><strong>Hora:</strong> ${timeStr}</li>
        </ul>
        <p>Te esperamos. Si necesitas cancelar o reprogramar, puedes hacerlo desde el portal.</p>
        <p><a href="https://x83tsow2k2b8.space.minimax.io/citas">Ver mis citas</a></p>
        <br>
        <p>Saludos cordiales,<br>UGT Towa Pharmaceutical Europe</p>
      `;

      emailBodyDelegate = `
        <h2>Nueva Cita Reservada</h2>
        <p>Se ha reservado una nueva cita:</p>
        <ul>
          <li><strong>Usuario:</strong> ${user.full_name} (${user.email})</li>
          <li><strong>Tipo de delegado:</strong> ${delegateTypeName}</li>
          <li><strong>Fecha:</strong> ${dateStr}</li>
          <li><strong>Hora:</strong> ${timeStr}</li>
        </ul>
        <p><a href="https://x83tsow2k2b8.space.minimax.io/admin/citas">Ver todas las citas</a></p>
        <br>
        <p>Sistema de Gestión UGT Towa</p>
      `;
    } else if (action === 'cancelled') {
      emailSubject = 'Cita Cancelada - UGT Towa';
      emailBodyUser = `
        <h2>Cita Cancelada</h2>
        <p>Hola ${user.full_name},</p>
        <p>Tu cita ha sido cancelada:</p>
        <ul>
          <li><strong>Tipo de delegado:</strong> ${delegateTypeName}</li>
          <li><strong>Fecha:</strong> ${dateStr}</li>
          <li><strong>Hora:</strong> ${timeStr}</li>
        </ul>
        <p>Puedes reservar una nueva cita cuando lo necesites.</p>
        <p><a href="https://x83tsow2k2b8.space.minimax.io/citas">Reservar nueva cita</a></p>
        <br>
        <p>Saludos cordiales,<br>UGT Towa Pharmaceutical Europe</p>
      `;

      emailBodyDelegate = `
        <h2>Cita Cancelada</h2>
        <p>Se ha cancelado una cita:</p>
        <ul>
          <li><strong>Usuario:</strong> ${user.full_name} (${user.email})</li>
          <li><strong>Tipo de delegado:</strong> ${delegateTypeName}</li>
          <li><strong>Fecha:</strong> ${dateStr}</li>
          <li><strong>Hora:</strong> ${timeStr}</li>
        </ul>
        <p><a href="https://x83tsow2k2b8.space.minimax.io/admin/citas">Ver todas las citas</a></p>
        <br>
        <p>Sistema de Gestión UGT Towa</p>
      `;
    }

    // Logs para el usuario (el email real requeriría integración con servicio de email)
    console.log('=== NOTIFICACIÓN DE CITA ===');
    console.log('Acción:', action);
    console.log('Usuario:', user.email);
    console.log('Asunto:', emailSubject);
    console.log('Contenido para usuario:', emailBodyUser);
    console.log('Contenido para delegado:', emailBodyDelegate);

    // Sistema de notificaciones por email removido durante limpieza
    // Solo registramos el evento en logs para seguimiento
    console.log('Notificación registrada para:', {
      userEmail: user.email,
      subject: emailSubject,
      type: action,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      data: {
        success: true,
        message: 'Notificación procesada correctamente',
        appointmentId: appointmentId,
        action: action,
        userEmail: user.email
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en notificación de cita:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'NOTIFICATION_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
