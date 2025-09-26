import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userPayload = await authenticateUser(req);
    
    if (!userPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get full user data from storage
    const { storage } = await import('../_lib/storage');
    const user = await storage.getUser(userPayload.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't expose password hash
    const { password, ...safeUser } = user;
    res.status(200).json(safeUser);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}