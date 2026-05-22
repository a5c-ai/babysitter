export type CliVariant = "core" | "harness";

export interface CliProgram {
  variant: CliVariant;
  commandName: string;
  packageName: string;
}

export const CORE_PROGRAM: CliProgram = {
  variant: "core",
  commandName: "babysitter",
  packageName: "@a5c-ai/babysitter",
};

export const HARNESS_PROGRAM: CliProgram = {
  variant: "harness",
  commandName: "babysitter-agent",
  packageName: "@a5c-ai/babysitter-agent",
};

export const HARNESS_RUNTIME_COMMANDS = [
  "create-run",
  "call",
  "yolo",
  "plan",
  "forever",
  "resume-run",
  "resume",
  "retrospect",
  "cleanup",
  "assimilate",
  "doctor",
  "contrib",
  "anycli",
  "session-history",
  "help",
  "observe",
  "user-install",
  "project-install",
  "invoke",
  "tui",
  "daemon:start",
  "daemon:stop",
  "daemon:status",
  "daemon:run",
  "cost:stats",
  "start-server",
] as const;

export const HARNESS_DISCOVERY_COMMANDS = [
  "discover",
  "list",
] as const;

export const HARNESS_INSTALL_COMMANDS = [
  "harness:install",
  "harness:install-plugin",
] as const;

const SHARED_VALID_COMMANDS = [
  "run:create", "run:assign-process", "run:status", "run:iterate", "run:events", "run:rebuild-state", "run:repair-journal",
  "task:post", "task:cancel", "task:list", "task:show",
  "log", "hook:log", "hook:run", "skill:discover", "skill:fetch-remote",
  "process-library:clone", "process-library:update", "process-library:use", "process-library:active",
  "profile:read", "profile:write", "profile:merge", "profile:render",
  "plugin:install", "plugin:uninstall", "plugin:update", "plugin:configure", "plugin:list-installed",
  "plugin:list-plugins", "plugin:add-marketplace", "plugin:update-marketplace", "plugin:update-registry",
  "plugin:remove-from-registry", "instructions:babysit-skill", "instructions:process-create", "instructions:orchestrate",
  "instructions:breakpoint-handling", "health", "configure", "tokens:stats", "compression:status", "compression:toggle",
  "compression:set", "compression:reset", "compress-output", "breakpoint:approve-rule", "breakpoint:remove-rule",
  "breakpoint:list-rules", "breakpoint:should-auto-approve", "breakpoint:history", "version",
] as const;

export const CORE_VALID_COMMANDS: readonly string[] = [
  ...SHARED_VALID_COMMANDS,
  "session:init",
  "session:associate",
  "session:resume",
  "session:state",
  "session:update",
  "session:check-iteration",
  "session:last-message",
  "session:iteration-message",
  "session:whoami",
  "session:cleanup",
  ...HARNESS_DISCOVERY_COMMANDS,
  ...HARNESS_INSTALL_COMMANDS,
] as const;

export const HARNESS_VALID_COMMANDS: readonly string[] = [
  ...HARNESS_RUNTIME_COMMANDS,
  ...HARNESS_DISCOVERY_COMMANDS,
  "version",
] as const;

export function getValidCommands(variant: CliVariant): readonly string[] {
  return variant === "harness" ? HARNESS_VALID_COMMANDS : CORE_VALID_COMMANDS;
}

export function isHarnessRuntimeCommand(command: string): boolean {
  return (HARNESS_RUNTIME_COMMANDS as readonly string[]).includes(command);
}

export function isHarnessInstallCommand(command: string): boolean {
  return (HARNESS_INSTALL_COMMANDS as readonly string[]).includes(command);
}
