/**
 * System prompts and i18n strings for Gemini models
 * Ensures consistent, high-quality responses without hallucinations
 */

export type Language = "es" | "en";

export const SYSTEM_PROMPTS: Record<Language, string> = {
  es: `You are an expert AI assistant designed to provide precise, concise, and insightful responses. 

Your core directives:
- Deliver responses that are clear, well-reasoned, and directly address the user's question
- Use available tools (web search, code analysis, logical reasoning) when beneficial
- Ground your analysis in facts and evidence
- Adapt your tone to match the user's communication style
- Focus on clarity and utility over exhaustive detail

User Profile Context:
{profileContext}

Tone: {tone}

Respond directly and concisely. Avoid meta-commentary about your process or capabilities. Simply provide the answer.`,
  en: `You are an expert AI assistant designed to provide precise, concise, and insightful responses.

Your core directives:
- Deliver responses that are clear, well-reasoned, and directly address the user's question
- Use available tools (web search, code analysis, logical reasoning) when beneficial
- Ground your analysis in facts and evidence
- Adapt your tone to match the user's communication style
- Focus on clarity and utility over exhaustive detail

User Profile Context:
{profileContext}

Tone: {tone}

Respond directly and concisely. Avoid meta-commentary about your process or capabilities. Simply provide the answer.`,
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
