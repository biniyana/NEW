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
  type Rate,
} from "@shared/schema";
import { IStorage, storage, fallbackToMemory } from "./storage";
import { randomUUID } from "crypto";

// Temporary type to avoid Postgrest 'never' inference in this file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SQLAny = any;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase: ReturnType<typeof createClient> | undefined;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  // Supabase not configured; do not initialize client at top-level.
}

function db() {
  if (!supabase) throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_KEY.");
  return supabase;
}

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
    };

    // Check if already exists
    const existing = await this.getUserByEmail(household.email);
    if (!existing) {
      await this.createUser(household);
    }

    // Seed junkshop user (include coordinates for map display)
    const junkshop: InsertUser = {
      name: "Caniezo Junkshop",
      email: "caniezojunkshop@gmail.com",
      phone: "+63 917 765 4321",
      address: "456 Burnham Park Area, Baguio City",
      password: "password123",
      userType: "junkshop",
      latitude: 16.4023,
      longitude: 120.5960,
    };

    const existingJunkshop = await this.getUserByEmail(junkshop.email);
    if (!existingJunkshop) {
      await this.createUser(junkshop);
    }

    // Create an additional dummy junkshop account for easier login/testing
    const dummyJunkshop: InsertUser = {
      name: "Test Junkshop",
      email: "testjunkshop@waiz.app",
      phone: "+63 917 000 0000",
      address: "789 Test Street, Baguio City",
      password: "password123",
      userType: "junkshop",
      latitude: 16.4020,
      longitude: 120.5950,
    };

    const existingDummy = await this.getUserByEmail(dummyJunkshop.email);
    if (!existingDummy) {
      await this.createUser(dummyJunkshop);
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
          time: "14:00",
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
          time: "10:30",
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
    const { data } = await db()
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    return data ? this.mapUser(data) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await db()
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get user: ${error.message}`);
    }
    return data ? this.mapUser(data) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const { data, error } = await db()
      .from("users")
      .insert({
        id,
        name: insertUser.name,
        email: insertUser.email,
        phone: insertUser.phone,
        address: insertUser.address,
        password: insertUser.password,
        user_type: insertUser.userType,
        latitude: insertUser.latitude || null,
        longitude: insertUser.longitude || null,
      } as any)
      .select()
      .single();
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    if (!data) throw new Error("Failed to create user: No data returned");
    return this.mapUser(data);
  }

  private mapUser(data: any): User {
    if (!data) return data;
    return {
      ...data,
      userType: data.user_type,
      createdAt: data.created_at ? new Date(data.created_at) : null,
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const mappedUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === "userType") mappedUpdates.user_type = value;
      else if (key === "createdAt") mappedUpdates.created_at = value;
      else mappedUpdates[key] = value;
    }
    const { data } = await (db() as any)
      .from("users")
      .update(mappedUpdates as any)
      .eq("id", id)
      .select()
      .single();
    return data ? this.mapUser(data) : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const { data } = await db().from("users").select("*");
    return (data || []).map((u) => this.mapUser(u));
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const { data, error } = await db()
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();
    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get user by phone: ${error.message}`);
    }
    return data ? this.mapUser(data) : undefined;
  }

  // Items
  private mapItem(data: any): Item {
    if (!data) return data;
    // convert image_urls field (stored as JSON string) into an array
    let imageUrls: string[] | null = null;
    if (data.image_urls) {
      try {
        if (typeof data.image_urls === "string") {
          imageUrls = JSON.parse(data.image_urls);
        } else if (Array.isArray(data.image_urls)) {
          imageUrls = data.image_urls;
        }
      } catch {
        imageUrls = null;
      }
    }

    // fallback to single image_url if no array present
    if (!imageUrls && data.image_url) {
      imageUrls = [data.image_url];
    }

    return {
      ...data,
      sellerId: data.seller_id,
      sellerName: data.seller_name,
      imageUrl: data.image_url,
      imageUrls,
      createdAt: data.created_at ? new Date(data.created_at) : null,
    };
  }

  async getItem(id: string): Promise<Item | undefined> {
    try {
      const { data } = await db()
        .from("items")
        .select("*")
        .eq("id", id)
        .single();
      return data ? this.mapItem(data) : undefined;
    } catch (err: any) {
      if (err.message && err.message.toString().includes("Could not find the table")) {
        fallbackToMemory(err.message);
        return (storage as any).getItem(id);
      }
      throw err;
    }
  }

  async getItems(category?: string): Promise<Item[]> {
    try {
      let query = db().from("items").select("*");
      if (category) {
        query = query.eq("category", category);
      }
      const { data } = await query;
      return (data || []).map((i) => this.mapItem(i));
    } catch (err: any) {
      if (err.message && err.message.toString().includes("Could not find the table")) {
        // switch to memory storage for future requests
        fallbackToMemory(err.message);
        return (storage as any).getItems(category);
      }
      throw err;
    }
  }

  async getItemsBySeller(sellerId: string): Promise<Item[]> {
    try {
      const { data } = await db()
        .from("items")
        .select("*")
        .eq("seller_id", sellerId);
      return (data || []).map((i) => this.mapItem(i));
    } catch (err: any) {
      if (err.message && err.message.toString().includes("Could not find the table")) {
        fallbackToMemory(err.message);
        return (storage as any).getItemsBySeller(sellerId);
      }
      throw err;
    }
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const payload: any = {
      id,
      title: insertItem.title,
      category: insertItem.category,
      price: insertItem.price,
      description: insertItem.description || null,
      emoji: insertItem.emoji || "📦",
      seller_id: insertItem.sellerId,
      seller_name: insertItem.sellerName,
      status: insertItem.status || "available",
    };

    // support both single imageUrl and multiple imageUrls
    if (insertItem.imageUrls && insertItem.imageUrls.length > 0) {
      payload.image_urls = JSON.stringify(insertItem.imageUrls);
      // keep image_url synced to first element for legacy compatibility
      payload.image_url = insertItem.imageUrls[0];
    } else if (insertItem.imageUrl) {
      payload.image_url = insertItem.imageUrl;
      payload.image_urls = JSON.stringify([insertItem.imageUrl]);
    }

    const { data, error } = await db()
      .from("items")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(`Failed to create item: ${error.message}`);
    if (!data) throw new Error("Failed to create item: No data returned");
    return this.mapItem(data);
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const mappedUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === "sellerId") mappedUpdates.seller_id = value;
      else if (key === "sellerName") mappedUpdates.seller_name = value;
      else if (key === "imageUrl") {
        mappedUpdates.image_url = value;
        // keep image_urls in sync at least with single URL case
        mappedUpdates.image_urls = value ? JSON.stringify([value]) : null;
      }
      else if (key === "imageUrls") {
        // store array as JSON string and sync primary image
        mappedUpdates.image_urls = Array.isArray(value) ? JSON.stringify(value) : null;
        if (Array.isArray(value) && value.length > 0) mappedUpdates.image_url = value[0];
        else mappedUpdates.image_url = null;
      }
      else if (key === "createdAt") mappedUpdates.created_at = value;
      else mappedUpdates[key] = value;
    }
    const { data } = await (db() as any)
      .from("items")
      .update(mappedUpdates as any)
      .eq("id", id)
      .select()
      .single();
    return data ? this.mapItem(data) : undefined;
  }

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await db().from("items").delete().eq("id", id);
    return !error;
  }

  // Requests
  async getRequest(id: string): Promise<Request | undefined> {
    const { data } = await db()
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();
    return this.mapRequest(data)!;
  }

  async getRequests(): Promise<Request[]> {
    const { data } = await db().from("requests").select("*");
    return (data || []).map((d: any) => this.mapRequest(d)!);
  }

  async getRequestsByRequester(requesterId: string): Promise<Request[]> {
    const { data } = await db()
      .from("requests")
      .select("*")
      .eq("requester_id", requesterId);
    return (data || []).map((d: any) => this.mapRequest(d)!);
  }

  async getRequestsByResponder(responderId: string): Promise<Request[]> {
    const { data } = await db()
      .from("requests")
      .select("*")
      .eq("responder_id", responderId);
    return (data || []).map((d: any) => this.mapRequest(d)!);
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = randomUUID();
    const { data, error } = await db()
      .from("requests")
      .insert({
        id,
        ...insertRequest,
        requester_id: insertRequest.requesterId,
        requester_name: insertRequest.requesterName,
        responder_id: insertRequest.responderId || null,
        responder_name: insertRequest.responderName || null,
      } as any)
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
    const { data } = await (db() as any)
      .from("requests")
      .update(mappedUpdates as any)
      .eq("id", id)
      .select()
      .single();
    return this.mapRequest(data);
  }

  async deleteRequest(id: string): Promise<boolean> {
    const { error } = await db().from("requests").delete().eq("id", id);
    return !error;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const { data } = await db()
      .from("messages")
      .select("*")
      .eq("id", id)
      .single();
    return this.mapMessage(data)!;
  }

  async getMessages(): Promise<Message[]> {
    const { data } = await db().from("messages").select("*");
    return (data || []).map((d: any) => this.mapMessage(d)!);
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    const { data } = await db()
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    return (data || []).map((d: any) => this.mapMessage(d)!);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const { data } = await db()
      .from("messages")
      .insert({
        id,
        ...insertMessage,
        sender_id: insertMessage.senderId,
        sender_name: insertMessage.senderName,
        receiver_id: insertMessage.receiverId,
        receiver_name: insertMessage.receiverName,
      } as any)
      .select()
      .single();
    return this.mapMessage(data)!;
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const { data } = await (db() as any)
      .from("messages")
      .update({ read: "true" } as any)
      .eq("id", id)
      .select()
      .single();
    return this.mapMessage(data)!;
  }

  // Chatbot conversations
  async getChatbotConversation(userId: string): Promise<ChatbotConversation[]> {
    const { data } = await db()
      .from("chatbot_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: true });
    return (data || []).map((d: any) => this.mapChatbotConversation(d)!);
  }

  async createChatbotConversation(conv: InsertChatbotConversation): Promise<ChatbotConversation> {
    const id = randomUUID();
    const { data } = await db()
      .from("chatbot_conversations")
      .insert({
        id,
        ...conv,
        user_id: conv.userId,
      } as any)
      .select()
      .single();
    return this.mapChatbotConversation(data)!;
  }

  // Rates
  private isMissingRatesTableError(error: any): boolean {
    if (!error || !error.message) return false;
    const msg = error.message.toLowerCase();
    return msg.includes("could not find the table public.rates in the schema cache") ||
      msg.includes("relation \"rates\" does not exist") ||
      msg.includes("table \"rates\" does not exist");
  }

  async getRates(sellerId?: string): Promise<Rate[]> {
    try {
      let q = db().from("rates").select("*");
      if (sellerId) {
        q = q.or(`seller_id.eq.${sellerId},junkshop_id.eq.${sellerId}`) as any;
      }
      const { data, error } = await q;
      if (error) {
        console.error("❌ [getRates] Database error:", error.message);
        if (this.isMissingRatesTableError(error)) {
          console.warn("⚠️  Rates table missing in Supabase, falling back to local memory storage.");
          const fallbackStorage = fallbackToMemory(error);
          return fallbackStorage.getRates(sellerId);
        }
        return [];
      }
      console.log("✅ [getRates] Retrieved rates:", (data || []).length);
      return (data || []).map((d: any) => this.mapRate(d)!);
    } catch (error: any) {
      console.error("❌ [getRates] Exception:", error?.message || error);
      if (this.isMissingRatesTableError(error)) {
        console.warn("⚠️  Rates table missing in Supabase (exception), falling back to local memory storage.");
        const fallbackStorage = fallbackToMemory(error);
        return fallbackStorage.getRates(sellerId);
      }
      return [];
    }
  }

  private mapRate(data: any): Rate | undefined {
    if (!data) return undefined;
    console.log("🔍 [mapRate] Mapping rate fields:", Object.keys(data));

    // Normalize legacy fields from Supabase schema (`price_per_kg`, `junkshop_id`) to app schema
    const priceValue = data.price || data.price_per_kg || "";

    return {
      ...data,
      price: priceValue,
      unit: data.unit || "kg",
      icon: data.icon || "📦",
      category: data.category || "General",
      sellerId: data.seller_id || data.junkshop_id || null,
      createdAt: data.created_at ? new Date(data.created_at) : null,
    };
  }

  async updateRate(id: string, updates: Partial<Rate>): Promise<Rate | undefined> {
    const mappedUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === "price") mappedUpdates.price_per_kg = value;
      else if (key === "sellerId") mappedUpdates.junkshop_id = value;
      else if (key === "createdAt") mappedUpdates.created_at = value;
      else mappedUpdates[key] = value;
    }

    try {
      const { data, error } = await (db() as any).from("rates").update(mappedUpdates).eq("id", id).select().single();
      if (error) {
        console.error("❌ [updateRate] Error updating rate:", error.message);
        if (this.isMissingRatesTableError(error)) {
          console.warn("⚠️  Rates table missing in Supabase, falling back to local memory storage.");
          const fallbackStorage = fallbackToMemory(error);
          return fallbackStorage.updateRate(id, updates);
        }
        return undefined;
      }
      if (!data) return undefined;
      return this.mapRate(data);
    } catch (error: any) {
      console.error("❌ [updateRate] Exception:", error?.message || error);
      if (this.isMissingRatesTableError(error)) {
        console.warn("⚠️  Rates table missing in Supabase (exception), falling back to local memory storage.");
        const fallbackStorage = fallbackToMemory(error);
        return fallbackStorage.updateRate(id, updates);
      }
      return undefined;
    }
  }

  async createRate(insertRate: any): Promise<Rate> {
    const id = randomUUID();

    let junkshopName: string | null = null;
    if (insertRate.sellerId) {
      const seller = await this.getUser(insertRate.sellerId).catch(() => null);
      junkshopName = seller?.name || null;
    }

    if (!insertRate.sellerId || !junkshopName) {
      throw new Error("Failed to create rate: invalid seller information");
    }

    const payload: any = {
      id,
      material: insertRate.material,
      price_per_kg: insertRate.price || "",
      unit: insertRate.unit || "kg",
      junkshop_id: insertRate.sellerId,
      junkshop_name: junkshopName,
    };

    try {
      const { data, error } = await db().from("rates").insert(payload).select().single();
      if (error) {
        console.error("❌ [createRate] Error creating rate:", error.message);
        if (this.isMissingRatesTableError(error)) {
          console.warn("⚠️  Rates table missing in Supabase, falling back to local memory storage.");
          const fallbackStorage = fallbackToMemory(error);
          return fallbackStorage.createRate(insertRate);
        }
        throw new Error(`Failed to create rate: ${error.message}`);
      }
      return this.mapRate(data)!;
    } catch (error: any) {
      console.error("❌ [createRate] Exception:", error?.message || error);
      if (this.isMissingRatesTableError(error)) {
        console.warn("⚠️  Rates table missing in Supabase (exception), falling back to local memory storage.");
        const fallbackStorage = fallbackToMemory(error);
        return fallbackStorage.createRate(insertRate);
      }
      throw error;
    }
  }

  async deleteRate(id: string): Promise<boolean> {
    try {
      const { error } = await db().from("rates").delete().eq("id", id);
      if (error) {
        console.error("❌ [deleteRate] Error deleting rate:", error.message);
        if (this.isMissingRatesTableError(error)) {
          console.warn("⚠️  Rates table missing in Supabase, falling back to local memory storage.");
          const fallbackStorage = fallbackToMemory(error);
          return fallbackStorage.deleteRate(id);
        }
        return false;
      }
      return true;
    } catch (error: any) {
      console.error("❌ [deleteRate] Exception:", error?.message || error);
      if (this.isMissingRatesTableError(error)) {
        console.warn("⚠️  Rates table missing in Supabase (exception), falling back to local memory storage.");
        const fallbackStorage = fallbackToMemory(error);
        return fallbackStorage.deleteRate(id);
      }
      return false;
    }
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
