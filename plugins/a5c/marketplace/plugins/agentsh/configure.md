# agentsh -- Configure Instructions

This plugin supports several configuration options. All configuration is stored in `.a5c/agentsh/`.

---

## Configuration Options

| Setting | File | Description |
|---------|------|-------------|
| Sandbox policy | `.a5c/agentsh/policy.yaml` | Command allowlists, file access rules, network rules, resource limits |
| Session mode | `.a5c/agentsh/start-session.sh` | Real-paths vs virtualized workspace |
| Server endpoint | `AGENTSH_SERVER` env var | agentsh server URL (default: `http://127.0.0.1:18080`) |
| Auto-launch | `AGENTSH_NO_AUTO` env var | Set to `1` to disable automatic server startup |
| Shell shim | System-wide | Force-route all `/bin/sh`/`/bin/bash` through agentsh |

---

## Configuring the Sandbox Policy

Edit `.a5c/agentsh/policy.yaml` to customize enforcement rules.

### Adding Allowed Commands

To allow additional commands (e.g., `docker`, `kubectl`):

Move them from the `prompt` or `deny` list to the `allow` list:

```yaml
commands:
  allow:
    - docker
    - kubectl
```

### Adding Network Access

To allow outbound access to additional domains:

```yaml
network:
  allow:
    - "api.example.com"
    - "*.internal.company.com"
```

### Adjusting File Access

To allow writes to additional directories:

```yaml
filesystem:
  writable:
    - "./output"
    - "${HOME}/.cache"
```

### Resource Limits

Adjust process and file limits:

```yaml
resources:
  max_processes: 200
  max_file_size_mb: 1000
  max_open_files: 2048
```

---

## Switching Harness Integration

If you switch harnesses (e.g., from Claude Code to Codex), re-run the installation for Step 5 only:

1. Remove existing hooks for the old harness (see uninstall.md Step 2)
2. Follow the integration instructions in install.md Step 5 for the new harness

---

## Enabling Execve Interception (Linux)

For maximum enforcement on Linux, enable seccomp-based execve interception. Add to `.a5c/agentsh/policy.yaml`:

```yaml
sandbox:
  seccomp:
    enabled: true
    execve:
      enabled: true
      max_argc: 1000
      max_argv_bytes: 65536
      approval_timeout: 10s
```

This intercepts every binary execution through policy, not just direct shell commands.

---

## Enabling Ptrace Mode (Restricted Runtimes)

For environments without seccomp user-notify (AWS Fargate, Modal, gVisor):

```yaml
sandbox:
  ptrace:
    enabled: true
    attach_mode: children
    trace:
      execve: true
      file: true
      network: true
```

Or via environment variables:

```bash
export AGENTSH_PTRACE_ENABLED=1
export AGENTSH_PTRACE_ATTACH_MODE=children
```

---

## Policy Signing (Enterprise)

For teams requiring tamper-proof policies, enable Ed25519 policy signing:

```bash
# Generate signing keys
agentsh policy keygen --output .a5c/agentsh/keys/ --label "team"

# Sign the policy
agentsh policy sign .a5c/agentsh/policy.yaml --key .a5c/agentsh/keys/private.key.json
```

Add to policy:

```yaml
policies:
  signing:
    trust_store: ".a5c/agentsh/keys/"
    mode: "enforce"
```

---

## Audit Log Configuration

Enable tamper-evident audit logging:

```yaml
audit:
  integrity:
    enabled: true
    algorithm: "hmac-sha256"
    key_source: "file"
    key_file: ".a5c/agentsh/hmac.key"
```

Generate the HMAC key:

```bash
openssl rand -hex 32 > .a5c/agentsh/hmac.key
chmod 600 .a5c/agentsh/hmac.key
```

Verify logs offline:

```bash
agentsh audit verify audit.jsonl --key-file .a5c/agentsh/hmac.key
```

---

## Checking Current Status

```bash
# Platform enforcement score
agentsh detect

# Active session
cat .a5c/agentsh/.session-id 2>/dev/null || echo "No active session"

# Test a command through agentsh
SESSION=$(cat .a5c/agentsh/.session-id)
agentsh exec "$SESSION" -- echo "sandbox is active"
```
