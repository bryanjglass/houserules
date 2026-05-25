import crypto from 'crypto';

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

export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Device tokens are 256-bit random, so a fast queryable hash is appropriate
// (unlike low-entropy PINs/passwords, which need bcrypt).
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
