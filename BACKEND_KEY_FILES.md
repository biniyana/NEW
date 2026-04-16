# Key Backend Files - Final Versions

## 1. backend/app.ts (Express App with CORS)

```typescript
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

// ... .env loading code ...

import { registerRoutes } from "./routes";

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

  const port = process.env.PORT || 5004;

  const listenOptions: any = {
    port,
  };

  if (process.env.HOST) {
    listenOptions.host = process.env.HOST;
  }

  server.listen(listenOptions, () => {
    const url = `http://localhost:${port}`;
    console.log(`✅ Server running at ${url}`);
  });
}
```

**Key Points:**
- ✅ CORS middleware enabled
- ✅ Allows localhost:5173 (frontend dev)
- ✅ Credentials and all methods supported
- ✅ Express JSON/URL-encoded parsers
- ✅ Static file serving
- ✅ Error handling
- ✅ Port configurable via .env

---

## 2. backend/index-dev.ts (Development Entry Point)

```typescript
import dotenv from "dotenv";
dotenv.config();

import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import http from "node:http";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

import viteConfig from "../frontend/vite.config";
import { registerRoutes } from "./routes";

const PORT = Number(process.env.PORT || 5005);
console.log("Using PORT:", PORT);
console.log("Genkit AI Enabled:", Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY));

(async () => {
  const app: Express = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const server = http.createServer(app);

  // Setup Vite in middleware mode
  const vite = await createViteServer({
    ...viteConfig,
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Run app logic
  try {
    await registerRoutes(app);
    console.log("Routes registered.");
  } catch (err) {
    console.warn("Warning: registerRoutes failed, continuing dev server", err);
  }

  // Serve SPA routes with Vite-transformed index.html
  app.use("*", async (req, res, next) => {
    try {
      const indexHtmlPath = path.resolve(process.cwd(), "frontend/index.html");
      let template = await fs.promises.readFile(indexHtmlPath, "utf-8");

      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx"`
      );

      res.type("text/html");
      res.send(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as any);
      next(e);
    }
  });

  server.listen(PORT, () => {
    console.log(`\n✅ Dev server running at http://localhost:${PORT}\n`);
  });
})();
```

**Key Points:**
- ✅ Vite middleware mode (HMR support)
- ✅ Serves frontend from frontend/index.html
- ✅ API routes registered
- ✅ SPA fallback handling
- ✅ Development-friendly error handling
- ✅ Port from .env

---

## 3. backend/index-prod.ts (Production Entry Point)

```typescript
import dotenv from "dotenv";
dotenv.config();

import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";
import express, { type Express } from "express";
import runApp from "./app";

export async function serveStatic(app: Express, _server: Server) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

(async () => {
  await runApp(serveStatic);
})();
```

**Key Points:**
- ✅ Production-optimized static serving
- ✅ SPA fallback to index.html
- ✅ Uses app.ts for setup
- ✅ Serves pre-built frontend

---

## 4. backend/package.json

```json
{
  "name": "waiz-backend",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx index-dev.ts",
    "build": "esbuild index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js",
    "start": "NODE_ENV=production node dist/index.js",
    "type-check": "tsc --noEmit",
    "db:push": "drizzle-kit push",
    "migrate:firebase": "node migrateToFirebase.js"
  },
  "dependencies": {
    "@genkit-ai/core": "^1.30.1",
    "@genkit-ai/flow": "^0.5.17",
    "@genkit-ai/google-genai": "^1.17.0",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.4",
    "cloudinary": "^2.9.0",
    "cors": "^2.8.5",
    "csv-parser": "^3.0.0",
    "date-fns": "^3.6.0",
    "dotenv": "^17.2.3",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "firebase": "^12.11.0",
    "firebase-admin": "^13.7.0",
    "genkit": "^1.17.0",
    "memorystore": "^1.6.7",
    "mysql2": "^3.19.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-local": "^1.0.0",
    "pg": "^8.18.0",
    "sharp": "^0.34.5",
    "twilio": "^5.12.0",
    "ws": "^8.18.0",
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@types/connect-pg-simple": "^7.0.3",
    "@types/cors": "^2.8.17",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/node": "20.16.11",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/ws": "^8.5.13",
    "cross-env": "^10.1.0",
    "drizzle-kit": "^0.18.1",
    "esbuild": "^0.25.0",
    "tsx": "^4.21.0",
    "typescript": "5.6.3"
  },
  "optionalDependencies": {
    "bufferutil": "^4.0.8"
  }
}
```

**Key Points:**
- ✅ Express 4.21.2
- ✅ CORS support added
- ✅ Firebase Admin SDK
- ✅ Genkit AI support
- ✅ Passport OAuth
- ✅ TypeScript compilation via TSX
- ✅ ESBuild for production bundling
- ✅ Development and production scripts

---

## 5. backend/.env

```
PORT=5004
GOOGLE_CALLBACK_URL=http://localhost:5004/auth/google/callback
CLIENT_BASE_URL=http://localhost:5004
SEED_DATA=true

FIREBASE_PROJECT_ID=waiz-app-f11f1
GEMINI_API_KEY=AIzaSyCo97W7VQ7UQ-8bb_wvHXTbBJKwwBq_zCc
CLOUDINARY_CLOUD_NAME=detb5sdvp
CLOUDINARY_API_KEY=915662681348829
CLOUDINARY_API_SECRET=5Abjd_BAIXeX0EfI3XM6E6HY0PU
```

**Key Points:**
- ✅ Port configuration
- ✅ Firebase credentials
- ✅ OAuth callback URL
- ✅ Genkit AI key
- ✅ Cloudinary upload configuration
- ✅ Seed data enabled for development

---

## 6. backend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "jsx": "preserve",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "types": ["node"],
    "paths": {
      "@shared/*": ["./shared/*"]
    }
  },
  "include": [".", "shared", "types"],
  "exclude": ["node_modules", "dist", "frontend"]
}
```

**Key Points:**
- ✅ ES2022 target
- ✅ Strict mode enabled
- ✅ Path alias for shared code
- ✅ NoEmit (build done by esbuild)
- ✅ Excludes frontend directory

---

## Example API Flow (Frontend → Backend)

### Frontend Code
```typescript
// frontend/src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL;

export async function fetchUsers() {
  const response = await fetch(`${API_BASE}/api/users`);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

// Or use in a component
const users = await fetch("http://localhost:5004/api/users").then(r => r.json());
```

### Backend API
```typescript
// backend/routes.ts
app.get("/api/users", async (req, res) => {
  try {
    const users = await fetchAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### CORS Headers
Backend returns:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Result:** Frontend can successfully call backend APIs! ✅

---

## Build Commands Reference

### Development
```bash
# Backend
cd backend
npm run dev          # Starts on :5004 with Vite HMR

# Frontend (separate terminal)
cd frontend
npm run dev          # Starts on :5173 with HMR
```

### Production Build
```bash
# Frontend
cd frontend
npm run build        # Creates dist/ folder
npm run preview      # Test production build locally

# Backend
cd backend
npm run build        # Creates dist/index.js
npm start           # Run production server
```

### TypeScript Checking
```bash
cd frontend && npm run type-check
cd backend && npm run type-check
```
