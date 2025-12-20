import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files with proper MIME types
  app.use(express.static(distPath, {
    // Don't serve index.html for root /, let the fallback handle it
    index: false,
    // Add caching for static assets
    maxAge: '1d',
    etag: true,
  }));

  // fall through to index.html if the file doesn't exist (but NOT for API routes)
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ 
        message: "API endpoint not found",
        path: req.path,
        method: req.method 
      });
    }

    // Skip if file exists (don't serve index.html for actual files)
    const filePath = path.resolve(distPath, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return next();
    }

    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
