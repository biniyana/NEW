import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertItemSchema, insertRequestSchema, insertMessageSchema, insertChatbotConversationSchema } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  // Chatbot routes
  app.get("/api/chatbot/:userId", async (req, res) => {
    try {
      const conversations = await storage.getChatbotConversation(req.params.userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch chatbot history" });
    }
  });

  // Fallback responses for when OpenAI is unavailable
  function getSmartFallbackResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes("rate") || message.includes("price")) {
      return "📊 Here are our current market rates:\n\n• Plastic Bottles: ₱3 per piece\n• Newspapers: ₱8 per kilo\n• Aluminum Cans: ₱4 per piece\n• Glass Bottles: ₱2 per piece\n• Cardboard: ₱6 per kilo\n• Copper Wire: ₱350 per kilo\n• Steel/Iron: ₱15 per kilo\n\nPrices may vary by quality and quantity. Check the Rate List page for more details!";
    }
    
    if (message.includes("sell") || message.includes("list")) {
      return "🏪 To sell recyclables on Waiz:\n\n1. Go to Browse Items → Add Item\n2. Fill in title, category, price\n3. Add description (optional)\n4. Click Add Item\n5. Buyers will contact you for purchase!\n\nMake sure your items are clean and properly described.";
    }
    
    if (message.includes("collection") || message.includes("request")) {
      return "📦 To create a collection request:\n\n1. Go to My Requests section\n2. Click Create Request\n3. Describe your items\n4. Provide your address\n5. Set preferred date\n6. Submit!\n\nJunkshops will review and contact you if interested.";
    }
    
    if (message.includes("contact") || message.includes("chat") || message.includes("message")) {
      return "💬 To contact a seller:\n\n1. Browse the Marketplace\n2. Find an item you want\n3. Click 'Contact Seller'\n4. Start your conversation\n5. Discuss details and arrange pickup\n\nAlways be respectful and clear about your needs!";
    }
    
    if (message.includes("recycle") || message.includes("eco") || message.includes("green")) {
      return "♻️ Waiz promotes eco-friendly practices!\n\nWhy recycle?\n• Reduces landfill waste\n• Saves natural resources\n• Supports sustainability\n• Earns you money!\n\nWe connect households with junkshops to make recycling easy and rewarding.";
    }
    
    if (message.includes("household") || message.includes("junkshop")) {
      return "👥 Waiz has two user types:\n\n🏠 **Household**: \n- Browse and buy recyclables\n- Create collection requests\n- Sell your own recyclables\n\n🏪 **Junkshop**:\n- List recyclable items\n- Respond to collection requests\n- Build your customer base\n\nWhichever you are, you can buy and sell!";
    }
    
    if (message.includes("how") || message.includes("help") || message.includes("feature")) {
      return "🤔 Popular features:\n\n📊 **Rate List** - Current market prices\n📦 **Marketplace** - Browse available items\n📝 **Requests** - Create/manage collection requests\n💬 **Messages** - Chat with buyers/sellers\n👤 **Profile** - Manage your account\n\nWhat else can I help with?";
    }
    
    return "👋 Hi! I'm Jarvish, your Waiz assistant!\n\nI can help with:\n• Market rates and pricing\n• How to sell or buy items\n• Collection requests\n• How to use Waiz features\n• Recycling tips\n\nWhat would you like to know?";
  }

  app.post("/api/chatbot/chat", async (req, res) => {
    try {
      const { userId, message: userMessage } = req.body;

      // Save user message
      await storage.createChatbotConversation({
        userId,
        role: "user",
        content: userMessage,
      });

      // Get conversation history for context - the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const history = await storage.getChatbotConversation(userId);

      let assistantMessage: string;

      try {
        // Build conversation messages for OpenAI
        const messages: any[] = [
          {
            role: "system",
            content: "You are Jarvish, a helpful eco-friendly marketplace assistant for Waiz. You help users with questions about recycling, selling recyclables, collection requests, and the Waiz platform. Be friendly, knowledgeable about eco-friendly practices, and focused on helping users make sustainable choices.",
          },
        ];

        // Add conversation history
        history.forEach((conv) => {
          messages.push({
            role: conv.role,
            content: conv.content,
          });
        });

        // Get AI response
        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages,
          max_completion_tokens: 500,
        });

        assistantMessage = response.choices[0].message.content || getSmartFallbackResponse(userMessage);
      } catch (openaiError: any) {
        console.error("OpenAI error:", openaiError.message);
        // Use smart fallback response instead of failing
        assistantMessage = getSmartFallbackResponse(userMessage);
      }

      // Save assistant message
      await storage.createChatbotConversation({
        userId,
        role: "assistant",
        content: assistantMessage,
      });

      res.json({ message: assistantMessage });
    } catch (error: any) {
      console.error("Chatbot error:", error);
      res.status(400).json({ message: error.message || "Failed to process chatbot message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
