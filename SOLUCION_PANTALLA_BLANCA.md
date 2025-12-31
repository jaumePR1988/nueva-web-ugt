# 🚨 Solución: Pantalla en Blanco - UGT TOWA Portal

## 🎯 **PROBLEMA IDENTIFICADO**
Tu aplicación se ve en blanco porque **faltan las variables de entorno de Supabase**. La aplicación no puede cargar sin estas credenciales.

---

## ✅ **SOLUCIÓN RÁPIDA (5 minutos)**

### **Paso 1: Crear archivo .env**
```bash
# Desde la carpeta del proyecto, ejecuta:
cp .env.example .env
```

### **Paso 2: Obtener credenciales de Supabase**
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto UGT TOWA
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### **Paso 3: Completar archivo .env**
Edita el archivo `.env` que acabas de crear:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu-clave-completa...eyJ
```

### **Paso 4: Reiniciar aplicación**
```bash
npm run dev
```

---

## 🔧 **VERIFICACIÓN**

### **¿Funciona ahora?**
- ✅ **Sí:** La aplicación carga con login y funcionalidades
- ❌ **No:** Continúa leyendo...

---

## 🛠️ **SOLUCIONES ADICIONALES**

### **Opción A: Variables de entorno en hosting**
Si usas **Vercel**, **Netlify**, etc., configura las variables en el dashboard del hosting:

**Vercel:**
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `VITE_SUPABASE_URL` = tu_url_supabase
   - `VITE_SUPABASE_ANON_KEY` = tu_clave_supabase

### **Opción B: Deploy desde cero**
Si sigues teniendo problemas:
1. Borra `node_modules` y `package-lock.json`
2. Ejecuta: `npm install`
3. Configura `.env`
4. Ejecuta: `npm run build`
5. Deploya la carpeta `dist/`

---

## 📱 **TESTING LOCAL**

### **Comandos útiles:**
```bash
# Verificar instalación
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### **Verificar variables:**
```bash
# En desarrollo, las variables deben estar en:
# .env (raíz del proyecto)

# En producción, configurar en el dashboard del hosting
```

---

## 🆘 **SOPORTE TÉCNICO**

### **Error común:**
```
Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY
```

### **Solución:**
1. Verificar que el archivo `.env` existe
2. Verificar que las credenciales son correctas
3. Reiniciar el servidor de desarrollo
4. Limpiar cache: `npm run clean && npm install`

### **¿Necesitas las credenciales?**
Si no tienes acceso al proyecto Supabase:
1. Contacta al administrador de UGT TOWA
2. O crea un nuevo proyecto en Supabase
3. Ejecuta las migraciones de base de datos incluidas

---

## 📂 **ARCHIVOS IMPORTANTES**

```
ugt-towa-portal/
├── .env.example          # ← Plantilla de configuración
├── .env                  # ← TU archivo de configuración
├── supabase/
│   ├── migrations/       # ← Scripts de base de datos
│   └── functions/        # ← Edge functions
└── src/
    └── lib/
        └── supabase.ts   # ← Configuración de conexión
```

---

## 🎉 **RESULTADO ESPERADO**

Una vez configurado correctamente verás:
- ✅ Página de inicio del portal UGT TOWA
- ✅ Funcionalidad de login
- ✅ Sistema de citas
- ✅ Gestión de comunicados
- ✅ Panel de administración
- ✅ Todas las funcionalidades sindicales

---

**📞 ¿Aún tienes problemas?** Verifica la consola del navegador (F12) para ver errores específicos y contacta al soporte técnico.