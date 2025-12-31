// Edge Function: delete-subscriber
// Maneja la eliminación de suscriptores con permisos de servicio

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  // Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Obtener credenciales de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuración de Supabase no disponible');
    }

    // Crear cliente con service role key (bypassa RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener el token del usuario desde el header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario es admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no válido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar rol de admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Permisos insuficientes. Solo administradores pueden eliminar suscriptores.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el ID del suscriptor del cuerpo de la petición
    const { subscriberId } = await req.json();

    if (!subscriberId) {
      return new Response(
        JSON.stringify({ error: 'ID de suscriptor requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar el suscriptor usando service role (bypassa RLS)
    const { error: deleteError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .delete()
      .eq('id', subscriberId);

    if (deleteError) {
      console.error('Error eliminando suscriptor:', deleteError);
      throw deleteError;
    }

    console.log(`Suscriptor ${subscriberId} eliminado exitosamente por admin ${user.id}`);

    // Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Suscriptor eliminado correctamente'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error en delete-subscriber:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Error al eliminar el suscriptor'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
