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
import cors from "cors";

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
      currentValue += line + '\n';
      if (line.includes('}')) {
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
          inMultiline = true;
          currentKey = key;
          currentValue = value + '\n';
        } else {
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

// Enable CORS for frontend access
app.use(cors({
  origin: [
    "http://localhost:5173",      // Vite dev server
    "http://localhost:3000",      // Alternative dev
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL || "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  limit: "60mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ extended: false, limit: "60mb" }));

const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;

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

    res.status(status).json({ message });
    console.error("Unhandled error in middleware:", err);
  });

  await setup(app, server);

  // ✅ FIXED FOR RENDER (IMPORTANT CHANGE)
  const port = process.env.PORT || 5004;

  const listenOptions: any = {
    port,
    host: "0.0.0.0",
  };

  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  server.on("error", (err: any) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${port} already in use.`);
      process.exit(1);
    }
    console.error("Server error:", err?.message || err);
    process.exit(1);
  });

  server.listen(listenOptions, () => {
    console.log(`Server running on port: ${port}`);
    console.log(`Google OAuth callback: http://localhost:${port}/auth/google/callback`);
    console.log("Genkit AI Enabled:", Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY));
  });
}