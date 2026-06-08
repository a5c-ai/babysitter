/**
 * BabysitterJournalProvider — implements the JournalProvider interface
 * using babysitter-sdk's journal storage primitives.
 */

import type {
  JournalProvider,
  RunEvent,
} from "@a5c-ai/genty-platform/orchestration";
import {
  loadJournal,
  appendEvent as sdkAppendEvent,
} from "@a5c-ai/babysitter-sdk";

export class BabysitterJournalProvider implements JournalProvider {
  async loadEvents(runDir: string): Promise<RunEvent[]> {
    const events = await loadJournal(runDir);
    return events.map((e) => ({
      type: e.type,
      timestamp: e.recordedAt,
      data: e.data,
    }));
  }

  async appendEvent(runDir: string, event: RunEvent): Promise<void> {
    await sdkAppendEvent({
      runDir,
      eventType: event.type,
      event: (event.data as Record<string, unknown>) ?? {},
    });
  }
}
