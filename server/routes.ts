import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";
import { customAuthRouter, isCustomAuthenticated } from "./customAuth";
import { insertPostSchema, updatePostSchema, insertWhitelistedEmailSchema, type InsertPostData, type UpdatePostData, type InsertWhitelistedEmailData } from "@shared/schema";
import { z } from "zod";
import { uploadToObjectStorage } from "./objectStorage";

// Configure multer for file uploads (in memory for now)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware for custom authentication
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Custom authentication routes
  app.use(customAuthRouter);

  // Auth routes
  app.get('/api/auth/user', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Post routes
  app.get('/api/posts', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let posts;
      if (user.role === 'admin') {
        posts = await storage.getAllPosts();
      } else {
        posts = await storage.getPostsByUser(userId);
      }

      // Include author information for each post
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const author = await storage.getUser(post.authorId);
          return {
            ...post,
            author: author ? {
              name: `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'Unknown',
              role: author.role,
              avatar: author.profileImageUrl
            } : {
              name: 'Unknown User',
              role: 'student',
              avatar: null
            }
          };
        })
      );

      res.json(postsWithAuthors);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/pending', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const posts = await storage.getPendingPosts();
      
      // Include author information for each post
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const author = await storage.getUser(post.authorId);
          return {
            ...post,
            author: author ? {
              name: `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'Unknown',
              role: author.role,
              avatar: author.profileImageUrl
            } : {
              name: 'Unknown User',
              role: 'student',
              avatar: null
            }
          };
        })
      );

      res.json(postsWithAuthors);
    } catch (error) {
      console.error("Error fetching pending posts:", error);
      res.status(500).json({ message: "Failed to fetch pending posts" });
    }
  });

  app.post('/api/posts', isCustomAuthenticated, upload.array('images', 4), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user's email is whitelisted (admin users are exempt)
      if (user.role !== 'admin') {
        if (!user.email) {
          return res.status(403).json({ 
            message: "Your email is not available. Please contact an administrator to be added to the whitelist." 
          });
        }
        
        const isWhitelisted = await storage.isEmailWhitelisted(user.email);
        if (!isWhitelisted) {
          return res.status(403).json({ 
            message: "Your email is not authorized to submit posts. Please contact an administrator to be added to the whitelist." 
          });
        }
      }

      // Validate request body
      const validatedData = insertPostSchema.parse({
        caption: req.body.caption,
        images: []
      });

      // Upload images to object storage
      const imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        try {
          for (const file of req.files) {
            const imageUrl = await uploadToObjectStorage(file, 'posts');
            imageUrls.push(imageUrl);
          }
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          return res.status(500).json({ message: "Failed to upload images" });
        }
      }

      const post = await storage.createPost({
        caption: validatedData.caption,
        images: imageUrls.length > 0 ? imageUrls : null,
        authorId: userId,
        status: 'pending'
      });

      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.put('/api/posts/:id/approve', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      const postId = req.params.id;
      
      // Strictly enforce admin role
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const post = await storage.updatePostStatus(postId, 'approved', userId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Generate shareable link for approved posts
      const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
      const shareableLink = `${protocol}://${req.get('host')}/posts/${postId}`;
      await storage.updatePostShareableLink(postId, shareableLink);

      res.json({ ...post, shareableLink });
    } catch (error) {
      console.error("Error approving post:", error);
      res.status(500).json({ message: "Failed to approve post" });
    }
  });

  app.put('/api/posts/:id/reject', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      const postId = req.params.id;
      
      // Strictly enforce admin role
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const post = await storage.updatePostStatus(postId, 'rejected', userId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      console.error("Error rejecting post:", error);
      res.status(500).json({ message: "Failed to reject post" });
    }
  });

  // Update post content (users can edit their own posts only when pending)
  app.put('/api/posts/:id', isCustomAuthenticated, upload.array('images', 4), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      const postId = req.params.id;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get the existing post to check ownership and status
      const existingPost = await storage.getPostById(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Users can only edit their own posts or admins can edit any
      if (existingPost.authorId !== userId && user.role !== 'admin') {
        return res.status(403).json({ message: "You can only edit your own posts" });
      }

      // Posts can only be edited when pending
      if (existingPost.status !== 'pending') {
        return res.status(400).json({ message: "Only pending posts can be edited" });
      }

      const { caption } = req.body;
      const files = req.files as Express.Multer.File[];

      // Validate with zod schema
      const validation = updatePostSchema.safeParse({ caption });
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      let images: string[] | undefined;
      
      // Handle new image uploads if provided
      if (files && files.length > 0) {
        const uploadPromises = files.map(file => uploadToObjectStorage(file, 'posts'));
        images = await Promise.all(uploadPromises);
      }

      // Prepare updates
      const updates: { caption?: string; images?: string[] } = {};
      if (caption) updates.caption = caption.trim();
      if (images) updates.images = images;

      const updatedPost = await storage.updatePost(postId, updates);
      if (!updatedPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete('/api/posts/:id', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      const postId = req.params.id;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Users can delete their own posts or admins can delete any post
      if (post.authorId !== userId && user.role !== 'admin') {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }

      await storage.deletePost(postId);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Public route to view shared posts
  app.get('/posts/:id', async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getPostById(postId);
      
      if (!post || post.status !== 'approved') {
        return res.status(404).send('Post not found');
      }

      const author = await storage.getUser(post.authorId);
      const authorName = author ? 
        `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'Unknown' :
        'Unknown User';

      // Escape HTML to prevent XSS
      const escapeHtml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      };

      const escapedAuthorName = escapeHtml(authorName);
      const escapedCaption = escapeHtml(post.caption);
      const escapedDescription = escapeHtml(post.caption.substring(0, 160));

      // Simple HTML page for sharing
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline';">
          <title>Riphah School Post - ${escapedAuthorName}</title>
          <meta name="description" content="${escapedDescription}...">
          <meta property="og:title" content="Riphah School Post by ${escapedAuthorName}">
          <meta property="og:description" content="${escapedDescription}...">
          <meta property="og:type" content="article">
          <style>
            body { font-family: Inter, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; }
            .post { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; }
            .author { font-weight: 600; margin-bottom: 0.5rem; }
            .caption { line-height: 1.6; margin-bottom: 1rem; white-space: pre-wrap; }
            .images { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; }
            .images img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; }
            .meta { color: #6b7280; font-size: 0.875rem; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="post">
            <div class="author">Posted by ${escapedAuthorName}</div>
            <div class="caption">${escapedCaption}</div>
            ${post.images && post.images.length > 0 ? `
              <div class="images">
                ${post.images.map(img => `<img src="${escapeHtml(img)}" alt="Post image">`).join('')}
              </div>
            ` : ''}
            <div class="meta">
              Shared from Riphah School of Computing & Innovation • ${post.submittedAt ? new Date(post.submittedAt).toLocaleDateString() : ''}
            </div>
          </div>
        </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error("Error viewing shared post:", error);
      res.status(500).send('Error loading post');
    }
  });

  // Serve public images from object storage using express.static for security
  app.use('/public', express.static('/tmp/uploads', {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res: any, path: string) => {
      res.set('X-Content-Type-Options', 'nosniff');
      // Force image content types for security
      const ext = path.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') {
        res.set('Content-Type', 'image/jpeg');
      } else if (ext === 'png') {
        res.set('Content-Type', 'image/png');
      } else if (ext === 'gif') {
        res.set('Content-Type', 'image/gif');
      } else if (ext === 'webp') {
        res.set('Content-Type', 'image/webp');
      }
    }
  }));

  // Dashboard stats
  app.get('/api/stats', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let stats;
      if (user.role === 'admin') {
        const allPosts = await storage.getAllPosts();
        stats = {
          totalPosts: allPosts.length,
          pendingPosts: allPosts.filter(p => p.status === 'pending').length,
          approvedPosts: allPosts.filter(p => p.status === 'approved').length,
          rejectedPosts: allPosts.filter(p => p.status === 'rejected').length,
          totalUsers: 156 // TODO: Implement actual user count
        };
      } else {
        const userPosts = await storage.getPostsByUser(userId);
        stats = {
          totalPosts: userPosts.length,
          pendingPosts: userPosts.filter(p => p.status === 'pending').length,
          approvedPosts: userPosts.filter(p => p.status === 'approved').length,
          rejectedPosts: userPosts.filter(p => p.status === 'rejected').length,
          totalUsers: 0
        };
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin whitelist management routes
  app.get('/api/admin/whitelist', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const whitelistedEmails = await storage.getAllWhitelistedEmails();
      
      // Include admin information for each entry
      const emailsWithAdminInfo = await Promise.all(
        whitelistedEmails.map(async (email) => {
          const admin = await storage.getUser(email.addedBy);
          return {
            ...email,
            addedByAdmin: admin ? {
              name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email || 'Unknown',
              email: admin.email
            } : {
              name: 'Unknown Admin',
              email: null
            }
          };
        })
      );

      res.json(emailsWithAdminInfo);
    } catch (error) {
      console.error("Error fetching whitelisted emails:", error);
      res.status(500).json({ message: "Failed to fetch whitelisted emails" });
    }
  });

  app.post('/api/admin/whitelist', isCustomAuthenticated, async (req: any, res) => {
    try {
      console.log('POST /api/admin/whitelist - Request body:', req.body);
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        console.log('Admin access denied for user:', user?.email);
        return res.status(403).json({ message: "Admin access required" });
      }

      const validation = insertWhitelistedEmailSchema.safeParse(req.body);
      if (!validation.success) {
        console.log('Validation failed:', validation.error.errors);
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors
        });
      }

      const { email } = validation.data;
      
      // Check if email is already whitelisted
      const isAlreadyWhitelisted = await storage.isEmailWhitelisted(email);
      if (isAlreadyWhitelisted) {
        return res.status(409).json({ message: "Email is already whitelisted" });
      }

      const whitelistedEmail = await storage.addWhitelistedEmail(email, userId);
      res.status(201).json(whitelistedEmail);
    } catch (error) {
      console.error("Error adding whitelisted email:", error);
      res.status(500).json({ message: "Failed to add whitelisted email" });
    }
  });

  app.delete('/api/admin/whitelist/:id', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      await storage.removeWhitelistedEmail(id);
      res.json({ message: "Email removed from whitelist successfully" });
    } catch (error) {
      console.error("Error removing whitelisted email:", error);
      res.status(500).json({ message: "Failed to remove whitelisted email" });
    }
  });

  app.post('/api/admin/whitelist/bulk', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { emails, csvContent } = req.body;
      let emailsToAdd: string[] = [];

      if (csvContent) {
        // Parse CSV content (simple comma/newline separated values)
        const parsedEmails = csvContent
          .split(/[,\n\r]+/)
          .map((email: string) => email.trim())
          .filter((email: string) => email.length > 0 && email.includes('@'));
        emailsToAdd = parsedEmails;
      } else if (emails && Array.isArray(emails)) {
        emailsToAdd = emails;
      } else {
        return res.status(400).json({ message: "Either 'emails' array or 'csvContent' is required" });
      }

      if (emailsToAdd.length === 0) {
        return res.status(400).json({ message: "No valid emails provided" });
      }

      // Validate all emails
      const invalidEmails: string[] = [];
      const validEmails: string[] = [];
      
      emailsToAdd.forEach(email => {
        const validation = z.string().email().safeParse(email);
        if (validation.success) {
          validEmails.push(email);
        } else {
          invalidEmails.push(email);
        }
      });

      if (validEmails.length === 0) {
        return res.status(400).json({ 
          message: "No valid emails found", 
          invalidEmails 
        });
      }

      const addedEmails = await storage.bulkAddWhitelistedEmails(validEmails, userId);
      
      res.status(201).json({
        message: `Successfully added ${addedEmails.length} emails to whitelist`,
        addedEmails,
        skippedEmails: validEmails.length - addedEmails.length,
        invalidEmails
      });
    } catch (error) {
      console.error("Error bulk adding whitelisted emails:", error);
      res.status(500).json({ message: "Failed to bulk add whitelisted emails" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}