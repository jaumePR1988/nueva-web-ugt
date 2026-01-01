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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuración de Supabase faltante');
        }

        // Obtener contenido publicado del mes actual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const contentResponse = await fetch(
            `${supabaseUrl}/rest/v1/newsletter_content?is_published=eq.true&published_at=gte.${firstDayOfMonth}&published_at=lte.${lastDayOfMonth}&order=created_at.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        if (!contentResponse.ok) {
            throw new Error('Error obteniendo contenido');
        }

        const content = await contentResponse.json();

        // Agrupar contenido por tipo
        const contentByType = {
            news: content.filter(c => c.type === 'news'),
            events: content.filter(c => c.type === 'events'),
            statistics: content.filter(c => c.type === 'statistics'),
            directives: content.filter(c => c.type === 'directives'),
            suggestions: content.filter(c => c.type === 'suggestions')
        };

        // Generar HTML del newsletter
        const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const subject = `Newsletter UGT Towa - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;

        // Obtener QR code activo
        const qrResponse = await fetch(
            `${supabaseUrl}/rest/v1/qr_codes?is_active=eq.true&order=created_at.desc&limit=1`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        let qrCode = null;
        if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData && qrData.length > 0) {
                qrCode = qrData[0];
            }
        }

        const htmlContent = generateNewsletterHTML(contentByType, monthName, qrCode);

        // Verificar si ya existe un borrador para este mes
        const existingDraftResponse = await fetch(
            `${supabaseUrl}/rest/v1/newsletters_sent?status=eq.draft&subject=eq.${encodeURIComponent(subject)}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const existingDrafts = await existingDraftResponse.json();

        if (existingDrafts && existingDrafts.length > 0) {
            // Actualizar borrador existente
            await fetch(`${supabaseUrl}/rest/v1/newsletters_sent?id=eq.${existingDrafts[0].id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    content: htmlContent,
                    created_at: new Date().toISOString()
                })
            });

            return new Response(JSON.stringify({
                data: {
                    message: 'Borrador actualizado exitosamente',
                    newsletterId: existingDrafts[0].id,
                    subject,
                    contentItems: content.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else {
            // Crear nuevo borrador
            const createResponse = await fetch(`${supabaseUrl}/rest/v1/newsletters_sent`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    subject,
                    content: htmlContent,
                    status: 'draft'
                })
            });

            if (!createResponse.ok) {
                throw new Error('Error creando borrador');
            }

            const newDraft = await createResponse.json();

            return new Response(JSON.stringify({
                data: {
                    message: 'Borrador generado exitosamente',
                    newsletterId: newDraft[0].id,
                    subject,
                    contentItems: content.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Error generando borrador:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'DRAFT_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generateNewsletterHTML(contentByType: any, monthName: string, qrCode: any = null): string {
    const baseUrl = "https://towa-ugt.es"; // URL base real del portal

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter UGT Towa - ${monthName}</title>
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.4;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            background-color: white;
        }
        .a4-container {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            position: relative;
        }
        /* Header Estilo Periódico */
        .header {
            border-bottom: 4px solid #e50000;
            margin-bottom: 20px;
            padding-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .header-main {
            flex: 2;
        }
        .header-logo {
            font-size: 48px;
            font-weight: 900;
            color: #e50000;
            margin: 0;
            letter-spacing: -2px;
            text-transform: uppercase;
        }
        .header-subtitle {
            font-size: 16px;
            font-weight: bold;
            color: #666;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .header-date {
            text-align: right;
            font-weight: bold;
            color: #e50000;
            text-transform: uppercase;
            font-size: 14px;
        }

        /* Layout de 2 Columnas */
        .columns {
            display: flex;
            gap: 20px;
        }
        .column-main {
            flex: 2;
        }
        .column-side {
            flex: 1;
            padding-left: 20px;
            border-left: 1px solid #ddd;
        }

        .section-title {
            background-color: #1a1a1a;
            color: white;
            padding: 5px 15px;
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 15px;
            display: inline-block;
        }

        .news-item {
            margin-bottom: 25px;
            position: relative;
        }
        .news-item h3 {
            font-size: 22px;
            font-weight: 900;
            margin: 0 0 10px 0;
            line-height: 1.1;
            color: #e50000;
        }
        .news-content {
            font-size: 13px;
            color: #333;
            margin: 0;
            text-align: justify;
        }
        .news-footer {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
        }
        .qr-small {
            width: 60px;
            height: 60px;
            border: 1px solid #eee;
            padding: 2px;
        }
        .qr-label {
            font-size: 9px;
            color: #999;
            font-weight: bold;
            text-transform: uppercase;
        }

        .event-item {
            padding: 10px;
            background-color: #f8f8f8;
            margin-bottom: 10px;
            border-left: 3px solid #e50000;
        }
        .event-item h4 {
            margin: 0;
            font-size: 14px;
            color: #1a1a1a;
        }
        .event-date {
            font-size: 11px;
            color: #e50000;
            font-weight: bold;
        }

        .stat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
        }
        .stat-card {
            background-color: #e50000;
            color: white;
            padding: 10px;
            text-align: center;
            border-radius: 4px;
        }
        .stat-card .val { font-size: 24px; font-weight: 900; }
        .stat-card .lab { font-size: 10px; text-transform: uppercase; font-weight: bold; }

        .app-promo {
            margin-top: 30px;
            padding: 20px;
            background-color: #1a1a1a;
            color: white;
            text-align: center;
            border-radius: 8px;
        }
        .app-promo h4 { margin: 0 0 10px 0; font-size: 16px; color: #e50000; }
        .app-promo p { font-size: 11px; margin-bottom: 15px; }

        .footer {
            position: absolute;
            bottom: 0;
            width: 100%;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            font-size: 10px;
            color: #999;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="a4-container">
        <header class="header">
            <div class="header-main">
                <h1 class="header-logo">UGT TOWA</h1>
                <p class="header-subtitle">Resumen Mensual de Actividad Sindical</p>
            </div>
            <div class="header-date">
                ${monthName}
            </div>
        </header>

        <div class="columns">
            <!-- Columna Principal -->
            <div class="column-main">
                <div class="section-title">Noticias Destacadas</div>
                
                ${contentByType.news.map((item: any) => `
                    <article class="news-item">
                        <h3>${item.title}</h3>
                        <p class="news-content">${item.content}</p>
                        <div class="news-footer">
                            <img class="qr-small" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(baseUrl + '/comunicados')}" alt="QR" />
                            <span class="qr-label">Escanea para leer más<br/>en el portal</span>
                        </div>
                    </article>
                `).join('')}

                ${contentByType.directives.length > 0 ? `
                    <div class="section-title">Comunicados</div>
                    ${contentByType.directives.map((item: any) => `
                        <div class="news-item">
                            <h4 style="margin:0; font-size:16px;">${item.title}</h4>
                            <p class="news-content" style="font-size:12px;">${item.content}</p>
                        </div>
                    `).join('')}
                ` : ''}
            </div>

            <!-- Columna Lateral -->
            <div class="column-side">
                <div class="section-title">En Cifras</div>
                <div class="stat-grid">
                    ${contentByType.statistics.map((item: any) => `
                        <div class="stat-card">
                            <div class="val">${item.title}</div>
                            <div class="lab">${item.content}</div>
                        </div>
                    `).join('')}
                    ${contentByType.statistics.length === 0 ? `
                        <div class="stat-card" style="grid-column: span 2;">
                            <div class="val">TOWA</div>
                            <div class="lab">Unidos por tus derechos</div>
                        </div>
                    ` : ''}
                </div>

                <div class="section-title">Agenda</div>
                ${contentByType.events.map((item: any) => `
                    <div class="event-item">
                        <h4>${item.title}</h4>
                        <div class="event-date">Próximamente</div>
                        <p style="font-size:11px; margin:5px 0 0 0;">${item.content.substring(0, 100)}...</p>
                    </div>
                `).join('')}

                <div class="app-promo">
                    <h4>INSTALA NUESTRA APP</h4>
                    <p>Acceso VIP a documentos, tablas salariales y notificaciones urgentes.</p>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(baseUrl + '/instalar')}" alt="QR App" style="width:100px; height:100px; background:white; padding:5px; border-radius:4px;" />
                    <p style="margin-top:10px; font-weight:bold;">TOWA-UGT.ES/INSTALAR</p>
                </div>
            </div>
        </div>

        <footer class="footer">
            UGT Sección Sindical Towa Pharmaceutical Europe | Martorelles, Barcelona | jpedragosa@towapharmaceutical.com
        </footer>
    </div>
</body>
</html>
    `.trim();
}
