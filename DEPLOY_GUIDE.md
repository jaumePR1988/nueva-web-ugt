# Guía de Despliegue - UGT Towa Portal

## 📋 Requisitos Previos

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- Cuenta en Vercel (opcional)
- Cuenta en Supabase configurada

## 🚀 Instalación Rápida

### 1. Clonar/Instalar Dependencias
```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev
```

### 2. Configuración de Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Opcional: Para producción en Vercel
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 3. Despliegue en Vercel

#### Opción A: Despliegue Automático
1. Conecta tu repositorio GitHub a Vercel
2. Vercel detectará automáticamente la configuración
3. Configura las variables de entorno en el dashboard de Vercel

#### Opción B: Despliegue Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar
vercel --prod
```

### 4. Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta las migraciones en `supabase/migrations/`
3. Despliega las Edge Functions en `supabase/functions/`
4. Configura las políticas RLS necesarias

## 📁 Estructura del Proyecto

```
ugt-towa-portal/
├── src/                 # Código fuente React
├── supabase/           # Backend (migraciones + Edge Functions)
├── public/             # Archivos estáticos
├── package.json        # Dependencias y scripts
└── README.md           # Documentación
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev

# Build de producción
pnpm build

# Preview del build
pnpm preview

# Linting
pnpm lint

# Limpiar dependencias
pnpm clean
```

## ⚠️ Notas Importantes

- **NO incluir `node_modules` en el repositorio**
- **NO incluir `pnpm-lock.yaml` en versiones específicas**
- **NO incluir `dist/` (se genera automáticamente)**
- Configurar variables de entorno en la plataforma de deploy

## 🐛 Solución de Problemas

### Error: "Cannot resolve /assets/index-xxx.js"
- Solución: Ejecutar `pnpm build` antes del deploy
- Verificar que el build se complete correctamente

### Error: "Module not found"
- Solución: Verificar que todas las dependencias estén instaladas
- Ejecutar `pnpm install`

### Error de variables de entorno
- Verificar que `.env.local` esté configurado
- Verificar variables en la plataforma de deploy

## 📞 Soporte

Para problemas técnicos, revisar:
1. Logs de la consola del navegador
2. Logs de la plataforma de deploy
3. Estado del proyecto en Supabase
