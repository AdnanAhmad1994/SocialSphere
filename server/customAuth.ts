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
    const validation = adminLoginSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: fromZodError(validation.error).toString() 
      });
    }
    
    const { email, password } = validation.data;
    const user = await storage.authenticateAdmin(email, password);
    
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
    
    res.json({ 
      success: true, 
      user: req.session.user 
    });
    
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Custom whitelisted user login with email only
customAuthRouter.post('/api/auth/email-login', async (req, res) => {
  try {
    const validation = emailLoginSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: fromZodError(validation.error).toString() 
      });
    }
    
    const { email } = validation.data;
    const user = await storage.authenticateWhitelistedUser(email);
    
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
    
    res.json({ 
      success: true, 
      user: req.session.user 
    });
    
  } catch (error) {
    console.error("Email login error:", error);
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