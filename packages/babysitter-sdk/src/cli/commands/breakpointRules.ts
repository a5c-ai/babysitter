/**
 * breakpoint:* commands — Manage breakpoint auto-approval rules.
 *
 * Commands:
 *   breakpoint:approve-rule <pattern> [--action auto-approve|never-auto-approve] [--source <source>] [--note <note>] [--json]
 *   breakpoint:remove-rule <ruleId> [--json]
 *   breakpoint:list-rules [--json]
 *   breakpoint:should-auto-approve <breakpointId> [--tags <csv>] [--expert <expert>] [--json]
 *   breakpoint:history [--breakpoint-id <id>] [--runs-dir <dir>] [--limit <n>] [--json]
 */

import * as crypto from "node:crypto";
import { getReadableRunsDirs, resolveRunsDir } from "../../config";
import { readRules, addRule, removeRule, listRules } from "../../breakpoints/rules";
import { evaluateAutoApproval } from "../../breakpoints/evaluator";
import type { BreakpointRule, BreakpointRuleAction } from "../../breakpoints/types";

export interface BreakpointCommandArgs {
  subcommand: string;
  pattern?: string;
  ruleId?: string;
  breakpointId?: string;
  action?: string;
  source?: string;
  note?: string;
  tags?: string;
  expert?: string;
  runsDir?: string;
  limit?: number;
  json: boolean;
}

export async function handleBreakpointCommand(args: BreakpointCommandArgs): Promise<number> {
  switch (args.subcommand) {
    case "approve-rule":
      return handleApproveRule(args);
    case "remove-rule":
      return handleRemoveRule(args);
    case "list-rules":
      return handleListRules(args);
    case "should-auto-approve":
      return handleShouldAutoApprove(args);
    case "history":
      return handleHistory(args);
    default:
      console.error(`Unknown breakpoint subcommand: ${args.subcommand}`);
      return 1;
  }
}

async function handleApproveRule(args: BreakpointCommandArgs): Promise<number> {
  if (!args.pattern) {
    console.error("breakpoint:approve-rule requires a pattern argument");
    return 1;
  }

  const action: BreakpointRuleAction = (args.action === "never-auto-approve")
    ? "never-auto-approve"
    : "auto-approve";

  const rule: BreakpointRule = {
    id: `rule-${crypto.randomUUID().slice(0, 8)}`,
    pattern: args.pattern,
    action,
    createdAt: new Date().toISOString(),
    createdBy: args.source ?? "cli",
    source: args.source,
    note: args.note,
  };

  const rules = await addRule(rule);

  if (args.json) {
    console.log(JSON.stringify({ success: true, rule, totalRules: rules.length }));
  } else {
    console.log(`Added rule ${rule.id}: ${rule.action} for pattern "${rule.pattern}"`);
  }
  return 0;
}

async function handleRemoveRule(args: BreakpointCommandArgs): Promise<number> {
  if (!args.ruleId) {
    console.error("breakpoint:remove-rule requires a rule-id argument");
    return 1;
  }

  const before = await readRules();
  const after = await removeRule(args.ruleId);
  const removed = before.length > after.length;

  if (args.json) {
    console.log(JSON.stringify({ success: removed, ruleId: args.ruleId, totalRules: after.length }));
  } else {
    if (removed) {
      console.log(`Removed rule ${args.ruleId}`);
    } else {
      console.log(`Rule ${args.ruleId} not found`);
    }
  }
  return 0;
}

async function handleListRules(args: BreakpointCommandArgs): Promise<number> {
  const rules = await listRules();

  if (args.json) {
    console.log(JSON.stringify({ rules, count: rules.length }));
  } else {
    if (rules.length === 0) {
      console.log("No breakpoint approval rules configured.");
    } else {
      for (const rule of rules) {
        console.log(`  ${rule.id}  ${rule.action.padEnd(20)}  ${rule.pattern}${rule.note ? `  (${rule.note})` : ""}`);
      }
      console.log(`\n${rules.length} rule(s) total.`);
    }
  }
  return 0;
}

async function handleShouldAutoApprove(args: BreakpointCommandArgs): Promise<number> {
  if (!args.breakpointId) {
    console.error("breakpoint:should-auto-approve requires a breakpoint-id argument");
    return 1;
  }

  const rules = await readRules();
  const tags = args.tags ? args.tags.split(",").map(t => t.trim()) : undefined;
  const result = evaluateAutoApproval({
    breakpointId: args.breakpointId,
    tags,
    expert: args.expert,
    rules,
  });

  if (args.json) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`Breakpoint: ${args.breakpointId}`);
    console.log(`Recommended: ${result.recommended ? "auto-approve" : "prompt"}`);
    console.log(`Reason: ${result.reason}`);
    if (result.matchedRule) {
      console.log(`Matched rule: ${result.matchedRule}`);
    }
  }
  return 0;
}

async function handleHistory(args: BreakpointCommandArgs): Promise<number> {
  // Scan journal directories for breakpoint EFFECT_RESOLVED events
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const runsDir = args.runsDir ?? resolveRunsDir();
  const limit = args.limit ?? 50;

  interface HistoryEntry {
    runId: string;
    breakpointId?: string;
    effectId: string;
    status: string;
    resolvedAt: string;
  }

  const entries: HistoryEntry[] = [];

  try {
    for (const candidateRunsDir of getReadableRunsDirs({ override: runsDir })) {
      const runDirs = await fs.readdir(candidateRunsDir).catch(() => []);
      for (const runId of runDirs.slice(-limit * 2)) {
        const journalDir = path.join(candidateRunsDir, runId, "journal");
        let journalFiles: string[];
        try {
          journalFiles = await fs.readdir(journalDir);
        } catch {
          continue;
        }
        for (const jf of journalFiles) {
          try {
            const raw = await fs.readFile(path.join(journalDir, jf), "utf-8");
            const event = JSON.parse(raw) as Record<string, unknown>;
            const data = event.data as Record<string, unknown> | undefined;
            if (event.type === "EFFECT_RESOLVED" && data?.breakpointId) {
              const bpId = data.breakpointId as string;
              if (args.breakpointId && bpId !== args.breakpointId) continue;
              entries.push({
                runId,
                breakpointId: bpId,
                effectId: data.effectId as string,
                status: data.status as string,
                resolvedAt: event.recordedAt as string,
              });
            }
          } catch {
            continue;
          }
        }
      }
    }
  } catch {
    // runs dir may not exist
  }

  const limited = entries.slice(-limit);

  if (args.json) {
    console.log(JSON.stringify({ entries: limited, count: limited.length }));
  } else {
    if (limited.length === 0) {
      console.log("No breakpoint history found.");
    } else {
      for (const e of limited) {
        console.log(`  ${e.resolvedAt}  ${e.breakpointId ?? "unknown"}  ${e.status}  run:${e.runId.slice(0, 12)}`);
      }
      console.log(`\n${limited.length} entries.`);
    }
  }
  return 0;
}
