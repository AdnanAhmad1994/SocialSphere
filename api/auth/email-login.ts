import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateWhitelistedUser, generateToken } from '../_lib/auth';
import { z } from 'zod';

const emailLoginSchema = z.object({
  email: z.string().email("Valid email address is required"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { email } = emailLoginSchema.parse(req.body);
    
    console.log('Email login attempt:', { email });
    
    // Authenticate whitelisted user
    const user = await authenticateWhitelistedUser(email);
    
    if (!user) {
      return res.status(401).json({ message: 'Email not whitelisted or user not found' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Set token as httpOnly cookie
    res.setHeader('Set-Cookie', [
      `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
    ]);

    // Return user data
    res.status(200).json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Email login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}