import admin from 'firebase-admin';
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
import { IStorage } from "./storage";
import { randomUUID } from "crypto";
import dotenv from 'dotenv';

dotenv.config();

/* =================================================
   FIREBASE INITIALIZATION (FIXED VERSION)
================================================= */

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;

let firebaseInitialized = false;
let initializationError: Error | null = null;

try {
  if (admin.apps.length === 0) {

    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      console.log("✅ Firebase initialized using service account");
    } 
    else if (projectId) {

      admin.initializeApp({
        projectId: projectId,
      });

      console.log("✅ Firebase initialized using project ID:", projectId);
    } 
    else {
      throw new Error(
        "Firebase configuration missing. Please set FIREBASE_PROJECT_ID in .env"
      );
    }

    firebaseInitialized = true;

  } else {
    firebaseInitialized = true;
  }

} catch (error) {
  initializationError = error as Error;
  console.error("❌ Firebase initialization failed:", error);
}

let db: any = null;
if (firebaseInitialized) {
  db = admin.firestore();
}

/* =================================================
   FIRESTORE NORMALIZER
================================================= */

function normalizeFirestoreValue(value: any): any {
  if (value === undefined || value === null) return value;

  if (Array.isArray(value)) {
    return value.map(normalizeFirestoreValue);
  }

  if (typeof value === "object") {

    if (
      typeof value.toDate === "function" &&
      typeof value.toMillis === "function"
    ) {
      return value.toDate().toISOString();
    }

    const normalized: any = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      normalized[key] = normalizeFirestoreValue(nestedValue);
    }

    return normalized;
  }

  return value;
}

function normalizeFirestoreDocument<T>(doc: any): T | undefined {
  if (!doc.exists) return undefined;
  return { id: doc.id, ...normalizeFirestoreValue(doc.data()) } as T;
}

/* =================================================
   STORAGE CLASS
================================================= */

export class FirebaseStorage implements IStorage {

  private checkInitialized() {
    if (initializationError) throw initializationError;
    if (!firebaseInitialized || !db) {
      throw new Error("Firebase not properly initialized");
    }
  }

  /* =========================
     SEED DATA
  ========================= */

  async seedData(): Promise<void> {

    this.checkInitialized();

    const household: InsertUser = {
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "+63 917 123 4567",
      address: "123 Session Road, Baguio City",
      password: "password123",
      userType: "household",
    };

    const existing = await this.getUserByEmail(household.email);

    if (!existing) {
      await this.createUser(household);
    }

    const junkshop: InsertUser = {
      name: "Caniezo Junkshop",
      email: "caniezo@example.com",
      phone: "+63 917 987 6543",
      address: "456 Burnham Park Area, Baguio City",
      password: "password123",
      userType: "junkshop",
    };

    const existingJunkshop = await this.getUserByEmail(junkshop.email);

    if (!existingJunkshop) {
      await this.createUser(junkshop);
    }
  }

  /* =========================
     USERS
  ========================= */

  async getUser(id: string): Promise<User | undefined> {
    const doc = await db.collection("users").doc(id).get();
    return normalizeFirestoreDocument<User>(doc);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {

    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;

    const doc = snapshot.docs[0];

    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(user: InsertUser): Promise<User> {

    const id = randomUUID();

    const data = {
      ...user,
      id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("users").doc(id).set(data);

    const created = await this.getUser(id);

    if (!created) throw new Error("Failed to fetch created user");

    return created;
  }

  async createOrUpdateUser(id: string, data: Partial<any>): Promise<any> {
    const existingUser = await this.getUser(id);
    
    const userData: any = {
      ...data,
      id,
    };

    if (!existingUser) {
      userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    // Always use merge: true to avoid overwriting existing data
    await db.collection("users").doc(id).set(userData, { merge: true });

    const result = await this.getUser(id);
    if (!result) throw new Error("Failed to fetch created/updated user");

    return result;
  }

  /* =========================
     ITEMS
  ========================= */

  async createItem(item: InsertItem): Promise<Item> {

    const id = randomUUID();

    const data = {
      ...item,
      id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("items").doc(id).set(data);

    const created = await this.getItem(id);

    if (!created) throw new Error("Failed to fetch created item");

    return created;
  }

  async getItem(id: string): Promise<Item | undefined> {

    const doc = await db.collection("items").doc(id).get();

    return normalizeFirestoreDocument<Item>(doc);
  }

  /* =========================
     REQUESTS
  ========================= */

  async createRequest(request: InsertRequest): Promise<Request> {

    const id = randomUUID();

    const data = {
      ...request,
      id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("requests").doc(id).set(data);

    const created = await this.getRequest(id);

    if (!created) throw new Error("Failed to fetch created request");

    return created;
  }

  async getRequest(id: string): Promise<Request | undefined> {

    const doc = await db.collection("requests").doc(id).get();

    return normalizeFirestoreDocument<Request>(doc);
  }

  /* =========================
     MESSAGES
  ========================= */

  async createMessage(message: InsertMessage): Promise<Message> {

    const id = randomUUID();

    const data = {
      ...message,
      id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: message.read ?? false
    };

    await db.collection("messages").doc(id).set(data);

    const created = await this.getMessage(id);

    if (!created) throw new Error("Failed to fetch created message");

    return created;
  }

  async getMessage(id: string): Promise<Message | undefined> {

    const doc = await db.collection("messages").doc(id).get();

    return normalizeFirestoreDocument<Message>(doc);
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {

    await db.collection("messages").doc(id).update({
      read: true
    });

    return this.getMessage(id);
  }

  /* =========================
     CHATBOT
  ========================= */

  async createChatbotConversation(
    conversation: InsertChatbotConversation
  ): Promise<ChatbotConversation> {

    const id = randomUUID();

    const data = {
      ...conversation,
      id,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("chatbotConversations").doc(id).set(data);

    const created = await this.getChatbotConversation(id);

    if (!created) throw new Error("Failed to fetch created chatbot conversation");

    return created;
  }

  async getChatbotConversation(
    id: string
  ): Promise<ChatbotConversation | undefined> {

    const doc = await db.collection("chatbotConversations").doc(id).get();

    return normalizeFirestoreDocument<ChatbotConversation>(doc);
  }

  /* =========================
     RATES
  ========================= */

  async createRate(rate: InsertRate): Promise<Rate> {

    const id = randomUUID();

    const data = {
      ...rate,
      id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("rates").doc(id).set(data);

    const created = await this.getRate(id);

    if (!created) throw new Error("Failed to fetch created rate");

    return created;
  }

  async getRate(id: string): Promise<Rate | undefined> {

    const doc = await db.collection("rates").doc(id).get();

    return normalizeFirestoreDocument<Rate>(doc);
  }

  async getRates(sellerId?: string): Promise<Rate[]> {
    try {
      let query = db.collection("rates");
      
      if (sellerId) {
        query = query.where("sellerId", "==", sellerId);
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) return [];
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...normalizeFirestoreValue(doc.data())
      })) as Rate[];
    } catch (error) {
      console.error("Error fetching rates:", error);
      return [];
    }
  }

  async updateRate(id: string, updates: Partial<Rate>): Promise<Rate | undefined> {
    try {
      const updateData: any = { ...updates };
      
      // Remove id from update data if present
      delete updateData.id;
      
      // Add updatedAt timestamp
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      await db.collection("rates").doc(id).update(updateData);
      
      return this.getRate(id);
    } catch (error) {
      console.error("Error updating rate:", error);
      return undefined;
    }
  }

  async deleteRate(id: string): Promise<boolean> {
    try {
      await db.collection("rates").doc(id).delete();
      return true;
    } catch (error) {
      console.error("Error deleting rate:", error);
      return false;
    }
  }
}