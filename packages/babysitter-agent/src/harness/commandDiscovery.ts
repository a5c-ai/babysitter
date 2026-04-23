/**
 * GAP-UX-011: Command Discoverability
 *
 * Contextual command suggestions, search functionality, and in-session
 * guidance for navigating the 50+ babysitter CLI commands.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommandInfo {
  /** Full command name (e.g. "run:status"). */
  name: string;
  /** Short description. */
  description: string;
  /** Command category. */
  category: CommandCategory;
  /** Example usage. */
  example?: string;
  /** Related commands. */
  relatedCommands?: string[];
  /** Tags for search matching. */
  tags: string[];
}

export type CommandCategory =
  | "run"
  | "task"
  | "session"
  | "harness"
  | "plugin"
  | "profile"
  | "breakpoint"
  | "compression"
  | "instructions"
  | "observability"
  | "mcp";

// ---------------------------------------------------------------------------
// Command registry
// ---------------------------------------------------------------------------

const COMMANDS: CommandInfo[] = [
  // Run commands
  { name: "run:create", description: "Create a new run", category: "run", tags: ["create", "new", "start"], example: "babysitter run:create --process-id my-process --entry ./process.js#process --inputs inputs.json" },
  { name: "run:iterate", description: "Iterate a run until pending effects", category: "run", tags: ["iterate", "execute", "replay"], example: "babysitter run:iterate .a5c/runs/<runId>" },
  { name: "run:status", description: "Show run status and progress", category: "run", tags: ["status", "inspect", "progress"], example: "babysitter run:status .a5c/runs/<runId>" },
  { name: "run:events", description: "Show run journal events", category: "run", tags: ["events", "journal", "history"], example: "babysitter run:events .a5c/runs/<runId> --limit 50" },
  { name: "run:rebuild-state", description: "Rebuild state cache from journal", category: "run", tags: ["rebuild", "repair", "recovery", "state"], example: "babysitter run:rebuild-state .a5c/runs/<runId>" },
  { name: "run:repair-journal", description: "Repair corrupt journal entries", category: "run", tags: ["repair", "journal", "recovery"], example: "babysitter run:repair-journal .a5c/runs/<runId>" },
  // Task commands
  { name: "task:post", description: "Post a task result", category: "task", tags: ["post", "result", "resolve"], example: "babysitter task:post .a5c/runs/<runId> <effectId> --status ok --value-inline '{...}'" },
  { name: "task:list", description: "List tasks in a run", category: "task", tags: ["list", "pending", "tasks"], example: "babysitter task:list .a5c/runs/<runId> --pending" },
  { name: "task:show", description: "Show task details", category: "task", tags: ["show", "detail", "inspect"], example: "babysitter task:show .a5c/runs/<runId> <effectId>" },
  // Session commands
  { name: "session-history", description: "Browse persisted session history", category: "session", tags: ["session", "history", "browse"] },
  // Harness commands
  { name: "discover", description: "Discover available harness CLIs", category: "harness", tags: ["discover", "list", "harness"], example: "babysitter-agent discover --json" },
  { name: "call", description: "Create and run a programmatic session", category: "harness", tags: ["call", "create", "run", "harness"], example: "babysitter-agent call --process ./process.js#process" },
  { name: "resume", description: "Resume an existing run", category: "harness", tags: ["resume", "continue", "harness"], example: "babysitter-agent resume --run-id <runId>" },
  { name: "observe", description: "Launch live observer dashboard", category: "harness", tags: ["observe", "dashboard", "live", "ui"] },
  // Plugin commands
  { name: "plugin:install", description: "Install a plugin", category: "plugin", tags: ["install", "plugin", "add"] },
  { name: "plugin:list-installed", description: "List installed plugins", category: "plugin", tags: ["list", "installed", "plugins"] },
  // Breakpoint commands
  { name: "breakpoint:approve-rule", description: "Add an auto-approval rule", category: "breakpoint", tags: ["approve", "rule", "auto", "breakpoint"] },
  { name: "breakpoint:list-rules", description: "List auto-approval rules", category: "breakpoint", tags: ["list", "rules", "breakpoint"] },
  // Compression commands
  { name: "compression:status", description: "Show compression layer status", category: "compression", tags: ["compression", "status", "tokens"] },
  { name: "tokens:stats", description: "Show token usage statistics", category: "compression", tags: ["tokens", "usage", "stats", "cost"] },
  // Instruction commands
  { name: "instructions:babysit-skill", description: "Generate babysit skill instructions", category: "instructions", tags: ["instructions", "babysit", "skill", "generate"] },
  // Skill commands
  { name: "skill:discover", description: "Discover available skills", category: "harness", tags: ["skill", "discover", "list"] },
  { name: "skill:fetch-remote", description: "Fetch a remote skill definition", category: "harness", tags: ["skill", "fetch", "remote"] },
  // Process library
  { name: "process-library:clone", description: "Clone the process library", category: "harness", tags: ["process", "library", "clone", "git"] },
  { name: "process-library:update", description: "Pull latest process library", category: "harness", tags: ["process", "library", "update", "pull"] },
  { name: "process-library:use", description: "Bind a process library to a run/session", category: "harness", tags: ["process", "library", "use", "bind"] },
  { name: "process-library:active", description: "Show active process library binding", category: "harness", tags: ["process", "library", "active"] },
  // Profile commands
  { name: "profile:read", description: "Read user or project profile", category: "profile", tags: ["profile", "read", "user", "project"] },
  { name: "profile:write", description: "Write user or project profile", category: "profile", tags: ["profile", "write", "user", "project"] },
  { name: "profile:merge", description: "Merge into existing profile", category: "profile", tags: ["profile", "merge"] },
  { name: "profile:render", description: "Render profile as markdown", category: "profile", tags: ["profile", "render", "markdown"] },
  // Additional breakpoint commands
  { name: "breakpoint:remove-rule", description: "Remove an auto-approval rule", category: "breakpoint", tags: ["remove", "rule", "breakpoint"] },
  { name: "breakpoint:should-auto-approve", description: "Check if a breakpoint should auto-approve", category: "breakpoint", tags: ["auto", "approve", "check", "breakpoint"] },
  { name: "breakpoint:history", description: "View breakpoint approval history", category: "breakpoint", tags: ["history", "breakpoint", "approval"] },
  // Hook commands
  { name: "hook:log", description: "Log hook execution", category: "observability", tags: ["hook", "log"] },
  { name: "hook:run", description: "Execute a hook", category: "observability", tags: ["hook", "run", "execute"] },
  // Observability
  { name: "health", description: "Run system health diagnostics", category: "observability", tags: ["health", "diagnostics", "check"] },
  { name: "log", description: "Write structured log entry", category: "observability", tags: ["log", "logging", "structured"] },
  // Compression extras
  { name: "compression:toggle", description: "Toggle a compression layer", category: "compression", tags: ["compression", "toggle", "layer"] },
  { name: "compression:set", description: "Set a compression config value", category: "compression", tags: ["compression", "set", "config"] },
  { name: "compression:reset", description: "Reset compression to defaults", category: "compression", tags: ["compression", "reset", "defaults"] },
  { name: "compress-output", description: "Run command with compressed output", category: "compression", tags: ["compress", "output", "command"] },
  // Run extras
  { name: "run:execute-tasks", description: "Execute pending tasks for a run", category: "run", tags: ["execute", "tasks", "run"] },
  // Harness aliases
  { name: "yolo", description: "Non-interactive harness run", category: "harness", tags: ["yolo", "non-interactive", "run", "harness"] },
  { name: "plan", description: "Plan-only harness run (stops after phase 1)", category: "harness", tags: ["plan", "harness", "phase"] },
  { name: "forever", description: "Infinite-loop harness run", category: "harness", tags: ["forever", "infinite", "loop", "harness"] },
  { name: "retrospect", description: "Analyze past runs for insights", category: "harness", tags: ["retrospect", "analyze", "insights", "harness"] },
  { name: "cleanup", description: "Clean up old runs and artifacts", category: "harness", tags: ["cleanup", "clean", "artifacts", "harness"] },
  { name: "assimilate", description: "Assimilate external methodology", category: "harness", tags: ["assimilate", "methodology", "harness"] },
  { name: "doctor", description: "Diagnose run health", category: "harness", tags: ["doctor", "diagnose", "health", "harness"] },
  { name: "contrib", description: "Submit feedback or contributions", category: "harness", tags: ["contrib", "feedback", "contributions", "harness"] },
  { name: "help", description: "Show harness help", category: "harness", tags: ["help", "harness"] },
  { name: "user-install", description: "Set up babysitter for current user", category: "harness", tags: ["install", "user", "setup", "harness"] },
  { name: "project-install", description: "Set up babysitter for current project", category: "harness", tags: ["install", "project", "setup", "harness"] },
  { name: "harness:install", description: "Install a harness CLI", category: "harness", tags: ["install", "harness", "cli"] },
  { name: "harness:install-plugin", description: "Install a harness plugin", category: "harness", tags: ["install", "plugin", "harness"] },
  // Plugin extras
  { name: "plugin:uninstall", description: "Uninstall a plugin", category: "plugin", tags: ["uninstall", "remove", "plugin"] },
  { name: "plugin:update", description: "Update a plugin", category: "plugin", tags: ["update", "upgrade", "plugin"] },
  { name: "plugin:configure", description: "Configure a plugin", category: "plugin", tags: ["configure", "settings", "plugin"] },
  { name: "plugin:list-plugins", description: "List plugins from marketplace", category: "plugin", tags: ["list", "marketplace", "plugins"] },
  { name: "plugin:add-marketplace", description: "Add a marketplace", category: "plugin", tags: ["add", "marketplace", "plugin"] },
  { name: "plugin:update-marketplace", description: "Update a marketplace", category: "plugin", tags: ["update", "marketplace", "plugin"] },
  { name: "plugin:update-registry", description: "Update plugin registry entry", category: "plugin", tags: ["update", "registry", "plugin"] },
  { name: "plugin:remove-from-registry", description: "Remove plugin from registry", category: "plugin", tags: ["remove", "registry", "plugin"] },
  // Instruction extras
  { name: "instructions:process-create", description: "Generate process creation instructions", category: "instructions", tags: ["instructions", "process", "create", "generate"] },
  { name: "instructions:orchestrate", description: "Generate orchestration instructions", category: "instructions", tags: ["instructions", "orchestrate", "generate"] },
  { name: "instructions:breakpoint-handling", description: "Generate breakpoint handling instructions", category: "instructions", tags: ["instructions", "breakpoint", "handling", "generate"] },
  // MCP
  { name: "start-server", description: "Start MCP server", category: "mcp", tags: ["mcp", "server", "serve"] },
  // Misc
  { name: "configure", description: "Configure babysitter settings", category: "observability", tags: ["configure", "settings", "config"] },
  { name: "version", description: "Show babysitter version", category: "observability", tags: ["version"] },
];

// ---------------------------------------------------------------------------
// Search and discovery
// ---------------------------------------------------------------------------

/** Search commands by query string. Returns scored results. */
export function searchCommands(query: string, maxResults = 10): CommandInfo[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return COMMANDS.slice(0, maxResults);

  const scored = COMMANDS.map((cmd) => {
    const lower = `${cmd.name} ${cmd.description} ${cmd.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (cmd.name.toLowerCase().includes(term)) score += 10;
      if (cmd.tags.includes(term)) score += 5;
      if (lower.includes(term)) score += 1;
    }
    return { cmd, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map((s) => s.cmd);
}

/** Get commands by category. */
export function getCommandsByCommandCategory(category: CommandCategory): CommandInfo[] {
  return COMMANDS.filter((c) => c.category === category);
}

/** Get contextual suggestions based on current run state. */
export function getContextualSuggestions(context: {
  hasRun: boolean;
  hasPendingTasks: boolean;
  hasSession: boolean;
  isStuck: boolean;
}): CommandInfo[] {
  const suggestions: CommandInfo[] = [];

  if (context.hasRun) {
    suggestions.push(...COMMANDS.filter((c) => c.name === "run:status" || c.name === "run:events"));
    if (context.hasPendingTasks) {
      suggestions.push(...COMMANDS.filter((c) => c.name === "task:list" || c.name === "task:show"));
    }
  }

  if (context.isStuck) {
    suggestions.push(...COMMANDS.filter((c) =>
      c.name === "run:rebuild-state" || c.name === "health" || c.name === "run:repair-journal",
    ));
  }

  if (!context.hasRun) {
    suggestions.push(...COMMANDS.filter((c) =>
      c.name === "call" || c.name === "discover",
    ));
  }

  return suggestions;
}

/** Get all registered commands. */
export function getAllCommands(): CommandInfo[] {
  return [...COMMANDS];
}

/** Get all command categories. */
export function getCommandCategories(): CommandCategory[] {
  return [...new Set(COMMANDS.map((c) => c.category))].sort();
}
