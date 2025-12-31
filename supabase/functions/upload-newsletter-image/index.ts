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
        const { imageData, fileName } = await req.json();

        if (!imageData || !fileName) {
            throw new Error('imageData y fileName son requeridos');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuración de Supabase faltante');
        }

        // Extraer datos base64 del data URL
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.split(';')[0].split(':')[1];

        // Convertir base64 a binario
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Generar ruta de almacenamiento con timestamp
        const timestamp = Date.now();
        const storagePath = `${timestamp}-${fileName}`;

        // Subir a Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/newsletter-images/${storagePath}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': mimeType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Subida fallida: ${errorText}`);
        }

        // Obtener URL pública
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/newsletter-images/${storagePath}`;

        return new Response(JSON.stringify({
            data: {
                publicUrl,
                fileName: storagePath
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error subiendo imagen:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'IMAGE_UPLOAD_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
