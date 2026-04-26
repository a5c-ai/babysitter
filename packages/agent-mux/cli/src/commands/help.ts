/**
 * `amux help` and `--help` support.
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
const MAIN_HELP = `amux - Agent Multiplexer CLI (v${VERSION})

Usage: amux [command] [subcommand] [args] [flags]

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
  remote                  Install / update amux on a remote host
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
  amux run claude "explain this code"
  amux run --agent gemini --json "list all files"
  amux adapters list
  amux models list claude
  amux sessions list claude
  amux config get claude model
  amux workspaces list
`;

/** Command-specific help texts. */
const COMMAND_HELP: Record<string, string> = {
  run: `amux run - Run an agent with a prompt

Usage: amux run [<agent>] [<prompt>] [flags]

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
  amux run claude "explain this codebase"
  amux run codex --yolo --no-session "add tests"
  amux run --profile fast "review this PR"
`,
  adapters: `amux adapters - Adapter discovery

Usage:
  amux adapters list [flags]
  amux adapters detect <agent> [flags]
  amux adapters info <agent> [flags]

Flags:
  --json    Output as JSON

Examples:
  amux adapters list
  amux adapters detect claude
  amux adapters info gemini
`,
  models: `amux models - Model registry

Usage:
  amux models list <agent> [flags]
  amux models info <agent> <model> [flags]
  amux models refresh <agent>

Flags:
  --json    Output as JSON

Examples:
  amux models list claude
  amux models info claude claude-sonnet-4-20250514
`,
  sessions: `amux sessions - Session management

Usage:
  amux sessions list <agent> [flags]
  amux sessions show <agent> <session-id>
  amux sessions search <query> [flags]
  amux sessions export <agent> <session-id> [flags]
  amux sessions cost

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
  workspaces: `amux workspaces - Workspace lifecycle

Usage:
  amux workspaces list [--json]
  amux workspaces create <name> --repo <path> [--repo <path>...] [--mode worktree|symlink]
  amux workspaces archive <workspace>
  amux workspaces cleanup <workspace>
  amux workspaces recover <workspace>
  amux workspaces delete <workspace> [--force]

Flags:
  --repo <path>      Local cloned repository path (repeatable)
  --mode <mode>      worktree or symlink
  --branch <name>    Branch prefix for worktree creation
  --root <path>      Override workspace root directory
  --force            Allow delete to clean up on disk first
  --json             Output as JSON
`,
  config: `amux config - Configuration management

Usage:
  amux config get <agent> [field]
  amux config set <agent> <field> <value>
  amux config schema <agent>
  amux config validate <agent>
  amux config reload [agent]

Flags:
  --scope <scope>    global or project
  --json             Output as JSON

Examples:
  amux config get claude
  amux config get claude model
  amux config set claude model claude-sonnet-4-20250514
  amux config schema codex
`,
  profiles: `amux profiles - Profile management

Usage:
  amux profiles list [flags]
  amux profiles show <name>
  amux profiles set <name> [run-flags]
  amux profiles delete <name> [flags]
  amux profiles apply <name>

Flags:
  --scope <scope>    global or project
  --json             Output as JSON

Examples:
  amux profiles list
  amux profiles set fast --agent claude --yolo --max-turns 5
  amux profiles show fast
  amux profiles delete fast
`,
  auth: `amux auth - Authentication

Usage:
  amux auth check [agent]
  amux auth setup <agent>

Flags:
  --json    Output as JSON

Examples:
  amux auth check
  amux auth check claude
  amux auth setup gemini
`,
  install: `amux install - Install agent CLI binaries

Usage:
  amux install <agent> [--force] [--dry-run] [--version <v>] [--json]
  amux install --all [--force] [--dry-run] [--json]
  amux uninstall <agent> [--json]

Flags:
  --all             Install every registered agent
  --force           Reinstall even if already present
  --dry-run         Print the planned command without executing
  --version <v>     Pin to a specific version (npm only)
  --json            Output as JSON

Examples:
  amux install claude
  amux install --all --dry-run
  amux uninstall codex
`,
  update: `amux update - Update an installed agent CLI

Usage:
  amux update <agent> [--dry-run] [--json]
  amux update --all [--dry-run] [--json]

Flags:
  --all       Update every registered agent
  --dry-run   Print the planned command without executing
  --json      Output as JSON

Examples:
  amux update claude
  amux update --all
`,
  detect: `amux detect - Report installed version, path, and status per agent

Usage:
  amux detect <agent> [--json]
  amux detect --all [--json]

Flags:
  --all     Detect every registered agent
  --json    Output as JSON

Examples:
  amux detect claude
  amux detect --all --json
`,
  uninstall: `amux uninstall - Uninstall an agent CLI binary

Usage:
  amux uninstall <agent> [--json]
`,
  'detect-host': `amux detect-host - Detect the current agent harness

Usage:
  amux detect-host [--json]

Inspects env vars, parent process, and TTY signals to report which
coding-agent harness (claude, codex, gemini, ...) this CLI is running
inside, if any.
`,
  remote: `amux remote - Install / update amux on a remote host

Usage:
  amux remote install <host> --mode <ssh|docker|k8s|local> [flags]
  amux remote update  <host> --mode <ssh|docker|k8s|local> [flags]

Flags:
  --mode <mode>            ssh | docker | k8s | local (required)
  --harness <agent>        Agent to install after amux (default: claude)
  --image <img>            Docker image (docker mode)
  --identity-file <path>   SSH key path (ssh mode)
  --port <n>               SSH port (ssh mode)
  --namespace <ns>         Kubernetes namespace (k8s mode)
  --context <ctx>          Kubernetes context (k8s mode)
  --force                  Reinstall even if amux is already present
  --dry-run                Print the planned commands without executing
  --json                   Output as JSON

Examples:
  amux remote install host.example.com --mode ssh --dry-run
  amux remote install my-pod --mode k8s --namespace dev --harness codex
`,
  plugins: `amux plugins - Plugin management

Usage:
  amux plugins list <agent> [flags]
  amux plugins install <agent> <plugin> [flags]
  amux plugins uninstall <agent> <plugin>

Flags:
  --version <ver>    Pin to specific version
  --global           Install globally
  --json             Output as JSON
`,
  plugin: `amux plugin - Native agent plugin management

Usage:
  amux plugin list <agent>
  amux plugin install <agent> <plugin>
  amux plugin enable <agent> <plugin>
  amux plugin disable <agent> <plugin>
  amux plugin marketplace <agent> [cmd]

Flags:
  --help    Show help

Examples:
  amux plugin list claude
  amux plugin install claude filesystem-watcher
  amux plugin marketplace claude

Note: This command delegates to native agent plugin systems.
      For MCP server management, use "amux mcp" instead.
`,
  mcp: `amux mcp - MCP (Model Context Protocol) server management

Usage:
  amux mcp list <agent>
  amux mcp install <agent> <server>
  amux mcp enable <agent> <server>
  amux mcp disable <agent> <server>

Examples:
  amux mcp list claude
  amux mcp install claude filesystem
  amux mcp enable claude memory
`,
  hooks: `amux hooks - Unified hook management and dispatch

Usage:
  amux hooks discover [--json]              List supported hook types per harness
  amux hooks list [--agent <a>] [--json]    List registered hooks
  amux hooks add --id <id> --agent <a> --hook-type <t> --handler <builtin|command|script> --target <t>
  amux hooks remove <id>
  amux hooks set <id> [--priority N] [--enabled true|false]
  amux hooks handle <agent> <hookType>      Dispatch a hook (reads payload JSON from stdin)
  amux hooks install <agent> <hookType> <command>   Write native hook entry into harness config

Flags:
  --global / --project     Target scope (default: project)
  --priority <int>         Sort order (lower = earlier); default 100
  --enabled <bool>         Enable or disable without removal
  --json                   Output as JSON

Examples:
  amux hooks discover
  amux hooks add --id trace-all --agent '*' --hook-type '*' --handler builtin --target trace
  amux hooks install claude PreToolUse "amux hooks handle claude PreToolUse"
`,
  launch: `amux launch - Launch a harness with provider/model config

Usage: amux launch <harness> [provider] [flags...]

Provider Flags:
  --model, -m <model>          Model identifier
  --api-key <key>              API key for the provider
  --api-base <url>             Custom API endpoint
  --region <region>            Cloud region (Bedrock, Vertex)
  --project <id>               Cloud project (Vertex, Foundry)
  --transport, -t <proto>      Wire protocol: anthropic, openai-chat, openai-responses, google
  --auth-command <cmd>         External command that emits a bearer token

Proxy Flags:
  --with-proxy-if-needed       Auto-launch amux-proxy if harness can't speak provider natively
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
  amux launch claude bedrock --region us-east-1
  amux launch codex bedrock --with-proxy-if-needed -p "fix the bug"
  amux launch gemini vertex --project my-proj --region us-central1
  amux launch claude ollama --model qwen3:32b --with-proxy-if-needed
  amux launch claude anthropic --dry-run
`,
  gateway: `amux gateway - Gateway service and token management

Usage:
  amux gateway serve [--config <path>] [--host <host>] [--port <port>] [--webui <path>] [--no-webui]
  amux gateway tokens list [--config <path>]
  amux gateway tokens create [--config <path>] [--name <name>] [--ttl-ms <ms>] [--qr] [--url <url>]
  amux gateway tokens revoke <id> [--config <path>]
  amux gateway status [--url <url>]

Examples:
  amux gateway serve
  amux gateway tokens create --name phone --qr
  amux gateway status --url http://127.0.0.1:7878
`,
  doctor: `amux doctor - Health check for amux environment

Usage:
  amux doctor [--json]

Aggregates:
  - Node.js version (>= 20.9.0)
  - Installed harness CLIs and versions (per adapter detectInstallation)
  - Auth status per adapter (detectAuth)
  - Config file presence per adapter
  - Hook registry + .amux paths

Use this first when filing a bug. The text report is stable for copy/paste.
`,
  skill: `amux skill - Manage skill folders for agents

Usage: amux skill <subcommand> <agent> [args] [--global|--project]

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
  amux skill list claude
  amux skill add claude ./skills/my-skill --global
  amux skill remove claude my-skill --project
`,
  agent: `amux agent - Manage custom sub-agents for harnesses

Usage: amux agent <subcommand> <agent> [args] [--global|--project]

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
  amux agent list claude
  amux agent add claude ./my-agent.md --global
  amux agent remove claude my-agent.md --project
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
  process.stdout.write(`amux v${VERSION}\n`);
}
