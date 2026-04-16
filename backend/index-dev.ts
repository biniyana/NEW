import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "url";

// Define __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from root directory (parent of backend/)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import fs from "node:fs";
import express, { type Express } from "express";
import http from "node:http";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

import viteConfig from "../frontend/vite.config";
import { registerRoutes } from "./routes";
import { nanoid } from "nanoid";

// Use PORT from .env
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
      const indexHtmlPath = path.resolve(process.cwd(), "../frontend/index.html");
      let template = await fs.promises.readFile(indexHtmlPath, "utf-8");

      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Unhandled error in middleware:", err);
  });

  // Start server safely
  server.listen(PORT)
    .on("listening", () => console.log(`🚀 Dev server running at http://localhost:${PORT}`))
    .on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Free it or change PORT in .env`);
      } else {
        console.error(err);
      }
    });
})();