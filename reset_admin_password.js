import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const newPassword = 'admin123';
  const hash = await hashPassword(newPassword);
  console.log(`Password hash for '${newPassword}': ${hash}`);
}

main().catch(console.error);