# Guía Rápida de Configuración en Render

## El Error que Estás Viendo
```
getaddrinfo ENOTFOUND host
```

Este error significa que **falta configurar la base de datos en Render**. No tiene nada que ver con Google OAuth.

---

## Solución Rápida (5 pasos)

### 1️⃣ Crea la Base de Datos
- Ve a https://render.com/dashboard
- Click en "+ New" → "PostgreSQL"
- Nombre: `surveyia-db`
- Region: **Elige la misma que usarás para el Web Service**
- Click "Create Database"
- **Espera 2-3 minutos a que esté lista**

### 2️⃣ Crea el Web Service
- Click en "+ New" → "Web Service"
- Conecta tu repositorio GitHub: `elproelpromaspro123-art/surveyIA`
- Nombre: `surveyia`
- Environment: Node
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Region: **MISMO que la base de datos**
- Plan: Free
- NO hagas deploy aún ⏸️

### 3️⃣ Vincula la Base de Datos
En tu Web Service recién creado:
1. Ve a la pestaña "Environment"
2. Click en "+ Add Environment Variable"
3. En el dropdown que aparece, selecciona tu PostgreSQL (`surveyia-db`)
4. Render llenará automáticamente `DATABASE_URL`

### 4️⃣ Agrega API Keys
En la sección "Environment", agrega:

```
GEMINI_API_KEY = [TU_KEY]
```

Para obtenerlo:
1. Ve a https://aistudio.google.com/app/apikey
2. Si no tienes, click en "Create API Key"
3. Copia el valor
4. Pégalo en Render (sin las comillas)

**Opcional** (si quieres Google OAuth):
```
GOOGLE_CLIENT_ID = [TU_CLIENT_ID]
GOOGLE_CLIENT_SECRET = [TU_CLIENT_SECRET]
```

### 5️⃣ Deploy
1. Click en "Deploy"
2. Espera 5-10 minutos
3. Cuando veas "Your service is live 🎉", ¡está listo!

---

## Cómo Saber que Funciona

1. Visita la URL de tu servicio (ej: https://surveyia.onrender.com)
2. Intenta **registrarte con email y contraseña**
3. Si puedes crear una cuenta, ¡funciona!

---

## Si Sigue Fallando

### Opción A: Revisar Logs
1. En tu Web Service en Render
2. Ve a "Logs"
3. Busca mensajes que digan:
   - ✅ "Database connection successful" = BD está OK
   - ❌ "DATABASE_URL environment variable is not set" = Falta configurar

### Opción B: Reiniciar
1. Ve a tu Web Service
2. Click en el botón "..." (arriba derecha)
3. Select "Restart"
4. Espera a que reinicie

---

## Preguntas Comunes

**P: ¿Por qué dice "getaddrinfo ENOTFOUND host"?**
R: Porque el `DATABASE_URL` no está configurado. Render intenta conectar a un servidor llamado "host" que no existe.

**P: ¿Cuánto tiempo toma?**
R: La BD toma 2-3 minutos. El Web Service toma 5-10 minutos en la primera ejecución.

**P: ¿Puedo usar email/contraseña sin Google OAuth?**
R: Sí. Google OAuth es opcional. Los usuarios pueden registrarse con email y contraseña.

**P: ¿Qué es GEMINI_API_KEY?**
R: Es la API Key para usar los modelos de IA (Google Gemini). Es gratis con límites.

---

## Resumen Visualmente

```
┌─────────────────────────────────────────────────────┐
│ 1. Crea DB PostgreSQL (2-3 min)                     │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│ 2. Crea Web Service conectado a GitHub              │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│ 3. Vincula DB a Web Service (DATABASE_URL)          │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│ 4. Agrega GEMINI_API_KEY (y opcionales)             │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│ 5. Deploy (5-10 min) → ¡LISTO!                      │
└─────────────────────────────────────────────────────┘
```

---

## Contacto

Si algo no funciona:
1. Revisa los Logs en Render
2. Verifica que DATABASE_URL esté configurado
3. Asegúrate de que la DB está en la misma región
4. Intenta reiniciar el servicio
