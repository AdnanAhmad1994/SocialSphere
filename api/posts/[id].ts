import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from '../_lib/auth';
import { storage } from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userPayload = await authenticateUser(req);
    
    if (!userPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    if (req.method === 'GET') {
      const post = await storage.getPostById(id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check authorization
      const user = await storage.getUser(userPayload.userId);
      if (user?.role !== 'admin' && post.authorId !== userPayload.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      return res.status(200).json(post);
    }
    
    if (req.method === 'PATCH') {
      const { caption, images, status, shareableLink } = req.body;
      
      const post = await storage.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check authorization
      const user = await storage.getUser(userPayload.userId);
      if (user?.role !== 'admin' && post.authorId !== userPayload.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      let updatedPost;
      
      if (status) {
        // Status update (admin only)
        if (user?.role !== 'admin') {
          return res.status(403).json({ message: 'Only admins can change post status' });
        }
        updatedPost = await storage.updatePostStatus(id, status, shareableLink);
      } else {
        // Content update
        const updateData: any = {};
        if (caption !== undefined) updateData.caption = caption;
        if (images !== undefined) updateData.images = images;
        
        updatedPost = await storage.updatePost(id, updateData);
      }

      return res.status(200).json(updatedPost);
    }
    
    if (req.method === 'DELETE') {
      const post = await storage.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check authorization
      const user = await storage.getUser(userPayload.userId);
      if (user?.role !== 'admin' && post.authorId !== userPayload.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.deletePost(id);
      return res.status(200).json({ message: 'Post deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Post API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}