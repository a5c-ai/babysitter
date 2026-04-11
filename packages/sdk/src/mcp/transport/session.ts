/**
 * GAP-REMOTE-003: WebSocket Session Manager.
 *
 * Tracks active sessions with unique IDs, supports reconnection by session ID.
 */

import type { WebSocketSession } from "./types";
import * as crypto from "node:crypto";

export class WebSocketSessionManager {
  private sessions = new Map<string, WebSocketSession>();

  createSession(): WebSocketSession {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const session: WebSocketSession = {
      sessionId,
      connectedAt: now,
      lastActivity: now,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  restoreSession(sessionId: string): WebSocketSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.lastActivity = new Date().toISOString();
    return session;
  }

  removeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getSession(sessionId: string): WebSocketSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  listSessions(): WebSocketSession[] {
    return [...this.sessions.values()];
  }

  getActiveCount(): number {
    return this.sessions.size;
  }
}
