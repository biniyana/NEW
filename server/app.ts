import { type Server } from "node:http";

// Catch unhandled errors so the server stays up and logs are visible
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

// Simple .env loader (fallback if 'dotenv' isn't installed). Loads key=value pairs
// from a top-level .env file and populates process.env if not already set.
import fs from "node:fs";
import path from "node:path";
const _envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(_envPath)) {
  const _envRaw = fs.readFileSync(_envPath, "utf8");
  const lines = _envRaw.split(/\r?\n/);
  let currentKey = '';
  let currentValue = '';
  let inMultiline = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (inMultiline) {
      // Continue accumulating multiline value
      currentValue += line + '\n';
      if (line.includes('}')) {
        // End of JSON object
        inMultiline = false;
        if (process.env[currentKey] === undefined) {
          process.env[currentKey] = currentValue.trim();
        }
        currentKey = '';
        currentValue = '';
      }
    } else {
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex).trim();
        const value = line.substring(eqIndex + 1).trim();

        if (value.startsWith('{') && !value.includes('}')) {
          // Start of multiline JSON
          inMultiline = true;
          currentKey = key;
          currentValue = value + '\n';
        } else {
          // Single line value
          if (process.env[key] === undefined) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
// allow large base64 payloads for image uploads (needs to be significantly
// higher than MAX_UPLOAD_BYTES because base64 adds ~33% overhead)
app.use(express.json({
  limit: "60mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: "60mb" }));

// Serve uploaded files
const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // respond to client then log internally; do NOT rethrow so the server
    // process stays alive (especially important during development).
    res.status(status).json({ message });
    console.error("Unhandled error in middleware:", err);
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on a fixed, single port to avoid automatic
  // port-switching when the desired port is busy.  Port 5004 is chosen as the
  // canonical development port for this project (also set in the .env file).
  // If the port is unavailable the server will exit with an error so the
  // developer can free it or change the configuration; it will **not** try to
  // listen on a different port.
  const FIXED_PORT = 5004;
  const port = FIXED_PORT;
  const listenOptions: any = { port, host: "0.0.0.0" };
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  // Centralized error handler for server listen errors (prevents unhandled exceptions)
  server.on("error", (err: any) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${port} already in use. Change PORT in .env or free the port.`);
      // Exit cleanly so process managers / dev tooling can restart or notify the developer.
      process.exit(1);
    }
    console.error("Server error:", err?.message || err);
    process.exit(1);
  });

  server.listen(listenOptions, () => {
    // Clean, professional startup logs
    console.log(`Server running on *fixed* port: ${port} (will not switch ports)`);
    console.log(`NOTE: if this port is busy the process will exit with an error`);
    console.log(`Google OAuth callback: http://localhost:${port}/auth/google/callback`);
    console.log("Genkit AI Enabled:", Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY));

  });
}
