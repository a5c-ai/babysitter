import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { isProcessAlive } from "../utils/processLiveness";

interface ReservationPayload {
  pid: number;
  token: string;
  acquiredAt: number;
}

interface ClaimRecord {
  token?: string;
}

export interface SessionReservation {
  lockPath: string;
  claimPath: string;
  token: string;
}

export interface SessionReservationOptions {
  timeoutMs?: number;
  staleMs?: number;
}

const DEFAULT_TIMEOUT_MS = 250;
const DEFAULT_STALE_MS = 30_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidPayload(value: unknown): value is ReservationPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Partial<ReservationPayload>;
  return typeof payload.pid === "number"
    && payload.pid > 0
    && typeof payload.token === "string"
    && payload.token.length > 0
    && typeof payload.acquiredAt === "number"
    && Number.isFinite(payload.acquiredAt);
}

async function readClaim(claimPath: string): Promise<ReservationPayload | undefined> {
  try {
    const parsed = JSON.parse(await fs.readFile(claimPath, "utf8")) as unknown;
    return isValidPayload(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function listBlockingClaims(lockPath: string, staleMs: number): Promise<ClaimRecord[]> {
  const now = Date.now();
  const bootedAt = now - os.uptime() * 1000;
  let names: string[];
  try {
    names = await fs.readdir(lockPath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    throw error;
  }

  const claims: ClaimRecord[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const claimPath = path.join(lockPath, name);
    const claim = await readClaim(claimPath);
    if (!claim) {
      try {
        const stat = await fs.stat(claimPath);
        if (now - stat.mtimeMs <= staleMs) claims.push({});
      } catch {
        // A concurrent release is harmless.
      }
      continue;
    }
    if (claim.acquiredAt < bootedAt || !isProcessAlive(claim.pid)) {
      // A stale claim has a unique immutable pathname. Its removal can never
      // target a later publisher, because valid claims are atomically renamed
      // into new UUID paths and are never rewritten in place.
      await fs.rm(claimPath, { force: true }).catch(() => undefined);
      continue;
    }
    claims.push({ token: claim.token });
  }
  return claims;
}

async function createClaim(lockPath: string): Promise<SessionReservation> {
  const token = randomUUID();
  const claimPath = path.join(lockPath, `${token}.json`);
  const temporaryPath = `${lockPath}.${token}.tmp`;
  const payload: ReservationPayload = { pid: process.pid, token, acquiredAt: Date.now() };
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  const handle = await fs.open(temporaryPath, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(payload), "utf8");
    await handle.sync();
  } catch (error) {
    await handle.close().catch(() => undefined);
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
  await handle.close();
  await fs.mkdir(lockPath, { recursive: true, mode: 0o700 });
  try {
    await fs.rename(temporaryPath, claimPath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
  return { lockPath, claimPath, token };
}

export async function acquireSessionReservation(
  stateFile: string,
  options: SessionReservationOptions = {},
): Promise<SessionReservation> {
  const lockPath = `${stateFile}.create.lock`;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
  const startedAt = Date.now();

  while (true) {
    const reservation = await createClaim(lockPath);
    const claims = await listBlockingClaims(lockPath, staleMs);
    if (claims.length === 1 && claims[0]?.token === reservation.token) return reservation;
    const tokens = claims.flatMap((claim) => claim.token ? [claim.token] : []).sort();
    const retryFirst = tokens.length === claims.length && tokens[0] === reservation.token;
    await fs.rm(reservation.claimPath, { force: true });
    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error(`OMP session reservation is busy: ${lockPath}`);
    }
    await sleep(retryFirst ? 1 : 30);
  }
}

export async function releaseSessionReservation(reservation: SessionReservation): Promise<void> {
  const owner = await readClaim(reservation.claimPath);
  if (owner?.token !== reservation.token) return;
  await fs.rm(reservation.claimPath, { force: true });
}
