import type { Express } from "express";
import { storage } from "@shared/storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { generateGeminiResponse, streamGeminiResponse, getAvailableModels, getModelStatus } from "./gemini-service";
import { getSystemPrompt, t, type Language } from "./prompts-i18n";
import { getUserIP, canCreateAccountFromIP, createAuthSession, getAuthSessionByIP, validateGoogleToken, requireAuthMiddleware, clearAuthSession } from "./auth-service";

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Generate Gemini response for a survey question with full context and streaming
 */
async function generateSurveyResponse(
  userProfile: any,
  question: string,
  language: Language = "es",
  includeThinking: boolean = true
): Promise<{
  text: string;
  model: string;
  thinking?: string;
  usageStats?: any;
}> {
  const systemPrompt = getSystemPrompt(userProfile, language);

  const response = await generateGeminiResponse({
    userPrompt: question,
    systemPrompt,
    includeThinking: true, // Always enable maximum thinking
    temperature: 0.85, // High temperature for expert-level analysis
    maxTokens: 8000, // Maximum tokens for comprehensive responses
  });

  return response;
}

/**
 * Register all API routes
 */
export async function registerRoutes(
  app: Express
): Promise<void> {
  console.log("Starting to register routes...");


  // ==================== AUTH ROUTES ====================

  /**
    * POST /api/auth/register
    * Register new user with email and password
    */
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, language = "es" } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const ip = getUserIP(req);

      // Check if IP can create account
      if (!(await canCreateAccountFromIP(ip))) {
        return res.status(403).json({
          message: t("one_account_per_ip", language),
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password,
        ipAddress: ip,
        language,
      });

      // Create auth session
      await createAuthSession(ip, user.id);

      log(`User registered: ${user.username} (ID: ${user.id})`, "auth");

      res.status(201).json({
        userId: user.id,
        username: user.username,
        language: user.language,
      });
    } catch (error: any) {
      log(`Registration error: ${error.message}`, "auth");
      res.status(500).json({ message: "Registration failed" });
    }
  });

  /**
    * POST /api/auth/login
    * Login with email and password
    */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const ip = getUserIP(req);

      // Create auth session
      await createAuthSession(ip, user.id);

      log(`User logged in: ${user.username} (ID: ${user.id})`, "auth");

      res.json({
        userId: user.id,
        username: user.username,
        language: user.language || "es",
      });
    } catch (error: any) {
      log(`Login error: ${error.message}`, "auth");
      res.status(401).json({ message: "Authentication failed" });
    }
  });

  /**
    * POST /api/auth/google
    * Authenticate with Google OAuth token
    */
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const ip = getUserIP(req);

      try {
        const { userId, isNewUser } = await validateGoogleToken(token, ip);
        const user = await storage.getUser(userId);

        // Create auth session
        await createAuthSession(ip, userId);

        res.json({
          userId,
          isNewUser,
          username: user?.username,
          language: user?.language || "es",
        });
      } catch (error: any) {
        if (error.message.includes("one account per IP")) {
          return res.status(403).json({ message: t("one_account_per_ip", "es") });
        }
        throw error;
      }
    } catch (error: any) {
      log(`Google auth error: ${error.message}`, "auth");
      res.status(401).json({ message: "Authentication failed" });
    }
  });

  /**
   * POST /api/auth/logout
   * Clear authentication session
   */
  app.post("/api/auth/logout", (req, res) => {
    const ip = getUserIP(req);
    clearAuthSession(ip);
    res.json({ success: true });
  });

  /**
   * GET /api/auth/session
   * Check current session status
   */
  app.get("/api/auth/session", async (req, res) => {
    try {
      const ip = getUserIP(req);
      const session = getAuthSessionByIP(ip);

      if (!session) {
        return res.status(401).json({ authenticated: false });
      }

      const user = await storage.getUser(session.userId);
      res.json({
        authenticated: true,
        userId: session.userId,
        username: user?.username,
        language: user?.language || "es",
      });
    } catch (error: any) {
      log(`Session check error: ${error.message}`, "auth");
      res.status(500).json({ authenticated: false, message: "Session check failed" });
    }
  });

  // ==================== USER ROUTES ====================

  /**
    * POST /api/users
    * Create new user (requires IP auth)
    */
  app.post("/api/users", async (req, res) => {
    try {
      const ip = getUserIP(req);

      // Check if IP can create account
      if (!(await canCreateAccountFromIP(ip))) {
        return res.status(403).json({
          message: t("one_account_per_ip", "es"),
        });
      }

      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser({
        ...input,
        ipAddress: ip,
        language: input.language || "es",
      });

      // Create auth session
      await createAuthSession(ip, user.id);

      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  /**
   * GET /api/users/:id
   * Get user profile (requires auth)
   */
  app.get("/api/users/:id", requireAuthMiddleware, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Users can only see their own profile unless admin
      if (user.id !== Number(req.userId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * PATCH /api/users/:id
   * Update user profile
   */
  app.patch("/api/users/:id", requireAuthMiddleware, async (req, res) => {
    try {
      const userId = Number(req.params.id);

      // Users can only update their own profile
      if (userId !== Number(req.userId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { demographics, preferences, language } = req.body;

      if (language) {
        await storage.updateUserLanguage(userId, language);
      }

      if (demographics || preferences) {
        await storage.updateUserProfile(userId, demographics || {}, preferences || {});
      }

      const user = await storage.getUser(userId);
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ==================== SURVEY ROUTES ====================

  /**
   * POST /api/survey/generate
   * Generate AI response for survey question with streaming support
   */
  app.post("/api/survey/generate", requireAuthMiddleware, async (req, res) => {
    try {
      const { question, includeThinking } = req.body;
      const userId = req.userId;

      if (!question || typeof question !== "string") {
        return res.status(400).json({ message: "Question required" });
      }

      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const language = (user.language as Language) || "es";

      log(
        `Generating survey response for user ${userId}, question: "${question.slice(0, 50)}..."`,
        "survey"
      );

      // Generate response
      const { text, model, thinking, usageStats } = await generateSurveyResponse(
        user,
        question,
        language,
        includeThinking === true
      );

      // Save to database (only metadata to save space)
      // Responses are stored client-side in localStorage
      await storage.createSurveyResponse({
        userId: Number(userId),
        question,
        answer: null,  // Don't store full response to save database space
        modelUsed: model,
        status: "completed",
      });

      res.json({
        answer: text,
        modelUsed: model,
        thinking,
        usageStats,
        logs: [
          t("selecting_model", language),
          t("analyzing_coherence", language),
          t("using_tools", language),
          t("process_completed", language),
        ],
      });

      log(`Successfully generated response with ${model}`, "survey");
    } catch (err: any) {
      log(`Survey generation error: ${err.message}`, "survey");
      res.status(500).json({
        message: t("error_generating_response", "es"),
        details: err.message,
      });
    }
  });

  /**
    * GET /api/survey/history
    * Get survey response history for user
    */
  app.get("/api/survey/history", requireAuthMiddleware, async (req, res) => {
    try {
      const userId = Number(req.userId);
      const responses = await storage.getUserSurveyResponses(userId);

      res.json({
        responses: responses || [],
        total: responses?.length || 0,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  /**
    * DELETE /api/survey/history
    * Clear survey response history for user
    */
  app.delete("/api/survey/history", requireAuthMiddleware, async (req, res) => {
    try {
      const userId = Number(req.userId);
      await storage.clearUserSurveyResponses(userId);

      res.json({ success: true, message: "History cleared" });
    } catch (err) {
      res.status(500).json({ message: "Failed to clear history" });
    }
  });

  /**
    * GET /api/survey/models
    * Get list of available Gemini models and rate limit status
    */
  app.get("/api/survey/models", (_req, res) => {
    const modelStatus = getModelStatus();
    const { available, rateLimited } = getAvailableModels();

    res.json({
      available,
      rateLimited: rateLimited.map((info) => ({
        model: info.model,
        minutesUntilAvailable: Math.ceil(
          (info.nextAvailableTime - Date.now()) / 60000
        ),
        secondsUntilAvailable: Math.ceil(
          (info.nextAvailableTime - Date.now()) / 1000
        ),
      })),
      status: {
        hasAvailableModels: modelStatus.hasAvailableModels,
        primaryModel: modelStatus.primaryModel,
        minutesUntilAvailable: modelStatus.minutesUntilAvailable,
      },
    });
  });

  // ==================== SEED DATA ====================

  /**
    * Seed demo data if needed (non-blocking with retry)
    */
  async function seed(retries = 3, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const existing = await storage.getUserByUsername("demo_user");
        if (!existing) {
          await storage.createUser({
            username: "demo_user",
            password: "demo_password_123",
            demographics: {
              age: 28,
              occupation: "Software Engineer",
              location: "San Francisco",
              education: "Bachelor's",
            },
            preferences: {
              tone: "Professional",
              interests: ["Technology", "AI", "Innovation"],
              communicationStyle: "Direct",
            },
            language: "es",
            ipAddress: "127.0.0.1",
          });
          log("Seeded demo user", "seed");
        }
        return; // Success, exit function
      } catch (err: any) {
        if (attempt < retries) {
          log(`Seeding attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${delayMs}ms...`, "seed");
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          log(`Seeding failed after ${retries} attempts: ${err.message}. Continuing with app startup.`, "seed");
        }
      }
    }
  }

  // Run seeding in the background, don't wait for it
  seed().catch(err => log(`Seeding error: ${err.message}`, "seed"));
  }
