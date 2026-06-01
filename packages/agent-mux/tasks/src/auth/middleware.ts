import type { Request, Response, NextFunction } from "express";

import type { JWTPayload } from "./types.js";
import { verifyToken } from "./jwt.js";

// ── Augment Express Request ───────────────────────────────────────────────

declare module "express" {
  interface Request {
    user?: JWTPayload;
  }
}

// ── Options ───────────────────────────────────────────────────────────────

export interface AuthMiddlewareOpts {
  /** The secret used to verify JWT tokens. */
  secret: string;
  /** If true, returns 401 on missing or invalid token. Defaults to false. */
  required?: boolean;
}

// ── Middleware ─────────────────────────────────────────────────────────────

/**
 * Create Express middleware that extracts and verifies a JWT from the
 * Authorization: Bearer header.
 *
 * If `required` is true, returns 401 on missing or invalid tokens.
 * If `required` is false (default), continues without auth when no token is present.
 */
export function createAuthMiddleware(
  opts: AuthMiddlewareOpts,
): (req: Request, res: Response, next: NextFunction) => void {
  const { secret, required = false } = opts;

  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      if (required) {
        res.status(401).json({ error: "Authorization header with Bearer token is required" });
        return;
      }
      next();
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = verifyToken(token, secret);
      req.user = payload;
      next();
    } catch {
      if (required) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }
      next();
    }
  };
}
