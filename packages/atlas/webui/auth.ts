import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type AtlasSessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  login: string | null;
};

type SessionTokenPayload = {
  user: AtlasSessionUser;
  exp: number;
};

type OAuthStatePayload = {
  nonce: string;
  callbackUrl: string;
  exp: number;
};

type AtlasSession = {
  user: AtlasSessionUser;
};

export const ATLAS_SESSION_COOKIE = "atlas_session";
export const ATLAS_GITHUB_STATE_COOKIE = "atlas_github_oauth_state";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const STATE_TTL_MS = 1000 * 60 * 10;

function requireAuthSecret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is required for Atlas authentication.");
  }
  return value;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenBody(body: string): string {
  return createHmac("sha256", requireAuthSecret()).update(body).digest("base64url");
}

function encodeSignedPayload(payload: Record<string, unknown>): string {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = signTokenBody(body);
  return `${body}.${signature}`;
}

function decodeSignedPayload<T extends { exp?: number }>(token: string | undefined): T | null {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = signTokenBody(body);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expectedSignature);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as T;
    if (typeof payload.exp === "number" && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function normalizeCallbackUrl(raw: string | null | undefined, fallback = "/workspace"): string {
  if (!raw || typeof raw !== "string") {
    return fallback;
  }
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  return raw;
}

export function getGitHubClientConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required for Atlas authentication.");
  }
  return { clientId, clientSecret };
}

export function buildAppOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const protocol = forwardedProto ?? url.protocol.replace(/:$/, "");
  const host = forwardedHost ?? request.headers.get("host") ?? url.host;
  return `${protocol}://${host}`;
}

export function createOAuthStateToken(callbackUrl: string): string {
  const payload: OAuthStatePayload = {
    nonce: randomBytes(18).toString("base64url"),
    callbackUrl: normalizeCallbackUrl(callbackUrl),
    exp: Date.now() + STATE_TTL_MS,
  };
  return encodeSignedPayload(payload);
}

export function verifyOAuthStateToken(token: string | undefined): OAuthStatePayload | null {
  return decodeSignedPayload<OAuthStatePayload>(token);
}

export function createSessionToken(user: AtlasSessionUser): string {
  const payload: SessionTokenPayload = {
    user,
    exp: Date.now() + SESSION_TTL_MS,
  };
  return encodeSignedPayload(payload);
}

export function verifySessionToken(token: string | undefined): AtlasSession | null {
  const payload = decodeSignedPayload<SessionTokenPayload>(token);
  if (!payload?.user?.id) {
    return null;
  }
  return { user: payload.user };
}

export async function auth(): Promise<AtlasSession | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ATLAS_SESSION_COOKIE)?.value);
}
