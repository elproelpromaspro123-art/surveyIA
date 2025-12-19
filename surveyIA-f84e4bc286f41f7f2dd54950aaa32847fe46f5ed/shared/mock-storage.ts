import { InsertUser, InsertSurveyResponse, User } from "./schema";

// Simple in-memory storage for testing
const users: User[] = [];
const surveyResponses: InsertSurveyResponse[] = [];

export const mockStorage = {
  // Users
  getUserByUsername: async (username: string) => {
    return users.find(u => u.username === username);
  },
  getUserByGoogleId: async (googleId: string) => {
    return users.find(u => u.googleId === googleId);
  },
  getUserByIP: async (ip: string) => {
    return users.find(u => u.ipAddress === ip);
  },
  getUser: async (id: number) => {
    return users.find(u => u.id === id);
  },
  createUser: async (userData: InsertUser) => {
    const id = users.length + 1;
    const user: User = {
      id,
      username: userData.username,
      password: userData.password || null,
      googleId: userData.googleId || null,
      ipAddress: userData.ipAddress || null,
      language: userData.language || "es",
      demographics: userData.demographics || {},
      preferences: userData.preferences || {},
      createdAt: new Date(),
    };
    users.push(user);
    return user;
  },
  updateUserLanguage: async (id: number, language: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      user.language = language;
    }
  },
  updateUserProfile: async (id: number, demographics: any, preferences: any) => {
    const user = users.find(u => u.id === id);
    if (user) {
      user.demographics = { ...(user.demographics as any), ...demographics };
      user.preferences = { ...(user.preferences as any), ...preferences };
    }
  },

  // Survey Responses
  createSurveyResponse: async (response: InsertSurveyResponse) => {
    surveyResponses.push(response);
    return response;
  },
  getUserSurveyResponses: async (userId: number) => {
    return surveyResponses.filter(r => r.userId === userId);
  },
  clearUserSurveyResponses: async (userId: number) => {
    const initialLength = surveyResponses.length;
    const filtered = surveyResponses.filter(r => r.userId !== userId);
    surveyResponses.length = 0;
    surveyResponses.push(...filtered);
    return initialLength - surveyResponses.length;
  },
};