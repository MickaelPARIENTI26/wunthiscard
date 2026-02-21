/**
 * Password hashing utilities using bcrypt (cost 12)
 * Includes migration support for legacy scrypt hashes
 */
import bcrypt from 'bcryptjs';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Bcrypt cost factor (12 as per security_rules.md)
const BCRYPT_COST = 12;

/**
 * Hash format detection
 * - bcrypt: $2a$, $2b$, or $2y$ prefix
 * - scrypt: salt:derivedKey format (hex:hex)
 */
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}

function isScryptHash(hash: string): boolean {
  const parts = hash.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  return salt !== undefined && key !== undefined && /^[0-9a-f]+$/.test(salt) && /^[0-9a-f]+$/.test(key);
}

/**
 * Hash a password using bcrypt with cost factor 12
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Verify a password against a stored hash
 * Supports both bcrypt and legacy scrypt formats for migration
 *
 * @returns Object with isValid flag and needsRehash if using legacy format
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  // Bcrypt hash (preferred)
  if (isBcryptHash(hash)) {
    const isValid = await bcrypt.compare(password, hash);
    return { isValid, needsRehash: false };
  }

  // Legacy scrypt hash (needs migration)
  if (isScryptHash(hash)) {
    const [salt, key] = hash.split(':');
    if (!salt || !key) {
      return { isValid: false, needsRehash: false };
    }

    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
      const isValid = timingSafeEqual(keyBuffer, derivedKey);
      return { isValid, needsRehash: isValid }; // Only rehash if password is valid
    } catch {
      return { isValid: false, needsRehash: false };
    }
  }

  // Unknown hash format
  return { isValid: false, needsRehash: false };
}
