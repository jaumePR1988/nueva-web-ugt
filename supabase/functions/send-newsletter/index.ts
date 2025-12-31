Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { newsletterId, subject, htmlContent } = await req.json();

        if (!newsletterId || !subject || !htmlContent) {
            throw new Error('newsletterId, subject y htmlContent son requeridos');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuración de Supabase faltante');
        }

        // Obtener suscriptores activos
        const subscribersResponse = await fetch(`${supabaseUrl}/rest/v1/newsletter_subscribers?is_active=eq.true&select=email,name`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
            }
        });

        if (!subscribersResponse.ok) {
            throw new Error('Error obteniendo suscriptores');
        }

        const subscribers = await subscribersResponse.json();

        if (!subscribers || subscribers.length === 0) {
            throw new Error('No hay suscriptores activos');
        }

        // Filtrar solo emails @towapharmaceutical.com
        const validSubscribers = subscribers.filter(sub => 
            sub.email && sub.email.endsWith('@towapharmaceutical.com')
        );

        if (validSubscribers.length === 0) {
            throw new Error('No hay suscriptores válidos (@towapharmaceutical.com)');
        }

        let successCount = 0;
        let failCount = 0;

        // Si no hay API key de Resend, simular envío (para testing)
        if (!resendApiKey) {
            console.log('MODO SIMULACIÓN: No hay RESEND_API_KEY configurada');
            console.log(`Se enviarían ${validSubscribers.length} emails a:`, validSubscribers.map(s => s.email));
            
            // Crear registros de analytics simulados
            for (const subscriber of validSubscribers) {
                await fetch(`${supabaseUrl}/rest/v1/email_analytics`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        newsletter_id: newsletterId,
                        email: subscriber.email,
                        bounced: false
                    })
                });
            }

            successCount = validSubscribers.length;
        } else {
            // Enviar emails reales usando Resend
            for (const subscriber of validSubscribers) {
                try {
                    // Agregar tracking pixel y enlaces con tracking
                    const trackingPixel = `<img src="${supabaseUrl}/functions/v1/track-email-event?newsletter_id=${newsletterId}&email=${encodeURIComponent(subscriber.email)}&event=open" width="1" height="1" style="display:none;" />`;
                    const trackedContent = htmlContent.replace('</body>', `${trackingPixel}</body>`);

                    const emailResponse = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${resendApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: 'UGT Towa <newsletter@ugttowa.com>',
                            to: [subscriber.email],
                            subject: subject,
                            html: trackedContent
                        })
                    });

                    if (emailResponse.ok) {
                        successCount++;
                        
                        // Crear registro de analytics
                        await fetch(`${supabaseUrl}/rest/v1/email_analytics`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=minimal'
                            },
                            body: JSON.stringify({
                                newsletter_id: newsletterId,
                                email: subscriber.email,
                                bounced: false
                            })
                        });
                    } else {
                        failCount++;
                    }
                } catch (emailError) {
                    console.error(`Error enviando a ${subscriber.email}:`, emailError);
                    failCount++;
                }
            }
        }

        // Actualizar newsletter con estadísticas
        await fetch(`${supabaseUrl}/rest/v1/newsletters_sent?id=eq.${newsletterId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                status: 'sent',
                total_sent: successCount,
                sent_at: new Date().toISOString()
            })
        });

        return new Response(JSON.stringify({
            data: {
                success: true,
                totalSubscribers: validSubscribers.length,
                successCount,
                failCount,
                message: resendApiKey ? 'Newsletter enviado exitosamente' : 'Simulación exitosa (configurar RESEND_API_KEY para envío real)'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error enviando newsletter:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'NEWSLETTER_SEND_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
