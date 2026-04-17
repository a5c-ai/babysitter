/**
 * GAP-USER-001: Operator Command Layer
 *
 * Surfaces key babysitter CLI commands as in-session actions during
 * breakpoint interactions. Enables operators to inspect and manage
 * orchestration without leaving the flow.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OperatorCommand {
  /** Short command name for selection. */
  name: string;
  /** Human-readable label. */
  label: string;
  /** Brief description shown during breakpoint interaction. */
  description: string;
  /** The CLI command template. Placeholders: {{runDir}}, {{runId}}, {{effectId}}. */
  commandTemplate: string;
  /** Category for grouping in UI. */
  category: OperatorCommandCategory;
}

export type OperatorCommandCategory = "inspect" | "manage" | "debug" | "tokens";

// ---------------------------------------------------------------------------
// Built-in operator commands
// ---------------------------------------------------------------------------

export const OPERATOR_COMMANDS: OperatorCommand[] = [
  {
    name: "status",
    label: "Run Status",
    description: "Show current run status and progress",
    commandTemplate: "babysitter run:status {{runDir}}",
    category: "inspect",
  },
  {
    name: "tasks",
    label: "Task List",
    description: "List all tasks (pending, completed, failed)",
    commandTemplate: "babysitter task:list {{runDir}} --pending",
    category: "inspect",
  },
  {
    name: "events",
    label: "Recent Events",
    description: "Show recent journal events",
    commandTemplate: "babysitter run:events {{runDir}} --limit 20",
    category: "inspect",
  },
  {
    name: "tokens",
    label: "Token Usage",
    description: "Show token usage statistics for this run",
    commandTemplate: "babysitter tokens:stats {{runId}}",
    category: "tokens",
  },
  {
    name: "task-detail",
    label: "Task Detail",
    description: "Show details of the current pending task",
    commandTemplate: "babysitter task:show {{runDir}} {{effectId}}",
    category: "inspect",
  },
  {
    name: "compression",
    label: "Compression Status",
    description: "Show context compression status",
    commandTemplate: "babysitter compression:status",
    category: "tokens",
  },
  {
    name: "rebuild",
    label: "Rebuild State",
    description: "Rebuild state cache from journal (recovery)",
    commandTemplate: "babysitter run:rebuild-state {{runDir}}",
    category: "manage",
  },
  {
    name: "health",
    label: "Health Check",
    description: "Run system health diagnostics",
    commandTemplate: "babysitter health",
    category: "debug",
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Render operator command template with run context. */
export function renderOperatorCommand(
  template: string,
  context: { runDir?: string; runId?: string; effectId?: string },
): string {
  return template
    .replace(/\{\{runDir\}\}/g, context.runDir ?? ".")
    .replace(/\{\{runId\}\}/g, context.runId ?? "<runId>")
    .replace(/\{\{effectId\}\}/g, context.effectId ?? "<effectId>");
}

/** Get operator commands filtered by category. */
export function getCommandsByCategory(category: OperatorCommandCategory): OperatorCommand[] {
  return OPERATOR_COMMANDS.filter((c) => c.category === category);
}

/** Get all categories with their commands. */
export function getGroupedCommands(): Record<OperatorCommandCategory, OperatorCommand[]> {
  const grouped: Record<OperatorCommandCategory, OperatorCommand[]> = {
    inspect: [],
    manage: [],
    debug: [],
    tokens: [],
  };
  for (const cmd of OPERATOR_COMMANDS) {
    grouped[cmd.category].push(cmd);
  }
  return grouped;
}

/** Format commands for display in a breakpoint prompt. */
export function formatCommandsForPrompt(
  context: { runDir?: string; runId?: string; effectId?: string },
): string {
  const lines: string[] = ["## Available Operator Commands", ""];
  const grouped = getGroupedCommands();

  for (const [category, commands] of Object.entries(grouped)) {
    if (commands.length === 0) continue;
    lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    for (const cmd of commands) {
      const rendered = renderOperatorCommand(cmd.commandTemplate, context);
      lines.push(`- **${cmd.label}**: \`${rendered}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}
