import { GoogleGenAI } from "@google/genai";
import { log } from "./index";

// Gemini API configuration with fallback models - ordered by capability (per Dec 2025 docs)
// All models listed are FREE TIER eligible (as of December 19, 2025)
// Verified at: https://ai.google.dev/gemini-api/docs/pricing
const GEMINI_MODELS = [
  "gemini-3-flash-preview",       // OPTIMAL: Latest Gen 3 Flash - FREE, fastest, superior intelligence
  "gemini-2.5-flash",             // Gemini 2.5 Flash - FREE, 1M context, hybrid reasoning with thinking
  "gemini-2.5-pro",               // Gemini 2.5 Pro - FREE tier, advanced reasoning for complex tasks
  "gemini-2.5-flash-lite",        // Gemini 2.5 Flash Lite - FREE, ultra-fast, cost-efficient
  "gemini-2.0-flash",             // Gemini 2.0 Flash - FREE, 1M context window, multimodal
] as const;

export { GEMINI_MODELS };

// Rate limit tracking for models
interface RateLimitInfo {
  model: string;
  nextAvailableTime: number;
  retryAfterSeconds?: number;
}

const rateLimitTracker: Map<string, RateLimitInfo> = new Map();

type GeminiModel = (typeof GEMINI_MODELS)[number];

interface GeminiRequest {
  userPrompt: string;
  systemPrompt?: string;
  includeThinking?: boolean;
  temperature?: number;
  maxTokens?: number;
  imageData?: {
    mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string; // base64 encoded
  };
}

interface GeminiResponse {
  text: string;
  model: GeminiModel;
  thinking?: string;
  usageStats?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

// Initialize Gemini client with API key
const initializeGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable not set. Get it from https://aistudio.google.com/apikey"
    );
  }

  return new GoogleGenAI({
    apiKey,
  });
};

let geminiClient: GoogleGenAI | null = null;

const getGeminiClient = (): GoogleGenAI => {
  if (!geminiClient) {
    geminiClient = initializeGeminiClient();
  }
  return geminiClient;
};

export async function generateGeminiResponse(
  request: GeminiRequest
): Promise<GeminiResponse> {
  const client = getGeminiClient();
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      log(`Attempting Gemini with model: ${model}`, "gemini-service");

      // Build the content parts
      const parts: any[] = [];

      // Add image if provided
      if (request.imageData) {
        parts.push({
          inlineData: {
            mimeType: request.imageData.mimeType,
            data: request.imageData.data,
          },
        });
      }

      // Add user prompt
      const finalPrompt = request.systemPrompt
        ? `${request.systemPrompt}\n\n${request.userPrompt}`
        : request.userPrompt;

      parts.push({
        text: finalPrompt,
      });

      // Build request config with MAXIMUM capabilities (per official Gemini docs 2025)
      // Extended parameters for optimal reasoning and generation
      const requestConfig: any = {
        model,
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.85,
          maxOutputTokens: request.maxTokens ?? 8000,
          topP: 0.99,
          topK: 50,
        },
      };

      // Configure thinking for ALL supported models (Gemini 3, 2.5, 2.0)
      // Uses budgetTokens to control thinking depth
      // Thinking capability significantly improves reasoning, coding, math, data analysis
      // https://ai.google.dev/gemini-api/docs/thinking
      if (request.includeThinking) {
        requestConfig.thinking = {
          type: "ENABLED",
          budgetTokens: 15000, // Increased budget for complex reasoning tasks
        };
      }

      // Configure ALL available tools for MAXIMUM capabilities
      // Source: https://ai.google.dev/gemini-api/docs/tools
      // FREE TIER SUPPORT (as of December 19, 2025):
      // - Google Search: 500 RPD free (shared limit for Flash/Flash-Lite)
      // - Code Execution: FREE unlimited
      // - Google Maps: 500 RPD free (shared limit for Flash/Flash-Lite)
      // - URL Context: FREE unlimited
      // - File Search: FREE unlimited (embeddings charged separately)
      const tools: any[] = [
        // 1. Google Search - Ground responses in current events and facts from the web
        // Reduces hallucinations, perfect for real-time information
        { googleSearchRetrieval: {} },
        
        // 2. Code Execution - Write and run Python code for exact calculations
        // Excellent for math problems, data processing, analysis
        { codeExecution: {} },
        
        // 3. Google Maps - Location-aware assistance
        // Find places, directions, local context (available for all models)
        { googleMaps: {} },
      ];

      requestConfig.tools = tools;
      // Use "ANY" mode to allow model to choose when to use tools
      // This gives maximum flexibility for complex reasoning
      requestConfig.toolConfig = {
        functionCallingConfig: { mode: "ANY" },
      };

      const response = await client.models.generateContent(requestConfig);

      const text = response.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("") || "";
      if (!text) {
        throw new Error(`No text response from ${model}`);
      }

      // Extract thinking if available
      let thinking: string | undefined;
      if (request.includeThinking && response.candidates) {
        for (const candidate of response.candidates) {
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if ((part as any).thinking) {
                thinking = (part as any).thinking;
                break;
              }
            }
          }
        }
      }

      // Clear rate limit on success
      rateLimitTracker.delete(model);

      log(`Successfully generated response with ${model}`, "gemini-service");

      return {
        text,
        model,
        thinking,
        usageStats: {
          inputTokens: response.usageMetadata?.promptTokenCount,
          outputTokens: response.usageMetadata?.candidatesTokenCount,
        },
      };
    } catch (error: any) {
      // Handle rate limit errors
      if (error?.response?.status === 429) {
        const retryAfter = error?.response?.headers?.["retry-after"];
        const retrySeconds = retryAfter
          ? parseInt(retryAfter) * 1000
          : 60000; // Default to 60 seconds

        rateLimitTracker.set(model, {
          model,
          nextAvailableTime: Date.now() + retrySeconds,
          retryAfterSeconds: Math.ceil(retrySeconds / 1000),
        });

        log(
          `Model ${model} rate limited for ${Math.ceil(retrySeconds / 1000)} seconds`,
          "gemini-service"
        );
      }

      log(
        `Model ${model} failed: ${error.message || "Unknown error"}`,
        "gemini-service"
      );
      lastError = error;
      // Continue to next model
    }
  }

  throw (
    lastError ||
    new Error(
      "All Gemini models failed. Please check your API key and rate limits."
    )
  );
}

// Stream version for real-time responses
export async function* streamGeminiResponse(
  request: GeminiRequest
): AsyncGenerator<string, void, unknown> {
  const client = getGeminiClient();
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      log(`Attempting stream with model: ${model}`, "gemini-service");

      const parts: any[] = [];

      if (request.imageData) {
        parts.push({
          inlineData: {
            mimeType: request.imageData.mimeType,
            data: request.imageData.data,
          },
        });
      }

      const finalPrompt = request.systemPrompt
        ? `${request.systemPrompt}\n\n${request.userPrompt}`
        : request.userPrompt;

      parts.push({ text: finalPrompt });

      const requestConfig: any = {
        model,
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: request.temperature ?? 0.85,
          maxOutputTokens: request.maxTokens ?? 8000,
          topP: 0.99,
          topK: 50,
        },
      };

      // Configure thinking for streaming (all supported models)
      if (request.includeThinking) {
        requestConfig.thinking = {
          type: "ENABLED",
          budgetTokens: 15000,
        };
      }

      // All tools enabled for maximum streaming capability
      const tools: any[] = [
        { googleSearchRetrieval: {} },
        { codeExecution: {} },
        { googleMaps: {} },
      ];

      requestConfig.tools = tools;
      requestConfig.toolConfig = {
        functionCallingConfig: { mode: "ANY" },
      };

      const stream = await client.models.generateContentStream(requestConfig);

      for await (const chunk of stream) {
        const text = chunk.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join("");

        if (text) {
          yield text;
        }
      }

      return;
    } catch (error: any) {
      log(`Stream with ${model} failed: ${error.message}`, "gemini-service");
      lastError = error;
    }
  }

  throw lastError || new Error("All streaming models failed");
}

/**
 * Get available models and rate limit information
 */
export function getAvailableModels(): {
  available: GeminiModel[];
  rateLimited: RateLimitInfo[];
} {
  const available: GeminiModel[] = [];
  const rateLimited: RateLimitInfo[] = [];
  const now = Date.now();

  for (const model of GEMINI_MODELS) {
    const limitInfo = rateLimitTracker.get(model);
    if (limitInfo && limitInfo.nextAvailableTime > now) {
      rateLimited.push(limitInfo);
    } else {
      available.push(model);
    }
  }

  return { available, rateLimited };
}

/**
 * Check model status and return time until available
 */
export function getModelStatus(): {
  hasAvailableModels: boolean;
  primaryModel: GeminiModel | null;
  minutesUntilAvailable?: number;
} {
  const { available, rateLimited } = getAvailableModels();

  if (available.length > 0) {
    return {
      hasAvailableModels: true,
      primaryModel: available[0],
    };
  }

  // All models are rate limited
  const soonestModel = rateLimited.reduce((prev, curr) =>
    prev.nextAvailableTime < curr.nextAvailableTime ? prev : curr
  );

  const minutesUntilAvailable = Math.ceil(
    (soonestModel.nextAvailableTime - Date.now()) / 60000
  );

  return {
    hasAvailableModels: false,
    primaryModel: null,
    minutesUntilAvailable: Math.max(1, minutesUntilAvailable),
  };
}

export function isValidGeminiModel(model: string): model is GeminiModel {
  return GEMINI_MODELS.includes(model as GeminiModel);
}

