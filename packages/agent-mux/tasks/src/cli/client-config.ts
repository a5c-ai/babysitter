import { AuthClient, DEFAULT_BMUX_SERVER_URL, ServerClient } from "../client/index.js";
import { isTokenExpired, loadAuthState, loadClientConfig, saveAuthState } from "./auth-store.js";

export interface CliConnectionOptions {
  serverUrl?: string;
  authToken?: string;
}

function normalizeTrimmed(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function decodeJwtExpiry(token: string): string | undefined {
  const parts = token.split(".");
  if (parts.length < 2) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"),
    ) as { exp?: unknown };

    if (typeof payload.exp !== "number") {
      return undefined;
    }

    return new Date(payload.exp * 1000).toISOString();
  } catch {
    return undefined;
  }
}

export function resolveServerUrl(explicit?: string): string {
  const config = loadClientConfig();
  return (
    normalizeTrimmed(explicit) ??
    normalizeTrimmed(process.env.BMUX_SERVER_URL) ??
    normalizeTrimmed(process.env.SERVER_URL) ??
    normalizeTrimmed(config.serverUrl) ??
    DEFAULT_BMUX_SERVER_URL
  ).replace(/\/+$/, "");
}

export function resolveApiBaseUrl(explicit?: string): string {
  const serverUrl = resolveServerUrl(explicit);
  return serverUrl.endsWith("/api/v1") ? serverUrl : `${serverUrl}/api/v1`;
}

export async function resolveAuthToken(serverUrl?: string, explicit?: string): Promise<string | undefined> {
  const config = loadClientConfig();
  const configuredToken =
    normalizeTrimmed(explicit) ??
    normalizeTrimmed(process.env.BMUX_AUTH_TOKEN) ??
    normalizeTrimmed(process.env.AUTH_TOKEN) ??
    normalizeTrimmed(config.authToken);

  if (configuredToken) {
    return configuredToken;
  }

  const session = loadAuthState();
  if (!session?.accessToken) {
    return undefined;
  }

  if (!isTokenExpired(session.expiresAt)) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    return session.accessToken;
  }

  let refreshedTokens:
    | {
        accessToken: string;
        refreshToken: string;
      }
    | undefined;

  const client = new AuthClient({
    serverUrl: resolveApiBaseUrl(serverUrl),
    token: session.accessToken,
    refreshToken: session.refreshToken,
    onTokenRefresh: (tokens) => {
      refreshedTokens = tokens;
    },
  });

  try {
    const user = await client.getUser();
    if (refreshedTokens) {
      saveAuthState({
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken,
        expiresAt: decodeJwtExpiry(refreshedTokens.accessToken) ?? session.expiresAt,
        user,
      });
      return refreshedTokens.accessToken;
    }
  } catch {
    // Fall back to the stored token and let the command surface the real server error.
  }

  return session.accessToken;
}

export async function createCliServerClient(options: CliConnectionOptions = {}): Promise<ServerClient> {
  const baseUrl = resolveApiBaseUrl(options.serverUrl);
  const token = await resolveAuthToken(options.serverUrl, options.authToken);

  return new ServerClient({
    baseUrl,
    defaultHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
