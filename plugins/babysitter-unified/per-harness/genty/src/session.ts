/**
 * BabysitterSessionProvider — implements the SessionProvider interface
 * using babysitter-sdk session marker utilities.
 */

import type { SessionProvider } from "@a5c-ai/genty-platform/orchestration";
import {
  resolveSessionIdWithMarker,
  writeSessionMarker,
} from "@a5c-ai/babysitter-sdk";

const DEFAULT_HARNESS = "genty";

export class BabysitterSessionProvider implements SessionProvider {
  private readonly harness: string;

  constructor(harness?: string) {
    this.harness = harness ?? DEFAULT_HARNESS;
  }

  resolveSessionId(): string | undefined {
    // Check AGENT_SESSION_ID env var first, then fall back to session markers
    const envSessionId = process.env.AGENT_SESSION_ID;
    if (envSessionId) {
      return envSessionId;
    }

    return resolveSessionIdWithMarker(this.harness, {});
  }

  async bindSession(runId: string, sessionId: string): Promise<void> {
    // Write a session marker so subsequent calls in the same process tree
    // can discover this session
    writeSessionMarker(this.harness, sessionId);

    // Also set the env var for child processes
    process.env.AGENT_SESSION_ID = sessionId;
  }
}
