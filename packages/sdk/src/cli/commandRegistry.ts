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

  // Session diagnostics
  { name: "session:init", description: "Initialize session state for a run or prompt", category: "session", usage: "babysitter session:init --session-id <id> --state-dir <dir>" },
  { name: "session:associate", description: "Associate an existing session with a run", category: "session", usage: "babysitter session:associate --session-id <id> --state-dir <dir> --run-id <id>" },
  { name: "session:resume", description: "Resume an existing run into a session state file", category: "session", usage: "babysitter session:resume --session-id <id> --run-id <id>" },
  { name: "session:state", description: "Show the stored state for a session", category: "session", usage: "babysitter session:state --session-id <id> --state-dir <dir>" },
  { name: "session:update", description: "Update or delete stored session state", category: "session", usage: "babysitter session:update --session-id <id> --state-dir <dir> --iteration 2" },
  { name: "session:check-iteration", description: "Evaluate whether a session should continue iterating", category: "session", usage: "babysitter session:check-iteration --session-id <id> --state-dir <dir>" },
  { name: "session:last-message", description: "Extract the last assistant message from a transcript", category: "session", usage: "babysitter session:last-message --transcript-path <file>" },
  { name: "session:iteration-message", description: "Generate orchestration guidance for a session iteration", category: "session", usage: "babysitter session:iteration-message --iteration <n> --run-id <id>" },
  { name: "session:whoami", description: "Show how the current session ID was resolved", category: "session", usage: "babysitter session:whoami --json" },
  { name: "session:cleanup", description: "Clean up dead session markers and stale session state", category: "session", usage: "babysitter session:cleanup --dry-run" },

  // Harness commands
  { name: "harness:discover", description: "Discover installed harness CLIs", category: "harness", aliases: ["harness:list"] },
  { name: "harness:install", description: "Install a harness CLI", category: "harness", usage: "babysitter harness:install <name>" },
  { name: "harness:install-plugin", description: "Install a harness plugin", category: "harness", usage: "babysitter harness:install-plugin <name>" },

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
        c.name === "run:create" || c.name === "harness:discover" || c.name === "harness:install",
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
        c.name === "run:rebuild-state" || c.name === "run:repair-journal" || c.name === "health",
      ),
    );
  }

  if (context.runStatus === "completed") {
    suggestions.push(
      ...COMMAND_REGISTRY.filter((c) =>
        c.name === "run:events" || c.name === "tokens:stats",
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
