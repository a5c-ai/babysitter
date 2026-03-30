# agentsh -- Install Instructions

This plugin installs [agentsh](https://www.agentsh.org/) -- a sandbox and policy enforcement layer that intercepts every shell command, file operation, and network call made by AI agents. After installation, all Bash tool calls in your harness session route through agentsh automatically via hooks.

---

## Step 1: Detect Platform and Prerequisites

Determine the current platform and check prerequisites:

```bash
uname -s 2>/dev/null || echo "Windows"
```

Verify the following tools are available:

```bash
which jq >/dev/null 2>&1 && echo "jq: ok" || echo "jq: MISSING -- install jq first"
which git >/dev/null 2>&1 && echo "git: ok" || echo "git: MISSING"
```

If `jq` is missing, stop and ask the user to install it before continuing.

---

## Step 2: Install agentsh Binary

### Linux (Debian/Ubuntu)

Download the latest release package and install:

```bash
# Get latest release version
AGENTSH_VERSION=$(curl -sL https://api.github.com/repos/canyonroad/agentsh/releases/latest | jq -r .tag_name)
ARCH=$(dpkg --print-architecture 2>/dev/null || echo "amd64")

# Download and install
curl -sLO "https://github.com/canyonroad/agentsh/releases/download/${AGENTSH_VERSION}/agentsh_${AGENTSH_VERSION#v}_linux_${ARCH}.deb"
sudo dpkg -i "agentsh_${AGENTSH_VERSION#v}_linux_${ARCH}.deb"
rm -f "agentsh_${AGENTSH_VERSION#v}_linux_${ARCH}.deb"
```

### Linux (RPM-based)

```bash
AGENTSH_VERSION=$(curl -sL https://api.github.com/repos/canyonroad/agentsh/releases/latest | jq -r .tag_name)
ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')

curl -sLO "https://github.com/canyonroad/agentsh/releases/download/${AGENTSH_VERSION}/agentsh_${AGENTSH_VERSION#v}_linux_${ARCH}.rpm"
sudo rpm -i "agentsh_${AGENTSH_VERSION#v}_linux_${ARCH}.rpm"
rm -f "agentsh_${AGENTSH_VERSION#v}_linux_${ARCH}.rpm"
```

### macOS

Install FUSE-T first (required for standard mode):

```bash
brew install fuse-t
```

Then build from source:

```bash
AGENTSH_VERSION=$(curl -sL https://api.github.com/repos/canyonroad/agentsh/releases/latest | jq -r .tag_name)
git clone --depth 1 --branch "$AGENTSH_VERSION" https://github.com/canyonroad/agentsh.git /tmp/agentsh-build
cd /tmp/agentsh-build
CGO_ENABLED=1 go build -o bin/agentsh ./cmd/agentsh
sudo install -m 0755 bin/agentsh /usr/local/bin/agentsh
sudo install -m 0755 bin/agentsh-shell-shim /usr/local/bin/agentsh-shell-shim
cd - && rm -rf /tmp/agentsh-build
```

If `go` is not installed, install it first: `brew install go`

### Windows (WSL2)

agentsh achieves 100% enforcement on WSL2 (same as native Linux). Use the Linux Debian/Ubuntu instructions inside WSL2.

For native Windows, agentsh uses a mini-filter driver. Download the Windows installer from the [releases page](https://github.com/canyonroad/agentsh/releases).

### Build from Source (any platform with Go)

```bash
git clone --depth 1 https://github.com/canyonroad/agentsh.git /tmp/agentsh-build
cd /tmp/agentsh-build
make build
sudo install -m 0755 bin/agentsh bin/agentsh-shell-shim /usr/local/bin/
cd - && rm -rf /tmp/agentsh-build
```

### Verify Installation

```bash
agentsh --version
agentsh detect
```

The `detect` command probes your kernel and returns a weighted protection score (0-100) across five domains: file protection, command control, network, resource limits, and isolation. Present this score to the user.

If agentsh is not found after installation, ask the user to check their PATH.

---

## Step 3: Create agentsh Session Configuration

Create a project-level agentsh configuration directory and default policy:

```bash
mkdir -p .a5c/agentsh
```

Write a default agentsh policy file at `.a5c/agentsh/policy.yaml`:

```yaml
# agentsh sandbox policy for AI agent sessions
# Customize allowed commands, file access, and network rules

sandbox:
  # File system protection
  filesystem:
    # Writable paths (project workspace + temp)
    writable:
      - "."
      - "/tmp"
      - "${HOME}/.a5c"
    # Read-only paths (system, node_modules, etc.)
    readonly:
      - "/usr"
      - "/etc"
      - "${HOME}/.npm"
      - "${HOME}/.config"

  # Command control
  commands:
    # Always allowed commands
    allow:
      - git
      - node
      - npm
      - npx
      - pnpm
      - yarn
      - bun
      - python
      - python3
      - pip
      - pip3
      - go
      - cargo
      - rustc
      - make
      - cmake
      - gcc
      - g++
      - clang
      - ls
      - cat
      - head
      - tail
      - grep
      - find
      - sed
      - awk
      - curl
      - wget
      - jq
      - tar
      - gzip
      - unzip
      - mkdir
      - cp
      - mv
      - rm
      - touch
      - chmod
      - echo
      - printf
      - tee
      - sort
      - uniq
      - wc
      - diff
      - which
      - env
      - babysitter
    # Commands requiring approval
    prompt:
      - docker
      - kubectl
      - terraform
      - ssh
      - scp
    # Blocked commands
    deny:
      - reboot
      - shutdown
      - mkfs
      - dd
      - fdisk

  # Network control
  network:
    # Allowed outbound domains
    allow:
      - "github.com"
      - "api.github.com"
      - "registry.npmjs.org"
      - "pypi.org"
      - "proxy.golang.org"
      - "crates.io"
      - "api.anthropic.com"
      - "api.openai.com"
      - "localhost"
      - "127.0.0.1"
    # Block everything else by default
    default: deny

  # Resource limits
  resources:
    max_processes: 100
    max_file_size_mb: 500
    max_open_files: 1024
```

Write a session launcher script at `.a5c/agentsh/start-session.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${1:-$(pwd)}"
POLICY="${2:-.a5c/agentsh/policy.yaml}"

# Create agentsh session with real-paths mode
SESSION_ID=$(agentsh session create \
  --workspace "$WORKSPACE" \
  --real-paths \
  ${POLICY:+--policy "$POLICY"} \
  2>/dev/null | jq -r .id)

if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
  echo "ERROR: Failed to create agentsh session" >&2
  exit 1
fi

echo "$SESSION_ID"
```

```bash
chmod +x .a5c/agentsh/start-session.sh
```

---

## Step 4: Integrate with Current Harness

Follow the integration section matching the harness you are running in:

### Claude Code Integration

#### 4a. Create the bash-wrapper hook script

Write `.a5c/agentsh/agentsh-bash-hook.sh`:

```bash
#!/usr/bin/env bash
# agentsh bash wrapper hook for Claude Code
# Routes all Bash tool calls through agentsh exec
set -euo pipefail

# Read hook input from stdin
HOOK_INPUT=$(cat)
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // empty')

# Only intercept Bash tool calls
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

# Get or create agentsh session
SESSION_FILE=".a5c/agentsh/.session-id"
if [ -f "$SESSION_FILE" ]; then
  AGENTSH_SESSION=$(cat "$SESSION_FILE")
  # Verify session is still valid
  if ! agentsh session status "$AGENTSH_SESSION" >/dev/null 2>&1; then
    AGENTSH_SESSION=""
  fi
fi

if [ -z "${AGENTSH_SESSION:-}" ]; then
  AGENTSH_SESSION=$(.a5c/agentsh/start-session.sh "$(pwd)")
  echo "$AGENTSH_SESSION" > "$SESSION_FILE"
fi

export AGENTSH_SESSION_ID="$AGENTSH_SESSION"

# Extract the command from the hook input
COMMAND=$(echo "$HOOK_INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Replace the command with agentsh-wrapped version
# Output the modified tool input for Claude Code to execute
cat <<HOOK_EOF
{
  "tool_input": {
    "command": "agentsh exec $AGENTSH_SESSION -- bash -c $(echo "$COMMAND" | jq -Rs .)"
  }
}
HOOK_EOF
```

```bash
chmod +x .a5c/agentsh/agentsh-bash-hook.sh
```

#### 4b. Create session lifecycle hooks

Write `.a5c/agentsh/agentsh-session-start.sh`:

```bash
#!/usr/bin/env bash
# Start agentsh session when Claude Code session begins
set -euo pipefail

SESSION_FILE=".a5c/agentsh/.session-id"
mkdir -p .a5c/agentsh

# Create a new agentsh session
AGENTSH_SESSION=$(.a5c/agentsh/start-session.sh "$(pwd)")
echo "$AGENTSH_SESSION" > "$SESSION_FILE"

echo "[agentsh] Session started: $AGENTSH_SESSION"
```

Write `.a5c/agentsh/agentsh-session-end.sh`:

```bash
#!/usr/bin/env bash
# Clean up agentsh session when Claude Code session ends
set -euo pipefail

SESSION_FILE=".a5c/agentsh/.session-id"

if [ -f "$SESSION_FILE" ]; then
  AGENTSH_SESSION=$(cat "$SESSION_FILE")
  agentsh session destroy "$AGENTSH_SESSION" 2>/dev/null || true
  rm -f "$SESSION_FILE"
  echo "[agentsh] Session destroyed: $AGENTSH_SESSION"
fi
```

```bash
chmod +x .a5c/agentsh/agentsh-session-start.sh
chmod +x .a5c/agentsh/agentsh-session-end.sh
```

#### 4c. Register hooks in Claude Code settings

Add the following hooks to `.claude/settings.json` (merge into existing hooks, do not overwrite):

**PreToolUse hook** -- intercepts Bash calls and routes through agentsh:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".a5c/agentsh/agentsh-bash-hook.sh"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": ".a5c/agentsh/agentsh-session-start.sh"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": ".a5c/agentsh/agentsh-session-end.sh"
          }
        ]
      }
    ]
  }
}
```

When merging, preserve all existing hooks -- append the agentsh hooks to any existing arrays for the same event types.

### Codex Integration

#### 4a. Create the codex hook scripts

Write `.a5c/agentsh/agentsh-codex-hook.sh`:

```bash
#!/usr/bin/env bash
# agentsh wrapper for Codex shell commands
set -euo pipefail

SESSION_FILE=".a5c/agentsh/.session-id"
if [ ! -f "$SESSION_FILE" ]; then
  AGENTSH_SESSION=$(.a5c/agentsh/start-session.sh "$(pwd)")
  echo "$AGENTSH_SESSION" > "$SESSION_FILE"
fi

AGENTSH_SESSION=$(cat "$SESSION_FILE")
export AGENTSH_SESSION_ID="$AGENTSH_SESSION"

# Codex UserPromptSubmit hook -- wrap any shell execution
HOOK_INPUT=$(cat)
echo "$HOOK_INPUT"
```

```bash
chmod +x .a5c/agentsh/agentsh-codex-hook.sh
```

#### 4b. Install the shell shim for Codex

Codex uses `/bin/sh -c` and `/bin/bash -lc` for shell commands. Install the agentsh shell shim so these are intercepted:

```bash
agentsh shim install-shell \
  --shim $(which agentsh-shell-shim) \
  --bash \
  --i-understand-this-modifies-the-host
```

Set the agentsh server endpoint in the Codex environment:

Add to `.codex/config.toml` (or ensure it's in the environment):

```bash
export AGENTSH_SERVER=http://127.0.0.1:18080
```

#### 4c. Register Codex hooks

Add to `.codex/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": ".a5c/agentsh/agentsh-session-start.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": ".a5c/agentsh/agentsh-session-end.sh"
          }
        ]
      }
    ]
  }
}
```

### Gemini CLI / Other Harnesses

For harnesses that support `AGENTS.md` or project instruction files, add the following to the project's `AGENTS.md` (or equivalent):

```markdown
## agentsh Shell Enforcement

All shell commands MUST route through agentsh for sandboxed execution.

Before running any shell command, wrap it:

```
agentsh exec SESSION_ID -- COMMAND [ARGS...]
```

Or with the environment variable set:

```
export AGENTSH_SESSION_ID=$(cat .a5c/agentsh/.session-id)
agentsh exec -- COMMAND [ARGS...]
```

The `--` separator is required between session ID and command.
```

Also create a session start script and instruct the user to start it manually before sessions:

```bash
.a5c/agentsh/start-session.sh "$(pwd)" > .a5c/agentsh/.session-id
```

---

## Step 5: Add CLAUDE.md Integration

Append the following block to the project's `CLAUDE.md` (create if it doesn't exist). This ensures the LLM is aware of agentsh even when hooks aren't available:

```markdown
## agentsh Sandbox

This project uses [agentsh](https://www.agentsh.org/) for shell command sandboxing.
All shell commands are routed through agentsh via hooks -- no manual wrapping needed.

- Session ID is stored in `.a5c/agentsh/.session-id`
- Policy is at `.a5c/agentsh/policy.yaml`
- If a command is blocked by agentsh policy, do NOT retry with workarounds. Report the blocked command to the user.
- The `agentsh detect` command shows current platform enforcement level.
```

---

## Step 6: Verify Installation

Run the following verification checks:

```bash
# 1. Verify agentsh is installed
agentsh --version

# 2. Run platform detection
agentsh detect

# 3. Test session creation
TEST_SESSION=$(.a5c/agentsh/start-session.sh "$(pwd)")
echo "Test session created: $TEST_SESSION"

# 4. Test command execution through agentsh
agentsh exec "$TEST_SESSION" -- echo "agentsh is working"

# 5. Test command blocking (should be denied by policy)
agentsh exec "$TEST_SESSION" -- reboot 2>&1 || echo "Correctly blocked dangerous command"

# 6. Destroy test session
agentsh session destroy "$TEST_SESSION" 2>/dev/null || true
```

Present the verification results to the user. If any check fails, troubleshoot before completing.

---

## Step 7: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name agentsh --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

---

## Post-Installation Summary

Present the user with:

```
agentsh Plugin -- Installation Complete

Binary:       agentsh $(agentsh --version 2>/dev/null || echo "not found")
Platform:     [platform from detect]
Enforcement:  [score from detect]/100
Harness:      [detected harness name]
Integration:  [hooks / shell-shim / AGENTS.md]
Policy:       .a5c/agentsh/policy.yaml
Session mgmt: .a5c/agentsh/start-session.sh

Hooks installed:
  - PreToolUse (Bash) -> agentsh exec wrapper
  - SessionStart      -> agentsh session create
  - SessionEnd        -> agentsh session destroy

All Bash tool calls now route through agentsh automatically.
Run `agentsh detect` to see your platform enforcement score.
Edit .a5c/agentsh/policy.yaml to customize allowed commands, network rules, and file access.
```
