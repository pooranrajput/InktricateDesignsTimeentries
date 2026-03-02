import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    console.log('🔐 comparePasswords called with:', { supplied: supplied.length + ' chars', stored: stored.substring(0, 20) + '...' });
    
    // Handle new format: salt:hash
    if (stored.includes(':')) {
      const parts = stored.split(':');
      console.log('🔐 Split parts:', { count: parts.length, part1Length: parts[0]?.length, part2Length: parts[1]?.length });
      
      if (parts.length !== 2) {
        console.error('Invalid password format (colon):', stored.substring(0, 20));
        return false;
      }
      const [salt, hash] = parts;
      console.log('🔐 Salt and hash extracted:', { saltLength: salt?.length, hashLength: hash?.length });
      
      if (!salt || !hash) {
        console.error('Missing salt or hash in colon format');
        return false;
      }
      
      console.log('🔐 About to call scryptAsync with salt length:', salt.length);
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      const hashedBuf = Buffer.from(hash, 'hex');
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }
    
    // Handle old format: hash.salt (fallback)
    const parts = stored.split(".");
    if (parts.length !== 2) {
      console.error('Invalid password format (dot):', stored.substring(0, 20));
      return false;
    }
    const [hashed, salt] = parts;
    if (!hashed || !salt) {
      console.error('Missing hash or salt in dot format');
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'sessions',
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: false, // Allow client access for debugging
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax', // Allow cross-site requests
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find user by username (case-insensitive) or email
        let user = await storage.getUserByUsername(username.toLowerCase());
        
        // If not found by username, try by email
        if (!user) {
          user = await storage.getUserByEmail(username.toLowerCase());
        }
        
        if (!user || !user.isActive) {
          console.log('🔐 User not found or inactive:', { found: !!user, active: user?.isActive });
          return done(null, false);
        }
        
        if (!user.password) {
          console.log('🔐 User has no password');
          return done(null, false);
        }
        
        console.log('🔐 Comparing passwords for user:', user.username);
        console.log('🔐 Password format check:', { 
          hasColon: user.password.includes(':'), 
          length: user.password.length,
          firstChars: user.password.substring(0, 10)
        });
        
        const isValid = await comparePasswords(password, user.password);
        console.log('🔐 Password valid:', isValid);
        
        if (!isValid) {
          return done(null, false);
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id.toString());
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Auth routes
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    const sessionId = req.sessionID;
    
    // First logout from passport
    req.logout((err) => {
      if (err) {
        console.error('Passport logout error:', err);
      }
      
      // Then destroy the session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ error: 'Failed to destroy session' });
          }
          
          // Clear cookies
          res.clearCookie('connect.sid', { path: '/' });
          res.clearCookie('session', { path: '/' });
          
          console.log(`Session ${sessionId} destroyed successfully`);
          res.sendStatus(200);
        });
      } else {
        res.clearCookie('connect.sid', { path: '/' });
        res.sendStatus(200);
      }
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Password reset
  app.post("/api/reset-password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const hashedPassword = await hashPassword(newPassword);
      const user = await storage.updatePassword(req.user!.id.toString(), hashedPassword);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
}

// Bootstrap admin user on startup to fix authentication deadlock
export async function bootstrapAdminUser() {
  try {
    console.log('🚀 Checking for admin user bootstrap...');
    
    // Check if any admin user exists
    const existingAdmins = await storage.getAllEmployees();
    const adminUsers = existingAdmins.filter(user => user.role === 'admin' && user.password);
    
    if (adminUsers.length > 0) {
      console.log(`✅ Admin user already exists: ${adminUsers[0].username}`);
      
      // FORCE UPDATE: Reset admin password to ensure proper format for authentication
      console.log('🔧 Force-updating admin password to ensure authentication compatibility...');
      const defaultPassword = '88888888';
      const hashedPassword = await hashPassword(defaultPassword);
      
      const updatedAdmin = await storage.updatePassword(adminUsers[0].id, hashedPassword);
      console.log(`✅ Admin password updated with proper hash format`);
      
      return updatedAdmin;
    }
    
    console.log('🔧 No admin user found, creating bootstrap admin...');
    
    // Check if user with admin username/email already exists
    let existingUser = await storage.getUserByUsername('admin');
    if (!existingUser) {
      existingUser = await storage.getUserByEmail('admin@inktricate.com');
    }
    
    const defaultPassword = '88888888';
    const hashedPassword = await hashPassword(defaultPassword);
    
    let adminUser;
    
    if (existingUser) {
      // Update existing user to be admin with proper password
      console.log(`🔧 Upgrading existing user ${existingUser.username} to admin...`);
      adminUser = await storage.updateUserCredentials(
        existingUser.id,
        existingUser.username || 'admin',
        hashedPassword
      );
      
      // Ensure role is admin
      if (adminUser.role !== 'admin') {
        adminUser = await storage.updateUserRole(adminUser.id, 'admin');
      }
    } else {
      // Create new admin user
      console.log('🔧 Creating new admin user...');
      adminUser = await storage.createEmployee({
        username: 'admin',
        email: 'admin@inktricate.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        hourlyRate: '0.00',
        password: hashedPassword,
        mustResetPassword: true,
        isActive: true
      });
    }
    
    console.log(`✅ Admin user bootstrapped successfully: ${adminUser.username} (${adminUser.email})`);
    console.log('⚠️  Please change password on first login for security');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Failed to bootstrap admin user:', error);
    throw error;
  }
}

export { hashPassword };