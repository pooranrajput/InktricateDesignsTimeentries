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
    // Handle new format: salt:hash
    if (stored.includes(':')) {
      const parts = stored.split(':');
      if (parts.length !== 2) return false;
      const [salt, hash] = parts;
      if (!salt || !hash) return false;
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      const hashedBuf = Buffer.from(hash, 'hex');
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }

    // Handle old format: hash.salt (fallback)
    const parts = stored.split(".");
    if (parts.length !== 2) return false;
    const [hashed, salt] = parts;
    if (!hashed || !salt) return false;
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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || !!process.env.REPL_SLUG,
      sameSite: 'lax',
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
          return done(null, false);
        }

        if (!user.password) {
          return done(null, false);
        }

        const isValid = await comparePasswords(password, user.password);
        
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

  // Note: /api/user and /api/reset-password are defined in routes.ts to avoid duplicate route handlers
}

// Bootstrap admin user on startup - only creates if no admin exists (never resets existing passwords)
export async function bootstrapAdminUser() {
  try {
    const existingAdmins = await storage.getAllEmployees();
    const adminUsers = existingAdmins.filter(user => user.role === 'admin' && user.password);

    if (adminUsers.length > 0) {
      // Admin already exists - do NOT reset their password
      return adminUsers[0];
    }

    // No admin found - create one
    let existingUser = await storage.getUserByUsername('admin');
    if (!existingUser) {
      existingUser = await storage.getUserByEmail('admin@inktricate.com');
    }

    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMe2024!';
    const hashedPassword = await hashPassword(defaultPassword);

    let adminUser;

    if (existingUser) {
      adminUser = await storage.updateUserCredentials(
        existingUser.id,
        existingUser.username || 'admin',
        hashedPassword
      );

      if (adminUser.role !== 'admin') {
        adminUser = await storage.updateUserRole(adminUser.id, 'admin');
      }
    } else {
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

    console.log('Admin user bootstrapped - please change password on first login');
    return adminUser;
  } catch (error) {
    console.error('Failed to bootstrap admin user:', error);
    throw error;
  }
}

export { hashPassword, comparePasswords };