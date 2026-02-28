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

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // For admin users only, nullable
  role: varchar("role", { enum: ["admin", "contributor"] }).notNull().default("contributor"),
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

// Dynamic validation schema builders (use current settings)
export const buildInsertPostSchema = (settings: Settings) => 
  createInsertSchema(posts).pick({
    caption: true,
    images: true,
  }).extend({
    caption: z.string().min(1, "Caption is required").max(settings.captionMax, "Caption too long"),
    images: z.array(z.string()).max(settings.maxImages, "Maximum images exceeded").optional(),
  });

export const buildUpdatePostSchema = (settings: Settings) => 
  z.object({
    caption: z.string().min(1, "Caption is required").max(settings.captionMax, "Caption too long").optional(),
    images: z.array(z.string()).max(settings.maxImages, "Maximum images exceeded").optional(),
  });

// Default validation schemas (fallback when settings not available)
export const insertPostSchema = createInsertSchema(posts).pick({
  caption: true,
  images: true,
}).extend({
  caption: z.string().min(1, "Caption is required").max(500, "Caption too long"),
  images: z.array(z.string()).max(4, "Maximum 4 images allowed").optional(),
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

// Authentication schemas
export const adminLoginSchema = z.object({
  email: z.string().email("Valid email address is required"),
  // Password is optional for admin email-only login flows
  password: z.string().min(1, "Password is required").optional(),
});

export const emailLoginSchema = z.object({
  email: z.string().email("Valid email address is required"),
});

// Settings schema (in-memory storage)
export const settingsSchema = z.object({
  captionMax: z.number().min(100, "Minimum 100 characters").max(1000, "Maximum 1000 characters").default(500),
  maxImages: z.number().min(1, "Minimum 1 image").max(10, "Maximum 10 images").default(4),
  requiresApproval: z.boolean().default(true),
  showMetricsToContributors: z.boolean().default(false),
});

// User profile update schema
export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  profileImageUrl: z.string().url("Valid URL required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

// Contributor performance metrics types  
export const contributorMetricsSchema = z.object({
  userId: z.string(),
  userEmail: z.string(),
  userName: z.string(),
  totalSubmitted: z.number(),
  totalApproved: z.number(),
  totalRejected: z.number(),
  totalPending: z.number(),
  approvalRate: z.number(), // Percentage
  avgTimeToApproval: z.number().nullable(), // Hours, null if no approved posts
  lastSubmissionDate: z.string().datetime().nullable(),
  recentPosts: z.array(z.object({
    id: z.string(),
    caption: z.string(),
    status: z.enum(["pending", "approved", "rejected"]),
    submittedAt: z.string().datetime(),
    reviewedAt: z.string().datetime().nullable(),
  })).optional(),
});

export type Settings = z.infer<typeof settingsSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type ContributorMetrics = z.infer<typeof contributorMetricsSchema>;
export type InsertPostData = z.infer<typeof insertPostSchema>;
export type UpdatePostData = z.infer<typeof updatePostSchema>;
export type InsertWhitelistedEmailData = z.infer<typeof insertWhitelistedEmailSchema>;
export type AdminLoginData = z.infer<typeof adminLoginSchema>;
export type EmailLoginData = z.infer<typeof emailLoginSchema>;