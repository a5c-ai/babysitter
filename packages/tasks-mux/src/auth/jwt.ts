import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

import type { JWTPayload } from "./types.js";
import { JWTPayloadSchema } from "./types.js";

// ── Constants ─────────────────────────────────────────────────────────────

const ALGORITHM = "HS256";
const DEFAULT_ACCESS_TOKEN_EXPIRY: StringValue = "1h";
const DEFAULT_REFRESH_TOKEN_EXPIRY: StringValue = "7d";

// ── Sign / Verify ─────────────────────────────────────────────────────────

/**
 * Sign a JWT access token with the given payload and secret.
 */
export function signAccessToken(
  payload: Pick<JWTPayload, "sub" | "login" | "name">,
  secret: string,
  expiresIn: StringValue | number = DEFAULT_ACCESS_TOKEN_EXPIRY,
): string {
  return jwt.sign(
    { ...payload, type: "access" },
    secret,
    { algorithm: ALGORITHM, expiresIn },
  );
}

/**
 * Sign a JWT refresh token with the given payload and secret.
 */
export function signRefreshToken(
  payload: Pick<JWTPayload, "sub" | "login" | "name">,
  secret: string,
  expiresIn: StringValue | number = DEFAULT_REFRESH_TOKEN_EXPIRY,
): string {
  return jwt.sign(
    { ...payload, type: "refresh" },
    secret,
    { algorithm: ALGORITHM, expiresIn },
  );
}

/**
 * Verify a JWT token and return its decoded payload.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string, secret: string): JWTPayload {
  const decoded = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  const result = JWTPayloadSchema.parse(decoded);
  return result;
}

/**
 * Refresh an access token using a valid refresh token.
 * Returns a new access token and a new refresh token.
 */
export function refreshAccessToken(
  refreshToken: string,
  secret: string,
): { accessToken: string; refreshToken: string } {
  const payload = verifyToken(refreshToken, secret);

  if (payload.type !== "refresh") {
    throw new Error("Token is not a refresh token");
  }

  const tokenPayload = { sub: payload.sub, login: payload.login, name: payload.name };

  return {
    accessToken: signAccessToken(tokenPayload, secret),
    refreshToken: signRefreshToken(tokenPayload, secret),
  };
}
