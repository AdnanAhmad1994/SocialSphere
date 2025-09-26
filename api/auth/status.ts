import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req);
    
    if (!user) {
      return res.status(200).json({
        authenticated: false,
        user: null
      });
    }

    res.status(200).json({
      authenticated: true,
      user: user
    });

  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}