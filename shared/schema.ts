import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["student", "faculty", "admin"] }).notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  caption: text("caption").notNull(),
  images: jsonb("images").$type<string[]>(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  shareableLink: varchar("shareable_link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Whitelisted emails table
export const whitelistedEmails = pgTable("whitelisted_emails", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  addedBy: varchar("added_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertWhitelistedEmail = typeof whitelistedEmails.$inferInsert;
export type WhitelistedEmail = typeof whitelistedEmails.$inferSelect;

// Validation schemas
export const insertPostSchema = createInsertSchema(posts).pick({
  caption: true,
  images: true,
}).extend({
  caption: z.string().min(1, "Caption is required").max(500, "Caption too long"),
});

export const updatePostSchema = z.object({
  caption: z.string().min(1, "Caption is required").max(500, "Caption too long").optional(),
  images: z.array(z.string()).max(4, "Maximum 4 images allowed").optional(),
});

export const insertWhitelistedEmailSchema = createInsertSchema(whitelistedEmails).pick({
  email: true,
}).extend({
  email: z.string().email("Valid email address is required"),
});

export type InsertPostData = z.infer<typeof insertPostSchema>;
export type UpdatePostData = z.infer<typeof updatePostSchema>;
export type InsertWhitelistedEmailData = z.infer<typeof insertWhitelistedEmailSchema>;