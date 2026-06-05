import crypto from 'crypto';
import { prisma } from './prisma.js';

// Crockford-style base32, minus ambiguous chars (no I, L, O, U, 0, 1).
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateHouseholdCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

// Generate a household code guaranteed not to collide with an existing one.
// Shared by registration (auth) and code rotation (users).
export async function uniqueHouseholdCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateHouseholdCode();
    const exists = await prisma.user.findUnique({ where: { householdCode: code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique household code');
}

export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Device tokens are 256-bit random, so a fast queryable hash is appropriate
// (unlike low-entropy PINs/passwords, which need bcrypt).
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
