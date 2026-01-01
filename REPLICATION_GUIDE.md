# Guía de Replicación: Nueva Web UGT

Esta guía detalla el proceso para replicar este portal para una nueva sede o empresa de UGT de manera eficiente.

## Estrategia 1: Una Sede = Un Proyecto (Aislamiento Total)
Esta es la opción si quieres que cada sede tenga su propia base de datos y Storage totalmente independientes.

### Pasos:
1. **Supabase**:
   - Crea un nuevo proyecto en Supabase.
   - Copia el esquema de la base de datos (puedes usar el botón "SQL Editor" y pegar el contenido de los scripts de migración).
   - Configura el **Auth** (Emails, Redirect URLs).
   - Crea los buckets de **Storage** (ej: `event_images`, `documents`).
2. **GitHub**:
   - Crea un nuevo repositorio basado en `nueva-web-ugt`.
   - Configura las variables de entorno (`.env`) con las nuevas URLs y claves de Supabase.
   - Configura los **Secrets** de GitHub para el Keep-Alive.
3. **Personalización**:
   - Cambia el archivo `src/config/branding.config.ts` (ver abajo) con el logo y colores de la nueva sede.

## Estrategia 2: Multi-Sede (Uso Compartido)
Esta es la opción más escalable y la que recomiendo si vas a gestionar 10+ sedes.

### Pasos:
1. **Base de Datos**:
   - Añadimos la columna `empresa_id` a las tablas principales.
2. **Filtro Automático**:
   - El código detecta el subdominio o una variable y filtra automáticamente todas las consultas.
3. **Ventajas**:
   - No necesitas crear nuevos proyectos de Supabase.
   - Solo un despliegue de código.
   - Evitas problemas de inactividad (siempre habrá alguien usando alguna sede).

## Herramientas de Personalización (Replicabilidad)

Para que el portal sea replicable en cuestión de minutos, he centralizado los puntos clave:

### 1. Identidad Visual (`src/config/branding.config.ts`)
Modifica este archivo para cambiar:
- **Nombre de la empresa** y siglas.
- **Logo** (debe estar en la carpeta `public`).
- **Colores corporativos** (Primario, Secundario, Acentos).
- **Tipografía** y diseño de botones (bordes redondeados, etc.).

### 2. Automatización de Citas
Ya no necesitas crear cada hueco manualmente en Supabase:
- El sistema genera automáticamente slots de **08:00 a 16:30** cada hora.
- Solo debes configurar los **Delegados** en la tabla de perfiles (marcandolos como `is_admin`) para que puedan gestionar sus bloqueos.
- La tabla `appointment_slots` ahora solo se usa para **bloqueos excepcionales** (vacaciones, reuniones externas).

### 3. Requisitos de Infraestructura (NUEVO)
Para una réplica funcional al 100%, asegúrate de:
- **VAPID Keys**: Generar un par de claves para las notificaciones Push y poner la pública en el `.env`.
- **Edge Functions**: Desplegar las funciones de la carpeta `supabase/functions`.
- **Secrets**: Configurar `RESEND_API_KEY` (si se usa para emails) y `VAPID_PRIVATE_KEY` en los secretos de Supabase (`supabase secrets set`).

---
*Esta guía se actualiza a medida que añadimos nuevas funcionalidades modulares.*
