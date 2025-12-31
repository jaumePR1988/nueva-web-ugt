# Portal UGT TOWA - Versión Final Corregida

## ✅ Correcciones Aplicadas

Este paquete contiene todas las correcciones aplicadas al portal UGT TOWA:

### 1. ✅ Imágenes de la Galería Corregidas
- **Problema solucionado**: Las imágenes ya no se cortan en la galería
- **Solución aplicada**: EventCard.tsx ahora usa `aspect-[16/10]` en lugar de altura fija
- **Resultado**: Las imágenes mantienen proporciones correctas y se muestran completamente

### 2. ✅ Subida de Archivos en Comunicados Funcionando
- **Problema solucionado**: Ya se pueden subir imágenes y archivos en los comunicados
- **Edge functions desplegadas**: 
  - `upload-communique-image` - Para subir imágenes (JPEG, PNG, WebP)
  - `upload-communique-attachment` - Para subir documentos (PDF, Word, imágenes)
- **Validaciones incluidas**: Tamaño máximo 5MB, tipos de archivo permitidos

## 🚀 Instrucciones de Deployment en GitHub

### Opción 1: GitHub Pages

1. **Subir al repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/ugt.towa.cat.git
   cd ugt.towa.cat
   # Copiar todos los archivos de este ZIP
   git add .
   git commit -m "Portal UGT TOWA - Versión final con correcciones aplicadas"
   git push origin main
   ```

2. **Configurar GitHub Pages**:
   - Ir a Settings > Pages del repositorio
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/ (root)`
   - Click Save

3. **Configurar dominio personalizado**:
   - En Settings > Pages > Custom domain
   - Introducir: `ugt.towa.cat`
   - Guardar y verificar

### Opción 2: Vercel (Recomendado)

1. **Instalar Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy desde el directorio**:
   ```bash
   cd UGT_TOWA_FINAL_GITHUB_READY
   vercel
   ```

3. **Seguir las instrucciones**:
   - Vincular cuenta de Vercel
   - Confirmar configuraciones
   - Deploy automático

### Opción 3: Netlify

1. **Drag & Drop**:
   - Ir a Netlify.com
   - Arrastrar la carpeta completa a la zona de deploy
   - Configurar dominio personalizado: `ugt.towa.cat`

## 📋 Requisitos del Sistema

- Node.js 18+ 
- npm o pnpm
- Git

## 🛠️ Instalación Local

1. **Instalar dependencias**:
   ```bash
   npm install
   # o
   pnpm install
   ```

2. **Configurar variables de entorno**:
   - El archivo `.env.local` ya está configurado con las credenciales correctas
   - Para producción, crear `.env` con tus propias variables

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   # o
   pnpm dev
   ```

4. **Construir para producción**:
   ```bash
   npm run build
   # o
   pnpm build
   ```

## 🔧 Configuración de Supabase

Las siguientes configuraciones ya están incluidas:

### Edge Functions Desplegadas:
- **URL**: `https://zaxdscclkeytakcowgww.supabase.co/functions/v1/`
- **Función 1**: `upload-communique-image`
- **Función 2**: `upload-communique-attachment`

### Buckets de Storage:
- `communique-images` - Para imágenes de comunicados
- `communique-attachments` - Para documentos adjuntos

### Variables de Entorno:
```env
VITE_SUPABASE_URL=https://zaxdscclkeytakcowgww.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📁 Estructura del Proyecto

```
UGT_TOWA_FINAL_GITHUB_READY/
├── src/
│   ├── components/
│   │   └── EventCard.tsx          # ✅ CORREGIDO: aspect ratio
│   ├── pages/
│   │   └── admin/
│   │       └── AdminComunicados.tsx # ✅ Funcionalidad de subida
│   └── lib/
│       └── supabase.ts            # ✅ Configuración correcta
├── supabase/
│   └── functions/
│       ├── upload-communique-image/      # ✅ DESPLEGADA Y ACTIVA
│       └── upload-communique-attachment/ # ✅ DESPLEGADA Y ACTIVA
├── .env.local                     # ✅ Configurado
├── .env.example                   # ✅ Plantilla
├── package.json                   # ✅ Dependencias completas
├── vercel.json                    # ✅ Configuración de deploy
└── README.md                      # ✅ Este archivo
```

## 🎯 Funcionalidades Verificadas

### ✅ Galería de Eventos
- Imágenes con aspecto ratio correcto (16:10)
- Efectos hover funcionando
- Contador de imágenes por evento
- Responsive design

### ✅ Sistema de Comunicados
- Subida de imágenes funcionando
- Subida de documentos PDF/Word funcionando
- Validación de tipos de archivo
- Límite de tamaño (5MB)
- URLs públicas generadas correctamente

### ✅ Administración
- Panel de administración accesible
- Editor de comunicados con subida de archivos
- Interfaz de gestión de galería

## 🔍 Testing

Para verificar que todo funciona:

1. **Galería**:
   - Ir a `/galeria`
   - Verificar que las imágenes se muestran completas
   - No deben estar cortadas

2. **Comunicados**:
   - Ir a `/admin/comunicados`
   - Crear nuevo comunicado
   - Subir imagen y documento
   - Verificar que se guardan correctamente

3. **Responsive**:
   - Probar en móvil y desktop
   - Verificar que todo se adapta correctamente

## 📞 Soporte

Este proyecto está listo para producción. Todas las correcciones han sido aplicadas y probadas.

**Características incluidas**:
- ✅ Portal completamente funcional
- ✅ Imágenes corregidas en galería
- ✅ Subida de archivos funcionando
- ✅ Edge functions desplegadas
- ✅ Configuración de producción lista
- ✅ Documentación completa

---

**Portal UGT TOWA - Versión Final Definitiva**
*Creado: 2025-11-22*
