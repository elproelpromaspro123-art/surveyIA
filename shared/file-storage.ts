import fs from "fs/promises";
import path from "path";
import { InsertUser, InsertSurveyResponse, User } from "./schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const DATA_FILE = path.join(DATA_DIR, "storage.json");

function now() {
  return new Date().toISOString();
}

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch (e) {
    const initial = { users: [], surveyResponses: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

async function readAll() {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw || "{}");
}

async function writeAll(data: any) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export class FileStorage {
  async getUser(id: number): Promise<User | undefined> {
    const data = await readAll();
    return data.users.find((u: any) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const data = await readAll();
    return data.users.find((u: any) => u.username === username);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const data = await readAll();
    return data.users.find((u: any) => u.googleId === googleId);
  }

  async getUserByIP(ip: string): Promise<User | undefined> {
    const data = await readAll();
    return data.users.find((u: any) => u.ipAddress === ip);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const data = await readAll();
    const users = data.users || [];
    const id = (users.reduce((max: number, u: any) => Math.max(max, u.id || 0), 0) || 0) + 1;
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password || null,
      googleId: insertUser.googleId || null,
      ipAddress: insertUser.ipAddress || null,
      language: insertUser.language || "es",
      demographics: insertUser.demographics || {},
      preferences: insertUser.preferences || {},
      createdAt: now(),
    } as any;
    users.push(user);
    data.users = users;
    await writeAll(data);
    return user;
  }

  async updateUserProfile(id: number, demographics: any, preferences: any): Promise<User> {
    const data = await readAll();
    const users = data.users || [];
    const idx = users.findIndex((u: any) => u.id === id);
    if (idx === -1) throw new Error("User not found");
    users[idx].demographics = { ...(users[idx].demographics || {}), ...demographics };
    users[idx].preferences = { ...(users[idx].preferences || {}), ...preferences };
    users[idx].updatedAt = now();
    data.users = users;
    await writeAll(data);
    return users[idx];
  }

  async updateUserLanguage(id: number, language: string): Promise<User> {
    const data = await readAll();
    const users = data.users || [];
    const idx = users.findIndex((u: any) => u.id === id);
    if (idx === -1) throw new Error("User not found");
    users[idx].language = language;
    users[idx].updatedAt = now();
    data.users = users;
    await writeAll(data);
    return users[idx];
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<void> {
    const data = await readAll();
    const arr = data.surveyResponses || [];
    const id = (arr.reduce((max: number, r: any) => Math.max(max, r.id || 0), 0) || 0) + 1;
    const entry = {
      id,
      userId: response.userId,
      question: response.question,
      answer: response.answer || null,
      modelUsed: response.modelUsed || null,
      status: response.status || 'completed',
      createdAt: now(),
    };
    arr.push(entry);
    data.surveyResponses = arr;
    await writeAll(data);
  }

  async getUserSurveyResponses(userId: number): Promise<any[]> {
    const data = await readAll();
    const arr = data.surveyResponses || [];
    return arr.filter((r: any) => r.userId === userId).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async clearUserSurveyResponses(userId: number): Promise<void> {
    const data = await readAll();
    const arr = (data.surveyResponses || []).filter((r: any) => r.userId !== userId);
    data.surveyResponses = arr;
    await writeAll(data);
  }
}

export default FileStorage;
