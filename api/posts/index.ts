import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from '../_lib/auth';
import { storage } from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userPayload = await authenticateUser(req);
    
    if (!userPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get posts based on user role
      const user = await storage.getUser(userPayload.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let posts;
      if (user.role === 'admin') {
        posts = await storage.getAllPosts();
      } else {
        posts = await storage.getPostsByUser(userPayload.userId);
      }
      
      return res.status(200).json(posts);
    }
    
    if (req.method === 'POST') {
      // Create a new post
      const { caption, images } = req.body;
      
      if (!caption) {
        return res.status(400).json({ message: 'Caption is required' });
      }

      const postData = {
        caption,
        images: images || [],
        authorId: userPayload.userId,
        status: 'pending' as const
      };

      const post = await storage.createPost(postData);
      return res.status(201).json(post);
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Posts API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}