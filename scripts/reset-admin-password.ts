import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting admin password...');
    
    const newPassword = '8888888';
    const hashedPassword = await hashPassword(newPassword);
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        mustResetPassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, 'founder_bindiya_rajput'))
      .returning();
    
    if (updatedUser) {
      console.log('✅ Admin password reset successfully!');
      console.log(`   Username: ${updatedUser.username}`);
      console.log(`   New Password: ${newPassword}`);
    } else {
      console.log('❌ Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
