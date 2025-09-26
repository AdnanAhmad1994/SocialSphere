import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from '../../../_lib/auth';
import { storage } from '../../../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userPayload = await authenticateUser(req);
    
    if (!userPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is admin
    const user = await storage.getUser(userPayload.userId);
    if (user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.query;
    const { shareableLink } = req.body;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    const post = await storage.getPostById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const updatedPost = await storage.updatePostStatus(id, 'approved', shareableLink);
    return res.status(200).json(updatedPost);

  } catch (error) {
    console.error('Approve post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}