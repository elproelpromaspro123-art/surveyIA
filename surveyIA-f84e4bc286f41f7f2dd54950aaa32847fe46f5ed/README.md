# SurveyIA - Encuestas Inteligentes con Gemini AI

Plataforma moderna de encuestas que utiliza los modelos Gemini más avanzados para generar respuestas coherentes y contextualizadas basadas en el perfil del usuario.

## Características Principales

### 🤖 Modelos IA Avanzados (Tier FREE)
- **Gemini 3 Flash Preview** - Modelo más nuevo (Diciembre 2025)
- **Gemini 2.5 Flash** - Mejor relación precio-rendimiento
- **Gemini 2.5 Pro** - Razonamiento avanzado con "thinking"
- **Fallback automático** - Si un modelo falla, usa el siguiente

### 🧠 Capacidades Incluidas
- **Thinking Mode** - Ver el proceso de razonamiento del modelo
- **Streaming** - Respuestas en tiempo real
- **Multimodal** - Soporte para imágenes
- **Context-Aware** - Utiliza el perfil del usuario para coherencia
- **Anti-Alucinaciones** - Prompts diseñados para evitar falsedades

### 🔐 Autenticación Segura
- **Google OAuth** - Inicia sesión con tu cuenta Google
- **1 Cuenta por IP** - Previene multicuentas
- **Sin verificación de email** - Acceso inmediato

### 🌐 Internacionalización
- **Español (es)** - Por defecto
- **English (en)** - Completamente traducido
- **Cambio dinámico** - Cambia idioma en cualquier momento

### 📊 Herramientas Disponibles (FREE)
- Google Search (500 requests/día)
- Code Execution
- URL Context
- File Search
- Function Calling

## Stack Tecnológico

### Backend
- **Express.js** - Framework web
- **Node.js** - Runtime
- **PostgreSQL** - Base de datos
- **Drizzle ORM** - Type-safe database queries
- **Gemini API** - IA

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes accesibles
- **TanStack Query** - State management
- **Wouter** - Routing

### Deployment
- **Render** - Hosting
- **GitHub** - Version control

## Quick Start

### 1. Requisitos
- Node.js 18+
- PostgreSQL
- Gemini API Key (gratis)
- Google OAuth credentials (opcional)

### 2. Instalación

```bash
# Clonar repositorio
git clone https://github.com/yourusername/surveyIA.git
cd surveyIA

# Instalar dependencias
npm install

# Obtener Gemini API Key
# Visita: https://aistudio.google.com/apikey
```

### 3. Configuración

```bash
# Crear archivo .env
cp .env.example .env

# Añadir tu API Key
GEMINI_API_KEY=your_key_here
DATABASE_URL=postgresql://...
```

### 4. Base de datos

```bash
# Ejecutar migrations
npm run db:push
```

### 5. Desarrollo

```bash
# Inicia servidor en http://localhost:5000
npm run dev
```

## API Reference

### Authentication
```
POST /api/auth/google
POST /api/auth/logout
GET /api/auth/session
```

### Users
```
POST /api/users              # Create account
GET /api/users/:id          # Get profile
PATCH /api/users/:id        # Update profile
```

### Survey
```
POST /api/survey/generate   # Generate AI response
GET /api/survey/models      # List available models
```

## Rate Limits (FREE Tier)

| Modelo | Límite |
|--------|---------|
| Gemini 3 Flash | 15 req/min |
| Gemini 2.5 Flash | 15 req/min |
| Gemini 2.5 Pro | 10 req/min |
| Google Search | 500 req/día |
| Cuentas por IP | 1 |

## Modelos Disponibles

### Gemini 3 Flash Preview ⭐ (Recomendado)
- Última versión (Diciembre 2025)
- Más rápido y eficiente
- Mejor para respuestas rápidas
- 1M tokens contexto

### Gemini 2.5 Flash
- Estable y probado
- Mejor precio-rendimiento
- Multimodal completo
- 1M tokens contexto

### Gemini 2.5 Pro
- Razonamiento avanzado
- "Thinking" habilitado
- Mejor para tareas complejas
- Más lento pero más preciso

## Ejemplo de Uso

```typescript
// Frontend
import { useAuth } from "@/hooks/useAuth";
import { useSurvey } from "@/hooks/useSurvey";

function MyComponent() {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const { generateResponse, isGenerating } = useSurvey();

  const handleQuestion = async () => {
    const result = await generateResponse(
      "¿Cuál es tu ocupación?",
      true // incluir thinking
    );
    
    console.log(result.answer);
    console.log(result.modelUsed);
    console.log(result.thinking);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <button onClick={() => loginWithGoogle(token)}>
          Sign in with Google
        </button>
      ) : (
        <button onClick={handleQuestion} disabled={isGenerating}>
          Ask AI
        </button>
      )}
    </div>
  );
}
```

## Deployment en Render

### ⚠️ IMPORTANTE: Pasos en Orden
1. Crea la base de datos PRIMERO
2. Luego crea el Web Service
3. Render vinculará automáticamente el DATABASE_URL

### Paso 1: Crear Base de Datos PostgreSQL
1. Ve a https://render.com/dashboard
2. Click en "+ New" → "PostgreSQL"
3. Nombre: `surveyia-db` (o similar)
4. Region: Mismo que tu Web Service
5. Click "Create Database"
6. Espera 2-3 minutos para que esté lista

### Paso 2: Crear Web Service
1. Click en "+ New" → "Web Service"
2. Conecta tu repositorio GitHub
3. Nombre: `surveyia` (o similar)
4. Environment: `Node`
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
7. Region: Mismo que la BD
8. Plan: Free (o superior)

### Paso 3: Vincular Base de Datos
1. En tu Web Service, ve a "Environment"
2. Click en "Add Environment Variable"
3. Name: `DATABASE_URL`
4. Selecciona tu PostgreSQL del dropdown
5. Render llenará automáticamente el valor

### Paso 4: Agregar Variables de Entorno
En la sección "Environment" de tu Web Service:

**Obligatorias:**
- `GEMINI_API_KEY` - Obtén en https://aistudio.google.com/app/apikey

**Opcionales:**
- `GOOGLE_CLIENT_ID` - Para autenticación con Google
- `GOOGLE_CLIENT_SECRET` - Para autenticación con Google

### Paso 5: Deploy
1. Click en "Deploy"
2. Espera a que finalice (5-10 minutos)
3. La URL estará en https://surveyia.onrender.com (o similar)

### ✅ Verificar que Funciona
1. Visita tu URL en el navegador
2. Intenta registrarte con email/contraseña
3. Si funciona, ¡está listo!

## Características de Seguridad

### Validación
- Zod schemas para validación de input
- Type-safe queries
- SQL injection prevention

### Rate Limiting
- Por IP
- Por usuario
- Respeta límites de Gemini

### Privacy
- Sin almacenamiento de conversaciones sensibles
- Data retention policy
- GDPR compatible

## Componentes UI

### GoogleAuthButton
```tsx
<GoogleAuthButton onSuccess={handleSuccess} />
```

### LanguageSwitcher
```tsx
<LanguageSwitcher className="ml-auto" />
```

### ModelInfo
```tsx
<ModelInfo 
  modelUsed="gemini-3-flash-preview"
  thinking={thinkingText}
  usageStats={{ inputTokens: 100, outputTokens: 200 }}
  language="es"
/>
```

### GenerationProgress
```tsx
<GenerationProgress
  logs={["Paso 1...", "Paso 2..."]}
  isLoading={true}
  language="es"
/>
```

## Variables de Entorno

### Servidor
```env
GEMINI_API_KEY=          # Gemini API (obligatorio)
DATABASE_URL=            # PostgreSQL (obligatorio)
NODE_ENV=development     # development/production
PORT=5000                # Puerto del servidor
```

### Cliente (.env.local)
```env
VITE_GOOGLE_CLIENT_ID=   # Google OAuth (opcional)
VITE_API_URL=http://...  # URL del API
```

## Troubleshooting

### "GEMINI_API_KEY not set"
```bash
# Verificar que .env existe y tiene el valor
cat .env | grep GEMINI_API_KEY
```

### "Rate limit exceeded"
```bash
# Esperar o usar modelo diferente
# Ver límites en: https://aistudio.google.com/usage
```

### Database connection error
```bash
# Verificar DATABASE_URL
npm run db:push
```

## Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing`)
3. Commit cambios (`git commit -m 'Add amazing'`)
4. Push a la rama (`git push origin feature/amazing`)
5. Abre un Pull Request

## License

MIT - Ver LICENSE file

## Soporte

- 📧 Email: support@surveyia.com
- 💬 Discord: [Discord Server]
- 🐛 Issues: GitHub Issues
- 📖 Docs: https://surveyia.docs

## Roadmap

- [ ] Soporte para más idiomas
- [ ] Analytics avanzados
- [ ] Export a PDF/Excel
- [ ] Collaborative surveys
- [ ] API webhooks
- [ ] Custom branding
- [ ] SSO empresarial

---

**Hecho con ❤️ usando Gemini API**

Última actualización: Diciembre 19, 2025
