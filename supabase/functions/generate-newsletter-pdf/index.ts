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
        const { newsletterId } = await req.json();

        if (!newsletterId) {
            throw new Error('newsletterId es requerido');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuración de Supabase faltante');
        }

        // Obtener el newsletter de newsletter_editions
        const newsletterResponse = await fetch(`${supabaseUrl}/rest/v1/newsletter_editions?id=eq.${newsletterId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
            }
        });

        if (!newsletterResponse.ok) {
            throw new Error('Error obteniendo newsletter');
        }

        const newsletters = await newsletterResponse.json();
        if (!newsletters || newsletters.length === 0) {
            throw new Error('Newsletter no encontrado');
        }

        const newsletter = newsletters[0];
        const htmlContent = newsletter.content?.html || newsletter.content;
        const subject = newsletter.title;

        // Generar PDF usando librería jspdf-html2canvas
        // Como Deno no soporta jsPDF directamente, usaremos una aproximación con Puppeteer
        // Para este entorno, generaremos un HTML optimizado para PDF
        
        const pdfOptimizedHtml = generatePdfOptimizedHtml(htmlContent, subject);

        return new Response(JSON.stringify({
            data: {
                success: true,
                htmlContent: pdfOptimizedHtml,
                fileName: `newsletter-ugt-towa-${new Date().toISOString().split('T')[0]}.pdf`,
                message: 'HTML optimizado para PDF generado exitosamente'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error generando PDF:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'PDF_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generatePdfOptimizedHtml(htmlContent: string, subject: string): string {
    // Optimizar HTML para impresión profesional en PDF
    // Con saltos de página inteligentes y layout A4
    
    const optimizedHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        /* Configuración de página A4 profesional */
        @page {
            size: A4 portrait;
            margin: 2cm 1.5cm;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            /* Ocultar elementos no imprimibles */
            .no-print {
                display: none !important;
            }
            
            /* Control de saltos de página */
            .page-break-before {
                page-break-before: always;
            }
            
            .page-break-after {
                page-break-after: always;
            }
            
            /* Evitar huérfanos y viudas */
            h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                orphans: 3;
                widows: 3;
            }
            
            /* Contador de páginas */
            @bottom-right {
                content: "Página " counter(page) " de " counter(pages);
                font-size: 10px;
                color: #666;
            }
        }
        
        /* Estilos base del documento */
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #ffffff;
            max-width: 21cm;
            margin: 0 auto;
            padding: 0;
            font-size: 11pt;
        }
        
        .container {
            background-color: #ffffff;
            padding: 0;
        }
        
        /* Encabezado profesional con branding UGT */
        .header {
            background: linear-gradient(135deg, #e50000 0%, #c00000 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            margin-bottom: 35px;
            page-break-inside: avoid;
            page-break-after: avoid;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            margin: 0 0 12px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }
        
        .header p {
            margin: 0;
            font-size: 18px;
            opacity: 0.95;
            font-weight: 300;
        }
        
        /* Secciones con salto de página inteligente */
        .section {
            margin-bottom: 35px;
            page-break-inside: avoid;
            orphans: 3;
            widows: 3;
        }
        
        .section-title {
            color: #e50000;
            font-size: 24px;
            font-weight: bold;
            border-bottom: 3px solid #e50000;
            padding-bottom: 12px;
            margin-bottom: 25px;
            page-break-after: avoid;
            page-break-inside: avoid;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Items de contenido sin cortes */
        .content-item {
            margin-bottom: 28px;
            padding: 22px;
            background-color: #f9f9f9;
            border-left: 6px solid #e50000;
            border-radius: 4px;
            page-break-inside: avoid;
            orphans: 3;
            widows: 3;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .content-item h3 {
            margin: 0 0 14px 0;
            color: #2c2c2c;
            font-size: 20px;
            font-weight: 600;
            line-height: 1.3;
        }
        
        .content-item p {
            margin: 0;
            color: #555;
            font-size: 13px;
            line-height: 1.7;
        }
        
        .content-item img {
            max-width: 100%;
            height: auto;
            margin-top: 18px;
            display: block;
            border-radius: 6px;
            page-break-inside: avoid;
        }
        
        /* Estadísticas con layout profesional */
        .statistics {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            gap: 22px;
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .stat-box {
            background: linear-gradient(135deg, #e50000 0%, #b00000 100%);
            color: white;
            padding: 28px;
            text-align: center;
            flex: 1;
            min-width: 160px;
            border-radius: 8px;
            page-break-inside: avoid;
            box-shadow: 0 3px 8px rgba(229,0,0,0.3);
        }
        
        .stat-number {
            font-size: 42px;
            font-weight: bold;
            margin-bottom: 8px;
            line-height: 1;
        }
        
        .stat-label {
            font-size: 13px;
            opacity: 0.9;
            font-weight: 300;
        }
        
        /* QR de afiliación destacado */
        .qr-section {
            text-align: center;
            margin: 45px 0;
            padding: 35px;
            background-color: #f5f5f5;
            border: 3px solid #e50000;
            border-radius: 10px;
            page-break-inside: avoid;
        }
        
        .qr-section h2 {
            color: #e50000;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        
        .qr-section img {
            max-width: 220px;
            height: auto;
            margin: 0 auto;
            display: block;
            border: 2px solid #e50000;
            border-radius: 8px;
            padding: 15px;
            background: white;
        }
        
        .qr-section p {
            margin-top: 18px;
            color: #666;
            font-size: 13px;
            line-height: 1.6;
        }
        
        /* Footer profesional con datos de contacto */
        .footer {
            margin-top: 50px;
            padding: 30px 25px;
            border-top: 3px solid #e50000;
            background-color: #fafafa;
            text-align: center;
            color: #555;
            font-size: 11px;
            page-break-inside: avoid;
            border-radius: 6px;
        }
        
        .footer p {
            margin: 8px 0;
            line-height: 1.6;
        }
        
        .footer strong {
            color: #e50000;
            font-weight: 600;
        }
        
        .footer .contact-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
        }
        
        .footer .copyright {
            margin-top: 15px;
            font-size: 10px;
            color: #999;
            font-style: italic;
        }
        
        /* Eliminar elementos interactivos para PDF */
        a {
            color: inherit;
            text-decoration: none;
        }
        
        img[src*="track-email-event"] {
            display: none !important;
        }
        
        /* Mejoras tipográficas */
        h1, h2, h3, h4, h5, h6 {
            font-weight: 600;
            line-height: 1.2;
        }
        
        p {
            margin-bottom: 0.8em;
        }
        
        /* Optimización para impresión a color */
        @media print {
            .header,
            .stat-box,
            .qr-section,
            .content-item {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>
    `.trim();
    
    return optimizedHtml;
}
