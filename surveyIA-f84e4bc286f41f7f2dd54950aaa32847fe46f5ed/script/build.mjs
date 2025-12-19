import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { resolve } from "path";
import { existsSync } from "fs";

const rootDir = process.cwd();

const allowlist = [
  "@google/genai",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-session",
  "memorystore",
  "multer",
  "passport",
  "passport-local",
  "pg",
  "ws",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  try {
    // Clean dist
    if (existsSync("dist")) {
      await rm("dist", { recursive: true, force: true });
    }

    // Build client
    console.log("✓ building client...");
    await viteBuild();

    // Build server
    console.log("✓ building server...");
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    const allDeps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];
    const externals = allDeps.filter((dep) => !allowlist.includes(dep));

    await esbuild({
      entryPoints: [resolve(rootDir, "server/prod.ts")],
      platform: "node",
      bundle: true,
      format: "cjs",
      outfile: resolve(rootDir, "dist/index.cjs"),
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      minify: true,
      external: externals,
      logLevel: "info",
    });

    console.log("✓ build complete");
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

buildAll();
