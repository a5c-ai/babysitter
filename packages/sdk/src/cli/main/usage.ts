import type { HelpSurface } from "./types";
import { CORE_PROGRAM, type CliProgram } from "./program";

function coreAgentUsage(commandName: string): string {
  return `  ${commandName} run:create --process-id <id> --entry <path#export> [--runs-dir <dir>] [--inputs <file>] [--run-id <id>] [--process-revision <rev>] [--request <id>] [--prompt <text>] [--harness <name>] [--session-id <id>] [--plugin-root <dir>] [--non-interactive] [--json] [--dry-run]
  ${commandName} run:status <runDir> [--runs-dir <dir>] [--json]
  ${commandName} run:events <runDir> [--runs-dir <dir>] [--json] [--limit <n>] [--reverse] [--filter-type <type>]
  ${commandName} run:rebuild-state <runDir> [--runs-dir <dir>] [--json] [--dry-run]
  ${commandName} run:repair-journal <runDir> [--runs-dir <dir>] [--json] [--dry-run]
  ${commandName} run:iterate <runDir> [--runs-dir <dir>] [--json] [--verbose] [--iteration <n>]
  ${commandName} task:post <runDir> <effectId> --status <ok|error> [--runs-dir <dir>] [--json] [--dry-run] [--value <file>] [--value-inline <json>] [--error <file>] [--stdout-ref <ref>] [--stderr-ref <ref>] [--stdout-file <file>] [--stderr-file <file>] [--started-at <iso8601>] [--finished-at <iso8601>] [--metadata <file>] [--invocation-key <key>]
  ${commandName} task:list <runDir> [--runs-dir <dir>] [--pending] [--kind <kind>] [--json]
  ${commandName} task:show <runDir> <effectId> [--runs-dir <dir>] [--json]
  ${commandName} skill:discover --plugin-root <dir> [--run-id <id>] [--cache-ttl <seconds>] [--runs-dir <dir>] [--include-remote] [--summary-only] [--process-path <path>] [--json]
  ${commandName} session:init --session-id <id> --state-dir <dir> [--max-iterations <n>] [--run-id <id>] [--prompt <text>] [--json]
  ${commandName} session:associate --session-id <id> --state-dir <dir> --run-id <id> [--force] [--runs-dir <dir>] [--json]
  ${commandName} session:resume --session-id <id> [--state-dir <dir>] --run-id <id> [--max-iterations <n>] [--runs-dir <dir>] [--json]
  ${commandName} session:state --session-id <id> --state-dir <dir> [--json]
  ${commandName} session:update --session-id <id> --state-dir <dir> [--iteration <n>] [--last-iteration-at <iso8601>] [--iteration-times <csv>] [--delete] [--json]
  ${commandName} session:check-iteration --session-id <id> --state-dir <dir> [--json]
  ${commandName} session:last-message --transcript-path <file> [--json]
  ${commandName} session:iteration-message --iteration <n> [--run-id <id>] [--runs-dir <dir>] [--plugin-root <dir>] [--json]
  ${commandName} session:whoami [--harness <name>] [--json]
  ${commandName} session:cleanup [--harness <name>] [--dry-run] [--runs-dir <dir>] [--json]
  ${commandName} process-library:active [--run-id <id>] [--session-id <id>] [--state-dir <dir>] [--json]
  ${commandName} profile:read --user|--project [--dir <dir>] [--json]
  ${commandName} profile:write --user|--project --input <file> [--dir <dir>] [--json]
  ${commandName} profile:merge --user|--project --input <file> [--dir <dir>] [--json]
  ${commandName} profile:render --user|--project [--dir <dir>] [--json]
  ${commandName} instructions:babysit-skill --harness <name> [--interactive|--no-interactive] [--json]
  ${commandName} harness:discover [--json]
  ${commandName} harness:install <name> [--workspace <dir>] [--json] [--dry-run] [--verbose]
  ${commandName} harness:install-plugin <name> [--workspace <dir>] [--json] [--dry-run] [--verbose]`;
}

function coreHumanUsage(commandName: string): string {
  return `  ${commandName} log --type <process|hook|cli> --message <msg> [--run-id <id>] [--label <label>] [--level <level>] [--source <src>] [--json]
  ${commandName} hook:log --hook-type <type> --log-file <path> [--json]
  ${commandName} hook:run --hook-type <stop|session-start|user-prompt-submit|pre-tool-use> [--harness <claude-code|gemini-cli>] [--plugin-root <dir>] [--state-dir <dir>] [--runs-dir <dir>] [--json] [--verbose]
  ${commandName} session:init --session-id <id> --state-dir <dir> [--max-iterations <n>] [--run-id <id>] [--prompt <text>] [--json]
  ${commandName} session:associate --session-id <id> --state-dir <dir> --run-id <id> [--force] [--runs-dir <dir>] [--json]
  ${commandName} session:resume --session-id <id> [--state-dir <dir>] --run-id <id> [--max-iterations <n>] [--runs-dir <dir>] [--json]
  ${commandName} session:state --session-id <id> --state-dir <dir> [--json]
  ${commandName} session:update --session-id <id> --state-dir <dir> [--iteration <n>] [--last-iteration-at <iso8601>] [--iteration-times <csv>] [--delete] [--json]
  ${commandName} session:check-iteration --session-id <id> --state-dir <dir> [--json]
  ${commandName} session:last-message --transcript-path <file> [--json]
  ${commandName} session:iteration-message --iteration <n> [--run-id <id>] [--runs-dir <dir>] [--plugin-root <dir>] [--json]
  ${commandName} session:whoami [--harness <name>] [--json]
  ${commandName} session:cleanup [--harness <name>] [--dry-run] [--runs-dir <dir>] [--json]
  ${commandName} compress-output <command and args...>
  ${commandName} skill:fetch-remote --source-type <github|well-known> --url <url> [--json]
  ${commandName} process-library:clone [--repo <url>] [--dir <path>] [--ref <ref>] [--state-dir <dir>] [--json]
  ${commandName} process-library:update [--dir <path>] [--ref <ref>] [--state-dir <dir>] [--json]
  ${commandName} process-library:use [--dir <path>] [--run-id <id>] [--session-id <id>] [--state-dir <dir>] [--ref <ref>] [--json]
  ${commandName} plugin:install [<pluginName>] [--plugin-name <name>] [--plugin-version <ver>] [--global|--project] [--json] [--verbose]
  ${commandName} plugin:uninstall [<pluginName>] [--plugin-name <name>] [--global|--project] [--json] [--verbose]
  ${commandName} plugin:update [<pluginName>] [--plugin-name <name>] [--plugin-version <ver>] [--global|--project] [--json] [--verbose]
  ${commandName} plugin:configure [<pluginName>] [--plugin-name <name>] [--global|--project] [--json] [--verbose]
  ${commandName} plugin:list-installed [--global|--project] [--json] [--verbose]
  ${commandName} plugin:list-plugins --marketplace-name <name> [--global|--project] [--json] [--verbose]
  ${commandName} plugin:add-marketplace --marketplace-url <url> [--marketplace-path <path>] [--marketplace-branch <ref>] [--force] [--global|--project] [--json] [--verbose]
  ${commandName} plugin:update-marketplace --marketplace-name <name> [--marketplace-branch <ref>] [--global|--project] [--json] [--verbose]
  ${commandName} plugin:update-registry [<pluginName>] [--plugin-name <name>] [--plugin-version <ver>] [--global|--project] [--json] [--verbose]
  ${commandName} plugin:remove-from-registry [<pluginName>] [--plugin-name <name>] [--global|--project] [--json] [--verbose]
  ${commandName} tokens:stats [runId] [--all] [--runs-dir <dir>] [--json]
  ${commandName} compression:status [--json]
  ${commandName} compression:toggle <layer> <on|off> [--json]
  ${commandName} compression:set <layer.key> <value> [--json]
  ${commandName} compression:reset [--json]
  ${commandName} harness:discover [--json]
  ${commandName} harness:list [--json]
  ${commandName} harness:install <name> [--workspace <dir>] [--json] [--dry-run] [--verbose]
  ${commandName} harness:install-plugin <name> [--workspace <dir>] [--json] [--dry-run] [--verbose]
  ${commandName} instructions:process-create --harness <name> [--interactive|--no-interactive] [--json]
  ${commandName} instructions:orchestrate --harness <name> [--interactive|--no-interactive] [--json]
  ${commandName} instructions:breakpoint-handling --harness <name> [--interactive|--no-interactive] [--json]
  ${commandName} breakpoint:approve-rule <pattern> [--action auto-approve|never-auto-approve] [--source <source>] [--note <note>] [--json]
  ${commandName} breakpoint:remove-rule <ruleId> [--json]
  ${commandName} breakpoint:list-rules [--json]
  ${commandName} breakpoint:should-auto-approve <breakpointId> [--tags <csv>] [--expert <expert>] [--json]
  ${commandName} breakpoint:history [--breakpoint-id <id>] [--runs-dir <dir>] [--limit <n>] [--json]
  ${commandName} health [--json] [--verbose]
  ${commandName} configure [show|validate|paths] [--json] [--defaults-only]
  ${commandName} version

Harness runtime commands are provided by the optional ${"@a5c-ai/babysitter-harness"} package:
  babysitter-harness call --harness claude-code --prompt "implement feature X" --workspace .
  babysitter-harness start-server [--transport <stdio|websocket>]`;
}

function harnessAgentUsage(commandName: string): string {
  return `  ${commandName} create-run [--prompt <text>] [--harness <name>] [--process <path>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--runs-dir <dir>] [--interactive|--no-interactive|--non-interactive] [--json] [--verbose]
  ${commandName} resume-run [--run-id <id>] [--runs-dir <dir>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--interactive|--no-interactive] [--json] [--verbose]
  ${commandName} invoke <name> --prompt <text> [--workspace <dir>] [--model <model>] [--timeout <ms>] [--json]
  ${commandName} observe [--workspace <dir>] [--tui]
  ${commandName} tui [--run-id <id>] [--verbosity minimal|normal|verbose] [--workspace <dir>] [--json]
  ${commandName} discover [--json]`;
}

function harnessHumanUsage(commandName: string): string {
  return `  ${commandName} create-run [--prompt <text>] [--harness <name>] [--process <path>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--runs-dir <dir>] [--interactive|--no-interactive|--non-interactive] [--json] [--verbose]
  ${commandName} call [...]                          (alias for create-run)
  ${commandName} yolo [...]                          (alias for create-run --non-interactive)
  ${commandName} plan [...]                          (alias for create-run, stops after PhasePlanProcess)
  ${commandName} forever [...]                       (alias for create-run, infinite loop process)
  ${commandName} resume-run [--run-id <id>] [--runs-dir <dir>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--interactive|--no-interactive] [--json] [--verbose]
  ${commandName} resume [...]                        (alias for resume-run)
  ${commandName} retrospect [--run-id <id>...] [--all] [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--runs-dir <dir>] [--json] [--verbose]
  ${commandName} cleanup [--dry-run] [--keep-days <n>] [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--runs-dir <dir>] [--json] [--verbose]
  ${commandName} assimilate [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--runs-dir <dir>] [--json] [--verbose]
  ${commandName} doctor [--run-id <id>] [--runs-dir <dir>] [--json] [--verbose]
  ${commandName} contrib [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--runs-dir <dir>] [--json] [--verbose]
  ${commandName} anycli --service <name> [--scope <scopes>] [--mcp] [--auth-file <path>] [--transport <type>] [--prompt <text>] [--workspace <dir>] [--json] [--verbose]
  ${commandName} session-history --session-id <id> --state-dir <dir> [--run-id <id>] [--json]
  ${commandName} help [<topic>]
  ${commandName} observe [--workspace <dir>] [--tui]
  ${commandName} user-install [--harness <name>] [--workspace <dir>] [--model <model>] [--runs-dir <dir>] [--json] [--verbose]
  ${commandName} project-install [--harness <name>] [--workspace <dir>] [--model <model>] [--runs-dir <dir>] [--json] [--verbose]
  ${commandName} discover [--json]
  ${commandName} list [--json]
  ${commandName} invoke <name> --prompt <text> [--workspace <dir>] [--model <model>] [--timeout <ms>] [--json]
  ${commandName} tui [--run-id <id>] [--verbosity minimal|normal|verbose] [--workspace <dir>] [--json]
  ${commandName} version

Install or update harness CLIs and plugins with the main babysitter CLI:
  babysitter harness:install <name>
  babysitter harness:install-plugin <name>`;
}

const GLOBAL_FLAGS_USAGE = `Global flags:
  --runs-dir <dir>   Override the runs directory (defaults to .a5c/runs).
  --json             Emit JSON output when supported by the command.
  --dry-run          Describe planned mutations without changing on-disk state.
  --verbose          Log resolved paths and options to stderr for debugging.
  --show-config      Show current configuration before executing command.
  --help, -h         Show agent-facing help text.
  --help-human       Show human-facing help text.
  --version, -v      Show CLI version.`;

export function formatUsage(surface: HelpSurface, program: CliProgram = CORE_PROGRAM): string {
  const agentCommands = program.variant === "harness"
    ? harnessAgentUsage(program.commandName)
    : coreAgentUsage(program.commandName);
  const humanCommands = program.variant === "harness"
    ? harnessHumanUsage(program.commandName)
    : coreHumanUsage(program.commandName);

  return `Usage:
${surface === "human" ? "Human" : "Agent"} commands:
${surface === "human" ? humanCommands : agentCommands}

${GLOBAL_FLAGS_USAGE}`;
}

export const AGENT_USAGE = formatUsage("agent", CORE_PROGRAM);
export const HUMAN_USAGE = formatUsage("human", CORE_PROGRAM);
export const USAGE = AGENT_USAGE;
