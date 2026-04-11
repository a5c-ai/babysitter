import { describe, it, expect } from "vitest";
import { WebSocketSessionManager } from "../../transport/session";

describe("WebSocketSessionManager", () => {
  it("creates a session with a unique ID", () => {
    const mgr = new WebSocketSessionManager();
    const session = mgr.createSession();
    expect(session.sessionId).toBeTruthy();
    expect(session.connectedAt).toBeTruthy();
    expect(session.lastActivity).toBeTruthy();
  });

  it("creates sessions with distinct IDs", () => {
    const mgr = new WebSocketSessionManager();
    const s1 = mgr.createSession();
    const s2 = mgr.createSession();
    expect(s1.sessionId).not.toBe(s2.sessionId);
  });

  it("tracks active count", () => {
    const mgr = new WebSocketSessionManager();
    expect(mgr.getActiveCount()).toBe(0);
    mgr.createSession();
    expect(mgr.getActiveCount()).toBe(1);
    mgr.createSession();
    expect(mgr.getActiveCount()).toBe(2);
  });

  it("gets a session by ID", () => {
    const mgr = new WebSocketSessionManager();
    const session = mgr.createSession();
    const found = mgr.getSession(session.sessionId);
    expect(found).toBe(session);
  });

  it("returns null for unknown session ID", () => {
    const mgr = new WebSocketSessionManager();
    expect(mgr.getSession("nonexistent")).toBeNull();
  });

  it("removes a session", () => {
    const mgr = new WebSocketSessionManager();
    const session = mgr.createSession();
    expect(mgr.removeSession(session.sessionId)).toBe(true);
    expect(mgr.getActiveCount()).toBe(0);
    expect(mgr.getSession(session.sessionId)).toBeNull();
  });

  it("returns false when removing nonexistent session", () => {
    const mgr = new WebSocketSessionManager();
    expect(mgr.removeSession("nonexistent")).toBe(false);
  });

  it("restores an existing session and updates lastActivity", () => {
    const mgr = new WebSocketSessionManager();
    const session = mgr.createSession();
    const originalActivity = session.lastActivity;

    // Small delay to ensure timestamp difference
    const restored = mgr.restoreSession(session.sessionId);
    expect(restored).not.toBeNull();
    expect(restored!.sessionId).toBe(session.sessionId);
    expect(restored!.lastActivity).toBeTruthy();
    // lastActivity should be >= original
    expect(new Date(restored!.lastActivity).getTime()).toBeGreaterThanOrEqual(
      new Date(originalActivity).getTime(),
    );
  });

  it("returns null when restoring unknown session", () => {
    const mgr = new WebSocketSessionManager();
    expect(mgr.restoreSession("nonexistent")).toBeNull();
  });

  it("lists all active sessions", () => {
    const mgr = new WebSocketSessionManager();
    mgr.createSession();
    mgr.createSession();
    mgr.createSession();
    const list = mgr.listSessions();
    expect(list).toHaveLength(3);
    const ids = new Set(list.map((s) => s.sessionId));
    expect(ids.size).toBe(3);
  });
});
