import { Router } from "express";
import { storage } from "./storage";
import { adminLoginSchema, emailLoginSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      email: string | null;
      name: string;
      role: string;
      avatar: string | null;
    };
  }
}

export const customAuthRouter = Router();

// Custom admin login with email and password
customAuthRouter.post('/api/auth/admin-login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body);
    console.log('Storage object methods:', Object.getOwnPropertyNames(storage));
    console.log('Storage prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(storage)));
    
    const validation = adminLoginSchema.safeParse(req.body);
    
    if (!validation.success) {
      console.log('Validation failed:', validation.error);
      return res.status(400).json({ 
        message: fromZodError(validation.error).toString() 
      });
    }
    
    const { email, password } = validation.data;
    console.log('Attempting admin authentication for:', email);
    
    // Check if the method exists before calling it
    if (typeof storage.authenticateAdmin !== 'function') {
      console.error('authenticateAdmin method is not available on storage object');
      return res.status(500).json({ message: "Authentication method not available" });
    }
    
    const user = await storage.authenticateAdmin(email, password);
    console.log('Authentication result:', user ? 'Success' : 'Failed');
    
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid admin credentials" 
      });
    }
    
    // Create session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      avatar: user.profileImageUrl
    };
    
    console.log('Session created for admin user:', user.id);
    res.json({ 
      success: true, 
      user: req.session.user 
    });
    
  } catch (error) {
    console.error("Admin login error:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Custom whitelisted user login with email only
customAuthRouter.post('/api/auth/email-login', async (req, res) => {
  try {
    console.log('Email login attempt:', req.body);
    
    const validation = emailLoginSchema.safeParse(req.body);
    
    if (!validation.success) {
      console.log('Validation failed:', validation.error);
      return res.status(400).json({ 
        message: fromZodError(validation.error).toString() 
      });
    }
    
    const { email } = validation.data;
    console.log('Attempting email authentication for:', email);
    
    const user = await storage.authenticateWhitelistedUser(email);
    console.log('Authentication result:', user ? 'Success' : 'Failed');
    
    if (!user) {
      return res.status(401).json({ 
        message: "Email not authorized. Please contact administrator." 
      });
    }
    
    // Create session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      avatar: user.profileImageUrl
    };
    
    console.log('Session created for whitelisted user:', user.id);
    res.json({ 
      success: true, 
      user: req.session.user 
    });
    
  } catch (error) {
    console.error("Email login error:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Custom logout
customAuthRouter.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Check authentication status
customAuthRouter.get('/api/auth/status', (req, res) => {
  if (req.session?.user) {
    res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  } else {
    res.json({ 
      authenticated: false, 
      user: null 
    });
  }
});

// Custom authentication middleware
export const isCustomAuthenticated = (req: any, res: any, next: any) => {
  if (req.session?.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};