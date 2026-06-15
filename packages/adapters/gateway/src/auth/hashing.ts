import { randomBytes } from 'node:crypto';

import argon2 from 'argon2';

const ARGON2_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  saltLength: 16,
  hashLength: 32,
  parallelism: 1,
  memoryCost: 64 * 1024,
  timeCost: 3,
});

export async function hashToken(plaintext: string): Promise<string> {
  return await argon2.hash(plaintext, {
    ...ARGON2_OPTIONS,
    salt: randomBytes(ARGON2_OPTIONS.saltLength),
  });
}

export async function verifyTokenHash(hash: string, plaintext: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    return false;
  }
}

export const hashSecret = hashToken;
export const verifySecretHash = verifyTokenHash;
