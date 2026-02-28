import { 
  users, 
  posts, 
  whitelistedEmails,
  type User, 
  type UpsertUser, 
  type Post, 
  type InsertPost,
  type WhitelistedEmail,
  type InsertWhitelistedEmail,
  type AdminLoginData,
  type EmailLoginData,
  type Settings,
  type UpdateUserData,
  type ContributorMetrics,
  settingsSchema
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPostsByUser(userId: string): Promise<Post[]>;
  getAllPosts(): Promise<Post[]>;
  getPendingPosts(): Promise<Post[]>;
  updatePostStatus(postId: string, status: 'approved' | 'rejected', reviewerId: string): Promise<Post | undefined>;
  updatePostShareableLink(postId: string, link: string): Promise<Post | undefined>;
  updatePost(postId: string, updates: { caption?: string; images?: string[] }): Promise<Post | undefined>;
  getPostById(postId: string): Promise<Post | undefined>;
  deletePost(postId: string): Promise<void>;
  
  // Whitelisted email operations
  addWhitelistedEmail(email: string, addedBy: string): Promise<WhitelistedEmail>;
  removeWhitelistedEmail(id: string): Promise<void>;
  getAllWhitelistedEmails(): Promise<WhitelistedEmail[]>;
  isEmailWhitelisted(email: string): Promise<boolean>;
  bulkAddWhitelistedEmails(emails: string[], addedBy: string): Promise<WhitelistedEmail[]>;
  
  // Custom authentication methods
  authenticateAdmin(email: string, password?: string): Promise<User | null>;
  authenticateWhitelistedUser(email: string): Promise<User | null>;
  createAdminUser(email: string, password: string, firstName: string, lastName: string): Promise<User>;
  
  // Settings operations
  getSettings(): Promise<Settings>;
  updateSettings(updates: Partial<Settings>): Promise<Settings>;
  
  // User profile operations
  updateUser(userId: string, updates: UpdateUserData): Promise<User | undefined>;
  
  // Contributor metrics operations
  getContributorMetrics(userId: string): Promise<ContributorMetrics | undefined>;
  listContributorMetrics(): Promise<ContributorMetrics[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // SECURITY: upsertUser is NEVER allowed to create admin users
    // Admin users must only be created via createAdminUser method
    // This prevents any privilege escalation through this method
    
    const normalizedUserData = {
      ...userData,
      email: userData.email?.toLowerCase(), // Normalize email for consistency
      role: 'contributor' as const, // HARD-CODED: Always contributor, never admin
    };

    const [user] = await db
      .insert(users)
      .values(normalizedUserData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: normalizedUserData.firstName,
          lastName: normalizedUserData.lastName,
          profileImageUrl: normalizedUserData.profileImageUrl,
          role: 'contributor' as const, // SECURITY: Never update role to admin
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Post operations
  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();
    return post;
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.submittedAt));
  }

  async getAllPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .orderBy(desc(posts.submittedAt));
  }

  async getPendingPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'pending'))
      .orderBy(desc(posts.submittedAt));
  }

  async updatePostStatus(postId: string, status: 'approved' | 'rejected', reviewerId: string): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();
    return post;
  }

  async updatePostShareableLink(postId: string, link: string): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({
        shareableLink: link,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();
    return post;
  }

  async updatePost(postId: string, updates: { caption?: string; images?: string[] }): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();
    return post;
  }

  async getPostById(postId: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    return post;
  }

  async deletePost(postId: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, postId));
  }

  // Whitelisted email operations
  async addWhitelistedEmail(email: string, addedBy: string): Promise<WhitelistedEmail> {
    const [whitelistedEmail] = await db
      .insert(whitelistedEmails)
      .values({
        email: email.toLowerCase(),
        addedBy,
      })
      .returning();
    return whitelistedEmail;
  }

  async removeWhitelistedEmail(id: string): Promise<void> {
    await db.delete(whitelistedEmails).where(eq(whitelistedEmails.id, id));
  }

  async getAllWhitelistedEmails(): Promise<WhitelistedEmail[]> {
    return await db
      .select()
      .from(whitelistedEmails)
      .orderBy(desc(whitelistedEmails.createdAt));
  }

  async isEmailWhitelisted(email: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(whitelistedEmails)
      .where(eq(whitelistedEmails.email, email.toLowerCase()));
    return !!result;
  }

  async bulkAddWhitelistedEmails(emails: string[], addedBy: string): Promise<WhitelistedEmail[]> {
    const uniqueEmails = Array.from(new Set(emails.map(email => email.toLowerCase())));
    const values = uniqueEmails.map(email => ({
      email,
      addedBy,
    }));
    
    return await db
      .insert(whitelistedEmails)
      .values(values)
      .onConflictDoNothing()
      .returning();
  }

  // Custom authentication methods
  async authenticateAdmin(email: string, password?: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    
    if (!user || user.role !== 'admin') {
      return null;
    }
    
    // If password provided, verify; if not, allow email-only admin login
    if (password && user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      return isValidPassword ? user : null;
    }
    return user;
  }

  async authenticateWhitelistedUser(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    
    // Check if email is whitelisted
    const isWhitelisted = await this.isEmailWhitelisted(normalizedEmail);
    if (!isWhitelisted) {
      return null;
    }
    
    // Try to find existing user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));
    
    if (existingUser) {
      return existingUser;
    }
    
    // Create new contributor user if doesn't exist
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        firstName: normalizedEmail.split('@')[0], // Use email prefix as name
        lastName: '',
        role: 'contributor',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return newUser;
  }

  async createAdminUser(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return user;
  }

  // Settings operations (stored as JSON in database)
  async getSettings(): Promise<Settings> {
    // Store settings in a simple key-value way using the users table
    // Look for a special admin user entry with id 'settings'
    const [settingsRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, 'settings'));
    
    if (settingsRecord?.profileImageUrl) {
      try {
        const storedSettings = JSON.parse(settingsRecord.profileImageUrl);
        return settingsSchema.parse(storedSettings);
      } catch {
        // Fall back to defaults if JSON is invalid
      }
    }
    
    // Return defaults if no settings found
    return settingsSchema.parse({});
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    const newSettings = settingsSchema.parse({ ...currentSettings, ...updates });
    
    // Store settings by upserting to a special record
    await db
      .insert(users)
      .values({
        id: 'settings',
        email: 'settings@internal',
        firstName: 'System',
        lastName: 'Settings',
        profileImageUrl: JSON.stringify(newSettings),
        role: 'admin',
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          profileImageUrl: JSON.stringify(newSettings),
          updatedAt: new Date(),
        },
      });
    
    return newSettings;
  }

  // User profile operations
  async updateUser(userId: string, updates: UpdateUserData): Promise<User | undefined> {
    // SECURITY: Whitelist allowed fields and normalize email
    const updateData: any = { updatedAt: new Date() };
    
    // Only allow specific fields to be updated
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.profileImageUrl !== undefined) updateData.profileImageUrl = updates.profileImageUrl;
    
    // Hash password if provided
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 12);
    }
    
    // Normalize email if provided (but don't allow role changes)
    // Note: Email updates should be rare and handled carefully in routes
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  // Contributor metrics operations
  async getContributorMetrics(userId: string): Promise<ContributorMetrics | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const userPosts = await this.getPostsByUser(userId);
    
    const totalSubmitted = userPosts.length;
    const totalApproved = userPosts.filter(p => p.status === 'approved').length;
    const totalRejected = userPosts.filter(p => p.status === 'rejected').length;
    const totalPending = userPosts.filter(p => p.status === 'pending').length;
    
    const approvalRate = totalSubmitted > 0 ? (totalApproved / totalSubmitted) * 100 : 0;
    
    // Calculate average time to approval
    const approvedPosts = userPosts.filter(p => p.status === 'approved' && p.reviewedAt && p.submittedAt);
    const avgTimeToApproval = approvedPosts.length > 0 
      ? approvedPosts.reduce((sum, post) => {
          const timeDiff = post.reviewedAt!.getTime() - post.submittedAt!.getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / approvedPosts.length
      : null;

    const lastSubmissionDate = userPosts.length > 0 
      ? userPosts[0].submittedAt?.toISOString() || null 
      : null;

    return {
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      totalSubmitted,
      totalApproved,
      totalRejected,
      totalPending,
      approvalRate,
      avgTimeToApproval,
      lastSubmissionDate,
      recentPosts: userPosts.slice(0, 5).map(post => ({
        id: post.id,
        caption: post.caption,
        status: post.status as 'pending' | 'approved' | 'rejected',
        submittedAt: post.submittedAt!.toISOString(),
        reviewedAt: post.reviewedAt?.toISOString() || null,
      })),
    };
  }

  async listContributorMetrics(): Promise<ContributorMetrics[]> {
    const allUsers = await db.select().from(users).where(eq(users.role, 'contributor'));
    const metrics: ContributorMetrics[] = [];

    for (const user of allUsers) {
      const userMetrics = await this.getContributorMetrics(user.id);
      if (userMetrics) {
        metrics.push(userMetrics);
      }
    }

    return metrics.sort((a, b) => b.totalSubmitted - a.totalSubmitted);
  }
}

// In-memory storage for development/testing
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private posts: Map<string, Post>;
  private whitelistedEmails: Map<string, WhitelistedEmail>;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.whitelistedEmails = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id!);
    
    // SECURITY: Validate email is not empty
    if (!userData.email || userData.email.trim() === '') {
      throw new Error('Email is required and cannot be empty');
    }
    
    const user: User = {
      id: userData.id!,
      email: userData.email.toLowerCase(), // Normalize email
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      password: userData.password || null,
      role: 'contributor' as const, // SECURITY: Hard-coded, never admin
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const id = randomUUID();
    const post: Post = {
      id,
      caption: postData.caption,
      images: postData.images || null,
      authorId: postData.authorId,
      status: postData.status || 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      shareableLink: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.authorId === userId)
      .sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
  }

  async getPendingPosts(): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.status === 'pending')
      .sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
  }

  async updatePostStatus(postId: string, status: 'approved' | 'rejected', reviewerId: string): Promise<Post | undefined> {
    const post = this.posts.get(postId);
    if (!post) return undefined;

    const updatedPost: Post = {
      ...post,
      status,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      updatedAt: new Date(),
    };
    this.posts.set(postId, updatedPost);
    return updatedPost;
  }

  async updatePostShareableLink(postId: string, link: string): Promise<Post | undefined> {
    const post = this.posts.get(postId);
    if (!post) return undefined;

    const updatedPost: Post = {
      ...post,
      shareableLink: link,
      updatedAt: new Date(),
    };
    this.posts.set(postId, updatedPost);
    return updatedPost;
  }

  async updatePost(postId: string, updates: { caption?: string; images?: string[] }): Promise<Post | undefined> {
    const post = this.posts.get(postId);
    if (!post) return undefined;

    const updatedPost: Post = {
      ...post,
      ...updates,
      updatedAt: new Date(),
    };
    this.posts.set(postId, updatedPost);
    return updatedPost;
  }

  async getPostById(postId: string): Promise<Post | undefined> {
    return this.posts.get(postId);
  }

  async deletePost(postId: string): Promise<void> {
    this.posts.delete(postId);
  }

  // Whitelisted email operations
  async addWhitelistedEmail(email: string, addedBy: string): Promise<WhitelistedEmail> {
    const id = randomUUID();
    const whitelistedEmail: WhitelistedEmail = {
      id,
      email: email.toLowerCase(),
      addedBy,
      createdAt: new Date(),
    };
    this.whitelistedEmails.set(id, whitelistedEmail);
    return whitelistedEmail;
  }

  async removeWhitelistedEmail(id: string): Promise<void> {
    this.whitelistedEmails.delete(id);
  }

  async getAllWhitelistedEmails(): Promise<WhitelistedEmail[]> {
    return Array.from(this.whitelistedEmails.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async isEmailWhitelisted(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase();
    return Array.from(this.whitelistedEmails.values()).some(
      whitelisted => whitelisted.email === normalizedEmail
    );
  }

  async bulkAddWhitelistedEmails(emails: string[], addedBy: string): Promise<WhitelistedEmail[]> {
    const uniqueEmails = Array.from(new Set(emails.map(email => email.toLowerCase())));
    const addedEmails: WhitelistedEmail[] = [];
    
    for (const email of uniqueEmails) {
      // Check if email already exists
      const exists = Array.from(this.whitelistedEmails.values()).some(
        whitelisted => whitelisted.email === email
      );
      
      if (!exists) {
        const newEmail = await this.addWhitelistedEmail(email, addedBy);
        addedEmails.push(newEmail);
      }
    }
    
    return addedEmails;
  }

  // Custom authentication methods
  async authenticateAdmin(email: string, password?: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    const user = Array.from(this.users.values()).find(
      u => u.email === normalizedEmail && u.role === 'admin'
    );
    
    if (!user) {
      return null;
    }
    
    if (password && user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      return isValidPassword ? user : null;
    }
    return user;
  }

  async authenticateWhitelistedUser(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    
    // Check if email is whitelisted
    const isWhitelisted = await this.isEmailWhitelisted(normalizedEmail);
    if (!isWhitelisted) {
      return null;
    }
    
    // Try to find existing user
    const existingUser = Array.from(this.users.values()).find(
      u => u.email === normalizedEmail
    );
    
    if (existingUser) {
      return existingUser;
    }
    
    // Create new contributor user if doesn't exist
    const newUser: User = {
      id: randomUUID(),
      email: normalizedEmail,
      firstName: normalizedEmail.split('@')[0], // Use email prefix as name
      lastName: '',
      profileImageUrl: null,
      password: null,
      role: 'contributor',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async createAdminUser(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user: User = {
      id: randomUUID(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      profileImageUrl: null,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(user.id, user);
    return user;
  }

  // Settings operations (in-memory)
  private settings: Settings = settingsSchema.parse({});

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    this.settings = settingsSchema.parse({ ...this.settings, ...updates });
    return this.settings;
  }

  // User profile operations
  async updateUser(userId: string, updates: UpdateUserData): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    // SECURITY: Whitelist allowed fields only
    const updateData: any = { updatedAt: new Date() };
    
    // Only allow specific fields to be updated
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.profileImageUrl !== undefined) updateData.profileImageUrl = updates.profileImageUrl;
    
    // Hash password if provided
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 12);
    }

    const updatedUser: User = { ...user, ...updateData };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Contributor metrics operations
  async getContributorMetrics(userId: string): Promise<ContributorMetrics | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const userPosts = await this.getPostsByUser(userId);
    
    const totalSubmitted = userPosts.length;
    const totalApproved = userPosts.filter(p => p.status === 'approved').length;
    const totalRejected = userPosts.filter(p => p.status === 'rejected').length;
    const totalPending = userPosts.filter(p => p.status === 'pending').length;
    
    const approvalRate = totalSubmitted > 0 ? (totalApproved / totalSubmitted) * 100 : 0;
    
    // Calculate average time to approval
    const approvedPosts = userPosts.filter(p => p.status === 'approved' && p.reviewedAt && p.submittedAt);
    const avgTimeToApproval = approvedPosts.length > 0 
      ? approvedPosts.reduce((sum, post) => {
          const timeDiff = post.reviewedAt!.getTime() - post.submittedAt!.getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / approvedPosts.length
      : null;

    const lastSubmissionDate = userPosts.length > 0 
      ? userPosts[0].submittedAt?.toISOString() || null 
      : null;

    return {
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      totalSubmitted,
      totalApproved,
      totalRejected,
      totalPending,
      approvalRate,
      avgTimeToApproval,
      lastSubmissionDate,
      recentPosts: userPosts.slice(0, 5).map(post => ({
        id: post.id,
        caption: post.caption,
        status: post.status as 'pending' | 'approved' | 'rejected',
        submittedAt: post.submittedAt!.toISOString(),
        reviewedAt: post.reviewedAt?.toISOString() || null,
      })),
    };
  }

  async listContributorMetrics(): Promise<ContributorMetrics[]> {
    const contributors = Array.from(this.users.values()).filter(user => user.role === 'contributor');
    const metrics: ContributorMetrics[] = [];

    for (const user of contributors) {
      const userMetrics = await this.getContributorMetrics(user.id);
      if (userMetrics) {
        metrics.push(userMetrics);
      }
    }

    return metrics.sort((a, b) => b.totalSubmitted - a.totalSubmitted);
  }
}

// Use database storage when DATABASE_URL is provided, otherwise in-memory storage
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();