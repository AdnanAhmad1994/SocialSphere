import { createDbConnectionPool } from './db';
import { 
  users, 
  posts, 
  whitelistedEmails, 
  settingsSchema,
  type InsertPost,
  type Post,
  type InsertWhitelistedEmail,
  updateUserSchema,
} from '../../shared/schema';
import { z } from 'zod';
import { eq, desc, sql, count, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Initialize database connection pool
const db = createDbConnectionPool();

class Storage {
  async getUser(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async upsertUser(userData: any) {
    const { id, email, firstName, lastName, role } = userData;
    
    const existingUser = await this.getUser(id);
    if (existingUser) {
      // Update existing user
      const result = await db
        .update(users)
        .set({ 
          email, 
          firstName, 
          lastName, 
          role,
          updatedAt: sql`NOW()`
        })
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } else {
      // Insert new user
      const result = await db
        .insert(users)
        .values({ 
          id, 
          email, 
          firstName, 
          lastName, 
          role,
          password: null // No password for OAuth users
        })
        .returning();
      return result[0];
    }
  }

  async createPost(postData: InsertPost) {
    const result = await db.insert(posts).values(postData).returning();
    return result[0];
  }

  async getPostsByUser(userId: string) {
    return db.select().from(posts).where(eq(posts.authorId, userId)).orderBy(desc(posts.createdAt));
  }

  async getAllPosts() {
    return db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPendingPosts() {
    return db.select().from(posts).where(eq(posts.status, 'pending')).orderBy(desc(posts.createdAt));
  }

  async updatePostStatus(id: string, status: string, shareableLink?: string) {
    const updateData: any = { status, updatedAt: sql`NOW()` };
    if (shareableLink) {
      updateData.shareableLink = shareableLink;
    }
    
    const result = await db.update(posts).set(updateData).where(eq(posts.id, id)).returning();
    return result[0];
  }

  async updatePostShareableLink(id: string, shareableLink: string) {
    const result = await db.update(posts).set({ shareableLink }).where(eq(posts.id, id)).returning();
    return result[0];
  }

  async updatePost(id: string, updateData: any) {
    const result = await db.update(posts).set({ ...updateData, updatedAt: sql`NOW()` }).where(eq(posts.id, id)).returning();
    return result[0];
  }

  async getPostById(id: string) {
    const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result[0] || null;
  }

  async deletePost(id: string) {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async addWhitelistedEmail(emailData: InsertWhitelistedEmail) {
    const result = await db.insert(whitelistedEmails).values(emailData).returning();
    return result[0];
  }

  async removeWhitelistedEmail(id: string) {
    await db.delete(whitelistedEmails).where(eq(whitelistedEmails.id, id));
  }

  async getAllWhitelistedEmails() {
    return db.select().from(whitelistedEmails).orderBy(whitelistedEmails.email);
  }

  async isEmailWhitelisted(email: string) {
    const result = await db.select().from(whitelistedEmails).where(eq(whitelistedEmails.email, email)).limit(1);
    return result.length > 0;
  }

  async bulkAddWhitelistedEmails(emails: string[]) {
    const emailData = emails.map(email => ({ email }));
    const result = await db.insert(whitelistedEmails).values(emailData).returning();
    return result;
  }

  async authenticateAdmin(email: string, password: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0];
    
    if (!user || user.role !== 'admin' || !user.password) {
      throw new Error('Invalid credentials');
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    return user;
  }

  async authenticateWhitelistedUser(email: string) {
    const isWhitelisted = await this.isEmailWhitelisted(email);
    if (!isWhitelisted) {
      throw new Error('Email not whitelisted');
    }
    
    let user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      // Create new user
      const names = email.split('@')[0].split('.');
      const firstName = names[0] || 'User';
      const lastName = names[1] || '';
      
      const newUser = await db.insert(users).values({
        email,
        firstName,
        lastName,
        role: 'contributor',
        password: null
      }).returning();
      
      return newUser[0];
    }
    
    return user[0];
  }

  async createAdminUser(email: string, password: string, firstName: string, lastName: string) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.insert(users).values({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin'
    }).returning();
    return result[0];
  }

  async getSettings() {
    // Since settings are in-memory, return default settings
    // In a real implementation, you might store these in a configuration table
    return {
      captionMax: 500,
      maxImages: 4,
      requiresApproval: true,
      showMetricsToContributors: false
    };
  }

  async updateSettings(newSettings: any) {
    // For now, we'll just validate and return the settings
    // In a real implementation, you would store these in a database table
    const validatedSettings = settingsSchema.parse(newSettings);
    return validatedSettings;
  }

  async updateUser(id: string, updateData: any) {
    const result = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getContributorMetrics(userId: string) {
    const totalPosts = await db.select({ count: count() }).from(posts).where(eq(posts.authorId, userId));
    const approvedPosts = await db.select({ count: count() }).from(posts).where(and(eq(posts.authorId, userId), eq(posts.status, 'approved')));
    const pendingPosts = await db.select({ count: count() }).from(posts).where(and(eq(posts.authorId, userId), eq(posts.status, 'pending')));
    const rejectedPosts = await db.select({ count: count() }).from(posts).where(and(eq(posts.authorId, userId), eq(posts.status, 'rejected')));

    return {
      totalPosts: totalPosts[0].count,
      approvedPosts: approvedPosts[0].count,
      pendingPosts: pendingPosts[0].count,
      rejectedPosts: rejectedPosts[0].count
    };
  }

  async listContributorMetrics() {
    const contributors = await db.select().from(users).where(eq(users.role, 'contributor'));
    const metrics = await Promise.all(
      contributors.map(async (contributor) => {
        const userMetrics = await this.getContributorMetrics(contributor.id);
        return {
          user: contributor,
          ...userMetrics
        };
      })
    );
    return metrics;
  }
}

export const storage = new Storage();