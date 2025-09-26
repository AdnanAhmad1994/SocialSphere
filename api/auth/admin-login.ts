import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateAdmin, generateToken } from '../_lib/auth';
import { z } from 'zod';

const adminLoginSchema = z.object({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(1, "Password is required"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { email, password } = adminLoginSchema.parse(req.body);
    
    console.log('Admin login attempt:', { email, password });
    
    // Authenticate admin
    const user = await authenticateAdmin(email, password);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
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

    // Return user data (without password) and token for Vercel compatibility
    const { password: _, ...safeUser } = user;
    res.status(200).json({
      success: true,
      user: safeUser,
      token: token // Include token in response for localStorage storage
    });

  } catch (error) {
    console.error('Admin login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}