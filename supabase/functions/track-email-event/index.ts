Deno.serve(async (req) => {
    try {
        const url = new URL(req.url);
        const newsletterId = url.searchParams.get('newsletter_id');
        const email = url.searchParams.get('email');
        const event = url.searchParams.get('event');

        if (!newsletterId || !email || !event) {
            // Retornar pixel transparente incluso si faltan parámetros
            return new Response(
                atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'image/gif',
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                }
            );
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuración de Supabase faltante');
        }

        if (event === 'open') {
            // Actualizar registro de analytics con fecha de apertura
            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/email_analytics?newsletter_id=eq.${newsletterId}&email=eq.${email}&opened_at=is.null`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        opened_at: new Date().toISOString()
                    })
                }
            );

            if (updateResponse.ok) {
                // Incrementar contador de aperturas en newsletter
                const statsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/newsletters_sent?id=eq.${newsletterId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                        }
                    }
                );

                if (statsResponse.ok) {
                    const stats = await statsResponse.json();
                    if (stats && stats.length > 0) {
                        await fetch(
                            `${supabaseUrl}/rest/v1/newsletters_sent?id=eq.${newsletterId}`,
                            {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${serviceRoleKey}`,
                                    'apikey': serviceRoleKey,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify({
                                    opened_count: (stats[0].opened_count || 0) + 1
                                })
                            }
                        );
                    }
                }
            }
        } else if (event === 'click') {
            // Actualizar registro de analytics con fecha de clic
            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/email_analytics?newsletter_id=eq.${newsletterId}&email=eq.${email}&clicked_at=is.null`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        clicked_at: new Date().toISOString()
                    })
                }
            );

            if (updateResponse.ok) {
                // Incrementar contador de clics en newsletter
                const statsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/newsletters_sent?id=eq.${newsletterId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                        }
                    }
                );

                if (statsResponse.ok) {
                    const stats = await statsResponse.json();
                    if (stats && stats.length > 0) {
                        await fetch(
                            `${supabaseUrl}/rest/v1/newsletters_sent?id=eq.${newsletterId}`,
                            {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${serviceRoleKey}`,
                                    'apikey': serviceRoleKey,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify({
                                    clicked_count: (stats[0].clicked_count || 0) + 1
                                })
                            }
                        );
                    }
                }
            }
        } else if (event === 'unsubscribe') {
            // Desuscribir usuario
            await fetch(
                `${supabaseUrl}/rest/v1/newsletter_subscribers?email=eq.${email}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        is_active: false
                    })
                }
            );

            // Retornar página de confirmación
            return new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Desuscripción Confirmada</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            padding: 50px;
                            background-color: #f4f4f4;
                        }
                        .message {
                            background-color: white;
                            padding: 40px;
                            border-radius: 8px;
                            max-width: 500px;
                            margin: 0 auto;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        h1 { color: #e50000; }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h1>Desuscripción Confirmada</h1>
                        <p>Has sido eliminado de la lista de distribución del newsletter UGT Towa.</p>
                        <p>Lamentamos verte partir.</p>
                    </div>
                </body>
                </html>`,
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' }
                }
            );
        }

        // Retornar pixel transparente de 1x1 para tracking
        const transparentGif = atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        
        return new Response(transparentGif, {
            status: 200,
            headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        console.error('Error tracking evento:', error);
        
        // Retornar pixel transparente incluso si hay error
        return new Response(
            atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
            {
                status: 200,
                headers: { 'Content-Type': 'image/gif' }
            }
        );
    }
});
