# Optimización de Almacenamiento - Database 1GB

## Problemas Actuales
1. Se almacenan **todas las respuestas de encuestas** sin límite
2. Las respuestas pueden ser muy largas (cientos de KB)
3. Sin política de retención de datos

## Soluciones (en orden de prioridad)

### 1️⃣ NO ALMACENAR RESPUESTAS COMPLETAS (RECOMENDADO)
El mejor enfoque es **no guardar** las respuestas de encuestas en la BD.

**Cambio:**
```typescript
// ANTES: Guardar respuesta completa
await storage.createSurveyResponse({
  userId,
  question,
  answer: text,  // ❌ Esto consume muchísimo espacio
  modelUsed: model,
  status: "completed",
});

// DESPUÉS: Solo guardar metadata
await storage.createSurveyResponse({
  userId,
  question,  // Solo la pregunta
  answer: "[Response stored in client only]",  // Placeholder
  modelUsed: model,
  status: "completed",
});
```

**Beneficio:** Reduce uso de DB en 90%+

---

### 2️⃣ POLÍTICA DE RETENCIÓN (cleanup automático)
Eliminar respuestas después de X días.

```sql
-- Eliminar respuestas más viejas que 30 días
DELETE FROM survey_responses 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Ejecutar automáticamente cada día
-- (Implementar como cron job en Render)
```

---

### 3️⃣ COMPRIMIR DATOS LARGOS
Para preguntas/respuestas grandes, usar compresión.

```typescript
import { gzipSync, gunzipSync } from 'zlib';

// Al guardar
const compressed = gzipSync(text).toString('base64');
await storage.createSurveyResponse({
  answer: compressed,
  // ...
});

// Al leer
const decompressed = gunzipSync(Buffer.from(answer, 'base64')).toString();
```

**Beneficio:** Reduce tamaño 60-80%

---

### 4️⃣ LIMITAR NÚMERO DE RESPUESTAS POR USUARIO
Guardar solo las últimas N respuestas.

```typescript
// Guardar solo las últimas 100 respuestas por usuario
const userResponses = await storage.getUserSurveyResponses(userId);
if (userResponses.length >= 100) {
  // Eliminar la más antigua
  await db.delete(surveyResponses)
    .where(eq(surveyResponses.userId, userId))
    .orderBy(surveyResponses.createdAt)
    .limit(1);
}
```

---

## Plan Recomendado

### Implementación Inmediata (Opción Simple)
1. **NO almacenar respuestas completas** (Solo pregunta + modelo usado)
2. El frontend almacena localmente en `localStorage`
3. Reduce DB a menos de 100MB para muchos usuarios

### Implementación Avanzada (Opción Completa)
1. Almacenar solo preguntas (sin respuestas)
2. Agregar cron job para limpiar datos antiguos
3. Comprimir datos si necesitas mantenerlos

---

## Implementación Rápida (5 minutos)

### Modificar schema para respuestas pequeñas
Cambiar en `shared/schema.ts`:

```typescript
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),  // Nullable - opcional guardar
  modelUsed: text("model_used").notNull(),
  status: text("status").notNull(),
  answerLength: integer("answer_length"),  // Solo track tamaño
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Modificar ruta para NO guardar respuesta
En `server/routes.ts`, línea 340-346:

```typescript
// ANTES
await storage.createSurveyResponse({
  userId: Number(userId),
  question,
  answer: text,  // ❌ ELIMINAR
  modelUsed: model,
  status: "completed",
});

// DESPUÉS
await storage.createSurveyResponse({
  userId: Number(userId),
  question,
  answer: null,  // No guardar la respuesta
  modelUsed: model,
  status: "completed",
});
```

---

## Estimado de Almacenamiento

| Estrategia | Uso por Respuesta | 1000 Usuarios | 10,000 Respuestas |
|-----------|------------------|---------------|------------------|
| Actual (sin optimización) | 1-5 KB | 50-250 MB | 10-50 MB |
| Solo pregunta + modelo | 100 bytes | 1 MB | 1 MB |
| Con compresión | 200 bytes | 2 MB | 2 MB |
| Con retention (30 días) | Variable | Baja | Baja |

---

## Monitoreo

### Ver tamaño actual de la BD
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

Ejecutar en la consola de Render → SQL Editor

---

## Recomendación Final

✅ **IMPLEMENTA AHORA:**
1. NO almacenar respuestas completas
2. Frontend guarda en localStorage
3. Reduce DB a ~1-2 MB por 1000 usuarios

✅ **IMPLEMENTA DESPUÉS:**
1. Cron job para limpiar datos viejos
2. Compresión si necesitas histórico
3. Archiving a otro storage (S3, etc.)

---

## Archivos a Modificar

1. `shared/schema.ts` - Opcional: agregar campo para tracking
2. `server/routes.ts` - Línea 340-346: NO guardar answer completo
3. `server/storage.ts` - Opcional: agregar método de cleanup

Quieres que lo implemente?
