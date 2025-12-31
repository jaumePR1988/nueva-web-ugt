/**
 * Ejemplos de Uso - Edge Function Generate PDF Professional
 * 
 * Este archivo contiene ejemplos prácticos de cómo usar la función
 * generate-pdf-professional en diferentes escenarios.
 * 
 * @author UGT Towa Portal
 * @version 1.0.0
 */

// ============================================
// EJEMPLO 1: GENERAR PDF DESDE BASE DE DATOS
// ============================================

async function generatePDFfromDatabase(newsletterId) {
    const supabaseUrl = 'https://your-project.supabase.co';
    const supabaseKey = 'your-anon-key';
    
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf-professional`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify({
                dataSource: 'database',
                newsletterId: newsletterId,
                options: {
                    format: 'A4',
                    orientation: 'portrait',
                    margin: {
                        top: '2cm',
                        right: '1.5cm',
                        bottom: '2cm',
                        left: '1.5cm'
                    },
                    printBackground: true,
                    scale: 1.0
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ PDF generado exitosamente');
            console.log('Archivo:', result.data.fileName);
            console.log('Páginas estimadas:', result.data.metadata.pageCount);
            console.log('Tamaño estimado:', result.data.metadata.fileSize);
            
            // Usar las instrucciones de Puppeteer para generar el PDF real
            return result.data.puppeteerInstructions;
        } else {
            console.error('❌ Error:', result.error.message);
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
    }
}

// ============================================
// EJEMPLO 2: GENERAR PDF CON CONTENIDO DIRECTO
// ============================================

async function generatePDFfromDirectContent() {
    const supabaseUrl = 'https://your-project.supabase.co';
    const supabaseKey = 'your-anon-key';
    
    const sampleContent = `
        <div class="section">
            <h1>Bienvenidos al Newsletter UGT Towa</h1>
            <p>Este es un ejemplo de contenido que se convertirá en PDF profesional.</p>
            
            <div class="content-item">
                <h2>Destacados del Mes</h2>
                <p>Contenido importante sobre las actividades de UGT durante este período.</p>
                <ul>
                    <li>Nueva campaña de afiliación</li>
                    <li>Mejoras en el portal web</li>
                    <li>Eventos sindicales programados</li>
                </ul>
            </div>
            
            <div class="statistics-grid">
                <div class="stat-card">
                    <div class="stat-number">2,547</div>
                    <div class="stat-label">Afiliados Activos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">156</div>
                    <div class="stat-label">Nuevos Miembros</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">98%</div>
                    <div class="stat-label">Satisfacción</div>
                </div>
            </div>
            
            <div class="content-item">
                <h2>Próximos Eventos</h2>
                <p>Calendario de actividades sindicales para el próximo mes.</p>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf-professional`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify({
                dataSource: 'direct',
                htmlContent: sampleContent,
                subject: 'Newsletter UGT Towa - Ejemplo Profesional',
                options: {
                    format: 'A4',
                    orientation: 'portrait',
                    margin: {
                        top: '2.5cm',
                        right: '2cm',
                        bottom: '2.5cm',
                        left: '2cm'
                    },
                    printBackground: true,
                    scale: 1.0
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ PDF directo generado exitosamente');
            console.log('Archivo:', result.data.fileName);
            return result.data;
        } else {
            console.error('❌ Error:', result.error.message);
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
    }
}

// ============================================
// EJEMPLO 3: GENERAR PDF HORIZONTAL (LANDSCAPE)
// ============================================

async function generatePDFLandscape(newsletterId) {
    const supabaseUrl = 'https://your-project.supabase.co';
    const supabaseKey = 'your-anon-key';
    
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf-professional`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify({
                dataSource: 'database',
                newsletterId: newsletterId,
                options: {
                    format: 'A4',
                    orientation: 'landscape',
                    margin: {
                        top: '1.5cm',
                        right: '2cm',
                        bottom: '1.5cm',
                        left: '2cm'
                    },
                    printBackground: true,
                    scale: 0.9
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ PDF horizontal generado exitosamente');
            return result.data;
        } else {
            console.error('❌ Error:', result.error.message);
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
    }
}

// ============================================
// EJEMPLO 4: INTEGRACIÓN CON PUPPETEER
// ============================================

async function generatePDFwithPuppeteer(puppeteerInstructions) {
    const puppeteer = require('puppeteer');
    
    try {
        // Lanzar navegador en modo headless
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        
        // Crear nueva página
        const page = await browser.newPage();
        
        // Configurar viewport
        await page.setViewport({
            width: 1200,
            height: 800
        });
        
        // Cargar contenido HTML
        await page.setContent(puppeteerInstructions.htmlContent, {
            waitUntil: 'networkidle0'
        });
        
        // Generar PDF
        const pdfBuffer = await page.pdf(puppeteerInstructions.options);
        
        // Cerrar navegador
        await browser.close();
        
        // Guardar archivo o retornar buffer
        return pdfBuffer;
        
    } catch (error) {
        console.error('❌ Error con Puppeteer:', error);
        throw error;
    }
}

// ============================================
// EJEMPLO 5: FUNCIÓN COMPLETA END-TO-END
// ============================================

async function generateNewsletterPDFComplete(newsletterId, outputPath) {
    console.log('🔄 Iniciando generación de PDF completo...');
    
    try {
        // Paso 1: Generar HTML profesional
        const pdfData = await generatePDFfromDatabase(newsletterId);
        
        if (!pdfData) {
            throw new Error('No se pudo generar el HTML profesional');
        }
        
        // Paso 2: Convertir con Puppeteer (en entorno Node.js)
        const pdfBuffer = await generatePDFwithPuppeteer(pdfData);
        
        // Paso 3: Guardar archivo
        const fs = require('fs');
        await fs.promises.writeFile(outputPath, pdfBuffer);
        
        console.log('✅ PDF generado exitosamente en:', outputPath);
        console.log('📄 Páginas:', pdfData.metadata.pageCount);
        console.log('📦 Tamaño:', pdfData.metadata.fileSize);
        
        return {
            success: true,
            filePath: outputPath,
            metadata: pdfData.metadata
        };
        
    } catch (error) {
        console.error('❌ Error en generación completa:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// EJEMPLO 6: TESTING Y VALIDACIÓN
// ============================================

async function testPDFGeneration() {
    const testCases = [
        {
            name: 'Newsletter desde BD',
            dataSource: 'database',
            newsletterId: '123',
            options: { format: 'A4', orientation: 'portrait' }
        },
        {
            name: 'Contenido directo simple',
            dataSource: 'direct',
            htmlContent: '<h1>Test Simple</h1><p>Contenido básico</p>',
            subject: 'Test Simple',
            options: { format: 'A4', orientation: 'portrait' }
        },
        {
            name: 'PDF Horizontal',
            dataSource: 'direct',
            htmlContent: '<h1>Test Horizontal</h1><p>Contenido para landscape</p>',
            subject: 'Test Landscape',
            options: { format: 'A4', orientation: 'landscape' }
        }
    ];
    
    console.log('🧪 Iniciando tests de generación PDF...');
    
    for (const testCase of testCases) {
        console.log(`\n📋 Test: ${testCase.name}`);
        
        try {
            const supabaseUrl = 'https://your-project.supabase.co';
            const supabaseKey = 'your-anon-key';
            
            const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf-professional`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                },
                body: JSON.stringify(testCase)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('  ✅ Éxito:', result.data.fileName);
                console.log('  📊 Metadata:', result.data.metadata);
            } else {
                console.log('  ❌ Error:', result.error.message);
            }
            
        } catch (error) {
            console.log('  ❌ Error de red:', error.message);
        }
    }
}

// ============================================
// EJEMPLO 7: GENERACIÓN BATCH
// ============================================

async function generateBatchPDFs(newsletterIds) {
    console.log(`🔄 Generando ${newsletterIds.length} PDFs en lote...`);
    
    const results = [];
    
    for (const newsletterId of newsletterIds) {
        try {
            console.log(`  📄 Procesando newsletter ${newsletterId}...`);
            
            const pdfData = await generatePDFfromDatabase(newsletterId);
            
            if (pdfData) {
                const outputPath = `/tmp/newsletter-${newsletterId}-${Date.now()}.pdf`;
                const pdfBuffer = await generatePDFwithPuppeteer(pdfData);
                
                const fs = require('fs');
                await fs.promises.writeFile(outputPath, pdfBuffer);
                
                results.push({
                    newsletterId,
                    success: true,
                    filePath: outputPath,
                    metadata: pdfData.metadata
                });
                
                console.log(`    ✅ Completado: ${outputPath}`);
            } else {
                results.push({
                    newsletterId,
                    success: false,
                    error: 'No se pudo generar HTML'
                });
                console.log(`    ❌ Error: No se pudo generar HTML`);
            }
            
        } catch (error) {
            results.push({
                newsletterId,
                success: false,
                error: error.message
            });
            console.log(`    ❌ Error: ${error.message}`);
        }
    }
    
    console.log('\n📊 Resumen de generación en lote:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`  ✅ Exitosos: ${successful}`);
    console.log(`  ❌ Fallidos: ${failed}`);
    
    return results;
}

// ============================================
// EJECUTAR EJEMPLOS
// ============================================

// Descomentar para ejecutar ejemplos específicos:

// Ejemplo 1: Newsletter desde base de datos
// generatePDFfromDatabase('123');

// Ejemplo 2: Contenido directo
// generatePDFfromDirectContent();

// Ejemplo 3: PDF horizontal
// generatePDFfromDatabase('456');

// Ejemplo 4: Test completo
// testPDFGeneration();

// Ejemplo 5: Generación completa end-to-end
/*
// generateNewsletterPDFComplete('123', '/tmp/newsletter-123.pdf').then(result => {
//     console.log('Resultado final:', result);
// });
*/

// Ejemplo 6: Generación en lote
/*
// const newsletterIds = ['123', '456', '789'];
// generateBatchPDFs(newsletterIds).then(results => {
//     console.log('Resultados del lote:', results);
// });
*/

// ============================================
// EXPORTAR FUNCIONES PARA USO EXTERNO
// ============================================

module.exports = {
    generatePDFfromDatabase,
    generatePDFfromDirectContent,
    generatePDFLandscape,
    generatePDFwithPuppeteer,
    generateNewsletterPDFComplete,
    testPDFGeneration,
    generateBatchPDFs
};