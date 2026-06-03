/**
 * `adapters help` and `--help` support.
 *
 * @see docs/10-cli-reference.md Section 26
 */

import { createRequire } from 'node:module';

function readVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    return (require('../../package.json') as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const VERSION = readVersion();

/** Top-level help text. */
const MAIN_HELP = `adapters - Agent Multiplexer CLI (v${VERSION})

Usage: adapters [command] [subcommand] [args] [flags]

Commands:
  run [agent] [prompt]    Run an agent with a prompt
  install [agent]         Install an agent CLI (or --all)
  update [agent]          Update an agent CLI (or --all)
  detect [agent]          Report installed version/path (or --all)
  uninstall <agent>       Uninstall an agent CLI
  adapters                List and inspect registered adapters
  models                  List and inspect models
  sessions                Manage agent sessions
  config                  Read and write agent configuration
  profiles                Manage named RunOptions presets
  auth                    Check and setup authentication
  plugins                 Manage agent plugins
  plugin                  Manage native agent plugins
  mcp                     Manage MCP servers
  skill                   Manage agent skills
  agent                   Manage custom sub-agents
  workspaces              Manage temp workspaces and git worktrees
  launch                  Launch a harness with provider config and stdin/stdout passthrough
  detect-host             Detect which agent harness we are running under
  remote                  Install / update adapters on a remote host
  hooks                   Manage and dispatch unified agent hooks
  gateway                 Run the browser/mobile gateway service
  doctor                  Run environment health check
  version                 Print version
  help [command]          Show help for a command

Global Flags:
  --agent, -a <name>      Target agent name
  --model, -m <model>     Model ID
  --json                  Output as JSON
  --debug                 Enable debug output
  --config-dir <path>     Override config directory
  --project-dir <path>    Override project config directory
  --no-color              Disable colored output
  --version, -V           Print version
  --help, -h              Show help

Examples:
  adapters run claude "explain this code"
  adapters run --agent gemini --json "list all files"
  adapters adapters list
  adapters models list claude
  adapters sessions list claude
  adapters config get claude model
  adapters workspaces list
`;

/** Command-specific help texts. */
const COMMAND_HELP: Record<string, string> = {
  run: `adapters run - Run an agent with a prompt

Usage: adapters run [<agent>] [<prompt>] [flags]

Flags:
  --model, -m <model>          Model ID
  --stream / --no-stream       Enable/disable streaming
  --thinking-effort <level>    low, medium, high, max
  --thinking-budget <tokens>   Thinking budget in tokens
  --temperature <float>        Sampling temperature (0.0-2.0)
  --max-tokens <int>           Maximum output tokens
  --max-turns <int>            Maximum agentic turns
  --session <id>               Resume session by ID
  --fork <id>                  Fork session by ID
  --no-session                 Ephemeral run
  --system <text>              System prompt
  --system-mode <mode>         prepend, append, replace
  --cwd <path>                 Working directory
  --env KEY=VALUE              Environment variable (repeatable)
  --prompt, -p <text>          Initial prompt text
  --non-interactive            Force headless one-shot harness mode (with --prompt)
  --yolo                       Auto-approve all tool calls
  --deny                       Auto-deny all approval requests
  --timeout <ms>               Run timeout in milliseconds
  --tag <tag>                  Run tag (repeatable)
  --profile <name>             Named profile to apply
  --interactive, -i            Enter interactive REPL mode
  --quiet, -q                  Suppress non-essential output
  --json                       Emit JSONL event stream

Examples:
  adapters run claude "explain this codebase"
  adapters run codex --yolo --no-session "add tests"
  adapters run --profile fast "review this PR"
`,
  adapters: `adapters adapters - Adapter discovery

Usage:
  adapters adapters list [flags]
  adapters adapters detect <agent> [flags]
  adapters adapters info <agent> [flags]

Flags:
  --json    Output as JSON

Examples:
  adapters adapters list
  adapters adapters detect claude
  adapters adapters info gemini
`,
  models: `adapters models - Model registry

Usage:
  adapters models list <agent> [flags]
  adapters models info <agent> <model> [flags]
  adapters models refresh <agent>

Flags:
  --json    Output as JSON

Examples:
  adapters models list claude
  adapters models info claude claude-sonnet-4-20250514
`,
  sessions: `adapters sessions - Session management

Usage:
  adapters sessions list <agent> [flags]
  adapters sessions show <agent> <session-id>
  adapters sessions search <query> [flags]
  adapters sessions export <agent> <session-id> [flags]
  adapters sessions cost

Flags:
  --since <date>     Filter sessions after this date
  --until <date>     Filter sessions before this date
  --model <model>    Filter by model
  --tag <tag>        Filter by tag (repeatable)
  --limit <n>        Maximum results
  --sort <field>     Sort by: date, cost, turns
  --format <fmt>     Output format: json, jsonl, markdown
  --json             Output as JSON
`,
  workspaces: `adapters workspaces - Workspace lifecycle

Usage:
  adapters workspaces list [--json]
  adapters workspaces create <name> --repo <path> [--repo <path>...] [--mode worktree|symlink]
  adapters workspaces archive <workspace>
  adapters workspaces cleanup <workspace>
  adapters workspaces recover <workspace>
  adapters workspaces delete <workspace> [--force]

Flags:
  --repo <path>      Local cloned repository path (repeatable)
  --mode <mode>      worktree or symlink
  --branch <name>    Branch prefix for worktree creation
  --root <path>      Override workspace root directory
  --force            Allow delete to clean up on disk first
  --json             Output as JSON
`,
  config: `adapters config - Configuration management

Usage:
  adapters config get <agent> [field]
  adapters config set <agent> <field> <value>
  adapters config schema <agent>
  adapters config validate <agent>
  adapters config reload [agent]

Flags:
  --scope <scope>    global or project
  --json             Output as JSON

Examples:
  adapters config get claude
  adapters config get claude model
  adapters config set claude model claude-sonnet-4-20250514
  adapters config schema codex
`,
  profiles: `adapters profiles - Profile management

Usage:
  adapters profiles list [flags]
  adapters profiles show <name>
  adapters profiles set <name> [run-flags]
  adapters profiles delete <name> [flags]
  adapters profiles apply <name>

Flags:
  --scope <scope>    global or project
  --json             Output as JSON

Examples:
  adapters profiles list
  adapters profiles set fast --agent claude --yolo --max-turns 5
  adapters profiles show fast
  adapters profiles delete fast
`,
  auth: `adapters auth - Authentication

Usage:
  adapters auth check [agent]
  adapters auth setup <agent>

Flags:
  --json    Output as JSON

Examples:
  adapters auth check
  adapters auth check claude
  adapters auth setup gemini
`,
  install: `adapters install - Install agent CLI binaries

Usage:
  adapters install <agent> [--force] [--dry-run] [--version <v>] [--json]
  adapters install --all [--force] [--dry-run] [--json]
  adapters uninstall <agent> [--json]

Flags:
  --all             Install every registered agent
  --force           Reinstall even if already present
  --dry-run         Print the planned command without executing
  --version <v>     Pin to a specific version (npm only)
  --json            Output as JSON

Examples:
  adapters install claude
  adapters install --all --dry-run
  adapters uninstall codex
`,
  update: `adapters update - Update an installed agent CLI

Usage:
  adapters update <agent> [--dry-run] [--json]
  adapters update --all [--dry-run] [--json]

Flags:
  --all       Update every registered agent
  --dry-run   Print the planned command without executing
  --json      Output as JSON

Examples:
  adapters update claude
  adapters update --all
`,
  detect: `adapters detect - Report installed version, path, and status per agent

Usage:
  adapters detect <agent> [--json]
  adapters detect --all [--json]

Flags:
  --all     Detect every registered agent
  --json    Output as JSON

Examples:
  adapters detect claude
  adapters detect --all --json
`,
  uninstall: `adapters uninstall - Uninstall an agent CLI binary

Usage:
  adapters uninstall <agent> [--json]
`,
  'detect-host': `adapters detect-host - Detect the current agent harness

Usage:
  adapters detect-host [--json]

Inspects env vars, parent process, and TTY signals to report which
coding-agent harness (claude, codex, gemini, ...) this CLI is running
inside, if any.
`,
  remote: `adapters remote - Install / update adapters on a remote host

Usage:
  adapters remote install <host> --mode <ssh|docker|k8s|local> [flags]
  adapters remote update  <host> --mode <ssh|docker|k8s|local> [flags]

Flags:
  --mode <mode>            ssh | docker | k8s | local (required)
  --harness <agent>        Agent to install after adapters (default: claude)
  --image <img>            Docker image (docker mode)
  --identity-file <path>   SSH key path (ssh mode)
  --port <n>               SSH port (ssh mode)
  --namespace <ns>         Kubernetes namespace (k8s mode)
  --context <ctx>          Kubernetes context (k8s mode)
  --force                  Reinstall even if adapters is already present
  --dry-run                Print the planned commands without executing
  --json                   Output as JSON

Examples:
  adapters remote install host.example.com --mode ssh --dry-run
  adapters remote install my-pod --mode k8s --namespace dev --harness codex
`,
  plugins: `adapters plugins - Plugin management

Usage:
  adapters plugins list <agent> [flags]
  adapters plugins install <agent> <plugin> [flags]
  adapters plugins uninstall <agent> <plugin>

Flags:
  --version <ver>    Pin to specific version
  --global           Install globally
  --json             Output as JSON
`,
  plugin: `adapters plugin - Native agent plugin management

Usage:
  adapters plugin list <agent>
  adapters plugin install <agent> <plugin>
  adapters plugin enable <agent> <plugin>
  adapters plugin disable <agent> <plugin>
  adapters plugin marketplace <agent> [cmd]

Flags:
  --help    Show help

Examples:
  adapters plugin list claude
  adapters plugin install claude filesystem-watcher
  adapters plugin marketplace claude

Note: This command delegates to native agent plugin systems.
      For MCP server management, use "adapters mcp" instead.
`,
  mcp: `adapters mcp - MCP (Model Context Protocol) server management

Usage:
  adapters mcp list <agent>
  adapters mcp install <agent> <server>
  adapters mcp enable <agent> <server>
  adapters mcp disable <agent> <server>

Examples:
  adapters mcp list claude
  adapters mcp install claude filesystem
  adapters mcp enable claude memory
`,
  hooks: `adapters hooks - Unified hook management and dispatch

Usage:
  adapters hooks discover [--json]              List supported hook types per harness
  adapters hooks list [--agent <a>] [--json]    List registered hooks
  adapters hooks add --id <id> --agent <a> --hook-type <t> --handler <builtin|command|script> --target <t>
  adapters hooks remove <id>
  adapters hooks set <id> [--priority N] [--enabled true|false]
  adapters hooks handle <agent> <hookType>      Dispatch a hook (reads payload JSON from stdin)
  adapters hooks install <agent> <hookType> <command>   Write native hook entry into harness config

Flags:
  --global / --project     Target scope (default: project)
  --priority <int>         Sort order (lower = earlier); default 100
  --enabled <bool>         Enable or disable without removal
  --json                   Output as JSON

Examples:
  adapters hooks discover
  adapters hooks add --id trace-all --agent '*' --hook-type '*' --handler builtin --target trace
  adapters hooks install claude PreToolUse "adapters hooks handle claude PreToolUse"
`,
  launch: `adapters launch - Launch a harness with provider/model config

Usage: adapters launch <harness> [provider] [flags...]

Provider Flags:
  --model, -m <model>          Model identifier
  --api-key <key>              API key for the provider
  --api-base <url>             Custom API endpoint
  --region <region>            Cloud region (Bedrock, Vertex)
  --project <id>               Cloud project (Vertex, Foundry)
  --transport, -t <proto>      Wire protocol: anthropic, openai-chat, openai-responses, google
  --auth-command <cmd>         External command that emits a bearer token

Proxy Flags:
  --with-proxy-if-needed       Auto-launch adapters-proxy if harness can't speak provider natively
  --with-proxy                 Force proxy even if not needed
  --no-proxy                   Disable proxy (error if needed)
  --proxy-port <port>          Proxy listen port (0=auto)
  --proxy-log-level <level>    Proxy log level (debug, info, warn, error)

Session Flags:
  --prompt, -p <text>          Non-interactive mode with prompt
  --resume, -r <id>            Resume session by ID
  --session-id, -s <id>        Explicit new session ID
  --max-turns <n>              Turn limit
  --dry-run                    Print resolved plan as JSON, don't execute

Examples:
  adapters launch claude bedrock --region us-east-1
  adapters launch codex bedrock --with-proxy-if-needed -p "fix the bug"
  adapters launch gemini vertex --project my-proj --region us-central1
  adapters launch claude ollama --model qwen3:32b --with-proxy-if-needed
  adapters launch claude anthropic --dry-run
`,
  gateway: `adapters gateway - Gateway service and token management

Usage:
  adapters gateway serve [--config <path>] [--host <host>] [--port <port>] [--webui <path>] [--no-webui]
  adapters gateway tokens list [--config <path>]
  adapters gateway tokens create [--config <path>] [--name <name>] [--ttl-ms <ms>] [--qr] [--url <url>]
  adapters gateway tokens revoke <id> [--config <path>]
  adapters gateway status [--url <url>]

Examples:
  adapters gateway serve
  adapters gateway tokens create --name phone --qr
  adapters gateway status --url http://127.0.0.1:7878
`,
  doctor: `adapters doctor - Health check for adapters environment

Usage:
  adapters doctor [--json]

Aggregates:
  - Node.js version (>= 20.9.0)
  - Installed harness CLIs and versions (per adapter detectInstallation)
  - Auth status per adapter (detectAuth)
  - Config file presence per adapter
  - Hook registry + .adapters paths

Use this first when filing a bug. The text report is stable for copy/paste.
`,
  skill: `adapters skill - Manage skill folders for agents

Usage: adapters skill <subcommand> <agent> [args] [--global|--project]

Manage skill folders for an agent (file-convention based, no native command).

Subcommands:
  list <agent>                       List installed skills
  add <agent> <source-folder>        Copy a skill folder into the agent skills dir
                                     [--name <name>] [--force]
  remove <agent> <name>              Remove a skill folder
  where <agent>                      Show skill directory paths for the agent
  agents                             List agents with known skill conventions

Scope flags (default: --project):
  --global                           Use the user-level skills dir
  --project                          Use the project-level skills dir

Examples:
  adapters skill list claude
  adapters skill add claude ./skills/my-skill --global
  adapters skill remove claude my-skill --project
`,
  agent: `adapters agent - Manage custom sub-agents for harnesses

Usage: adapters agent <subcommand> <agent> [args] [--global|--project]

Manage custom sub-agents for a harness (file-convention based, no native command).

Subcommands:
  list <agent>                       List installed sub-agents
  add <agent> <source>               Copy an agent file or folder into the agents dir
                                     [--name <name>] [--force]
  remove <agent> <name>              Remove an agent file or folder
  where <agent>                      Show agent directory paths
  agents                             List harnesses with known agent conventions

Scope flags (default: --project):
  --global                           Use the user-level agents dir
  --project                          Use the project-level agents dir

Examples:
  adapters agent list claude
  adapters agent add claude ./my-agent.md --global
  adapters agent remove claude my-agent.md --project
`,
};

/**
 * Print help for a command or the main help.
 */
export function printHelp(command?: string): void {
  if (command && COMMAND_HELP[command]) {
    process.stdout.write(COMMAND_HELP[command] + '\n');
  } else {
    process.stdout.write(MAIN_HELP);
  }
}

/**
 * Print version.
 */
export function printVersion(): void {
  process.stdout.write(`adapters v${VERSION}\n`);
}
