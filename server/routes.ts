import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { insertUserSchema, insertItemSchema, insertRequestSchema, insertMessageSchema, insertChatbotConversationSchema, insertRateSchema } from "@shared/schema";
// IMPORTANT: storage import is moved to registerRoutes() to ensure it initializes AFTER
// the .env loader in app.ts has run. This ensures SEED_DATA and other env vars are loaded.
let storage: any;
import dotenv from "dotenv";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// helper module for Garbish chatbot logic
import { askGarbishChatbot, PRICE_RESPONSE } from "./garbishAI";

dotenv.config();

// === Genkit AI setup ===
const GENKIT_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let aiClient: ReturnType<typeof genkit> | null = null;
if (GENKIT_API_KEY) {
  aiClient = genkit({
    plugins: [googleAI({ apiKey: GENKIT_API_KEY })],
    model: googleAI.model("gemini-2.5-flash"),
  });
}

async function callGenkitAPI(message: string): Promise<string | null> {
  if (!aiClient) return null;
  try {
    const { text } = await aiClient.generate({ prompt: message });
    return text?.trim() || null;
  } catch (err: any) {
    console.warn("Genkit API error:", err?.message || err);
    return null;
  }
}

// Pre-warm the Genkit model on server start (silent background task)
async function warmupGenkitModel() {
  if (!aiClient || process.env.NODE_ENV === 'development') return;
  setTimeout(async () => {
    try {
      console.log("Pre-warming Genkit model...");
      await callGenkitAPI("Hello");
      console.log("Genkit model warmed up successfully");
    } catch (err) {
      console.warn("Genkit warm-up (non-critical):", err);
    }
  }, 2000);
}

// Max upload bytes for a single image. 20 MB used to be the cap, but because
// we encode images as base64 the request body can exceed that by ~33%, so bump it
// up to 30 MB.  Set to `Infinity` to disable the check entirely (use with caution).
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024; // 30MB

// Helper function to normalize item imageUrls for API responses
function normalizeItemUrls(item: any): any {
  const normalized = { ...item };
  // Determine server base for absolute URLs. Prefer explicit env var, fallback to localhost with PORT.
  const serverBase = (process.env.SERVER_BASE_URL && process.env.SERVER_BASE_URL.replace(/\/$/, ""))
    || `http://localhost:${process.env.PORT || 5000}`;

  // prefer imageUrls array, but if missing convert single imageUrl to array
  if (normalized.imageUrls) {
    try {
      const urls = typeof normalized.imageUrls === "string"
        ? JSON.parse(normalized.imageUrls)
        : normalized.imageUrls;
      normalized.imageUrls = Array.isArray(urls)
        ? urls.map((u: any) => {
            const s = typeof u === "string" ? u : u?.url || "";
            if (!s) return null;
            if (/^https?:\/\//i.test(s)) return s;
            if (s.startsWith("/")) return `${serverBase}${s}`;
            return `${serverBase}/${s}`;
          }).filter(Boolean)
        : [];
    } catch (e) {
      normalized.imageUrls = [];
    }
  } else if (normalized.imageUrl) {
    // fallback to single imageUrl converted to array
    const s = normalized.imageUrl;
    if (typeof s === "string") {
      if (/^https?:\/\//i.test(s)) normalized.imageUrls = [s];
      else if (s.startsWith("/")) normalized.imageUrls = [`${serverBase}${s}`];
      else normalized.imageUrls = [`${serverBase}/${s}`];
    } else {
      normalized.imageUrls = [];
    }
  } else {
    normalized.imageUrls = [];
  }
  return normalized;
}









export async function registerRoutes(app: Express): Promise<Server> {
  // Lazy import storage after .env has been loaded
  if (!storage) {
    const storageModule = await import("./storage");
    storage = storageModule.storage;
    
    // Initialize seed data if enabled
    if (process.env.SEED_DATA === 'true' && typeof storage.seedData === 'function') {
      try {
        await storage.seedData();
        console.log('✅ Seed data initialized');
      } catch (err: any) {
        console.warn('⚠️  Seed data initialization failed:', err.message);
      }
    }
  }

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Pre-warm Genkit model on server start (background task)
  warmupGenkitModel();

  // Setup sessions and passport for OAuth
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const u = await storage.getUser(id);
      done(null, u || null);
    } catch (err) {
      done(err as any, null);
    }
  });

  let googleStrategyRegistered = false;
  let googleCallbackUrl: string | undefined = undefined;

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    try {
      // Normalize and use the exact callback URL provided via env. If no explicit URL
      // is set, try using CLIENT_BASE_URL + '/auth/google/callback' as a fallback.
      const rawCallback = (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CALLBACK_URL.trim())
        || (process.env.CLIENT_BASE_URL && (`${process.env.CLIENT_BASE_URL.trim().replace(/\/$/, '')}/auth/google/callback`));

      if (!rawCallback) {
        // Fall back to localhost using the configured PORT so callback URL remains consistent with the server port.
        const port = process.env.PORT || '5000';
        googleCallbackUrl = `http://localhost:${port}/auth/google/callback`;
        console.log('Google OAuth callback not explicitly configured — using', googleCallbackUrl);
      } else {
        googleCallbackUrl = rawCallback.replace(/\/$/, ''); // remove trailing slash
      }

      passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: googleCallbackUrl || '/auth/google/callback',
      }, async (_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('Google account missing email'));
        let user = await storage.getUserByEmail(email);
        if (!user) {
          const name = profile.displayName || (profile.name && `${profile.name.givenName} ${profile.name.familyName}`) || 'Google User';
          const created = await storage.createUser({ name, email, password: 'oauth-google', phone: '', address: '', userType: 'household' });
          user = created;
        }
        // Ensure user has userType; default to household if missing
        if (!user.userType) {
          user = { ...user, userType: 'household' };
        }
        done(null, user);
      }));

      googleStrategyRegistered = true;
      console.log('✅ Google OAuth strategy registered. Callback URL:', googleCallbackUrl || '(none configured)');
      if (googleCallbackUrl) console.log('ℹ️ Ensure this exact URL is added to Google Cloud Console > OAuth 2.0 Client IDs > Authorized redirect URIs');
    } catch (err) {
      console.warn('passport-google-oauth20 not available; Google OAuth disabled.', err);
    }
  } else {
    console.warn('Google OAuth env vars (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET) not found; Google OAuth disabled.');
  }

  // Auth routes (only register Google OAuth endpoints when the strategy is registered)
  if (googleStrategyRegistered) {
    // Use an explicit callbackURL when initiating the auth request so the redirect_uri
    // parameter sent to Google matches exactly what you registered in the Cloud Console.
    app.get('/auth/google', (req, res, next) => {
      if (!googleCallbackUrl) {
        console.warn('/auth/google called but callback url is not configured');
        return res.status(500).json({ message: 'Google OAuth callback not configured on server' });
      }
      console.log('/auth/google initiated, using callback URL:', googleCallbackUrl);
      const authOptions: any = { scope: ['profile', 'email'], callbackURL: googleCallbackUrl, prompt: 'select_account' };
      // 'prompt: select_account' forces Google to show an account chooser/login page even if
      // the user has an active Google session. This ensures the browser goes to Google's
      // login/consent screen before returning to our backend callback.
      passport.authenticate('google', authOptions)(req, res, next);
    });

    app.get('/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
      (req, res) => {
        const user = req.user as any;
        if (!user) return res.redirect('/login?error=no_user');
        
        // Redirect to auth callback handler on frontend - it will check profile completeness
        const frontendBase = (process.env.CLIENT_BASE_URL && process.env.CLIENT_BASE_URL.replace(/\/$/, '')) || '';
        const redirectTo = frontendBase ? `${frontendBase}/auth-callback` : '/auth-callback';
        console.log('Google OAuth successful for user:', user.id, '— redirecting to auth-callback');
        res.redirect(redirectTo);
      }
    );

    // Debug endpoint to help confirm the exact callback URL used by the server
    app.get('/auth/google/debug', (_req, res) => {
      res.json({ registered: true, clientId: process.env.GOOGLE_CLIENT_ID, callbackUrl: googleCallbackUrl });
    });

    // Return current authenticated user (if any)
    app.get('/api/auth/me', (req, res) => {
      const u = (req as any).user;
      if (!u) return res.status(401).json({ message: 'Not authenticated' });
      
      // Check if profile is complete: all required fields must be non-empty
      const isProfileComplete = !!(
        u.name && 
        u.email && 
        u.phone && 
        u.address && 
        u.userType
      );
      
      const { password, ...rest } = u;
      // Ensure userType is always included; default to 'household' if missing
      const userWithRole = { 
        ...rest, 
        userType: rest.userType || 'household',
        profileComplete: isProfileComplete,
      };
      res.json(userWithRole);
    });

    // Logout endpoint
    app.post('/api/auth/logout', (req, res, next) => {
      req.logout((err) => {
        if (err) return next(err);
        req.session?.destroy((err2) => {
          if (err2) console.warn('Failed to destroy session on logout', err2);
          res.json({ success: true });
        });
      });
    });

    // Dev helper: simulate an OAuth login without contacting Google
    if (process.env.NODE_ENV !== 'production') {
      app.get('/auth/dev-login', async (req, res) => {
        const id = req.query.id as string | undefined || 'household-1';
        const user = await storage.getUser(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        req.login(user, (err) => {
          if (err) return res.status(500).json({ message: 'Failed to login' });
          const frontendBase = (process.env.CLIENT_BASE_URL && process.env.CLIENT_BASE_URL.replace(/\/$/, '')) || '';
          const redirectTo = frontendBase ? `${frontendBase}/dashboard` : '/dashboard';
          res.redirect(redirectTo);
        });
      });
    }
  } else {
    // provide safe stubs so callers get a clear error instead of Unknown strategy
    app.get('/auth/google', (_req, res) => res.status(404).json({ message: 'Google OAuth not configured' }));
    app.get('/auth/google/callback', (_req, res) => res.status(404).json({ message: 'Google OAuth not configured' }));
    app.get('/auth/google/debug', (_req, res) => res.json({ registered: false }));
  }

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const user = await storage.createUser(userData);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      let { email, password } = req.body;
      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: 'Email/phone and password are required' });
      }

      email = email.trim();
      password = password.trim();
      console.log('Login attempt for identifier:', email);

      // determine whether input is phone-looking (digits, plus, spaces) or contains @
      let user;
      if (/^\+?[0-9\s-]+$/.test(email)) {
        // treat as phone
        user = await storage.getUserByPhone(email);
      } else {
        user = await storage.getUserByEmail(email.toLowerCase());
      }

      if (!user || user.password !== password) {
        console.warn('Invalid login for', email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Ensure /api/auth/me exists even when Google OAuth strategy is not registered.
  app.get('/api/auth/me', async (req, res) => {
    const u = (req as any).user;
    if (!u) return res.status(401).json({ message: 'Not authenticated' });
    
    // Check if profile is complete: all required fields must be non-empty
    const isProfileComplete = !!(u.name && u.email && u.phone && u.address && u.userType);
    
    const { password, ...rest } = u;
    // Ensure userType is always included; default to 'household' if missing
    const userWithRole = { ...rest, userType: rest.userType || 'household', profileComplete: isProfileComplete };
    res.json(userWithRole);
  });

  // Sync user profile to backend storage (from Firebase)
  // Called when a user completes their profile after signup
  app.post('/api/auth/profile', async (req, res) => {
    try {
      const { id, name, email, phone, address, userType, latitude, longitude } = req.body;
      
      console.log('📝 [/api/auth/profile] Syncing user profile:', { id, name, email, userType, latitude, longitude });
      
      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const userData = {
        id,
        name,
        email,
        phone,
        address,
        userType: userType || 'household',
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        password: 'firebase-auth', // Placeholder since auth is handled by Firebase
        profileComplete: true,
      };

      const user = await storage.createOrUpdateUser(id, userData);
      const { password, ...userWithoutPassword } = user;
      
      console.log('✅ [/api/auth/profile] User profile synced successfully:', userWithoutPassword);
      res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('❌ [/api/auth/profile] Error:', error);
      res.status(400).json({ message: error.message || 'Failed to sync profile' });
    }
  });

  // Debug endpoint: GET all registered junkshops (for troubleshooting)
  app.get("/api/debug/junkshops", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const junkshops = users.filter((u: any) => u.userType === "junkshop");
      console.log('🔍 [/api/debug/junkshops] Total users:', users.length, 'Junkshops:', junkshops.length);
      res.json({ 
        totalUsers: users.length,
        junkshops: junkshops.map(({ password, ...rest }: any) => rest)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch debug data" });
    }
  });

  // Update user (patch)
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updated = await storage.updateUser(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update user" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitized = users.map(({ password, ...rest }: any) => rest);
      res.json(sanitized);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...rest } = user;
      res.json(rest);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates: any = { ...req.body };
      if (updates.latitude !== undefined) updates.latitude = updates.latitude === null ? null : Number(updates.latitude);
      if (updates.longitude !== undefined) updates.longitude = updates.longitude === null ? null : Number(updates.longitude);
      const updated = await storage.updateUser(req.params.id, updates);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password, ...rest } = updated;
      res.json(rest);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update user" });
    }
  });

  // Items routes
  app.get("/api/items", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const sellerId = req.query.sellerId as string | undefined;

      // If a sellerId is provided, return only that seller's items (optionally filtered by category)
      if (sellerId) {
        let items = await storage.getItemsBySeller(sellerId);
        if (category) items = items.filter((i: any) => i.category === category);
        return res.json(items.map(normalizeItemUrls));
      }

      // Get all items, but filter to only include items from household sellers
      let items = await storage.getItems(category);
      
      // Filter items to only include those from household sellers
      const householdItems = [];
      for (const item of items) {
        const seller = await storage.getUser(item.sellerId);
        if (seller && seller.userType === "household") {
          householdItems.push(item);
        }
      }
      
      res.json(householdItems.map(normalizeItemUrls));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(normalizeItemUrls(item));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch item" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      // Support old-style single imageUrl field by converting it to array
      if (req.body.imageUrl && !req.body.imageUrls) {
        req.body.imageUrls = [req.body.imageUrl];
      }

      // Normalize imageUrls: accept either array of strings or array of { url }
      if (Array.isArray(req.body.imageUrls)) {
        req.body.imageUrls = req.body.imageUrls.map((it: any) => {
          if (!it) return it;
          if (typeof it === "string") return it;
          if (it.url) return it.url;
          return it;
        });
      }

      const itemData = insertItemSchema.parse(req.body);
      // Server-side guard: only household users may post items
      const seller = await storage.getUser(itemData.sellerId);
      if (!seller) return res.status(400).json({ message: "Seller not found" });
      if (seller.userType === "junkshop") {
        return res.status(403).json({ message: "Junkshop users are not allowed to post marketplace items" });
      }
      const item = await storage.createItem(itemData);
      res.status(201).json(normalizeItemUrls(item));
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create item" });
    }
  });

  // Upload endpoint for images (accepts base64 data URL)
  app.post("/api/upload", async (req, res) => {
    try {
      const { filename, data } = req.body;
      if (!filename || !data) return res.status(400).json({ message: "Missing filename or data" });

      const match = (data as string).match(/^data:(.+);base64,(.+)$/);
      if (!match) return res.status(400).json({ message: "Invalid data URL format" });

      const [, mimeType, base64Data] = match;
      const baseBuf = Buffer.from(base64Data, "base64");

      // Reject too-large uploads early with 413
      if (baseBuf.length > MAX_UPLOAD_BYTES) {
        return res.status(413).json({ message: `Uploaded image exceeds maximum allowed size of ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB` });
      }

      console.log('Upload request received:', {
        filename,
        mimeType,
        base64Length: base64Data.length,
        bufferSize: baseBuf.length
      });

      // Import Cloudinary storage
      const { CloudinaryStorage } = await import("./cloudinaryStorage");

      // Upload to Cloudinary
      const url = await CloudinaryStorage.uploadBase64Image(data as string, 'garbish-uploads');

      // Create thumbnail URL by modifying the Cloudinary URL
      const thumbUrl = url.replace('/upload/', '/upload/w_400,h_400,c_fill/');

      console.log('Upload successful:', { url });
      res.status(201).json({ url, thumbUrl });
    } catch (error: any) {
      console.error("Upload error:", {
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack
      });
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  });

  app.patch("/api/items/:id", async (req, res) => {
    try {
      const existing = await storage.getItem(req.params.id);
      if (!existing) return res.status(404).json({ message: "Item not found" });

      // Require owner/sellerId to match existing item
      const sellerId = req.body?.sellerId as string | undefined;
      if (!sellerId || sellerId !== existing.sellerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // If a new single imageUrl provided, convert to array for storage
      if (req.body.imageUrl && !req.body.imageUrls) {
        req.body.imageUrls = [req.body.imageUrl];
      }

      // Do not allow changing owner via update payload
      const updates: any = { ...req.body };
      delete updates.sellerId;

      const updated = await storage.updateItem(req.params.id, updates);
      res.json(normalizeItemUrls(updated));
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const existing = await storage.getItem(req.params.id);
      if (!existing) return res.status(404).json({ message: "Item not found" });

      const sellerId = req.body?.sellerId as string | undefined;
      if (!sellerId || sellerId !== existing.sellerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const deleted = await storage.deleteItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete item" });
    }
  });

  // Requests routes
  app.get("/api/requests", async (req, res) => {
    try {
      console.log("🔍 [GET /api/requests] Fetching requests...");
      const requests = await storage.getRequests();
      console.log(`✅ [GET /api/requests] Returning ${requests?.length || 0} requests`);
      if (requests) {
        console.log("📋 First request:", JSON.stringify(requests[0], null, 2));
      }
      res.json(requests);
    } catch (error: any) {
      console.error("❌ [GET /api/requests] Error:", error.message);
      res.status(500).json({ message: error.message || "Failed to fetch requests" });
    }
  });

  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch request" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const requestData = insertRequestSchema.parse(req.body);

      // Validate requester exists and is household
      const requester = await storage.getUser(requestData.requesterId);
      if (!requester) return res.status(400).json({ message: "Requester not found" });
      if (requester.userType !== "household") return res.status(403).json({ message: "Only household users can create collection requests" });

      // Ensure requester has at least one posted item
      const requesterItems = await storage.getItemsBySeller(requestData.requesterId);
      if (!requesterItems || requesterItems.length === 0) return res.status(400).json({ message: "You must post at least one recyclable item before creating a collection request" });

      // If responderId provided, ensure it's a junkshop
      if (requestData.responderId) {
        const responder = await storage.getUser(requestData.responderId);
        if (!responder) return res.status(400).json({ message: "Selected junkshop not found" });
        if (responder.userType !== "junkshop") return res.status(400).json({ message: "Responder must be a junkshop user" });
        requestData.responderName = responder.name;
      }

      const request = await storage.createRequest(requestData);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create request" });
    }
  });

  app.patch("/api/requests/:id", async (req, res) => {
    try {
      const existing = await storage.getRequest(req.params.id);
      if (!existing) return res.status(404).json({ message: "Request not found" });

      // Enforce status lifecycle and actor permissions. Expect `actorId` in body for authorization.
      const actorId = req.body.actorId as string | undefined;
      const newStatus = req.body.status as string | undefined;

      if (newStatus) {
        // Only allow junkshop responder to change status
        if (!actorId) return res.status(403).json({ message: "actorId required to change request status" });
        const actor = await storage.getUser(actorId);
        if (!actor) return res.status(403).json({ message: "Actor not found" });
        if (actor.userType !== "junkshop") return res.status(403).json({ message: "Only junkshop users can update request status" });
        if (existing.responderId && existing.responderId !== actorId) return res.status(403).json({ message: "Only the addressed junkshop may update this request" });

        const current = existing.status || "Pending";
        // Allowed transitions
        const allowed: Record<string, string[]> = {
          Pending: ["Accepted", "Declined"],
          Accepted: ["Completed"],
        };
        const possible = allowed[current] || [];
        if (!possible.includes(newStatus)) {
          return res.status(400).json({ message: `Invalid status transition from ${current} to ${newStatus}` });
        }

        // Apply update
        const updated = await storage.updateRequest(req.params.id, { ...req.body });
        if (!updated) return res.status(500).json({ message: "Failed to update request" });

        // When completed, increment analytics counters on both users (dev-only fields)
        if (newStatus === "Completed") {
          try {
            const responder = updated.responderId ? await storage.getUser(updated.responderId) : null;
            const requester = await storage.getUser(updated.requesterId);
            if (responder) {
              const rcount = (responder as any).collectionsCompleted || 0;
              await storage.updateUser(responder.id, { ...(responder as any), collectionsCompleted: rcount + 1 } as any);
            }
            if (requester) {
              const hcount = (requester as any).collectionsCompleted || 0;
              await storage.updateUser(requester.id, { ...(requester as any), collectionsCompleted: hcount + 1 } as any);
            }
          } catch (e) {
            console.warn("Failed to increment collection analytics", e);
          }
        }

        return res.json(updated);
      }

      // Other updates: disallow household-driven status changes; allow safe partial updates
      const updated = await storage.updateRequest(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Request not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update request" });
    }
  });

  app.delete("/api/requests/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete request" });
    }
  });

  // Messages routes
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      // Ensure timestamps are serialized as ISO strings
      const serializedMessages = messages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
      }));
      res.json(serializedMessages);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/user/:userId", async (req, res) => {
    try {
      const messages = await storage.getMessagesByUser(req.params.userId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      console.log("Message request body:", req.body);
      const messageData = insertMessageSchema.parse(req.body);
      console.log("Parsed message data:", messageData);
      const message = await storage.createMessage(messageData);
      // Ensure timestamp is serialized as ISO string
      const serializedMessage = {
        ...message,
        timestamp: message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString(),
      };
      res.status(201).json(serializedMessage);
    } catch (error: any) {
      console.error("Message error:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const updated = await storage.markMessageAsRead(req.params.id);
      if (!updated) {
        return res.status(404).json({ message: "Message not found" });
      }
      // Ensure timestamp is serialized as ISO string
      const serializedMessage = {
        ...updated,
        timestamp: updated.timestamp ? new Date(updated.timestamp).toISOString() : new Date().toISOString(),
      };
      res.json(serializedMessage);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update message" });
    }
  });

  // Chatbot routes
  app.get("/api/chatbot/:userId", async (req, res) => {
    try {
      // prevent HTTP caching/304 so clients always get the latest conversation
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      const conversations = await storage.getChatbotConversation(req.params.userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch chatbot history" });
    }
  });

  app.delete("/api/chatbot/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteChatbotConversation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json({ message: "Conversation deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete conversation" });
    }
  });

  app.delete("/api/chatbot/user/:userId", async (req, res) => {
    try {
      const deleted = await storage.deleteAllChatbotConversations(req.params.userId);
      if (!deleted) {
        return res.status(404).json({ message: "No conversations found for user" });
      }
      res.json({ message: "All conversations deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete conversations" });
    }
  });

  // Fallback responses for chatbot (used when the AI service is not configured or fails)
  function getSmartFallbackResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();

    // Helper to make a friendly paragraph and optional quick link
    const paragraph = (text: string, quickLink?: string) => {
      return quickLink ? `${text}\n\nQuick link: ${quickLink}` : text;
    };

    if (
      message.includes("rate") ||
      message.includes("price") ||
      message.includes("cost")
    ) {
      return PRICE_RESPONSE;
    }

    if (
      message.includes("marketplace") ||
      message.includes("sell") ||
      message.includes("list") ||
      message.includes("add item")
    ) {
      return "📦 **How to List an Item on Marketplace:**\n\n1. Go to Marketplace → Click 'Add Item'\n2. Fill in:\n   • Item title (e.g., 'Plastic Bottles 50pcs')\n   • Category (Plastic, Paper, Metal, Glass, etc.)\n   • Price in ₱\n   • Description (optional)\n3. Click 'Add Item'\n4. Your item appears instantly!\n\nTip: Clean, well-described items sell faster! ✨";
    }

    if (message.includes("collection") || message.includes("request")) {
      return "📋 **How to Create a Collection Request:**\n\n1. Go to Dashboard → Requests tab\n2. Click 'Create Request'\n3. Describe the items you want collected\n4. Enter your address in Baguio\n5. Select preferred pickup date\n6. Submit the request\n7. Junkshops will review and contact you to confirm! ✓\n\nTip: Be specific about items (e.g., '50 plastic bottles, newspapers') for faster responses.";
    }

    if (message.includes("contact") || message.includes("chat") || message.includes("message")) {
      return "💬 **How to Message Someone:**\n\n**From Marketplace:**\n1. Find an item you're interested in\n2. Click 'Contact Seller'\n3. Start chatting!\n\n**From Messages Tab:**\n1. Click Messages in dashboard\n2. Select a conversation or start new\n3. Type and send\n\nTip: Be clear about quantity, condition, and pickup time for smooth deals! 🤝";
    }

    if (message.includes("recycle") || message.includes("eco") || message.includes("green")) {
      return "♻️ **Why Recycle with Waiz?**\n\n✓ Reduces landfill waste\n✓ Conserves natural resources\n✓ Supports sustainability\n✓ Earns you money!\n\n**Pro Tips:**\n• Sort materials by type\n• Clean items before collection\n• Bundle similar items\n• Accurate descriptions = better prices\n\nEvery item recycled makes a difference! 🌱";
    }

    if (message.includes("household") || message.includes("junkshop") || message.includes("user type")) {
      return "👥 **User Types on Waiz:**\n\n🏠 **Household:**\n• Browse marketplace items\n• Create collection requests\n• List recyclables for sale\n• Message junkshops\n\n🏪 **Junkshop:**\n• List recyclable items\n• Browse collection requests\n• Respond to requests\n• Set competitive prices\n• Message households\n\nBoth types can buy AND sell!";
    }

    if (message.includes("image") || message.includes("photo") || message.includes("upload") || message.includes("picture")) {
      return "📸 **Adding Photos to Listings:**\n\n• You can upload up to 5 photos per item\n• Supported formats: JPG, PNG, WebP\n• Show items clearly with good lighting\n• Include multiple angles if possible\n• Clear photos get more buyer interest!\n\nTip: If upload fails, check file size (max 30MB) and refresh the page.";
    }

    if ((message.includes("what") && message.includes("waiz")) || message.includes("about waiz") || message.includes("what's waiz")) {
      return "Hi, I'm Garbish, the WAIZ recycling assistant. I can help with questions about recycling, eco-friendly practices, and how to use the WAIZ marketplace. Please ask something related to recycling or the WAIZ platform.";
    }

    if ((message.includes("how") && message.includes("waiz")) || message.includes("how to use waiz") || message.includes("getting started")) {
      if (message.includes("waiz")) {
        return "📚 **Getting Started with WAIZ:**\n1. Sign up as Household or Junkshop\n2. Complete your profile with address & contact info\n3. Browse marketplace or create listings\n4. For pickups: Create a collection request\n5. Connect with other users via messaging\n6. Complete transactions safely!\nNeed help with a specific feature? Just ask!";
      }
    }

    if (message.includes("waiz") && (message.includes("feature") || message.includes("can i") || message.includes("features"))) {
      return "✨ **WAIZ Features:**\n📦 **Marketplace** - Buy/sell recyclables with photos & descriptions\n📋 **Collection Requests** - Request pickups from junkshops\n💬 **Messaging** - Chat with buyers/sellers\n💰 **Rates** - View current recycling prices\n👤 **Profile** - Manage your account & listings\n🗺️ **Junkshop Locator** - Find nearby junkshops\nWhich feature would you like to learn more about?";
    }

    if (message.includes("how") || message.includes("help") || message.includes("feature") || message.includes("guide")) {
      return "🤖 **I can help you with:**\n\n📊 Market rates & pricing\n📦 Listing & selling items\n📋 Creating collection requests\n💬 Messaging & contacting sellers\n🌍 Recycling tips & eco-tips\n👥 Understanding user types\n📸 Uploading photos\n❓ General Waiz features\n\nWhat would you like to know? 😊";
    }

    // Fallback friendly greeting
    return "Hi, I’m Garbish, your WAIZ recycling assistant. I’m sorry, I can’t answer that question, but I can help with recycling, eco-friendly tips, and anything related to the WAIZ marketplace.";
  }


  app.post("/api/chatbot/chat", async (req, res) => {
    const { userId, message: userMessage } = req.body;

    try {
      await storage.createChatbotConversation({
        userId,
        role: "user",
        content: userMessage,
      });
    } catch (e: any) {
      console.warn("Failed to store user chatbot message", e);
    }

    try {
      let assistantMessage: string;

      if (aiClient) {
        console.log("Using GarbishAI helper for chatbot response");
        try {
          const { answer } = await askGarbishChatbot({
            question: userMessage,
            context: JSON.stringify({}),
          });
          assistantMessage = answer || getSmartFallbackResponse(userMessage);
        } catch (err) {
          console.warn("GarbishAI helper error, falling back to direct Genkit call", err);
          const gen = await callGenkitAPI(userMessage);
          assistantMessage = gen || getSmartFallbackResponse(userMessage);
        }
      } else {
        console.log("Genkit AI not configured — responding with generic apology");
        assistantMessage = "Hi. Sorry, I don’t have an answer to that.";
      }

      res.json({ message: assistantMessage });

      try {
        await storage.createChatbotConversation({
          userId,
          role: "assistant",
          content: assistantMessage,
        });
      } catch (e: any) {
        console.warn("Failed to store assistant chatbot message", e);
      }

      console.log("Chatbot response sent:", { userId, userMessage, assistantMessage });
    } catch (error: any) {
      console.error("Chatbot error inside try:", error);
      res.json({ message: getSmartFallbackResponse(userMessage) });
    }
  });

  // Rates routes
  app.get("/api/rates", async (req, res) => {
    try {
      const sellerId = typeof req.query.sellerId === "string" ? req.query.sellerId : undefined;
      console.log("🔍 [GET /api/rates] Fetching rates...", sellerId ? `for seller: ${sellerId}` : "all");
      const rates = await storage.getRates(sellerId);
      console.log(`✅ [GET /api/rates] Returning ${rates?.length || 0} rates`);
      if (rates && rates.length > 0) {
        console.log("💰 First rate:", JSON.stringify(rates[0], null, 2));
      }
      res.json(rates);
    } catch (error: any) {
      console.error("❌ [GET /api/rates] Error:", error.message);
      res.status(500).json({ message: error.message || "Failed to fetch rates" });
    }
  });

  // List junkshops with their rate lists
  app.get("/api/junkshops", async (req, res) => {
    try {
      const q = (req.query.q as string | undefined) || undefined;
      const users = await storage.getAllUsers();
      let shops = users.filter((u: any) => u.userType === "junkshop");
      if (q) {
        const qLower = q.toLowerCase();
        shops = shops.filter((s: any) => s.name.toLowerCase().includes(qLower) || s.address.toLowerCase().includes(qLower));
      }
      const results = await Promise.all(shops.map(async (s: any) => {
        const rates = await storage.getRates(s.id);
        return { ...s, rates };
      }));
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch junkshops" });
    }
  });

  app.post("/api/rates", async (req, res) => {
    try {
      const rateData = insertRateSchema.parse(req.body);
      const rate = await storage.createRate(rateData);
      res.status(201).json(rate);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create rate" });
    }
  });

  app.patch("/api/rates/:id", async (req, res) => {
    try {
      const updated = await storage.updateRate(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Rate not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update rate" });
    }
  });

  app.delete("/api/rates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRate(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Rate not found" });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete rate" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
