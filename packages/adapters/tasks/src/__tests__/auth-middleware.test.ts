import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthMiddleware } from "../auth/middleware.js";
import { signAccessToken, signRefreshToken } from "../auth/jwt.js";

// ────────────────────────────────────────────────────────────────────────────
// Mock Express req/res/next
// ────────────────────────────────────────────────────────────────────────────

interface MockRequest {
  headers: Record<string, string>;
  user?: unknown;
}

interface MockResponse {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
}

function createMockReq(authorization?: string): MockRequest {
  return {
    headers: authorization ? { authorization } : {},
  };
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

const SECRET = "test-middleware-secret";
const PAYLOAD = { sub: "user-123", login: "tal", name: "Tal M" };

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("Auth Middleware", () => {
  // ── Required mode ───────────────────────────────────────────────────────

  describe("required mode", () => {
    it("should return 401 when no Authorization header is present", () => {
      const middleware = createAuthMiddleware({ secret: SECRET, required: true });
      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Bearer token") }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when Authorization header does not start with Bearer", () => {
      const middleware = createAuthMiddleware({ secret: SECRET, required: true });
      const req = createMockReq("Basic dGVzdDp0ZXN0");
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when token is invalid", () => {
      const middleware = createAuthMiddleware({ secret: SECRET, required: true });
      const req = createMockReq("Bearer invalid-token");
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Invalid or expired") }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when token is expired", () => {
      const middleware = createAuthMiddleware({ secret: SECRET, required: true });
      const expiredToken = signAccessToken(PAYLOAD, SECRET, 0);
      const req = createMockReq(`Bearer ${expiredToken}`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when token is signed with wrong secret", () => {
      const middleware = createAuthMiddleware({ secret: SECRET, required: true });
      const wrongToken = signAccessToken(PAYLOAD, "wrong-secret");
      const req = createMockReq(`Bearer ${wrongToken}`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next() and set req.user when token is valid", () => {
      const middleware = createAuthMiddleware({ secret: SECRET, required: true });
      const token = signAccessToken(PAYLOAD, SECRET);
      const req = createMockReq(`Bearer ${token}`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect((req.user as any).sub).toBe("user-123");
      expect((req.user as any).login).toBe("tal");
      expect((req.user as any).name).toBe("Tal M");
      expect((req.user as any).type).toBe("access");
    });
  });

  // ── Optional mode (default) ─────────────────────────────────────────────

  describe("optional mode (default)", () => {
    it("should call next() without error when no Authorization header", () => {
      const middleware = createAuthMiddleware({ secret: SECRET });
      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
    });

    it("should call next() without error when token is invalid", () => {
      const middleware = createAuthMiddleware({ secret: SECRET });
      const req = createMockReq("Bearer invalid-token");
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
    });

    it("should set req.user when valid token is provided", () => {
      const middleware = createAuthMiddleware({ secret: SECRET });
      const token = signAccessToken(PAYLOAD, SECRET);
      const req = createMockReq(`Bearer ${token}`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect((req.user as any).sub).toBe("user-123");
    });

    it("should call next() when Authorization header is not Bearer type", () => {
      const middleware = createAuthMiddleware({ secret: SECRET });
      const req = createMockReq("Basic dGVzdA==");
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
    });
  });

  // ── Token extraction ────────────────────────────────────────────────────

  describe("token extraction", () => {
    it("should extract token after 'Bearer ' prefix (7 chars)", () => {
      const middleware = createAuthMiddleware({ secret: SECRET, required: true });
      const token = signAccessToken(PAYLOAD, SECRET);
      const req = createMockReq(`Bearer ${token}`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
    });

    it("should work with refresh tokens too (verifyToken accepts both types)", () => {
      const middleware = createAuthMiddleware({ secret: SECRET, required: true });
      const token = signRefreshToken(PAYLOAD, SECRET);
      const req = createMockReq(`Bearer ${token}`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect((req.user as any).type).toBe("refresh");
    });
  });
});
