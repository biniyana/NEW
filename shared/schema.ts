import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
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
  rating: text("rating").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recyclable items/listings
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(), // 'Plastic', 'Paper', 'Metal', 'Glass', 'Cardboard', 'Copper'
  price: text("price").notNull(),
  description: text("description"),
  emoji: text("emoji").default("📦"),
  sellerId: varchar("seller_id").notNull(),
  sellerName: text("seller_name").notNull(),
  status: text("status").default("available"), // 'available', 'sold', 'pending'
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Rate list type (static data, not in database)
export type Rate = {
  material: string;
  price: string;
  icon: string;
};
