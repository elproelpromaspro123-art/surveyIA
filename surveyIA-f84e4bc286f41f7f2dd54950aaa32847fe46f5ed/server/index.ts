import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

// Simple cookie setter helper
function setCookie(
  res: Response,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    maxAge?: number;
  } = {}
) {
  let cookieStr = `${name}=${encodeURIComponent(value)}`;
  if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
  if (options.httpOnly) cookieStr += "; HttpOnly";
  if (options.secure) cookieStr += "; Secure";
  if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
  
  res.setHeader("Set-Cookie", cookieStr);
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

let appInitialized: express.Express | null = null;

export async function initializeApp(): Promise<express.Express> {
  if (appInitialized) return appInitialized;

  const app = express();

  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  // Simple cookie parser middleware
  app.use((req: any, _res, next) => {
    const cookieHeader = req.headers.cookie;
    req.cookies = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: string) => {
        const [name, value] = cookie.trim().split("=");
        if (name && value) {
          req.cookies[name] = decodeURIComponent(value);
        }
      });
    }
    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    (res as any).json = function (bodyJson: any, ...args: any[]) {
      capturedJsonResponse = bodyJson;
      return originalResJson.call(res, bodyJson);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        log(logLine);
      }
    });

    next();
  });

  // Attach setCookie helper to response object
  app.use((req: any, res: any, next) => {
    res.setCookie = function (name: string, value: string, options?: any) {
      setCookie(res, name, value, options);
    };
    next();
  });

  await registerRoutes(app);
  log("Routes registered successfully", "express");

  // Serve static files (must be after API routes)
  serveStatic(app);
  log("Static files served successfully", "express");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  appInitialized = app;
  return app;
}

export default initializeApp;
