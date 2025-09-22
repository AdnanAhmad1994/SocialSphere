import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, type InsertPostData } from "@shared/schema";
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
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/posts/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/posts', isAuthenticated, upload.array('images', 4), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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

  app.put('/api/posts/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const postId = req.params.id;
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const post = await storage.updatePostStatus(postId, 'approved', userId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Generate shareable link for approved posts
      const shareableLink = `https://${req.hostname}/posts/${postId}`;
      await storage.updatePostShareableLink(postId, shareableLink);

      res.json({ ...post, shareableLink });
    } catch (error) {
      console.error("Error approving post:", error);
      res.status(500).json({ message: "Failed to approve post" });
    }
  });

  app.put('/api/posts/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const postId = req.params.id;
      
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

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const postId = req.params.id;
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.deletePost(postId);
      res.status(204).send();
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

      // Simple HTML page for sharing
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Riphah School Post - ${authorName}</title>
          <meta name="description" content="${post.caption.substring(0, 160)}...">
          <meta property="og:title" content="Riphah School Post by ${authorName}">
          <meta property="og:description" content="${post.caption.substring(0, 160)}...">
          <meta property="og:type" content="article">
          <style>
            body { font-family: Inter, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; }
            .post { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; }
            .author { font-weight: 600; margin-bottom: 0.5rem; }
            .caption { line-height: 1.6; margin-bottom: 1rem; }
            .images { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; }
            .images img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; }
            .meta { color: #6b7280; font-size: 0.875rem; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="post">
            <div class="author">Posted by ${authorName}</div>
            <div class="caption">${post.caption}</div>
            ${post.images && post.images.length > 0 ? `
              <div class="images">
                ${post.images.map(img => `<img src="${img}" alt="Post image">`).join('')}
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

  // Serve public images from object storage
  app.get('/public/:folder/:filename', (req, res) => {
    try {
      const { folder, filename } = req.params;
      const publicPath = `${process.env.PUBLIC_OBJECT_SEARCH_PATHS?.[0] || '/tmp'}/${folder}/${filename}`;
      res.sendFile(publicPath, (err) => {
        if (err) {
          console.error('Error serving file:', err);
          res.status(404).send('File not found');
        }
      });
    } catch (error) {
      console.error('Error serving public file:', error);
      res.status(500).send('Error serving file');
    }
  });

  // Dashboard stats
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}