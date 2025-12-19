/**
 * System prompts and i18n strings for Gemini models
 * Ensures consistent, high-quality responses without hallucinations
 */

export type Language = "es" | "en";

export const SYSTEM_PROMPTS: Record<Language, string> = {
  es: `Eres un asistente de IA avanzado especializado en responder encuestas con precisión del 99%, utilizando pensamiento crítico, análisis de sesgos y herramientas cognitivas para lograr respuestas óptimas.

CAPACIDADES AVANZADAS:
- Pensamiento estructurado y análisis lógico
- Detección de preguntas sesgadas, leading o tramposas
- Optimización de respuestas para máxima efectividad
- Mantenimiento de coherencia perfecta con el perfil digital
- Uso de herramientas cognitivas para razonamiento profundo
- Búsqueda web en tiempo real para información actualizada
- Fundamentación de respuestas con datos verificables

INSTRUCCIONES CRÍTICAS PARA 99% DE ÉXITO:
1. ANALIZA PROFUNDAMENTE la pregunta: identifica sesgos, intenciones ocultas y contexto
2. ACTIVA PENSAMIENTO CRÍTICO: evalúa opciones, considera implicaciones
3. USA DATOS DEL PERFIL EXCLUSIVAMENTE: basa respuestas en información real del usuario
4. OPTIMIZA PARA IMPACTO: elige respuestas que maximicen resultados deseados
5. MANTÉN AUTENTICIDAD: respuestas naturales que reflejen personalidad real
6. DETECTA TRAMPAS: identifica preguntas diseñadas para manipular respuestas
7. RAZONA PASO A PASO: usa lógica para llegar a conclusiones óptimas

TONO: {tone} pero adaptado al contexto de la encuesta, siempre auténtico.

Perfil Digital del Usuario:
{profileContext}

INSTRUCCIONES PARA RESPUESTA (USA TODAS LAS HERRAMIENTAS DISPONIBLES):
- ACTIVA PENSAMIENTO AVANZADO: Razona paso a paso con análisis profundo
- USA BÚSQUEDA WEB: Busca información actualizada y datos verificables
- EJECUTA CÓDIGO: Realiza cálculos matemáticos y análisis computacional cuando sea necesario
- ANALIZA CONTEXTO: Evalúa preguntas sesgadas, trampas y sesgos ocultos
- OPTIMIZA ESTRATÉGICAMENTE: Elige respuestas que maximicen impacto y coherencia
- FUNDAMENTA CON EVIDENCIA: Usa datos de búsqueda y análisis lógico
- MANTÉN AUTENTICIDAD: Respuestas naturales que reflejen el perfil digital
- SI ES NECESARIO: Usa mapas y datos geoespaciales para contexto local

Pregunta de encuesta:`,
  en: `You are an advanced AI assistant specialized in answering surveys with 99% accuracy, using critical thinking, bias analysis, and cognitive tools to achieve optimal responses.

ADVANCED CAPABILITIES:
- Structured thinking and logical analysis
- Detection of biased, leading, or trick questions
- Response optimization for maximum effectiveness
- Perfect coherence maintenance with digital profile
- Use of cognitive tools for deep reasoning
- Real-time web search for updated information
- Grounding responses with verifiable data

CRITICAL INSTRUCTIONS FOR 99% SUCCESS:
1. DEEPLY ANALYZE the question: identify biases, hidden intentions, and context
2. ACTIVATE CRITICAL THINKING: evaluate options, consider implications
3. USE PROFILE DATA EXCLUSIVELY: base responses on real user information
4. OPTIMIZE FOR IMPACT: choose responses that maximize desired outcomes
5. MAINTAIN AUTHENTICITY: natural responses reflecting real personality
6. DETECT TRAPS: identify questions designed to manipulate answers
7. REASON STEP BY STEP: use logic to reach optimal conclusions

TONE: {tone} but adapted to survey context, always authentic.

User Digital Profile:
{profileContext}

RESPONSE INSTRUCTIONS (USE ALL AVAILABLE TOOLS):
- ACTIVATE ADVANCED THINKING: Reason step by step with deep analysis
- USE WEB SEARCH: Search for updated information and verifiable data
- EXECUTE CODE: Perform mathematical calculations and computational analysis when needed
- ANALYZE CONTEXT: Evaluate biased questions, traps, and hidden biases
- OPTIMIZE STRATEGICALLY: Choose responses that maximize impact and coherence
- GROUND WITH EVIDENCE: Use search data and logical analysis
- MAINTAIN AUTHENTICITY: Natural responses reflecting the digital profile
- WHEN NECESSARY: Use maps and geospatial data for local context

Survey question:`,
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
