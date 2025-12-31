# Edge Function: Generate PDF Professional

## Descripción
Edge Function profesional para generación de PDF con HTML→PDF backend usando Puppeteer. Implementación optimizada para Supabase Edge Functions (Deno) con características empresariales avanzadas.

## Características Principales

### 🎨 **Diseño Profesional**
- **Formato A4 empresarial** con márgenes optimizados
- **Tipografía profesional** (Segoe UI) con jerarquía visual clara
- **Colores corporativos** UGT (rojo #e50000) como identidad visual
- **Layout responsivo** adaptado para impresión

### 📄 **Control Avanzado de Páginas**
- **Saltos de página inteligentes** con `page-break-inside: avoid`
- **Encabezados y pies de página** profesionales en cada página
- **Numeración automática** (Página X de Y)
- **Control de huérfanos y viudas** para contenido limpio

### 🏢 **Elementos Corporativos**
- **Portada profesional** con branding UGT
- **Secciones estructuradas** con títulos y subtítulos
- **Estadísticas destacadas** con diseño de tarjetas
- **Sección de afiliación** con QR code generado
- **Footer informativo** con datos de contacto

### ⚡ **Backend Robusto**
- **Manejo de errores** completo con logging
- **Validaciones** de entrada exhaustivas
- **Soporte dual** (base de datos o contenido directo)
- **Compatibilidad** total con Supabase Edge Functions

## Estructura del Código

### Funciones Principales

#### `fetchNewsletterFromDatabase()`
```typescript
// Obtiene newsletter desde base de datos con manejo de errores
async function fetchNewsletterFromDatabase(newsletterId, supabaseUrl, serviceRoleKey)
```

#### `generateProfessionalPDFHtml()`
```typescript
// Genera HTML profesional optimizado para conversión PDF
function generateProfessionalPDFHtml(htmlContent, subject, sourceData, options)
```

#### `sanitizeHtmlContent()`
```typescript
// Sanitiza HTML removiendo scripts, tracking, etc.
function sanitizeHtmlContent(htmlContent: string): string
```

#### `processContentForPDF()`
```typescript
// Procesa contenido para optimización PDF
function processContentForPDF(htmlContent: string): string
```

## Uso de la Función

### Llamada desde Base de Datos

```javascript
// Generar PDF desde newsletter de base de datos
const response = await fetch('/functions/v1/generate-pdf-professional', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
        dataSource: 'database',
        newsletterId: '123',
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
```

### Llamada con Contenido Directo

```javascript
// Generar PDF desde contenido directo
const response = await fetch('/functions/v1/generate-pdf-professional', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
        dataSource: 'direct',
        htmlContent: '<h1>Título del documento</h1><p>Contenido...</p>',
        subject: 'Mi Documento PDF',
        options: {
            format: 'A4',
            orientation: 'portrait'
        }
    })
});
```

## Opciones de Configuración

### `PDFOptions`
```typescript
interface PDFOptions {
    format?: 'A4' | 'Letter';           // Tamaño de página
    orientation?: 'portrait' | 'landscape'; // Orientación
    margin?: {                           // Márgenes personalizados
        top: string;
        right: string;
        bottom: string;
        left: string;
    };
    printBackground?: boolean;           // Incluir fondos
    preferCSSPageSize?: boolean;         // Usar tamaño CSS
    scale?: number;                      // Escala de zoom (0.1 - 2.0)
}
```

### Opciones por Defecto
```typescript
const defaultOptions = {
    format: 'A4',
    orientation: 'portrait',
    margin: {
        top: '2cm',
        right: '1.5cm',
        bottom: '2cm',
        left: '1.5cm'
    },
    printBackground: true,
    preferCSSPageSize: true,
    scale: 1.0
};
```

## Respuesta de la Función

### Respuesta Exitosa (200)
```json
{
    "success": true,
    "data": {
        "htmlContent": "<!DOCTYPE html>...",
        "fileName": "ugt-towa-mi-documento-2025-11-16.pdf",
        "metadata": {
            "generatedAt": "2025-11-16T22:42:56.000Z",
            "sourceType": "database",
            "pageCount": 3,
            "fileSize": "245 KB",
            "subject": "Newsletter UGT Towa"
        },
        "puppeteerInstructions": {
            "htmlContent": "<!DOCTYPE html>...",
            "options": { /* opciones para Puppeteer */ },
            "outputPath": "/tmp/ugt-towa-mi-documento-2025-11-16.pdf"
        },
        "message": "HTML profesional generado exitosamente para conversión PDF con Puppeteer"
    }
}
```

### Respuesta de Error (500)
```json
{
    "success": false,
    "error": {
        "code": "PDF_GENERATION_FAILED",
        "message": "Descripción del error",
        "timestamp": "2025-11-16T22:42:56.000Z",
        "function": "generate-pdf-professional"
    }
}
```

## Integración con Puppeteer

### Implementación Externa Recomendada

Para completar la conversión HTML→PDF con Puppeteer, se recomienda usar:

1. **Cloudflare Workers con Puppeteer**
2. **API externa especializada** (HTMLCSStoPDF, PDFShift, etc.)
3. **Servicio propio en Node.js** separado

### Ejemplo de Integración

```javascript
// Frontend o servicio externo
const puppeteer = require('puppeteer');

async function generatePDFFromHTML(htmlContent, outputPath) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
            top: '2cm',
            right: '1.5cm',
            bottom: '2cm',
            left: '1.5cm'
        }
    });
    
    await browser.close();
}
```

## Características CSS Avanzadas

### Control de Páginas
```css
@page {
    size: A4 portrait;
    margin: 2cm 1.5cm;
    
    @top-center {
        content: element(header);
    }
    
    @bottom-center {
        content: element(footer);
    }
}
```

### Evitar Cortado de Contenido
```css
.content-item {
    page-break-inside: avoid;
    orphans: 3;
    widows: 3;
}

.section-title {
    page-break-after: avoid;
    page-break-inside: avoid;
}
```

### Elementos Repetitivos
```css
.header {
    position: running(header);
}

.footer {
    position: running(footer);
}
```

## Validaciones y Seguridad

### Validaciones de Entrada
- ✅ Verificación de `dataSource` (database/direct)
- ✅ Validación de `newsletterId` para fuente database
- ✅ Validación de `htmlContent` para fuente direct
- ✅ Sanitización de contenido HTML
- ✅ Escape de texto para prevenir inyección

### Sanitización Automática
```typescript
// Removido automáticamente:
- Scripts inline <script>...</script>
- Estilos inline <style>...</style>
- Eventos onclick
- Tracking pixels
- Espacios en blanco excesivos
```

## Performance y Optimización

### Optimizaciones Implementadas
- **CSS minificado** y optimizado para impresión
- **Fuentes web optimizadas** (Segoe UI, fallback system)
- **Gradientes profesionales** con aceleración hardware
- **Responsive design** para diferentes tamaños
- **Prevención de elementos huérfanos**

### Métricas de Rendimiento
- **Estimación de páginas** automática
- **Cálculo de tamaño** de archivo
- **Tiempo de generación** controlado
- **Uso de memoria** optimizado

## Deployment y Configuración

### Variables de Entorno Requeridas
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Deploy en Supabase
```bash
supabase functions deploy generate-pdf-professional
```

### Configuración de CORS
La función incluye headers CORS completos para:
- ✅ Origin: `*`
- ✅ Headers: `authorization, x-client-info, apikey, content-type`
- ✅ Methods: `POST, GET, OPTIONS`

## Testing y Debugging

### Logs Disponibles
```javascript
console.error('Error en generación PDF profesional:', error);
```

### Errores Comunes
1. **"Configuración de Supabase faltante"** → Verificar variables de entorno
2. **"Newsletter no encontrado"** → Verificar ID de newsletter
3. **"No se encontró contenido"** → Verificar contenido HTML

## Versión y Changelog

### v1.0.0 (2025-11-16)
- ✅ Implementación inicial profesional
- ✅ Soporte dual (base de datos/directo)
- ✅ CSS avanzado para PDF
- ✅ Validaciones y seguridad
- ✅ Documentación completa
- ✅ Integración con Puppeteer preparada

## Soporte y Contacto

### Información Técnica
- **Función**: `generate-pdf-professional`
- **Runtime**: Deno (Supabase Edge Functions)
- **Compatibilidad**: Edge Functions v2
- **Dependencias**: Ninguna (solo APIs web estándar)

### Mantenimiento
Para actualizaciones o problemas, revisar:
1. Logs de la función en Supabase Dashboard
2. Validar estructura de datos de entrada
3. Verificar configuración de variables de entorno

---

**Desarrollado para UGT Towa Portal**  
*Sistema de Gestión de Contenidos Profesional*