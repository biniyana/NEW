import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with account type (household or junkshop)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  password: text("password").notNull(),
  userType: text("user_type").notNull(), // 'household' or 'junkshop'
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recyclable items/listings
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(), // 'Plastic', 'Paper', 'Metal', 'Glass', 'Cardboard', 'Copper'
  price: text("price").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  imageUrls: text("image_urls"),
  emoji: text("emoji").default("📦"),
  sellerId: varchar("seller_id").notNull(),
  sellerName: text("seller_name").notNull(),
  status: text("status").default("available"), // 'available', 'sold', 'pending'
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews and ratings
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: varchar("reviewer_id").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  targetId: varchar("target_id").notNull(),
  targetName: text("target_name").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Collection requests
export const requests = pgTable("requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'Collection' or 'Purchase'
  items: text("items").notNull(),
  status: text("status").default("Pending"), // 'Pending', 'Accepted', 'Completed', 'Cancelled'
  address: text("address").notNull(),
  requesterId: varchar("requester_id").notNull(),
  requesterName: text("requester_name").notNull(),
  responderId: varchar("responder_id"),
  responderName: text("responder_name"),
  date: text("date").notNull(),
  time: text("time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages/Chat
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  receiverName: text("receiver_name").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: text("read").default("false"),
});

// Chatbot conversations with Garbish
export const chatbotConversations = pgTable("chatbot_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Market rates for recyclables
export const rates = pgTable("rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  material: text("material").notNull(),
  price: text("price").notNull(),
  unit: text("unit").default("kg"),
  icon: text("icon").default("📦"),
  category: text("category").notNull(),
  sellerId: varchar("seller_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  latitude: z.union([z.number(), z.string()]).optional(),
  longitude: z.union([z.number(), z.string()]).optional(),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
}).extend({
  imageUrls: z.array(z.string()).optional(),
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
}).extend({
  read: z.string().optional().default("false"),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({
  id: true,
  timestamp: true,
});

export const insertRateSchema = createInsertSchema(rates).omit({
  id: true,
  createdAt: true,
}).extend({
  sellerId: z.string().optional(),
  unit: z.string().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRate = z.infer<typeof insertRateSchema>;
export type Rate = typeof rates.$inferSelect;

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertChatbotConversation = z.infer<typeof insertChatbotConversationSchema>;
export type ChatbotConversation = typeof chatbotConversations.$inferSelect;

// Rate list type (static data, not in database)
export type StaticRate = {
  material: string;
  price: string;
  icon: string;
};
