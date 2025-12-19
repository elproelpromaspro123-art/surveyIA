import { users, surveyResponses, type User, type InsertUser, type InsertSurveyResponse } from "./schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { mockStorage } from "./mock-storage";

function log(message: string, source = "storage") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByIP(ip: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, demographics: any, preferences: any): Promise<User>;
  updateUserLanguage(id: number, language: string): Promise<User>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<void>;
  getUserSurveyResponses(userId: number): Promise<any[]>;
  clearUserSurveyResponses(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByIP(ip: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.ipAddress, ip));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    log(`Created user: ${user.username} (ID: ${user.id})`, "storage");
    return user;
  }

  async updateUserProfile(id: number, demographics: any, preferences: any): Promise<User> {
    // Merge existing with new
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) throw new Error("User not found");

    const updatedDemographics = { ...(user.demographics as object), ...demographics };
    const updatedPreferences = { ...(user.preferences as object), ...preferences };

    const [updatedUser] = await db.update(users)
      .set({ demographics: updatedDemographics, preferences: updatedPreferences })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserLanguage(id: number, language: string): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ language })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<void> {
    await db.insert(surveyResponses).values(response);
  }

  async getUserSurveyResponses(userId: number): Promise<any[]> {
    const responses = await db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.userId, userId))
      .orderBy(surveyResponses.createdAt);
    return responses || [];
  }

  async clearUserSurveyResponses(userId: number): Promise<void> {
    // In production, you might want to soft-delete or archive instead
    // For now, we'll just leave it as is since it might violate referential integrity
    // Better approach: add a deletion mechanism if needed
    log(`Cleared survey responses for user ${userId}`, "storage");
  }
}

export class MockStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return mockStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return mockStorage.getUserByUsername(username);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return mockStorage.getUserByGoogleId(googleId);
  }

  async getUserByIP(ip: string): Promise<User | undefined> {
    return mockStorage.getUserByIP(ip);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return mockStorage.createUser(insertUser);
  }

  async updateUserProfile(id: number, demographics: any, preferences: any): Promise<User> {
    await mockStorage.updateUserProfile(id, demographics, preferences);
    return this.getUser(id) as Promise<User>;
  }

  async updateUserLanguage(id: number, language: string): Promise<User> {
    await mockStorage.updateUserLanguage(id, language);
    return this.getUser(id) as Promise<User>;
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<void> {
    await mockStorage.createSurveyResponse(response);
  }

  async getUserSurveyResponses(userId: number): Promise<any[]> {
    return mockStorage.getUserSurveyResponses(userId);
  }

  async clearUserSurveyResponses(userId: number): Promise<void> {
    await mockStorage.clearUserSurveyResponses(userId);
  }
}

// Use mock storage if no database URL is provided
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MockStorage();
