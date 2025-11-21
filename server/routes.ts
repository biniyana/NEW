import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertItemSchema, insertRequestSchema, insertMessageSchema } from "@shared/schema";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
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
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Items routes
  app.get("/api/items", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const items = await storage.getItems(category);
      res.json(items);
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
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch item" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create item" });
    }
  });

  app.patch("/api/items/:id", async (req, res) => {
    try {
      const updated = await storage.updateItem(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
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
      const requests = await storage.getRequests();
      res.json(requests);
    } catch (error: any) {
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
      const request = await storage.createRequest(requestData);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create request" });
    }
  });

  app.patch("/api/requests/:id", async (req, res) => {
    try {
      const updated = await storage.updateRequest(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Request not found" });
      }
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
      const serializedMessages = messages.map(msg => ({
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
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      // Ensure timestamp is serialized as ISO string
      const serializedMessage = {
        ...message,
        timestamp: message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString(),
      };
      res.status(201).json(serializedMessage);
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
