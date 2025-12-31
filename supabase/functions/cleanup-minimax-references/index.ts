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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuración de Supabase no disponible');
    }

    const currentDomain = 'x83tsow2k2b8.space.minimax.io';
    
    // Lista de tablas que pueden contener URLs de minimax
    const tablesToCheck = [
      'newsletter_content',
      'notification_queue', 
      'admin_notification_preferences',
      'push_notification_history'
    ];

    let totalCleaned = 0;
    const results = [];

    // Limpiar cada tabla
    for (const table of tablesToCheck) {
      try {
        // Buscar registros con referencias a minimax
        const searchResponse = await fetch(
          `${supabaseUrl}/rest/v1/${table}?select=*`,
          {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            }
          }
        );

        if (searchResponse.ok) {
          const records = await searchResponse.json();
          
          for (const record of records) {
            let needsUpdate = false;
            const updatedRecord = { ...record };

            // Revisar todos los campos de texto
            for (const [key, value] of Object.entries(updatedRecord)) {
              if (typeof value === 'string' && (value.includes('minimax.io') || value.includes('space.minimax') || value.includes('dfxmdsy1r55k'))) {
                // Reemplazar URLs de minimax
                const cleanedValue = value
                  .replace(/https?:\/\/[^/]*\.minimax\.io/g, `https://${currentDomain}`)
                  .replace(/space\.minimax\.io/g, currentDomain)
                  .replace(/dfxmdsy1r55k\.space\.minimax\.io/g, currentDomain);
                
                if (cleanedValue !== value) {
                  updatedRecord[key] = cleanedValue;
                  needsUpdate = true;
                }
              }
            }

            // Actualizar si se hicieron cambios
            if (needsUpdate) {
              const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/${table}?id=eq.${record.id}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(updatedRecord)
                }
              );

              if (updateResponse.ok) {
                totalCleaned++;
                results.push({
                  table,
                  recordId: record.id,
                  action: 'cleaned'
                });
              }
            }
          }
        }
      } catch (tableError) {
        console.error(`Error al limpiar tabla ${table}:`, tableError);
        results.push({
          table,
          error: tableError.message
        });
      }
    }

    return new Response(JSON.stringify({
      data: {
        success: true,
        message: `Limpieza completada. ${totalCleaned} registros actualizados.`,
        totalCleaned,
        results,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en limpieza:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'CLEANUP_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
