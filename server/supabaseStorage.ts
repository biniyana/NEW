import { createClient } from "@supabase/supabase-js";
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
import { IStorage } from "./storage";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseStorage implements IStorage {
  async seedData(): Promise<void> {
    // Seed household user
    const household: InsertUser = {
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "+63 917 123 4567",
      address: "123 Session Road, Baguio City",
      password: "password123",
      userType: "household",
      rating: "4.8",
    };

    // Check if already exists
    const existing = await this.getUserByEmail(household.email);
    if (!existing) {
      await this.createUser(household);
    }

    // Seed junkshop user
    const junkshop: InsertUser = {
      name: "Caniezo Junkshop",
      email: "caniezojunkshop@gmail.com",
      phone: "+63 917 765 4321",
      address: "456 Burnham Park Area, Baguio City",
      password: "password123",
      userType: "junkshop",
      rating: "4.9",
    };

    const existingJunkshop = await this.getUserByEmail(junkshop.email);
    if (!existingJunkshop) {
      await this.createUser(junkshop);
    }

    // Get the created users for seeding items
    const householdUser = await this.getUserByEmail(household.email);
    const junkshopUser = await this.getUserByEmail(junkshop.email);

    if (householdUser && junkshopUser) {
      // Seed items
      const item1: InsertItem = {
        title: "Plastic Bottles (50pcs)",
        category: "Plastic",
        price: "₱150",
        description: "Clean PET plastic bottles, various sizes",
        emoji: "🍾",
        sellerId: junkshopUser.id,
        sellerName: junkshopUser.name,
        status: "available",
      };

      const item2: InsertItem = {
        title: "Newspapers Bundle",
        category: "Paper",
        price: "₱80",
        description: "Bundle of newspapers, approximately 10kg",
        emoji: "📰",
        sellerId: junkshopUser.id,
        sellerName: junkshopUser.name,
        status: "available",
      };

      const item3: InsertItem = {
        title: "Aluminum Cans (30pcs)",
        category: "Metal",
        price: "₱120",
        description: "Crushed aluminum soda cans",
        emoji: "🥫",
        sellerId: junkshopUser.id,
        sellerName: junkshopUser.name,
        status: "available",
      };

      // Check if items exist
      const existingItems = await this.getItemsBySeller(junkshopUser.id);
      if (existingItems.length === 0) {
        await Promise.all([
          this.createItem(item1),
          this.createItem(item2),
          this.createItem(item3),
        ]);
      }

      // Seed requests
      const existingRequests = await this.getRequestsByRequester(householdUser.id);
      if (existingRequests.length === 0) {
        const request1: InsertRequest = {
          type: "Collection",
          items: "Mixed recyclables - plastic bottles, newspapers, cardboard",
          status: "Pending",
          address: householdUser.address,
          requesterId: householdUser.id,
          requesterName: householdUser.name,
          date: new Date().toISOString().split("T")[0],
        };

        const request2: InsertRequest = {
          type: "Collection",
          items: "Aluminum cans and glass bottles",
          status: "Completed",
          address: householdUser.address,
          requesterId: householdUser.id,
          requesterName: householdUser.name,
          responderId: junkshopUser.id,
          responderName: junkshopUser.name,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        };

        await Promise.all([
          this.createRequest(request1),
          this.createRequest(request2),
        ]);
      }

      // Seed messages
      const existingMessages = await this.getMessagesByUser(householdUser.id);
      if (existingMessages.length === 0) {
        const msg1: InsertMessage = {
          senderId: householdUser.id,
          senderName: householdUser.name,
          receiverId: junkshopUser.id,
          receiverName: junkshopUser.name,
          content: "Hi! I have some plastic bottles for collection. Are you available this week?",
          read: "true",
        };

        const msg2: InsertMessage = {
          senderId: junkshopUser.id,
          senderName: junkshopUser.name,
          receiverId: householdUser.id,
          receiverName: householdUser.name,
          content: "Yes, we can collect this Friday afternoon. What's the approximate quantity?",
          read: "false",
        };

        await Promise.all([
          this.createMessage(msg1),
          this.createMessage(msg2),
        ]);
      }
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    return data || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get user: ${error.message}`);
    }
    return data || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const { data, error } = await supabase
      .from("users")
      .insert({
        id,
        ...insertUser,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    if (!data) throw new Error("Failed to create user: No data returned");
    return data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const { data } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return data || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const { data } = await supabase.from("users").select("*");
    return data || [];
  }

  // Items
  async getItem(id: string): Promise<Item | undefined> {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();
    return data || undefined;
  }

  async getItems(category?: string): Promise<Item[]> {
    let query = supabase.from("items").select("*");
    if (category) {
      query = query.eq("category", category);
    }
    const { data } = await query;
    return data || [];
  }

  async getItemsBySeller(sellerId: string): Promise<Item[]> {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("seller_id", sellerId);
    return data || [];
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const { data, error } = await supabase
      .from("items")
      .insert({
        id,
        ...insertItem,
        seller_id: insertItem.sellerId,
        seller_name: insertItem.sellerName,
        image_url: insertItem.imageUrl,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create item: ${error.message}`);
    if (!data) throw new Error("Failed to create item: No data returned");
    return data;
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const mappedUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === "sellerId") mappedUpdates.seller_id = value;
      else if (key === "sellerName") mappedUpdates.seller_name = value;
      else if (key === "imageUrl") mappedUpdates.image_url = value;
      else if (key === "createdAt") mappedUpdates.created_at = value;
      else mappedUpdates[key] = value;
    }
    const { data } = await supabase
      .from("items")
      .update(mappedUpdates)
      .eq("id", id)
      .select()
      .single();
    return data || undefined;
  }

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from("items").delete().eq("id", id);
    return !error;
  }

  // Requests
  async getRequest(id: string): Promise<Request | undefined> {
    const { data } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();
    return this.mapRequest(data);
  }

  async getRequests(): Promise<Request[]> {
    const { data } = await supabase.from("requests").select("*");
    return (data || []).map(this.mapRequest);
  }

  async getRequestsByRequester(requesterId: string): Promise<Request[]> {
    const { data } = await supabase
      .from("requests")
      .select("*")
      .eq("requester_id", requesterId);
    return (data || []).map(this.mapRequest);
  }

  async getRequestsByResponder(responderId: string): Promise<Request[]> {
    const { data } = await supabase
      .from("requests")
      .select("*")
      .eq("responder_id", responderId);
    return (data || []).map(this.mapRequest);
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = randomUUID();
    const { data, error } = await supabase
      .from("requests")
      .insert({
        id,
        ...insertRequest,
        requester_id: insertRequest.requesterId,
        requester_name: insertRequest.requesterName,
        responder_id: insertRequest.responderId || null,
        responder_name: insertRequest.responderName || null,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create request: ${error.message}`);
    if (!data) throw new Error("Failed to create request: No data returned");
    return this.mapRequest(data)!;
  }

  async updateRequest(id: string, updates: Partial<Request>): Promise<Request | undefined> {
    const mappedUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === "requesterId") mappedUpdates.requester_id = value;
      else if (key === "requesterName") mappedUpdates.requester_name = value;
      else if (key === "responderId") mappedUpdates.responder_id = value;
      else if (key === "responderName") mappedUpdates.responder_name = value;
      else if (key === "createdAt") mappedUpdates.created_at = value;
      else mappedUpdates[key] = value;
    }
    const { data } = await supabase
      .from("requests")
      .update(mappedUpdates)
      .eq("id", id)
      .select()
      .single();
    return this.mapRequest(data);
  }

  async deleteRequest(id: string): Promise<boolean> {
    const { error } = await supabase.from("requests").delete().eq("id", id);
    return !error;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("id", id)
      .single();
    return this.mapMessage(data);
  }

  async getMessages(): Promise<Message[]> {
    const { data } = await supabase.from("messages").select("*");
    return (data || []).map(this.mapMessage);
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    return (data || []).map(this.mapMessage);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const { data } = await supabase
      .from("messages")
      .insert({
        id,
        ...insertMessage,
        sender_id: insertMessage.senderId,
        sender_name: insertMessage.senderName,
        receiver_id: insertMessage.receiverId,
        receiver_name: insertMessage.receiverName,
      })
      .select()
      .single();
    return this.mapMessage(data);
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const { data } = await supabase
      .from("messages")
      .update({ read: "true" })
      .eq("id", id)
      .select()
      .single();
    return this.mapMessage(data);
  }

  // Chatbot conversations
  async getChatbotConversation(userId: string): Promise<ChatbotConversation[]> {
    const { data } = await supabase
      .from("chatbot_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: true });
    return (data || []).map(this.mapChatbotConversation);
  }

  async createChatbotConversation(conv: InsertChatbotConversation): Promise<ChatbotConversation> {
    const id = randomUUID();
    const { data } = await supabase
      .from("chatbot_conversations")
      .insert({
        id,
        ...conv,
        user_id: conv.userId,
      })
      .select()
      .single();
    return this.mapChatbotConversation(data);
  }

  // Helper methods to map Supabase snake_case to camelCase
  private mapMessage(data: any): Message | undefined {
    if (!data) return undefined;
    return {
      ...data,
      senderId: data.sender_id,
      senderName: data.sender_name,
      receiverId: data.receiver_id,
      receiverName: data.receiver_name,
    };
  }

  private mapRequest(data: any): Request | undefined {
    if (!data) return undefined;
    return {
      ...data,
      requesterId: data.requester_id,
      requesterName: data.requester_name,
      responderId: data.responder_id,
      responderName: data.responder_name,
      createdAt: data.created_at ? new Date(data.created_at) : null,
    };
  }

  private mapChatbotConversation(data: any): ChatbotConversation | undefined {
    if (!data) return undefined;
    return {
      ...data,
      userId: data.user_id,
      timestamp: data.timestamp ? new Date(data.timestamp) : null,
    };
  }
}
