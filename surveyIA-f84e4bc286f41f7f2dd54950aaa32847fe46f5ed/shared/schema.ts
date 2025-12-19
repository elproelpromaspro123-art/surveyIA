import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Allow null for Google OAuth users
  googleId: text("google_id").unique(), // For Google OAuth
  ipAddress: text("ip_address"), // Track IP for rate limiting
  language: text("language").default("es"), // Default to Spanish
  // Profile data for "Gemelo Digital" coherence
  demographics: jsonb("demographics").default({}), // Age, Location, Occupation, etc.
  preferences: jsonb("preferences").default({}),   // Interests, Values, Tone preference
  createdAt: timestamp("created_at").defaultNow(),
});

export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Ideally reference users.id but keeping simple for now
  question: text("question").notNull(),
  answer: text("answer"),  // Nullable: responses stored client-side to save database space
  modelUsed: text("model_used").notNull(),
  status: text("status").notNull(), // 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    password: z.string().optional(),
    language: z.enum(["es", "en"]).default("es"),
  });
export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

// Request types
export type GenerateResponseRequest = {
  question: string;
  userId: number; // For now, passing ID directly. In real auth, get from session.
};

// Response types
export type GenerateResponseResponse = {
  answer: string;
  modelUsed: string;
  logs: string[]; // Steps taken: "Escogiendo modelo...", "Analizando...", etc.
};
