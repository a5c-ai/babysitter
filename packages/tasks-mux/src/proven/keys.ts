import { generateKeyPairSync, createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { PublicKeyRecord, PrivateKeyRecord } from "./types.js";

/**
 * Generate a new Ed25519 key pair for a responder.
 */
export function generateKeyPair(
  responderId: string,
  responderName: string,
): { publicKeyRecord: PublicKeyRecord; privateKeyRecord: PrivateKeyRecord } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");

  const pubDer = publicKey.export({ type: "spki", format: "der" });
  const privPkcs8 = privateKey.export({ type: "pkcs8", format: "der" });

  const fingerprint = createHash("sha256").update(pubDer).digest("hex");
  const now = new Date().toISOString();

  return {
    publicKeyRecord: {
      publicKey: pubDer.toString("base64"),
      metadata: {
        fingerprint,
        responderId,
        responderName,
        createdAt: now,
      },
    },
    privateKeyRecord: {
      privateKey: privPkcs8.toString("base64"),
      fingerprint,
      responderId,
    },
  };
}

/**
 * Save a public key to the trusted keys directory (git-tracked).
 */
export async function saveTrustedPublicKey(
  publicKeyRecord: PublicKeyRecord,
  baseDir?: string,
): Promise<string> {
  const dir = baseDir
    ? path.join(baseDir, ".keys", "trusted")
    : path.resolve(process.cwd(), ".breakpoints", ".keys", "trusted");
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${publicKeyRecord.metadata.fingerprint}.pub.json`);
  await fs.writeFile(filePath, JSON.stringify(publicKeyRecord, null, 2) + "\n", "utf-8");
  return filePath;
}

/**
 * Save a private key to the private keys directory (gitignored).
 */
export async function savePrivateKey(
  privateKeyRecord: PrivateKeyRecord,
  baseDir?: string,
): Promise<string> {
  const dir = baseDir
    ? path.join(baseDir, ".keys", "private")
    : path.resolve(process.cwd(), ".breakpoints", ".keys", "private");
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${privateKeyRecord.fingerprint}.key.json`);
  await fs.writeFile(filePath, JSON.stringify(privateKeyRecord, null, 2) + "\n", "utf-8");
  return filePath;
}

/**
 * Load all trusted public keys from the trusted directory.
 */
export async function loadTrustedPublicKeys(
  baseDir?: string,
): Promise<PublicKeyRecord[]> {
  const dir = baseDir
    ? path.join(baseDir, ".keys", "trusted")
    : path.resolve(process.cwd(), ".breakpoints", ".keys", "trusted");

  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }

  const keys: PublicKeyRecord[] = [];
  for (const file of files) {
    if (!file.endsWith(".pub.json")) continue;
    const raw = await fs.readFile(path.join(dir, file), "utf-8");
    keys.push(JSON.parse(raw) as PublicKeyRecord);
  }
  return keys;
}

/**
 * Load a private key by fingerprint.
 */
export async function loadPrivateKey(
  fingerprint: string,
  baseDir?: string,
): Promise<PrivateKeyRecord | null> {
  const dir = baseDir
    ? path.join(baseDir, ".keys", "private")
    : path.resolve(process.cwd(), ".breakpoints", ".keys", "private");

  const filePath = path.join(dir, `${fingerprint}.key.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as PrivateKeyRecord;
  } catch {
    return null;
  }
}

/**
 * Rotate a key: generate new pair, save both, mark old public key as expired.
 */
export async function rotateKey(
  responderId: string,
  responderName: string,
  oldFingerprint: string,
  baseDir?: string,
): Promise<{ publicKeyRecord: PublicKeyRecord; privateKeyRecord: PrivateKeyRecord }> {
  // Mark old key as expired
  const trustedDir = baseDir
    ? path.join(baseDir, ".keys", "trusted")
    : path.resolve(process.cwd(), ".breakpoints", ".keys", "trusted");
  const oldKeyPath = path.join(trustedDir, `${oldFingerprint}.pub.json`);
  try {
    const raw = await fs.readFile(oldKeyPath, "utf-8");
    const oldKey = JSON.parse(raw) as PublicKeyRecord;
    oldKey.metadata.expiresAt = new Date().toISOString();
    oldKey.metadata.note = `Rotated. Superseded by new key for ${responderId}.`;
    await fs.writeFile(oldKeyPath, JSON.stringify(oldKey, null, 2) + "\n", "utf-8");
  } catch {
    // Old key may not exist; that's fine
  }

  // Generate and save new pair
  const newPair = generateKeyPair(responderId, responderName);
  await saveTrustedPublicKey(newPair.publicKeyRecord, baseDir);
  await savePrivateKey(newPair.privateKeyRecord, baseDir);
  return newPair;
}

export type { PublicKeyRecord, PrivateKeyRecord, KeyPairMetadata } from "./types.js";
