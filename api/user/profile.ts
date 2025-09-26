import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from '../_lib/auth';
import { storage } from '../_lib/storage';
import { updateUserSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userPayload = await authenticateUser(req);
    
    if (!userPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const user = await storage.getUser(userPayload.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't expose password hash
      const { password, ...safeUser } = user;
      return res.status(200).json(safeUser);
    }
    
    if (req.method === 'PATCH') {
      try {
        const validatedData = updateUserSchema.parse(req.body);
        const updatedUser = await storage.updateUser(userPayload.userId, validatedData);
        
        // Don't expose password hash
        const { password, ...safeUser } = updatedUser;
        return res.status(200).json(safeUser);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid profile data', error });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Profile API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}