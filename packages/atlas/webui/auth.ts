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
const DEV_AUTH_SECRET = "atlas-local-dev-secret";
const DEV_LOGIN_ENABLED = /^(1|true|yes|on)$/i;

function isExplicitDevLoginEnabled(): boolean {
  return DEV_LOGIN_ENABLED.test(process.env.ATLAS_DEV_LOGIN ?? "");
}

function getAuthSecret(): string | null {
  const value = process.env.AUTH_SECRET;
  if (value && value.length > 0) {
    return value;
  }
  if (process.env.NODE_ENV === "development" || isExplicitDevLoginEnabled()) {
    return DEV_AUTH_SECRET;
  }
  return null;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenBody(body: string): string | null {
  const secret = getAuthSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function encodeSignedPayload(payload: Record<string, unknown>): string | null {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = signTokenBody(body);
  if (!signature) return null;
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
  if (!expectedSignature) return null;
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

export function getGitHubClientConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isDevelopmentMockLoginEnabled(): boolean {
  return !getGitHubClientConfig() && (process.env.NODE_ENV === "development" || isExplicitDevLoginEnabled());
}

export function createDevelopmentSessionUser(): AtlasSessionUser {
  return {
    id: process.env.ATLAS_DEV_LOGIN_ID?.trim() || "atlas-dev-user",
    email: process.env.ATLAS_DEV_LOGIN_EMAIL?.trim() || "dev@localhost",
    name: process.env.ATLAS_DEV_LOGIN_NAME?.trim() || "Atlas Dev",
    image: null,
    login: process.env.ATLAS_DEV_LOGIN_HANDLE?.trim() || "atlas-dev",
  };
}

export function buildAppOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const protocol = forwardedProto ?? url.protocol.replace(/:$/, "");
  const host = forwardedHost ?? request.headers.get("host") ?? url.host;
  return `${protocol}://${host}`;
}

export function createOAuthStateToken(callbackUrl: string): string | null {
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

export function createSessionToken(user: AtlasSessionUser): string | null {
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
