import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
// import { storage } from './storage'; // Will be imported inline to avoid circular dependency

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export function extractToken(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookies for token
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }
  
  return null;
}

export async function authenticateUser(req: any): Promise<JwtPayload | null> {
  const token = extractToken(req);
  if (!token) {
    return null;
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }
  
  // Verify user still exists
  const { storage } = await import('./storage');
  const user = await storage.getUser(payload.userId);
  if (!user) {
    return null;
  }
  
  return payload;
}

export async function authenticateAdmin(email: string, password: string): Promise<any | null> {
  try {
    const { storage } = await import('./storage');
    const user = await storage.authenticateAdmin(email, password);
    return user;
  } catch (error) {
    return null;
  }
}

export async function authenticateWhitelistedUser(email: string): Promise<any | null> {
  try {
    const { storage } = await import('./storage');
    const user = await storage.authenticateWhitelistedUser(email);
    return user;
  } catch (error) {
    return null;
  }
}