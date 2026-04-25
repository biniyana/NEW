import {
  type User,
  type InsertUser,
  type Item,
  type InsertItem,
  type Request,
  type InsertRequest,
  type Message,
  type InsertMessage,
  type ChatbotConversation,
  type InsertChatbotConversation,
  type Rate,
  type InsertRate,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { FirebaseStorage } from "./firebaseStorage";
import { promises as fs } from "fs";
import path from "path";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOrUpdateUser(id: string, data: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Items
  getItem(id: string): Promise<Item | undefined>;
  getItems(category?: string): Promise<Item[]>;
  getItemsBySeller(sellerId: string): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;

  // Requests
  getRequest(id: string): Promise<Request | undefined>;
  getRequests(): Promise<Request[]>;
  getRequestsByRequester(requesterId: string): Promise<Request[]>;
  getRequestsByResponder(responderId: string): Promise<Request[]>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: string, updates: Partial<Request>): Promise<Request | undefined>;
  deleteRequest(id: string): Promise<boolean>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessages(): Promise<Message[]>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;

  // Chatbot conversations
  getChatbotConversation(userId: string): Promise<ChatbotConversation[]>;
  createChatbotConversation(conv: InsertChatbotConversation): Promise<ChatbotConversation>;
  deleteChatbotConversation(id: string): Promise<boolean>;
  deleteAllChatbotConversations(userId: string): Promise<boolean>;

  // Rates
  getRates(sellerId?: string): Promise<Rate[]>;
  createRate(rate: InsertRate): Promise<Rate>;
  updateRate(id: string, updates: Partial<Rate>): Promise<Rate | undefined>;
  deleteRate(id: string): Promise<boolean>;

  // Optional seed data method
  seedData?(): void;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private items: Map<string, Item>;
  private requests: Map<string, Request>;
  private messages: Map<string, Message>;
  private chatbotConversations: Map<string, ChatbotConversation[]>;
  private rates: Map<string, Rate>;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.requests = new Map();
    this.messages = new Map();
    this.chatbotConversations = new Map();
    this.rates = new Map();

    // Seed some initial data for testing.
    // Disabled by default to prevent demo data in development/production runs.
    // To enable seeding set the environment variable `SEED_DATA=true`.
    if (process.env.SEED_DATA === "true") {
      this.seedData();
      console.log("✅ Seed data added: use emails maria@example.com, juan@example.com, caniezojunkshop@gmail.com, greenvalley@example.com with password 'password123'");
    }

    // Optional on-disk persistence for MemStorage (dev convenience).
    // Enable by setting `PERSIST_MEM_STORAGE=true`.
    if (process.env.PERSIST_MEM_STORAGE === "true") {
      // Initialize persistence asynchronously to avoid using `await` in constructor
      void (async () => {
        try {
          const dataDir = path.resolve(process.cwd(), "data");
          await fs.mkdir(dataDir, { recursive: true });
          this._persistPath = path.join(dataDir, "memstorage.json");
          await this._loadFromDisk();
          // autosave every 5 seconds
          this._persistInterval = setInterval(() => void this._saveToDisk(), 5000);
          // save on exit
          const saveAndExit = async () => {
            await this._saveToDisk();
            process.exit();
          };
          process.on("SIGINT", saveAndExit);
          process.on("exit", () => { void this._saveToDisk(); });
        } catch (e) {
          console.warn("MemStorage persistence init failed:", e);
        }
      })();
    }
  }

  // persistence helpers (optional)
  private _persistPath: string | null = null;
  private _persistInterval: NodeJS.Timeout | null = null;

  private async _loadFromDisk(): Promise<void> {
    if (!this._persistPath) return;
    try {
      const raw = await fs.readFile(this._persistPath, "utf-8");
      const obj = JSON.parse(raw);
      if (obj.users) obj.users.forEach((u: any) => this.users.set(u.id, u));
      if (obj.items) obj.items.forEach((i: any) => this.items.set(i.id, i));
      if (obj.requests) obj.requests.forEach((r: any) => this.requests.set(r.id, r));
      if (obj.messages) obj.messages.forEach((m: any) => this.messages.set(m.id, m));
      if (obj.chatbotConversations) Object.entries(obj.chatbotConversations).forEach(([k, v]: any) => this.chatbotConversations.set(k, v));
      if (obj.rates) obj.rates.forEach((r: any) => this.rates.set(r.id, r));
    } catch (e) {
      // file may not exist yet - that's fine
    }
  }

  private async _saveToDisk(): Promise<void> {
    if (!this._persistPath) return;
    try {
      const obj: any = {
        users: Array.from(this.users.values()),
        items: Array.from(this.items.values()),
        requests: Array.from(this.requests.values()),
        messages: Array.from(this.messages.values()),
        chatbotConversations: Object.fromEntries(this.chatbotConversations.entries()),
        rates: Array.from(this.rates.values()),
      };
      await fs.writeFile(this._persistPath, JSON.stringify(obj, null, 2), "utf-8");
    } catch (e) {
      console.warn("Failed to save MemStorage to disk:", e);
    }
  }

  seedData(): void {
    // ============================================
    // HOUSEHOLD ACCOUNTS
    // ============================================
    const household1: User = {
      id: "household-1",
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "+63 917 123 4567",
      address: "123 Session Road, Baguio City",
      password: "password123",
      userType: "household",
      latitude: null,
      longitude: null,
      createdAt: new Date(),
    };
    this.users.set(household1.id, household1);

    const household2: User = {
      id: "household-2",
      name: "Juan Dela Cruz",
      email: "juan@example.com",
      phone: "+63 917 987 6543",
      address: "456 Eco Park Road, Baguio City",
      password: "password123",
      userType: "household",
      latitude: null,
      longitude: null,
      createdAt: new Date(),
    };
    this.users.set(household2.id, household2);

    // ============================================
    // ADMIN ACCOUNT
    // ============================================
    const adminUser: User = {
      id: "admin-1",
      name: "System Admin",
      email: "admin@example.com",
      phone: "+63 917 000 0000",
      address: "Baguio City",
      password: "admin123",
      userType: "admin",
      latitude: null,
      longitude: null,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // ============================================
    // JUNKSHOP ACCOUNTS
    // ============================================
    const junkshop1: User = {
      id: "junkshop-1",
      name: "Caniezo Junkshop",
      email: "caniezojunkshop@gmail.com",
      phone: "+63 917 765 4321",
      address: "456 Burnham Park Area, Baguio City",
      password: "password123",
      userType: "junkshop",
      latitude: "16.4023",
      longitude: "120.5960",
      createdAt: new Date(),
    };
    this.users.set(junkshop1.id, junkshop1);

    const junkshop2: User = {
      id: "junkshop-2",
      name: "Green Valley Recycling",
      email: "greenvalley@example.com",
      phone: "+63 917 555 9999",
      address: "789 Camp John Hay, Baguio City",
      password: "password123",
      userType: "junkshop",
      latitude: "16.3920",
      longitude: "120.5631",
      createdAt: new Date(),
    };
    this.users.set(junkshop2.id, junkshop2);

    // ============================================
    // MARKETPLACE ITEMS (Household only - junkshops do not post items)
    // ============================================
    const items: Item[] = [
      // Household 1 items for sale
      {
        id: "item-1",
        title: "Used Glass Bottles (20pcs)",
        category: "Glass",
        price: "₱40",
        description: "Clean glass bottles, mostly liquor bottles",
        imageUrl: null,
        imageUrls: null,
        emoji: "🍷",
        sellerId: household1.id,
        sellerName: household1.name,
        status: "available",
        createdAt: new Date(),
      },
      {
        id: "item-2",
        title: "Cardboard Boxes Bundle",
        category: "Cardboard",
        price: "₱25",
        description: "Flattened cardboard boxes from deliveries",
        imageUrl: null,
        imageUrls: null,
        emoji: "📦",
        sellerId: household1.id,
        sellerName: household1.name,
        status: "available",
        createdAt: new Date(),
      },
      {
        id: "item-3",
        title: "Mixed Plastic Containers (15pcs)",
        category: "Plastic",
        price: "₱35",
        description: "Clean plastic food containers",
        imageUrl: null,
        imageUrls: null,
        emoji: "🍾",
        sellerId: household1.id,
        sellerName: household1.name,
        status: "available",
        createdAt: new Date(),
      },
      // Household 2 items for sale
      {
        id: "item-4",
        title: "Old Magazines (30pcs)",
        category: "Paper",
        price: "₱50",
        description: "Fashion and lifestyle magazines, all clean",
        imageUrl: null,
        imageUrls: null,
        emoji: "📰",
        sellerId: household2.id,
        sellerName: household2.name,
        status: "available",
        createdAt: new Date(),
      },
      {
        id: "item-5",
        title: "Plastic Bags (100pcs)",
        category: "Plastic",
        price: "₱20",
        description: "Clean, reusable plastic bags from groceries",
        imageUrl: null,
        imageUrls: null,
        emoji: "♻️",
        sellerId: household2.id,
        sellerName: household2.name,
        status: "available",
        createdAt: new Date(),
      },
    ];
    items.forEach((item) => this.items.set(item.id, item));

    // ============================================
    // COLLECTION REQUESTS
    // ============================================
    const requests = [
      {
        id: "request-1",
        type: "Collection",
        items: "Mixed recyclables - plastic bottles, newspapers, cardboard",
        status: "Pending",
        address: household1.address,
        requesterId: household1.id,
        requesterName: household1.name,
        responderId: null,
        responderName: null,
        date: new Date().toISOString().split("T")[0],
        time: "14:00",
        createdAt: new Date(),
      },
      {
        id: "request-2",
        type: "Collection",
        items: "Aluminum cans and glass bottles",
        status: "Completed",
        address: household1.address,
        requesterId: household1.id,
        requesterName: household1.name,
        responderId: junkshop1.id,
        responderName: junkshop1.name,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        time: "10:30",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: "request-3",
        type: "Collection",
        items: "Magazines and old books (approx 20kg)",
        status: "Accepted",
        address: household2.address,
        requesterId: household2.id,
        requesterName: household2.name,
        responderId: junkshop2.id,
        responderName: junkshop2.name,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        time: "09:00",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ] as unknown as Request[];
    requests.forEach((req) => this.requests.set(req.id, req as any));

    // ============================================
    // MESSAGES
    // ============================================
    const messages: Message[] = [
      {
        id: "msg-1",
        senderId: household1.id,
        senderName: household1.name,
        receiverId: junkshop1.id,
        receiverName: junkshop1.name,
        content: "Hi! I have some plastic bottles for collection. Are you available this week?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: "true",
      },
      {
        id: "msg-2",
        senderId: junkshop1.id,
        senderName: junkshop1.name,
        receiverId: household1.id,
        receiverName: household1.name,
        content: "Yes, we can collect this Friday afternoon. What's the approximate quantity?",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: "false",
      },
      {
        id: "msg-3",
        senderId: household2.id,
        senderName: household2.name,
        receiverId: junkshop2.id,
        receiverName: junkshop2.name,
        content: "Good morning! I have old magazines and newspapers to recycle. What's your rate per kilo?",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: "true",
      },
      {
        id: "msg-4",
        senderId: junkshop2.id,
        senderName: junkshop2.name,
        receiverId: household2.id,
        receiverName: household2.name,
        content: "We pay ₱4 per kilo for newspapers, ₱3 for magazines. We can arrange pickup next Tuesday.",
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: "false",
      },
    ];
    messages.forEach((msg) => this.messages.set(msg.id, msg));

    // ============================================
    // MARKET RATES
    // ============================================
    const rates: Rate[] = [
      { id: randomUUID(), material: "White Paper (used)", price: "₱8.00 per kilo", unit: "kg", icon: "📄", category: "Paper", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Cartons (Corrugated/Brown)", price: "₱2.50 per kilo", unit: "kg", icon: "📦", category: "Paper", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Assorted/Mixed Paper", price: "₱1.50 per kilo", unit: "kg", icon: "📰", category: "Paper", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Newspaper", price: "₱4.00 per kilo", unit: "kg", icon: "📰", category: "Paper", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "PET Bottle (Clean)", price: "₱16.00 per kilo", unit: "kg", icon: "🍾", category: "Plastic", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "PET Bottle (Unclean)", price: "₱12.00 per kilo", unit: "kg", icon: "🍾", category: "Plastic", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Aluminum Cans", price: "₱50.00 per kilo", unit: "kg", icon: "🥫", category: "Metal", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Plastic HDPE", price: "₱10.00 per kilo", unit: "kg", icon: "♻️", category: "Plastic", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Plastic LDPE", price: "₱5.00 per kilo", unit: "kg", icon: "♻️", category: "Plastic", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Copper Wire (Class A)", price: "₱300.00 per kilo", unit: "kg", icon: "🔌", category: "Metal", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Copper Wire (Class B)", price: "₱250.00 per kilo", unit: "kg", icon: "🔌", category: "Metal", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Steel/Iron Alloys", price: "₱9.00 per kilo", unit: "kg", icon: "⚙️", category: "Metal", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Stainless Steel", price: "₱60.00 per kilo", unit: "kg", icon: "⚙️", category: "Metal", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Tin Can (Lata)", price: "₱7.00 per kilo", unit: "kg", icon: "🥫", category: "Metal", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Glass Cullets", price: "₱1.00 per kilo", unit: "kg", icon: "🍷", category: "Glass", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Old Diskette", price: "₱8.00 each", unit: "each", icon: "💿", category: "Electronics", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Ink Jet Cartridge", price: "₱100-300 each", unit: "each", icon: "🖨️", category: "Electronics", createdAt: new Date(), sellerId: null },
      { id: randomUUID(), material: "Car Battery", price: "₱100.00 each", unit: "each", icon: "🔋", category: "Hazardous", createdAt: new Date(), sellerId: null },
      // Seller specific example rates
      { id: randomUUID(), material: "PET Bottle (Clean)", price: "₱18.00 per kilo", unit: "kg", icon: "🍾", category: "Plastic", createdAt: new Date(), sellerId: "junkshop-1" },
      { id: randomUUID(), material: "Aluminum Cans", price: "₱55.00 per kilo", unit: "kg", icon: "🥫", category: "Metal", createdAt: new Date(), sellerId: "junkshop-1" },
    ];
    rates.forEach((rate) => this.rates.set(rate.id, rate));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // perform case-insensitive compare and trim extra spaces
    const target = email.trim().toLowerCase();
    return Array.from(this.users.values()).find((user) =>
      typeof user.email === 'string' && user.email.trim().toLowerCase() === target
    );
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const target = phone.trim();
    return Array.from(this.users.values()).find((user) =>
      typeof user.phone === 'string' && user.phone.trim() === target
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const parseCoord = (v: any) => (v === undefined || v === null ? null : String(Number(v)));
    const user: User = {
      ...insertUser,
      id,
      latitude: parseCoord(insertUser.latitude),
      longitude: parseCoord(insertUser.longitude),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createOrUpdateUser(id: string, data: Partial<User>): Promise<User> {
    const parseCoord = (v: any) => (v === undefined || v === null ? null : String(Number(v)));
    const existingUser = this.users.get(id);
    
    if (existingUser) {
      // Update existing user
      const updated: User = {
        ...existingUser,
        ...data,
        id, // Ensure ID doesn't change
        latitude: data.latitude !== undefined ? parseCoord(data.latitude) : existingUser.latitude,
        longitude: data.longitude !== undefined ? parseCoord(data.longitude) : existingUser.longitude,
      };
      this.users.set(id, updated);
      return updated;
    } else {
      // Create new user with specified ID
      const user: User = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        password: data.password || "",
        userType: data.userType || "household",
        id,
        latitude: parseCoord(data.latitude),
        longitude: parseCoord(data.longitude),
        createdAt: new Date(),
      };
      this.users.set(id, user);
      return user;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const parseCoord = (v: any) => (v === undefined || v === null ? null : String(Number(v)));
    const updated: User = {
      ...user,
      ...updates,
      latitude: updates.latitude !== undefined ? parseCoord((updates as any).latitude) : user.latitude,
      longitude: updates.longitude !== undefined ? parseCoord((updates as any).longitude) : user.longitude,
    };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Items
  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getItems(category?: string): Promise<Item[]> {
    const items = Array.from(this.items.values());
    if (category) {
      return items.filter((item) => item.category === category);
    }
    return items;
  }

  async getItemsBySeller(sellerId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.sellerId === sellerId
    );
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const imageUrlsStr = insertItem.imageUrls ? JSON.stringify(insertItem.imageUrls) : null;
    const item: Item = {
      ...insertItem,
      id,
      status: insertItem.status || "available",
      emoji: insertItem.emoji || "📦",
      imageUrl: insertItem.imageUrl || null,
      // store imageUrls as JSON string to match table (text)
      imageUrls: imageUrlsStr,
      description: insertItem.description ?? null,
      createdAt: new Date(),
    } as unknown as Item;
    this.items.set(id, item as Item);
    return item as Item;
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    const updated = { ...item, ...updates };
    this.items.set(id, updated);
    return updated;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  // Requests
  async getRequest(id: string): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async getRequests(): Promise<Request[]> {
    return Array.from(this.requests.values());
  }

  async getRequestsByRequester(requesterId: string): Promise<Request[]> {
    return Array.from(this.requests.values()).filter(
      (req) => req.requesterId === requesterId
    );
  }

  async getRequestsByResponder(responderId: string): Promise<Request[]> {
    return Array.from(this.requests.values()).filter(
      (req) => req.responderId === responderId
    );
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = randomUUID();
    const request: Request = {
      ...insertRequest,
      id,
      status: insertRequest.status || "Pending",
      responderId: insertRequest.responderId || null,
      responderName: insertRequest.responderName || null,
      // Ensure `time` is always present (Request.time is string | null)
      time: (insertRequest as any).time ?? null,
      createdAt: new Date(),
    };
    this.requests.set(id, request);
    return request;
  }

  async updateRequest(id: string, updates: Partial<Request>): Promise<Request | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;
    const updated = { ...request, ...updates };
    this.requests.set(id, updated);
    return updated;
  }

  async deleteRequest(id: string): Promise<boolean> {
    return this.requests.delete(id);
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (msg) => msg.senderId === userId || msg.receiverId === userId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      read: "false",
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    const updated = { ...message, read: "true" };
    this.messages.set(id, updated);
    return updated;
  }

  // Chatbot conversations
  async getChatbotConversation(userId: string): Promise<ChatbotConversation[]> {
    return this.chatbotConversations.get(userId) || [];
  }

  async createChatbotConversation(conv: InsertChatbotConversation): Promise<ChatbotConversation> {
    const id = randomUUID();
    const conversation: ChatbotConversation = {
      ...conv,
      id,
      timestamp: new Date(),
    };
    const existing = this.chatbotConversations.get(conv.userId) || [];
    existing.push(conversation);
    this.chatbotConversations.set(conv.userId, existing);
    return conversation;
  }

  async deleteChatbotConversation(id: string): Promise<boolean> {
    for (const [userId, conversations] of this.chatbotConversations) {
      const index = conversations.findIndex(conv => conv.id === id);
      if (index !== -1) {
        conversations.splice(index, 1);
        this.chatbotConversations.set(userId, conversations);
        return true;
      }
    }
    return false;
  }

  async deleteAllChatbotConversations(userId: string): Promise<boolean> {
    this.chatbotConversations.delete(userId);
    return true;
  }

  // Rates
  async getRates(sellerId?: string): Promise<Rate[]> {
    const all = Array.from(this.rates.values());
    if (!sellerId) return all;
    return all.filter(r => (r as any).sellerId === sellerId);
  }

  async createRate(insertRate: InsertRate): Promise<Rate> {
    const id = randomUUID();
    const rate: Rate = {
      ...insertRate,
      id,
      createdAt: new Date(),
    } as Rate;
    this.rates.set(id, rate);
    return rate;
  }

  async deleteRate(id: string): Promise<boolean> {
    return this.rates.delete(id);
  }

  async updateRate(id: string, updates: Partial<Rate>): Promise<Rate | undefined> {
    const rate = this.rates.get(id);
    if (!rate) return undefined;
    const updated = { ...rate, ...updates };
    this.rates.set(id, updated);
    return updated;
  }
}

// Use MemStorage for development (Firebase not set up)
let storageInstance: IStorage;
let storageFallback: MemStorage | null = null;

// helper that switches the exported storage to an in-memory instance
function fallbackToMemory(reason?: any) {
  if (!storageFallback) {
    console.warn("Switching to in-memory storage due to Firebase error", reason);
    storageFallback = new MemStorage();
  }
  storage = storageFallback;
  return storageFallback;
}

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    storageInstance = new FirebaseStorage();
    console.log("✅ Using FirebaseStorage for persistence");
  } catch (e) {
    console.warn("⚠️ Failed to initialize FirebaseStorage, falling back to MemStorage:", e);
    storageInstance = new MemStorage();
  }
} else {
  console.warn("⚠️ Firebase service account key not found. Using in-memory storage.");
  storageInstance = new MemStorage();
}

export let storage: IStorage = storageInstance;

// export helper so other modules could trigger fallback if needed
export { fallbackToMemory };
