import { GoogleGenAI } from "@google/genai";
import { log } from "./index";

// Gemini API configuration with fallback models - ordered by capability (per Dec 2025 docs)
const GEMINI_MODELS = [
  "gemini-2-pro-exp-12-05",      // Gemini 2.5 Pro with advanced thinking
  "gemini-2.5-flash",             // Gemini 2.5 Flash - fast & capable with thinking
  "gemini-2.5-flash-lite",        // Gemini 2.5 Flash Lite - ultra fast
  "gemini-1.5-pro",               // Gemini 1.5 Pro fallback
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

      // Build request config with MAXIMUM capabilities (per official Gemini docs 2025)
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

      // Configure thinking - supports Gemini 2.5 & 1.5
      // For Gemini 2.5: use budgetTokens (token limit for thinking)
      // Thinking improves reasoning, coding, math, data analysis
      if (request.includeThinking) {
        requestConfig.thinking = {
          type: "ENABLED",
          budgetTokens: 10000, // Optimal budget for high-quality reasoning
        };
      }

      // Add ALL tools for MAXIMUM capabilities
      const tools: any[] = [
        { googleSearchRetrieval: {} },      // Real-time web data
        { codeExecution: {} },              // Complex math & analysis
      ];

      // All models get access to geospatial tools
      if (model.includes("pro") || model.includes("3")) {
        tools.push({ googleMaps: {} });     // Advanced geospatial analysis
      }

      requestConfig.tools = tools;
      requestConfig.toolConfig = {
        functionCallingConfig: { mode: "ANY" },  // Aggressive tool use
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
          temperature: request.temperature ?? 0.85,
          maxOutputTokens: request.maxTokens ?? 8000,
          topP: 0.99,
          topK: 50,
        },
      };

      // Configure thinking for streaming (Gemini 2.5 & 1.5)
      if (request.includeThinking) {
        requestConfig.thinking = {
          type: "ENABLED",
          budgetTokens: 10000,
        };
      }

      // All tools enabled for maximum capability
      const tools: any[] = [
        { googleSearchRetrieval: {} },
        { codeExecution: {} },
      ];

      if (model.includes("pro") || model.includes("3")) {
        tools.push({ googleMaps: {} });
      }

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

export function isValidGeminiModel(model: string): model is GeminiModel {
  return GEMINI_MODELS.includes(model as GeminiModel);
}

export function getAvailableModels(): readonly GeminiModel[] {
  return GEMINI_MODELS;
}
