import { storage } from "@shared/storage";
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

// Store IP-based sessions in memory (in production, use Redis or database)
const ipSessions = new Map<string, IpAuthSession>();

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
 * Verify if IP can create a new account
 * Enforces: One account per IP
 */
export async function canCreateAccountFromIP(ip: string): Promise<boolean> {
  // Check if this IP already has an active session
  if (ipSessions.has(ip)) {
    return false;
  }

  // Check database for users created from this IP
  const existingUser = await storage.getUserByIP(ip);
  return !existingUser;
}

/**
 * Create auth session for IP
 */
export async function createAuthSession(
  ip: string,
  userId: number,
  googleId?: string
): Promise<IpAuthSession> {
  const session: IpAuthSession = {
    ip,
    userId,
    createdAt: new Date(),
    googleId,
  };

  ipSessions.set(ip, session);
  log(
    `Created auth session for IP ${ip} (User: ${userId})`,
    "auth-service"
  );

  return session;
}

/**
 * Get auth session by IP
 */
export function getAuthSessionByIP(ip: string): IpAuthSession | undefined {
  return ipSessions.get(ip);
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
      // Detect language from payload or default to es
      const userLanguage = (payload.locale as string)?.split('-')[0] || "es";
      user = await storage.createUser({
        username: email || `user_${googleId.slice(0, 8)}`,
        password: `google_${googleId}`, // Placeholder - Google users don't use password
        googleId,
        ipAddress: ip,
        language: userLanguage === 'en' ? 'en' : 'es',
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
 * Middleware to check if IP is authorized
 * Fallback to cookie-based userId if session not found
 */
export function requireAuthMiddleware(req: any, res: any, next: any) {
  const ip = getUserIP(req);
  const session = getAuthSessionByIP(ip);

  if (session) {
    // Session found via IP
    req.userId = session.userId;
    req.userIP = ip;
    return next();
  }

  // Fallback: Check for userId in cookies
  if (req.cookies?.userId) {
    try {
      const userId = parseInt(req.cookies.userId, 10);
      if (!isNaN(userId)) {
        req.userId = userId;
        req.userIP = ip;
        // Optionally re-create session from cookie
        // await createAuthSession(ip, userId);
        return next();
      }
    } catch (e) {
      // Invalid cookie
    }
  }

  return res.status(401).json({
    authenticated: false,
    message: "Not authenticated. Please sign in.",
  });
}

/**
 * Clear session for IP (logout)
 */
export function clearAuthSession(ip: string): void {
  ipSessions.delete(ip);
  log(`Cleared auth session for IP ${ip}`, "auth-service");
}
