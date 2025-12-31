import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Aplicando políticas de eliminación...');

    // 1. Políticas para tabla appointments
    const appointmentsPolicies = `
      -- Eliminar políticas existentes
      DROP POLICY IF EXISTS "Allow authenticated users to delete appointments" ON appointments;
      DROP POLICY IF EXISTS "Allow admins to delete any appointment" ON appointments;

      -- Política: Usuarios pueden eliminar sus propias citas
      CREATE POLICY "Allow authenticated users to delete appointments" 
      ON appointments 
      FOR DELETE 
      USING (auth.uid() = user_id);

      -- Política: Administradores pueden eliminar cualquier cita
      CREATE POLICY "Allow admins to delete any appointment" 
      ON appointments 
      FOR DELETE 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
    `;

    const { error: appointmentsError } = await supabase.rpc('exec', { sql: appointmentsPolicies });
    
    if (appointmentsError) {
      console.error('Error aplicando políticas de appointments:', appointmentsError);
    } else {
      console.log('Políticas de appointments aplicadas correctamente');
    }

    // 2. Políticas para tabla newsletter_subscribers
    const subscribersPolicies = `
      -- Eliminar políticas existentes
      DROP POLICY IF EXISTS "Allow admins to delete subscribers" ON newsletter_subscribers;

      -- Política: Solo administradores pueden eliminar suscriptores
      CREATE POLICY "Allow admins to delete subscribers" 
      ON newsletter_subscribers 
      FOR DELETE 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
    `;

    const { error: subscribersError } = await supabase.rpc('exec', { sql: subscribersPolicies });
    
    if (subscribersError) {
      console.error('Error aplicando políticas de newsletter_subscribers:', subscribersError);
    } else {
      console.log('Políticas de newsletter_subscribers aplicadas correctamente');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Políticas de eliminación aplicadas correctamente',
        details: {
          appointments: appointmentsError ? 'Error' : 'Exitoso',
          newsletter_subscribers: subscribersError ? 'Error' : 'Exitoso'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error general:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'FUNCTION_ERROR',
          message: error.message
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
