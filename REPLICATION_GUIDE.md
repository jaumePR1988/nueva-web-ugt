# 📋 Guía Maestra de Replicación: Portal UGT

Esta guía es el "manual de vuelo" para clonar este ecosistema en una nueva sede o empresa de UGT. Está diseñada para minimizar la fricción técnica y asegurar que todas las funcionalidades (Push, IA, Citas) operen desde el primer día.

---

## 🏗️ Requisitos de Infraestructura

1.  **GitHub**: Repositorio para el código (Vite + React + TS).
2.  **Vercel**: Hosting recomendado para el frontend (conecta directamente con GitHub).
3.  **Supabase**: Backend-as-a-Service (Base de datos, Auth, Storage y Edge Functions).
4.  **Resend**: (Opcional) Para envío de emails transaccionales.

---

## 🔧 Configuración Paso a Paso

### 1. Preparación del Código
1.  **Clonar**: `git clone https://github.com/jaumePR1988/nueva-web-ugt.git`
2.  **Instalar**: `npm install`
3.  **Configurar Branding**: Edita `src/config/branding.config.ts`.
    -   Cambia `companyName`, `siglas`, y los colores hexadecimales.
    -   Sustituye el logo en `public/ugt-towa-logo.png` (mantén el nombre o actualiza la ruta).

### 2. Configuración de Supabase (El Corazón)

#### A. Base de Datos (SQL)
-   Ejecuta el esquema completo en el **SQL Editor**. 
-   > [!TIP]
    > Si quieres una réplica exacta, exporta el esquema actual desde el panel de Supabase o solicita el archivo `schema.sql`.

#### B. Autenticación
-   Activa **Email Auth**. Desactiva "Confirm Email" si quieres un registro instantáneo para pruebas.
-   Configura **Google Auth** (opcional pero recomendado) en `Authentication > Providers`.
-   **Site URL**: Pon la URL de Vercel (ej: `https://tu-sede.vercel.app`).
-   **Redirect URLs**: Añade `https://tu-sede.vercel.app/**`.

#### C. Storage (Buckets)
Crea estos buckets con **acceso público**:
-   `event_images`: Fotos del carrusel y noticias.
-   `documents`: PDFs, actas y boletines.
-   `delegate_photos`: Fotos de los delegados.
-   `notification_logos`: Miniaturas para los avisos push.
-   `newsletter_images`: Imágenes para el gestor de boletines.

#### D. Edge Functions (Lógica de Servidor)
Desde tu terminal con el Supabase CLI instalado:
1.  Login: `supabase login`
2.  Link: `supabase link --project-ref tu-id-de-proyecto`
3.  Deploy: `supabase functions deploy` (esto subirá todas las carpetas en `supabase/functions`).

#### E. Secrets (Variables Seguras)
Debes configurar estos secretos en Supabase para que las funciones operen:
```bash
# Notificaciones Push (VAPID)
supabase secrets set VAPID_PUBLIC_KEY=tu_clave_publica
supabase secrets set VAPID_PRIVATE_KEY=tu_clave_privada
supabase secrets set VAPID_SUBJECT=mailto:tu@email.com

# Email (Si usas Resend)
supabase secrets set RESEND_API_KEY=re_123456789
```

---

## 📲 Notificaciones PWA y Push

Para que las notificaciones funcionen en el navegador/móvil:
1.  Genera claves VAPID: `npx web-push generate-vapid-keys`.
2.  Pon la **Clave Pública** en el `.env` del frontend (`VITE_VAPID_PUBLIC_KEY`).
3.  Pon la **Clave Pública Y Privada** en los Secrets de Supabase (paso anterior).
4.  Asegúrate de que `public/sw-notifications.js` esté presente (es el encargado de mostrar los avisos en segundo plano).

---

## 🚀 Checklist de Lanzamiento (Zero Bugs)

- [ ] **Primer Admin**: Regístrate en la web y luego, en la tabla `profiles` de Supabase, cambia manualmente tu `role` a `'admin'`.
- [ ] **Permisos de Storage**: Verifica que los buckets son públicos o que las políticas RLS permiten lectura (`SELECT`) a todos.
- [ ] **Variables Vercel**: No olvides copiar todas las variables del `.env` a la configuración de Vercel.
- [ ] **Cron Jobs**: Si quieres que el resumen de boletines sea automático, configura un HTTP Trigger (ej: GitHub Actions o Supabase Cron) que llame a la función `process-notification-queue`.

---

## 📈 Oportunidades de Mejora Continua

Si ya tienes lo básico funcionando, aquí hay ideas para subir de nivel:
1.  **Historial de Avisos**: Crear una página donde el usuario vea todos los avisos recibidos (no solo el push momentáneo).
2.  **Roles Intermedios**: Añadir un rol `editor` para delegados que solo suban contenido pero no gestionen usuarios.
3.  **Analíticas Integradas**: Conectar con Google Analytics o un dashboard de Supabase para ver qué secciones se visitan más.
4.  **IA en Documentos**: Implementar búsqueda semántica en los PDFs usando embeddings (Supabase Vector).
5.  **Offline Pro**: Cachear más secciones en el Service Worker para que el portal sea ultra-rápido incluso sin internet.

---
*Mantenido por el equipo de desarrollo de UGT.*
