import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';
import type { IdentityKeyPair, SignedEnvelope } from './types.js';

export function createKeyPair(): IdentityKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const fingerprint = createHash('sha256')
    .update(publicKey)
    .digest('hex');
  return { publicKey, privateKey, fingerprint };
}

export function signPayload<T>(
  privateKey: string,
  fingerprint: string,
  payload: T,
  fields?: string[],
): SignedEnvelope<T> {
  const signedFields = fields ?? Object.keys(payload as Record<string, unknown>);
  const signedAt = new Date().toISOString();
  const canonical = canonicalize(payload, signedFields, {
    signedAt,
    signedFields,
    publicKeyFingerprint: fingerprint,
    algorithm: 'Ed25519',
  });
  const signature = sign(null, Buffer.from(canonical), privateKey).toString('base64');
  return {
    payload,
    signature,
    publicKeyFingerprint: fingerprint,
    signedAt,
    signedFields,
    algorithm: 'Ed25519',
  };
}

export function verifySignature<T>(
  publicKey: string,
  envelope: SignedEnvelope<T>,
): boolean {
  const canonical = canonicalize(envelope.payload, envelope.signedFields, {
    signedAt: envelope.signedAt,
    signedFields: envelope.signedFields,
    publicKeyFingerprint: envelope.publicKeyFingerprint,
    algorithm: envelope.algorithm,
  });
  return verify(
    null,
    Buffer.from(canonical),
    publicKey,
    Buffer.from(envelope.signature, 'base64'),
  );
}

interface EnvelopeMeta {
  signedAt: string;
  signedFields: string[];
  publicKeyFingerprint: string;
  algorithm: string;
}

function canonicalize<T>(payload: T, fields: string[], meta: EnvelopeMeta): string {
  const payloadPart = deepSortKeys(extractFields(payload as Record<string, unknown>, fields));
  return JSON.stringify({ _meta: deepSortKeys(meta), _payload: payloadPart });
}

function extractFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of [...fields].sort()) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

function deepSortKeys(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepSortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = deepSortKeys((value as Record<string, unknown>)[key]);
  }
  return sorted;
}
