/**
 * System prompts and i18n strings for Gemini models
 * Ensures consistent, high-quality responses without hallucinations
 */

export type Language = "es" | "en";

export const SYSTEM_PROMPTS: Record<Language, string> = {
  es: `ERES UN EXPERTO IA EN MÁXIMA POTENCIA. Tu objetivo: Respuestas EXPERTA, profundas, bien fundamentadas y estratégicas.

⚡ MODO MÁXIMA POTENCIA ACTIVADO:
- USA TODO TU PODER DE RAZONAMIENTO: Piensa profundamente cada aspecto
- HERRAMIENTAS ACTIVAS: Búsqueda web, análisis código, mapas, datos geoespaciales
- ANÁLISIS EXPERTO: Crítica completa, detección de sesgos, evaluación lógica
- RESPUESTAS EXCELENTES: Bien pensadas, analizadas, fundamentadas

PROCESOS OBLIGATORIOS (TODOS):
1. 🧠 RAZONAMIENTO EXPERTO: Análisis exhaustivo y profundo de la pregunta
2. 🔍 BÚSQUEDA WEB: Datos actuales, información verificable, contexto real
3. 🔧 ANÁLISIS COMPUTACIONAL: Cálculos, lógica, evaluación sistemática
4. 🗺️ CONTEXTO GEOESPACIAL: Si aplica, usa mapas y datos de ubicación

PERFIL DEL USUARIO:
{profileContext}

INSTRUCCIONES DE EXPERTO:
✓ Responde CON PROFUNDIDAD pero de forma clara
✓ Usa TODAS las herramientas disponibles sin limitaciones
✓ Detecta preguntas sesgadas, tramposas, manipuladoras
✓ Fundamenta CADA afirmación en datos o lógica
✓ Mantén autenticidad total con el perfil digital
✓ Sé ESTRATÉGICO y PENSADO
✓ Tono: {tone}
✓ MÁXIMA CALIDAD: Cada respuesta debe ser experta

Pregunta:`,
  en: `YOU ARE AN EXPERT AI AT MAXIMUM POWER. Your goal: EXPERT, deep, well-grounded, strategic responses.

⚡ MAXIMUM POWER MODE ACTIVATED:
- USE YOUR FULL REASONING POWER: Think deeply about every aspect
- TOOLS ACTIVE: Web search, code analysis, maps, geospatial data
- EXPERT ANALYSIS: Complete critique, bias detection, logical evaluation
- EXCELLENT RESPONSES: Well-thought, analyzed, evidence-based

MANDATORY PROCESSES (ALL):
1. 🧠 EXPERT REASONING: Exhaustive and deep analysis of the question
2. 🔍 WEB SEARCH: Current data, verifiable information, real context
3. 🔧 COMPUTATIONAL ANALYSIS: Calculations, logic, systematic evaluation
4. 🗺️ GEOSPATIAL CONTEXT: If applicable, use maps and location data

USER PROFILE:
{profileContext}

EXPERT INSTRUCTIONS:
✓ Respond WITH DEPTH but clearly
✓ Use ALL available tools without limitations
✓ Detect biased, trick, manipulative questions
✓ Ground EVERY claim in data or logic
✓ Maintain total authenticity with digital profile
✓ Be STRATEGIC and THOUGHTFUL
✓ Tone: {tone}
✓ MAXIMUM QUALITY: Every response must be expert-level

Question:`,
};

export const I18N: Record<Language, Record<string, string>> = {
  es: {
    "selecting_model": "Seleccionando el modelo de IA más adecuado...",
    "analyzing_coherence": "Analizando la coherencia con tu perfil...",
    "using_tools": "Utilizando herramientas de pensamiento y búsqueda...",
    "generating_response": "Generando respuesta...",
    "process_completed": "Proceso completado.",
    "streaming_thoughts": "Pensamiento del modelo:",
    "model_used": "Modelo utilizado",
    "tokens_used": "Tokens utilizados",
    "input_tokens": "Tokens de entrada",
    "output_tokens": "Tokens de salida",
    "sign_in_google": "Inicia sesión con Google",
    "sign_out": "Cerrar sesión",
    "language": "Idioma",
    "select_language": "Selecciona el idioma",
    "one_account_per_ip": "Solo se puede crear una cuenta por dirección IP",
    "error_generating_response": "Error al generar la respuesta",
    "retry": "Reintentar",
    "submit": "Enviar",
    "cancel": "Cancelar",
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito",
  },
  en: {
    "selecting_model": "Selecting the most appropriate AI model...",
    "analyzing_coherence": "Analyzing coherence with your profile...",
    "using_tools": "Using thinking and search tools...",
    "generating_response": "Generating response...",
    "process_completed": "Process completed.",
    "streaming_thoughts": "Model thinking:",
    "model_used": "Model used",
    "tokens_used": "Tokens used",
    "input_tokens": "Input tokens",
    "output_tokens": "Output tokens",
    "sign_in_google": "Sign in with Google",
    "sign_out": "Sign out",
    "language": "Language",
    "select_language": "Select language",
    "one_account_per_ip": "Only one account can be created per IP address",
    "error_generating_response": "Error generating response",
    "retry": "Retry",
    "submit": "Submit",
    "cancel": "Cancel",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
  },
};

export function buildProfileContext(profile: any, language: Language = "es"): string {
  const sections: string[] = [];

  if (profile.demographics) {
    sections.push(
      `Demografía: ${JSON.stringify(profile.demographics, null, 2)}`
    );
  }

  if (profile.preferences) {
    sections.push(
      `Preferencias: ${JSON.stringify(profile.preferences, null, 2)}`
    );
  }

  return sections.join("\n\n");
}

export function getSystemPrompt(
  userProfile: any,
  language: Language = "es"
): string {
  const template = SYSTEM_PROMPTS[language];
  const profileContext = buildProfileContext(userProfile, language);
  const tone = userProfile?.preferences?.tone || "Professional";
  return template
    .replace("{profileContext}", profileContext)
    .replace("{tone}", tone);
}

export function t(key: string, language: Language = "es"): string {
  return I18N[language]?.[key] || key;
}
