import { GoogleGenAI } from "@google/genai";
import { log } from "./index";

// Gemini API configuration with fallback models - ordered by capability
const GEMINI_MODELS = [
  "gemini-3-flash-preview",    // Most intelligent - All tools
  "gemini-2.5-pro",             // Advanced thinking - All tools + Maps
  "gemini-2.5-flash",           // Best price-performance - All tools
  "gemini-2.5-flash-lite",      // Ultra fast - All tools, optimized
] as const;

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

      // Build request config with thinking support
      const requestConfig: any = {
        model,
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2000,
        },
      };

      // Add thinking config if requested and model supports it
      if (request.includeThinking) {
        // All current models support thinking (2.0-flash has experimental)
        requestConfig.thinking = {
          type: "ENABLED",
          budgetTokens: 5000,
        };
      }

      // Add ALL available tools for enhanced responses
      const tools: any[] = [
        { googleSearchRetrieval: {} },    // Web search for current data
        { codeExecution: {} },             // Math & logical analysis
      ];

      // Add Google Maps for Pro models
      if (model.includes("pro")) {
        tools.push({ googleMaps: {} });   // Geospatial data when needed
      }

      requestConfig.tools = tools;
      requestConfig.toolConfig = {
        functionCallingConfig: { mode: "AUTO" },  // Auto-use tools when beneficial
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
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2000,
        },
      };

      if (request.includeThinking) {
        // All current models support thinking
        requestConfig.thinking = {
          type: "ENABLED",
          budgetTokens: 5000,
        };
      }

      // Add ALL available tools for enhanced responses
      const tools: any[] = [
        { googleSearchRetrieval: {} },    // Web search for current data
        { codeExecution: {} },             // Math & logical analysis
      ];

      // Add Google Maps for Pro models
      if (model.includes("pro")) {
        tools.push({ googleMaps: {} });   // Geospatial data when needed
      }

      requestConfig.tools = tools;
      requestConfig.toolConfig = {
        functionCallingConfig: { mode: "AUTO" },  // Auto-use tools when beneficial
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

export function isValidGeminiModel(model: string): model is GeminiModel {
  return GEMINI_MODELS.includes(model as GeminiModel);
}

export function getAvailableModels(): readonly GeminiModel[] {
  return GEMINI_MODELS;
}
