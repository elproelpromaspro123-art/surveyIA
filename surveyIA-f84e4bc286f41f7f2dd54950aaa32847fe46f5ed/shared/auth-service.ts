import { storage } from "./storage";
import { jwtDecode } from "jwt-decode";

function log(message: string, source = "auth-service") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Get Google OAuth client ID
const googleClientId = process.env.GOOGLE_CLIENT_ID;

interface IpAuthSession {
  ip: string;
  userId: number;
  createdAt: Date;
  googleId?: string;
}

// Store sessions in memory (in production, use Redis or database)
const sessions = new Map<string, IpAuthSession>();
const sessionCookieName = "surveyia_session";

/**
 * Get user IP address from request
 */
export function getUserIP(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

/**
 * Generate session token
 */
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Verify if IP can create a new account
 * Enforces: One account per IP
 */
export async function canCreateAccountFromIP(ip: string): Promise<boolean> {
  // Check database for users created from this IP
  const existingUser = await storage.getUserByIP(ip);
  return !existingUser;
}

/**
 * Create auth session (returns session token for cookie)
 */
export async function createAuthSession(
  ip: string,
  userId: number,
  googleId?: string
): Promise<{ token: string; session: IpAuthSession }> {
  const token = generateSessionToken();
  const session: IpAuthSession = {
    ip,
    userId,
    createdAt: new Date(),
    googleId,
  };

  sessions.set(token, session);
  log(
    `Created auth session token for User ${userId}`,
    "auth-service"
  );

  return { token, session };
}

/**
 * Get auth session by token
 */
export function getAuthSessionByToken(token: string): IpAuthSession | undefined {
  const session = sessions.get(token);
  if (session) {
    // Check if session is not expired (24 hours)
    const now = new Date();
    const sessionAge = now.getTime() - session.createdAt.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    if (sessionAge > twentyFourHours) {
      sessions.delete(token);
      return undefined;
    }
  }
  return session;
}

/**
 * Validate Google OAuth token and create/get user
 */
export async function validateGoogleToken(
  token: string,
  ip: string
): Promise<{
  userId: number;
  isNewUser: boolean;
}> {
  try {
    if (!googleClientId) {
      throw new Error("Google OAuth is not configured. Set GOOGLE_CLIENT_ID environment variable.");
    }

    // Decode the JWT token locally (no network call)
    const payload = jwtDecode<{
      sub: string;
      email: string;
      aud: string;
      iss: string;
      [key: string]: any;
    }>(token);

    if (!payload) {
      throw new Error("Invalid token: unable to decode");
    }

    // Validate audience matches our client ID
    if (payload.aud !== googleClientId) {
      throw new Error(`Invalid token: audience mismatch (expected ${googleClientId}, got ${payload.aud})`);
    }

    // Validate issuer is Google
    if (!payload.iss?.includes("google")) {
      throw new Error("Invalid token: not issued by Google");
    }

    const googleId = payload.sub;
    const email = payload.email;

    if (!googleId) {
      throw new Error("Invalid token: missing sub claim");
    }

    // Check if user already exists with this Google ID
    let user = await storage.getUserByGoogleId(googleId);
    let isNewUser = false;

    if (!user) {
      // Check if IP can create new account
      if (!(await canCreateAccountFromIP(ip))) {
        throw new Error(
          "This IP has already created an account. One account per IP allowed."
        );
      }

      // Create new user
      isNewUser = true;
      user = await storage.createUser({
        username: email || `user_${googleId.slice(0, 8)}`,
        password: `google_${googleId}`, // Placeholder - Google users don't use password
        googleId,
        ipAddress: ip,
        language: "es",
      });

      log(`Created new user from Google OAuth: ${user.id}`, "auth-service");
    }

    // Create/update auth session
    await createAuthSession(ip, user.id, googleId);

    return {
      userId: user.id,
      isNewUser,
    };
  } catch (error: any) {
    log(`Google token validation failed: ${error.message}`, "auth-service");
    throw error;
  }
}

/**
 * Extract session token from cookie
 */
export function getSessionToken(req: any): string | undefined {
  const cookies = req.headers.cookie?.split(";") || [];
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === sessionCookieName && value) {
      return decodeURIComponent(value);
    }
  }
  return undefined;
}

/**
 * Middleware to check if authenticated via session token
 */
export function requireAuthMiddleware(req: any, res: any, next: any) {
  const token = getSessionToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Not authenticated. Please sign in.",
    });
  }

  const session = getAuthSessionByToken(token);

  if (!session) {
    return res.status(401).json({
      message: "Session expired. Please sign in again.",
    });
  }

  // Attach to request for later use
  req.userId = session.userId;
  req.sessionToken = token;

  next();
}

/**
 * Clear session (logout)
 */
export function clearAuthSession(token: string): void {
  sessions.delete(token);
  log(`Cleared auth session`, "auth-service");
}
