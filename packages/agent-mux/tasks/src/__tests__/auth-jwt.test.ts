import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  refreshAccessToken,
} from "../auth/jwt.js";
import type { JWTPayload } from "../auth/types.js";

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

const SECRET = "test-secret-key-for-jwt-signing";

const TEST_PAYLOAD = {
  sub: "user-123",
  login: "tal",
  name: "Tal M",
};

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("JWT", () => {
  // ── signAccessToken ─────────────────────────────────────────────────────

  describe("signAccessToken()", () => {
    it("should return a valid JWT string", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);

      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should include sub, login, and name in the payload", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded.sub).toBe("user-123");
      expect(decoded.login).toBe("tal");
      expect(decoded.name).toBe("Tal M");
    });

    it("should set type to 'access'", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded.type).toBe("access");
    });

    it("should set iat (issued at) timestamp", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe("number");
    });

    it("should set exp (expiration) timestamp", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe("number");
    });

    it("should default to 1h expiry", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      const iat = decoded.iat as number;
      const exp = decoded.exp as number;
      const diff = exp - iat;

      expect(diff).toBe(3600); // 1 hour in seconds
    });

    it("should accept custom expiry string", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET, "2h");
      const decoded = jwt.decode(token) as Record<string, unknown>;

      const iat = decoded.iat as number;
      const exp = decoded.exp as number;
      const diff = exp - iat;

      expect(diff).toBe(7200); // 2 hours in seconds
    });

    it("should accept custom expiry in seconds", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET, 300);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      const iat = decoded.iat as number;
      const exp = decoded.exp as number;
      const diff = exp - iat;

      expect(diff).toBe(300); // 5 minutes
    });

    it("should use HS256 algorithm", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded?.header.alg).toBe("HS256");
    });
  });

  // ── signRefreshToken ────────────────────────────────────────────────────

  describe("signRefreshToken()", () => {
    it("should return a valid JWT string", () => {
      const token = signRefreshToken(TEST_PAYLOAD, SECRET);

      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should set type to 'refresh'", () => {
      const token = signRefreshToken(TEST_PAYLOAD, SECRET);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded.type).toBe("refresh");
    });

    it("should default to 7d expiry", () => {
      const token = signRefreshToken(TEST_PAYLOAD, SECRET);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      const iat = decoded.iat as number;
      const exp = decoded.exp as number;
      const diff = exp - iat;

      expect(diff).toBe(7 * 24 * 3600); // 7 days in seconds
    });

    it("should include sub, login, and name in the payload", () => {
      const token = signRefreshToken(TEST_PAYLOAD, SECRET);
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded.sub).toBe("user-123");
      expect(decoded.login).toBe("tal");
      expect(decoded.name).toBe("Tal M");
    });

    it("should accept custom expiry", () => {
      const token = signRefreshToken(TEST_PAYLOAD, SECRET, "30d");
      const decoded = jwt.decode(token) as Record<string, unknown>;

      const iat = decoded.iat as number;
      const exp = decoded.exp as number;
      const diff = exp - iat;

      expect(diff).toBe(30 * 24 * 3600);
    });
  });

  // ── verifyToken ─────────────────────────────────────────────────────────

  describe("verifyToken()", () => {
    it("should verify and return payload for a valid access token", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);
      const payload = verifyToken(token, SECRET);

      expect(payload.sub).toBe("user-123");
      expect(payload.login).toBe("tal");
      expect(payload.name).toBe("Tal M");
      expect(payload.type).toBe("access");
    });

    it("should verify and return payload for a valid refresh token", () => {
      const token = signRefreshToken(TEST_PAYLOAD, SECRET);
      const payload = verifyToken(token, SECRET);

      expect(payload.type).toBe("refresh");
    });

    it("should include iat and exp in the returned payload", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);
      const payload = verifyToken(token, SECRET);

      expect(typeof payload.iat).toBe("number");
      expect(typeof payload.exp).toBe("number");
    });

    it("should throw for an expired token", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET, 0);

      // Token was created with 0 expiry, so it's already expired
      expect(() => verifyToken(token, SECRET)).toThrow();
    });

    it("should throw for a token signed with a different secret", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);

      expect(() => verifyToken(token, "wrong-secret")).toThrow();
    });

    it("should throw for a malformed token", () => {
      expect(() => verifyToken("not-a-valid-jwt", SECRET)).toThrow();
    });

    it("should throw for an empty token string", () => {
      expect(() => verifyToken("", SECRET)).toThrow();
    });

    it("should throw for a token with tampered payload", () => {
      const token = signAccessToken(TEST_PAYLOAD, SECRET);
      const parts = token.split(".");
      // Tamper with the payload
      const tamperedPayload = Buffer.from(JSON.stringify({ sub: "hacker", login: "hacker", name: "Hacker", type: "access" })).toString("base64url");
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      expect(() => verifyToken(tamperedToken, SECRET)).toThrow();
    });
  });

  // ── refreshAccessToken ──────────────────────────────────────────────────

  describe("refreshAccessToken()", () => {
    it("should return new access and refresh tokens", () => {
      const refreshToken = signRefreshToken(TEST_PAYLOAD, SECRET);
      const result = refreshAccessToken(refreshToken, SECRET);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessToken).not.toBe(refreshToken);
    });

    it("should preserve sub, login, and name from the refresh token", () => {
      const refreshToken = signRefreshToken(TEST_PAYLOAD, SECRET);
      const result = refreshAccessToken(refreshToken, SECRET);

      const accessPayload = verifyToken(result.accessToken, SECRET);
      expect(accessPayload.sub).toBe("user-123");
      expect(accessPayload.login).toBe("tal");
      expect(accessPayload.name).toBe("Tal M");
    });

    it("should set type=access on the new access token", () => {
      const refreshToken = signRefreshToken(TEST_PAYLOAD, SECRET);
      const result = refreshAccessToken(refreshToken, SECRET);

      const accessPayload = verifyToken(result.accessToken, SECRET);
      expect(accessPayload.type).toBe("access");
    });

    it("should set type=refresh on the new refresh token", () => {
      const refreshToken = signRefreshToken(TEST_PAYLOAD, SECRET);
      const result = refreshAccessToken(refreshToken, SECRET);

      const refreshPayload = verifyToken(result.refreshToken, SECRET);
      expect(refreshPayload.type).toBe("refresh");
    });

    it("should throw when given an access token instead of refresh token", () => {
      const accessToken = signAccessToken(TEST_PAYLOAD, SECRET);

      expect(() => refreshAccessToken(accessToken, SECRET)).toThrow(
        "Token is not a refresh token",
      );
    });

    it("should throw for an expired refresh token", () => {
      const expiredRefresh = signRefreshToken(TEST_PAYLOAD, SECRET, 0);

      expect(() => refreshAccessToken(expiredRefresh, SECRET)).toThrow();
    });

    it("should throw for wrong secret", () => {
      const refreshToken = signRefreshToken(TEST_PAYLOAD, SECRET);

      expect(() => refreshAccessToken(refreshToken, "wrong-secret")).toThrow();
    });
  });
});
