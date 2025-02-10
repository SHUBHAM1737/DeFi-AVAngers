import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avalancheAddress: text("avalanche_address"),
  privateKey: text("private_key"),
});

export const systemEvents = pgTable("system_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  timestamp: text("timestamp").notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull(),
  timestamp: text("timestamp").notNull(),
  metadata: jsonb("metadata"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSystemEventSchema = createInsertSchema(systemEvents);
export const insertChatMessageSchema = createInsertSchema(chatMessages);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SystemEvent = typeof systemEvents.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;