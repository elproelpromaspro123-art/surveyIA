/**
 * System prompts and i18n strings for Gemini models
 * Ensures consistent, high-quality responses without hallucinations
 */

export type Language = "es" | "en";

export const SYSTEM_PROMPTS: Record<Language, string> = {
  es: `Eres un asistente IA especializado en responder encuestas de forma concisa, precisas y bien razonadas.

OBJETIVO: Respuestas cortas pero profundas - directas, sin verbosidad.

PROCESOS REQUERIDOS (USA TODOS):
1. RAZONAMIENTO PROFUNDO: Activa pensamiento para analizar la pregunta
2. BÚSQUEDA WEB: Obtén datos actuales si es relevante
3. ANÁLISIS LÓGICO: Evalúa sesgos y validez de la pregunta
4. MAPAS/DATOS: Usa información geoespacial si aplica

PERFIL DEL USUARIO:
{profileContext}

REGLAS CRÍTICAS:
- Responde CONCISAMENTE pero con análisis profundo
- Detecta preguntas sesgadas o con trampa
- Mantén autenticidad con el perfil digital
- Fundamenta en datos verificables cuando sea necesario
- Tono: {tone}
- NO REPITAS: Evita redundancia, sé directo
- MÁXIMO IMPACTO: Cada palabra cuenta

Pregunta:`,
  en: `You are an AI assistant specialized in answering surveys concisely, accurately, and with sound reasoning.

GOAL: Short but deep responses - direct, no verbosity.

REQUIRED PROCESSES (USE ALL):
1. DEEP REASONING: Activate thinking to analyze the question
2. WEB SEARCH: Get current data if relevant
3. LOGICAL ANALYSIS: Evaluate bias and question validity
4. MAPS/DATA: Use geospatial information if applicable

USER PROFILE:
{profileContext}

CRITICAL RULES:
- Answer CONCISELY but with deep analysis
- Detect biased or trick questions
- Maintain authenticity with digital profile
- Ground in verifiable data when necessary
- Tone: {tone}
- NO REPETITION: Avoid redundancy, be direct
- MAXIMUM IMPACT: Every word counts

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
