import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from './_lib/auth';
import { storage } from './_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userPayload = await authenticateUser(req);
    
    if (!userPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.getUser(userPayload.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      // Admin gets global stats
      const allPosts = await storage.getAllPosts();
      const totalPosts = allPosts.length;
      const pendingPosts = allPosts.filter(p => p.status === 'pending').length;
      const approvedPosts = allPosts.filter(p => p.status === 'approved').length;
      const rejectedPosts = allPosts.filter(p => p.status === 'rejected').length;

      return res.status(200).json({
        totalPosts,
        pendingPosts,
        approvedPosts,
        rejectedPosts
      });
    } else {
      // Contributors get their own stats
      const metrics = await storage.getContributorMetrics(userPayload.userId);
      return res.status(200).json(metrics);
    }

  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}