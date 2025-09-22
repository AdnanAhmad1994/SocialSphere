import { 
  users, 
  posts, 
  type User, 
  type UpsertUser, 
  type Post, 
  type InsertPost 
} from "@shared/schema";
import { randomUUID } from "crypto";
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
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
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
}

// In-memory storage for development/testing
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private posts: Map<string, Post>;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id!);
    const user: User = {
      id: userData.id!,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || 'student',
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
}

// Use database storage in production, memory storage for development
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new DatabaseStorage(); // Use database even in development