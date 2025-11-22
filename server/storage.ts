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

  // Optional seed data method
  seedData?(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private items: Map<string, Item>;
  private requests: Map<string, Request>;
  private messages: Map<string, Message>;
  private chatbotConversations: Map<string, ChatbotConversation[]>;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.requests = new Map();
    this.messages = new Map();
    this.chatbotConversations = new Map();

    // Seed some initial data for testing (async, fire and forget)
    this.seedData();
  }

  private seedData(): void {
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
      name: "Caniezo Junkshop",
      email: "caniezojunkshop@gmail.com",
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
    const user: User = {
      ...insertUser,
      id,
      rating: insertUser.rating || "0",
      latitude: null,
      longitude: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
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
    const item: Item = {
      ...insertItem,
      id,
      status: insertItem.status || "available",
      emoji: insertItem.emoji || "📦",
      imageUrl: insertItem.imageUrl || null,
      createdAt: new Date(),
    };
    this.items.set(id, item);
    return item;
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
}

// Use Supabase storage if credentials are available, otherwise fall back to MemStorage
let storage: IStorage;

if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  storage = new SupabaseStorage();
  // Initialize seed data asynchronously (fire and forget)
  storage.seedData?.().catch((err) => console.error("Failed to seed Supabase data:", err));
} else {
  storage = new MemStorage();
}

export { storage };
