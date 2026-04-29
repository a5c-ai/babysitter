export const DEFAULT_LOCAL_GATEWAY_URL = "http://127.0.0.1:7878";
export const DEFAULT_BOOTSTRAP_LOGIN_PATH = "/api/v1/bootstrap/login";

export type GatewayAuthMode = "manual" | "bootstrap-admin";

export interface GatewayRuntimeConfig {
  defaultGatewayUrl: string | null;
  proxyGatewayUrl: string;
  authMode: GatewayAuthMode;
  bootstrapAdminUsername: string | null;
  bootstrapLoginPath: string;
}

export interface PublicGatewayRuntimeConfig {
  defaultGatewayUrl: string | null;
  authMode: GatewayAuthMode;
  bootstrapAdminUsername: string | null;
  bootstrapLoginPath: string;
}

export function sanitizeGatewayUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function normalizeGatewayUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  return sanitizeGatewayUrl(parsed.toString());
}

export function resolveGatewayAuthMode(value: string | null | undefined): GatewayAuthMode {
  if (value === "bootstrap-admin") {
    return "bootstrap-admin";
  }
  return "manual";
}

export function resolveGatewayRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): GatewayRuntimeConfig {
  const publicGatewayUrl = normalizeGatewayUrl(
    env.KANBAN_DEFAULT_GATEWAY_URL ?? env.NEXT_PUBLIC_GATEWAY_URL,
  );
  const proxyGatewayUrl =
    normalizeGatewayUrl(env.KANBAN_GATEWAY_PROXY_URL) ??
    publicGatewayUrl ??
    DEFAULT_LOCAL_GATEWAY_URL;
  const authMode = resolveGatewayAuthMode(
    env.KANBAN_GATEWAY_AUTH_MODE ?? env.CLOUD_BOOTSTRAP_AUTH_MODE,
  );
  const bootstrapAdminUsername = env.KANBAN_BOOTSTRAP_ADMIN_USERNAME?.trim()
    || env.CLOUD_BOOTSTRAP_ADMIN_USERNAME?.trim()
    || null;
  const bootstrapLoginPath = env.KANBAN_GATEWAY_BOOTSTRAP_LOGIN_PATH?.trim()
    || DEFAULT_BOOTSTRAP_LOGIN_PATH;

  return {
    defaultGatewayUrl: publicGatewayUrl,
    proxyGatewayUrl,
    authMode,
    bootstrapAdminUsername,
    bootstrapLoginPath,
  };
}

export function toPublicGatewayRuntimeConfig(
  config: GatewayRuntimeConfig,
): PublicGatewayRuntimeConfig {
  return {
    defaultGatewayUrl: config.defaultGatewayUrl,
    authMode: config.authMode,
    bootstrapAdminUsername: config.bootstrapAdminUsername,
    bootstrapLoginPath: config.bootstrapLoginPath,
  };
}

export function buildGatewayTargetUrl(
  baseUrl: string,
  pathname: string,
  search = "",
): string {
  const target = new URL(baseUrl);
  const basePath = target.pathname.replace(/\/+$/, "");
  const nextPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  target.pathname = `${basePath}${nextPath}`.replace(/\/{2,}/g, "/");
  target.search = search;
  return target.toString();
}

export function gatewayProxyPath(pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/api/gateway-proxy${normalized}`;
}

function readTokenCandidate(payload: Record<string, unknown>): string | null {
  const directKeys = ["token", "plaintext", "bearerToken", "accessToken"];
  for (const key of directKeys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  const nestedKeys = ["issuedToken", "credentials", "auth", "data"];
  for (const key of nestedKeys) {
    const value = payload[key];
    if (value && typeof value === "object") {
      const nested = extractBootstrapToken(value);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

export function extractBootstrapToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return readTokenCandidate(payload as Record<string, unknown>);
}
