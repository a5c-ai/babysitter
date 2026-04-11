/**
 * session:history command — Browse session history (GAP-SESSION-002).
 *
 * Displays accumulated decisions, run summaries, and context snapshots
 * for a session. Supports --json and --run-id filtering.
 */

import { getSessionHistory } from "../../session/history";
import type { SessionHistory } from "../../session/types";

export interface SessionHistoryArgs {
  sessionId: string;
  stateDir: string;
  json?: boolean;
  runId?: string;
}

export async function handleSessionHistory(args: SessionHistoryArgs): Promise<number> {
  const { sessionId, stateDir } = args;

  if (!sessionId) {
    console.error("[session:history] --session-id is required");
    return 1;
  }

  if (!stateDir) {
    console.error("[session:history] --state-dir is required");
    return 1;
  }

  const history = await getSessionHistory(stateDir, sessionId);

  // Apply run-id filter if requested
  const filtered = args.runId ? filterByRunId(history, args.runId) : history;

  if (args.json) {
    console.log(JSON.stringify(filtered, null, 2));
    return 0;
  }

  // Text mode
  renderTextHistory(filtered);
  return 0;
}

function filterByRunId(history: SessionHistory, runId: string): SessionHistory {
  return {
    notes: history.notes,
    sharedKnowledge: history.sharedKnowledge,
    decisions: history.decisions.filter((d) => d.runId === runId),
    runSummaries: history.runSummaries.filter((r) => r.runId === runId),
    contextSnapshots: history.contextSnapshots.filter((s) => s.runId === runId),
  };
}

function renderTextHistory(history: SessionHistory): void {
  console.log("=== Decisions ===");
  if (history.decisions.length === 0) {
    console.log("(none)");
  } else {
    for (const d of history.decisions) {
      const runPart = d.runId ? ` [${d.runId}]` : "";
      const ratPart = d.rationale ? ` — ${d.rationale}` : "";
      console.log(`  ${d.timestamp}${runPart}: ${d.description}${ratPart}`);
    }
  }

  console.log("");
  console.log("=== Run Summaries ===");
  if (history.runSummaries.length === 0) {
    console.log("(none)");
  } else {
    for (const r of history.runSummaries) {
      const parts = [`${r.runId} (${r.processId})`, r.status, `started ${r.startedAt}`];
      if (r.completedAt) parts.push(`completed ${r.completedAt}`);
      if (r.outcome) parts.push(r.outcome);
      if (r.score !== undefined) parts.push(`score: ${r.score}`);
      console.log(`  ${parts.join(" | ")}`);
    }
  }

  console.log("");
  console.log("=== Context Snapshots ===");
  if (history.contextSnapshots.length === 0) {
    console.log("(none)");
  } else {
    for (const s of history.contextSnapshots) {
      const keys = Object.keys(s.snapshot).length;
      const runPart = s.runId ? ` [${s.runId}]` : "";
      console.log(`  ${s.timestamp}${runPart}: ${keys} key(s)`);
    }
  }
}
