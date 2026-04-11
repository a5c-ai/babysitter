/**
 * Command registry for discoverability (GAP-UX-011).
 * Provides search and contextual suggestions across all babysitter CLI commands.
 */

export interface CommandInfo {
  name: string;
  description: string;
  aliases?: string[];
  category: CommandCategory;
  usage?: string;
}

export type CommandCategory =
  | "run"
  | "task"
  | "session"
  | "harness"
  | "plugin"
  | "config"
  | "debug"
  | "help"
  | "tui";

export interface RunContext {
  hasRun?: boolean;
  hasPendingEffects?: boolean;
  runStatus?: string;
}

export const COMMAND_REGISTRY: CommandInfo[] = [
  // Run commands
  { name: "run:create", description: "Create a new run with process and inputs", category: "run", usage: "babysitter run:create --process-id <id> --entry <path>" },
  { name: "run:iterate", description: "Execute one orchestration iteration", category: "run", usage: "babysitter run:iterate <runDir>" },
  { name: "run:status", description: "Show run status, metadata, and pending effects", category: "run", aliases: ["status"], usage: "babysitter run:status <runDir>" },
  { name: "run:events", description: "Show journal events for a run", category: "run", aliases: ["events"], usage: "babysitter run:events <runDir> --limit 50" },
  { name: "run:rebuild-state", description: "Rebuild derived state cache from journal", category: "run", usage: "babysitter run:rebuild-state <runDir>" },
  { name: "run:repair-journal", description: "Repair corrupted journal entries", category: "run", usage: "babysitter run:repair-journal <runDir>" },
  { name: "run:execute-tasks", description: "Execute pending tasks in a run", category: "run" },

  // Task commands
  { name: "task:post", description: "Post an effect result (task, breakpoint, sleep)", category: "task", usage: "babysitter task:post <runDir> <effectId> --status ok --value-inline '{...}'" },
  { name: "task:list", description: "List tasks/effects in a run", category: "task", aliases: ["tasks"], usage: "babysitter task:list <runDir> --pending" },
  { name: "task:show", description: "Show task definition and result details", category: "task", usage: "babysitter task:show <runDir> <effectId>" },

  // Session commands
  { name: "session:init", description: "Initialize a new orchestration session", category: "session" },
  { name: "session:associate", description: "Associate session with a run", category: "session" },
  { name: "session:resume", description: "Resume an existing session", category: "session" },
  { name: "session:state", description: "Show current session state", category: "session" },
  { name: "session:update", description: "Update session state", category: "session" },

  // Harness commands
  { name: "harness:discover", description: "Discover installed harness CLIs", category: "harness", aliases: ["harness:list"] },
  { name: "harness:invoke", description: "Invoke a harness CLI with a prompt", category: "harness" },
  { name: "harness:create-run", description: "Create and run an orchestration session", category: "harness", aliases: ["harness:call"] },
  { name: "harness:resume-run", description: "Resume an existing orchestration run", category: "harness", aliases: ["harness:resume"] },
  { name: "harness:yolo", description: "Create run in non-interactive mode", category: "harness" },
  { name: "harness:plan", description: "Create run, stop after planning phase", category: "harness" },
  { name: "harness:observe", description: "Launch real-time observer dashboard (--tui redirects to babysitter tui)", category: "harness", usage: "babysitter harness:observe [--workspace <dir>] [--tui]" },
  { name: "tui", description: "Launch unified Ink-based dashboard with run browser and session views", category: "tui", usage: "babysitter tui [--run-id <id>] [--verbosity minimal|normal|verbose] [--workspace <dir>] [--json]" },
  { name: "harness:doctor", description: "Diagnose run health issues", category: "harness" },
  { name: "harness:retrospect", description: "Analyze past runs for insights", category: "harness" },
  { name: "harness:cleanup", description: "Clean up old runs and artifacts", category: "harness" },
  { name: "harness:session-history", description: "Browse session history (decisions, run summaries, context snapshots)", category: "harness", usage: "babysitter harness:session-history --session-id <id> --state-dir <dir> [--run-id <id>] [--json]" },

  // Plugin commands
  { name: "plugin:install", description: "Install a plugin", category: "plugin" },
  { name: "plugin:uninstall", description: "Uninstall a plugin", category: "plugin" },
  { name: "plugin:update", description: "Update a plugin", category: "plugin" },
  { name: "plugin:list-installed", description: "List installed plugins", category: "plugin" },
  { name: "plugin:list-plugins", description: "List available plugins from marketplace", category: "plugin" },
  { name: "plugin:add-marketplace", description: "Add a plugin marketplace", category: "plugin" },

  // Config commands
  { name: "configure", description: "Configure babysitter settings", category: "config" },
  { name: "compression:status", description: "Show compression layer status", category: "config" },
  { name: "compression:toggle", description: "Toggle a compression layer on/off", category: "config" },
  { name: "compression:set", description: "Set a compression config value", category: "config" },
  { name: "compression:reset", description: "Reset compression config to defaults", category: "config" },
  { name: "breakpoint:approve-rule", description: "Add breakpoint auto-approval rule", category: "config" },
  { name: "breakpoint:list-rules", description: "List breakpoint auto-approval rules", category: "config" },
  { name: "breakpoint:remove-rule", description: "Remove a breakpoint auto-approval rule", category: "config" },
  { name: "tokens:stats", description: "Show token usage statistics", category: "config" },
  { name: "profile:read", description: "Read user or project profile", category: "config" },
  { name: "profile:write", description: "Write user or project profile", category: "config" },

  // Debug commands
  { name: "log", description: "Write structured log entry", category: "debug" },
  { name: "hook:log", description: "Log hook execution", category: "debug" },
  { name: "hook:run", description: "Execute a hook manually", category: "debug" },
  { name: "health", description: "Show system health status", category: "debug" },
  { name: "mcp:serve", description: "Start MCP server over stdio", category: "debug" },

  // Help commands
  { name: "help", description: "Show help for babysitter commands", category: "help" },
  { name: "version", description: "Show babysitter SDK version", category: "help", aliases: ["-v", "--version"] },
  { name: "instructions:babysit-skill", description: "Generate babysit skill instructions", category: "help" },
  { name: "instructions:orchestrate", description: "Generate orchestration instructions", category: "help" },
];

/**
 * Search commands by name, description, or alias. Case-insensitive fuzzy match.
 */
export function searchCommands(query: string): CommandInfo[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  return COMMAND_REGISTRY.filter((cmd) => {
    if (cmd.name.toLowerCase().includes(q)) return true;
    if (cmd.description.toLowerCase().includes(q)) return true;
    if (cmd.aliases?.some((a) => a.toLowerCase().includes(q))) return true;
    // Match category
    if (cmd.category.toLowerCase().includes(q)) return true;
    return false;
  });
}

/**
 * Suggest commands based on current run context.
 */
export function suggestCommands(context: RunContext): CommandInfo[] {
  const suggestions: CommandInfo[] = [];

  if (!context.hasRun) {
    // No active run — suggest creation
    suggestions.push(
      ...COMMAND_REGISTRY.filter((c) =>
        c.name === "run:create" || c.name === "harness:create-run" || c.name === "harness:discover",
      ),
    );
    return suggestions;
  }

  if (context.hasPendingEffects) {
    // Has pending effects — suggest posting results
    suggestions.push(
      ...COMMAND_REGISTRY.filter((c) =>
        c.name === "task:post" || c.name === "task:list" || c.name === "task:show",
      ),
    );
  }

  if (context.runStatus === "failed") {
    // Failed run — suggest recovery
    suggestions.push(
      ...COMMAND_REGISTRY.filter((c) =>
        c.name === "run:rebuild-state" || c.name === "run:repair-journal" || c.name === "harness:doctor",
      ),
    );
  }

  if (context.runStatus === "completed") {
    suggestions.push(
      ...COMMAND_REGISTRY.filter((c) =>
        c.name === "run:events" || c.name === "harness:retrospect" || c.name === "tokens:stats",
      ),
    );
  }

  // Always suggest status and iterate for active runs
  if (context.hasRun) {
    suggestions.push(
      ...COMMAND_REGISTRY.filter((c) =>
        c.name === "run:status" || c.name === "run:iterate",
      ),
    );
  }

  // Deduplicate
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}
