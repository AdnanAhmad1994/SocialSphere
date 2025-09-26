import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from '../_lib/auth';
import { storage } from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userPayload = await authenticateUser(req);
    
    if (!userPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const metrics = await storage.getContributorMetrics(userPayload.userId);
    return res.status(200).json(metrics);

  } catch (error) {
    console.error('Metrics API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}