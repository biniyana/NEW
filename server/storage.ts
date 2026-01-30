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
import { SupabaseStorage } from "./supabaseStorage";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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

  // Rates
  getRates(): Promise<Rate[]>;
  updateRate(id: string, updates: Partial<Rate>): Promise<Rate | undefined>;

  // Optional seed data method
  seedData?(): Promise<void>;
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

    // Seed some initial data for testing (async, fire and forget)
    void this.seedData();
  }

  async seedData(): Promise<void> {
    // Seed household user
    const household: User = {
      id: "household-1",
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "+63 917 123 4567",
      address: "123 Session Road, Baguio City",
      password: "password123",
      userType: "household",
      rating: "4.8",
      latitude: null,
      longitude: null,
      createdAt: new Date(),
    };
    this.users.set(household.id, household);

    // Seed junkshop user
    const junkshop: User = {
      id: "junkshop-1",
      name: "test",
      email: "test@example.com",
      phone: "+63 917 765 4321",
      address: "456 Burnham Park Area, Baguio City",
      password: "password123",
      userType: "junkshop",
      rating: "4.9",
      latitude: null,
      longitude: null,
      createdAt: new Date(),
    };
    this.users.set(junkshop.id, junkshop);

    // Seed items
    const item1: Item = {
      id: "item-1",
      title: "Plastic Bottles (50pcs)",
      category: "Plastic",
      price: "₱150",
      description: "Clean PET plastic bottles, various sizes",
      imageUrl: null,
      imageUrls: null,
      emoji: "🍾",
      sellerId: junkshop.id,
      sellerName: junkshop.name,
      status: "available",
      createdAt: new Date(),
    };
    const item2: Item = {
      id: "item-2",
      title: "Newspapers Bundle",
      category: "Paper",
      price: "₱80",
      description: "Bundle of newspapers, approximately 10kg",
      imageUrl: null,
      imageUrls: null,
      emoji: "📰",
      sellerId: junkshop.id,
      sellerName: junkshop.name,
      status: "available",
      createdAt: new Date(),
    };
    const item3: Item = {
      id: "item-3",
      title: "Aluminum Cans (30pcs)",
      category: "Metal",
      price: "₱120",
      description: "Crushed aluminum soda cans",
      imageUrl: null,
      imageUrls: null,
      emoji: "🥫",
      sellerId: junkshop.id,
      sellerName: junkshop.name,
      status: "available",
      createdAt: new Date(),
    };

    // Household items for sale
    const item4: Item = {
      id: "item-4",
      title: "Used Glass Bottles (20pcs)",
      category: "Glass",
      price: "₱40",
      description: "Clean glass bottles, mostly liquor bottles",
      imageUrl: null,
      imageUrls: null,
      emoji: "🍷",
      sellerId: household.id,
      sellerName: household.name,
      status: "available",
      createdAt: new Date(),
    };
    const item5: Item = {
      id: "item-5",
      title: "Cardboard Boxes Bundle",
      category: "Cardboard",
      price: "₱25",
      description: "Flattened cardboard boxes from deliveries",
      imageUrl: null,
      imageUrls: null,
      emoji: "📦",
      sellerId: household.id,
      sellerName: household.name,
      status: "available",
      createdAt: new Date(),
    };
    const item6: Item = {
      id: "item-6",
      title: "Mixed Plastic Containers (15pcs)",
      category: "Plastic",
      price: "₱35",
      description: "Clean plastic food containers",
      imageUrl: null,
      imageUrls: null,
      emoji: "🍾",
      sellerId: household.id,
      sellerName: household.name,
      status: "available",
      createdAt: new Date(),
    };
    
    [item1, item2, item3, item4, item5, item6].forEach((item) => this.items.set(item.id, item));

    // Seed requests
    const request1: Request = {
      id: "request-1",
      type: "Collection",
      items: "Mixed recyclables - plastic bottles, newspapers, cardboard",
      status: "Pending",
      address: household.address,
      requesterId: household.id,
      requesterName: household.name,
      responderId: null,
      responderName: null,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date(),
    };
    const request2: Request = {
      id: "request-2",
      type: "Collection",
      items: "Aluminum cans and glass bottles",
      status: "Completed",
      address: household.address,
      requesterId: household.id,
      requesterName: household.name,
      responderId: junkshop.id,
      responderName: junkshop.name,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };
    [request1, request2].forEach((req) => this.requests.set(req.id, req));

    // Seed messages
    const messages: Message[] = [
      {
        id: "msg-1",
        senderId: household.id,
        senderName: household.name,
        receiverId: junkshop.id,
        receiverName: junkshop.name,
        content: "Hi! I have some plastic bottles for collection. Are you available this week?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: "true",
      },
      {
        id: "msg-2",
        senderId: junkshop.id,
        senderName: junkshop.name,
        receiverId: household.id,
        receiverName: household.name,
        content: "Yes, we can collect this Friday afternoon. What's the approximate quantity?",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: "false",
      },
    ];
    messages.forEach((msg) => this.messages.set(msg.id, msg));

    // Seed rates
    const rates: Rate[] = [
      { id: randomUUID(), material: "White Paper (used)", price: "₱8.00 per kilo", icon: "📄", category: "Paper", createdAt: new Date() },
      { id: randomUUID(), material: "Cartons (Corrugated/Brown)", price: "₱2.50 per kilo", icon: "📦", category: "Paper", createdAt: new Date() },
      { id: randomUUID(), material: "Assorted/Mixed Paper", price: "₱1.50 per kilo", icon: "📰", category: "Paper", createdAt: new Date() },
      { id: randomUUID(), material: "Newspaper", price: "₱4.00 per kilo", icon: "📰", category: "Paper", createdAt: new Date() },
      { id: randomUUID(), material: "PET Bottle (Clean)", price: "₱16.00 per kilo", icon: "🍾", category: "Plastic", createdAt: new Date() },
      { id: randomUUID(), material: "PET Bottle (Unclean)", price: "₱12.00 per kilo", icon: "🍾", category: "Plastic", createdAt: new Date() },
      { id: randomUUID(), material: "Aluminum Cans", price: "₱50.00 per kilo", icon: "🥫", category: "Metal", createdAt: new Date() },
      { id: randomUUID(), material: "Plastic HDPE", price: "₱10.00 per kilo", icon: "♻️", category: "Plastic", createdAt: new Date() },
      { id: randomUUID(), material: "Plastic LDPE", price: "₱5.00 per kilo", icon: "♻️", category: "Plastic", createdAt: new Date() },
      { id: randomUUID(), material: "Copper Wire (Class A)", price: "₱300.00 per kilo", icon: "🔌", category: "Metal", createdAt: new Date() },
      { id: randomUUID(), material: "Copper Wire (Class B)", price: "₱250.00 per kilo", icon: "🔌", category: "Metal", createdAt: new Date() },
      { id: randomUUID(), material: "Steel/Iron Alloys", price: "₱9.00 per kilo", icon: "⚙️", category: "Metal", createdAt: new Date() },
      { id: randomUUID(), material: "Stainless Steel", price: "₱60.00 per kilo", icon: "⚙️", category: "Metal", createdAt: new Date() },
      { id: randomUUID(), material: "Tin Can (Lata)", price: "₱7.00 per kilo", icon: "🥫", category: "Metal", createdAt: new Date() },
      { id: randomUUID(), material: "Glass Cullets", price: "₱1.00 per kilo", icon: "🍷", category: "Glass", createdAt: new Date() },
      { id: randomUUID(), material: "Old Diskette", price: "₱8.00 each", icon: "💿", category: "Electronics", createdAt: new Date() },
      { id: randomUUID(), material: "Ink Jet Cartridge", price: "₱100-300 each", icon: "🖨️", category: "Electronics", createdAt: new Date() },
      { id: randomUUID(), material: "Car Battery", price: "₱100.00 each", icon: "🔋", category: "Hazardous", createdAt: new Date() },
    ];
    rates.forEach((rate) => this.rates.set(rate.id, rate));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const parseCoord = (v: any) => (v === undefined || v === null ? null : String(Number(v)));
    const user: User = {
      ...insertUser,
      id,
      rating: insertUser.rating || "0",
      latitude: parseCoord(insertUser.latitude),
      longitude: parseCoord(insertUser.longitude),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
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

  // Rates
  async getRates(): Promise<Rate[]> {
    return Array.from(this.rates.values());
  }

  async updateRate(id: string, updates: Partial<Rate>): Promise<Rate | undefined> {
    const rate = this.rates.get(id);
    if (!rate) return undefined;
    const updated = { ...rate, ...updates };
    this.rates.set(id, updated);
    return updated;
  }
}

// Use MemStorage for development (Supabase tables not set up)
const storage = new MemStorage();

export { storage };
