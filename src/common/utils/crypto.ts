import crypto from 'crypto';
import * as argon2 from 'argon2';

/**
 * Generate secure alphanumeric registration number (e.g. CA-2027-K7P4XM)
 */
export function generateRegistrationNo(academicYear = '2027/2028'): string {
  const yearPrefix = academicYear.split('/')[0] || '2027';
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `CA-${yearPrefix}-${randomChars}`;
}

/**
 * Generate cryptographically secure random session token (hex)
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash token using SHA256 for secure database lookup
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Hash password with Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1
  });
}

/**
 * Verify password against Argon2id hash
 */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
