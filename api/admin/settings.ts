import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from '../_lib/auth';
import { storage } from '../_lib/storage';
import { settingsSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    if (req.method === 'GET') {
      const settings = await storage.getSettings();
      return res.status(200).json(settings);
    }
    
    if (req.method === 'PATCH') {
      try {
        const validatedSettings = settingsSchema.parse(req.body);
        const updatedSettings = await storage.updateSettings(validatedSettings);
        return res.status(200).json(updatedSettings);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid settings data', error });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Settings API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}