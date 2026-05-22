# Docker-based E2E

Two matrices: a **mock** matrix that covers every adapter without credentials,
and a **real** matrix that exercises adapters whose CLIs are installable via npm.

## Mock matrix (no credentials)

One service per adapter. Each runs `run <agent> --use-mock-harness
--mock-scenario <agent>-basic --prompt hello` through the harness-mock.

| Service                         | Adapter            | Notes                    |
| ------------------------------- | ------------------ | ------------------------ |
| `mock-e2e-claude`               | claude             | Core Claude Code CLI     |
| `mock-e2e-codex`                | codex              | OpenAI Codex CLI         |
| `mock-e2e-cursor`               | cursor             | Cursor AI CLI            |
| `mock-e2e-gemini`               | gemini             | Google Gemini CLI        |
| `mock-e2e-opencode`             | opencode           | Anomaly OpenCode CLI     |
| `mock-e2e-openclaw`             | openclaw           | OpenClaw CLI             |
| `mock-e2e-copilot`              | copilot            | GitHub Copilot CLI       |
| `mock-e2e-hermes`               | hermes             | Hermes AI CLI            |
| `mock-e2e-pi`                   | pi                 | Inflection Pi CLI        |
| `mock-e2e-omp`                  | omp                | OMP CLI                  |
| `mock-e2e-agent-mux-remote`     | agent-mux-remote   | Remote agent-mux         |
| `mock-e2e-droid`                | droid              | Factory Droid CLI        |
| `mock-e2e-amp`                  | amp                | Sourcegraph Amp CLI      |
| `mock-e2e-qwen`                 | qwen               | Qwen CLI                 |
| `mock-e2e-claude-agent-sdk`     | claude-agent-sdk   | Programmatic Claude SDK  |
| `mock-e2e-codex-sdk`            | codex-sdk          | Programmatic Codex SDK   |
| `mock-e2e-codex-websocket`      | codex-websocket    | WebSocket Codex          |
| `mock-e2e-opencode-http`        | opencode-http      | HTTP OpenCode Server     |
| `mock-e2e-pi-sdk`               | pi-sdk             | Programmatic Pi SDK      |

```bash
docker compose -f docker/e2e/docker-compose.yml build mock-e2e-claude
docker compose -f docker/e2e/docker-compose.yml up --exit-code-from mock-e2e-claude mock-e2e-claude
```

Exit code 0 = pass. CI runs every mock service.

## Real matrix (credentials required)

One service per adapter whose real CLI is installable via npm.

| Service                     | Adapter            | Required env var          |
| --------------------------- | ------------------ | ------------------------- |
| `real-e2e-claude`           | claude             | `ANTHROPIC_API_KEY`       |
| `real-e2e-codex`            | codex              | `OPENAI_API_KEY`          |
| `real-e2e-cursor`           | cursor             | `CURSOR_API_KEY`          |
| `real-e2e-gemini`           | gemini             | `GOOGLE_API_KEY`          |
| `real-e2e-opencode`         | opencode           | `ANTHROPIC_API_KEY`       |
| `real-e2e-openclaw`         | openclaw           | `OPENCLAW_API_KEY`        |
| `real-e2e-copilot`          | copilot            | `GITHUB_TOKEN`            |
| `real-e2e-hermes`           | hermes             | `HERMES_API_KEY`          |
| `real-e2e-pi`               | pi                 | `INFLECTION_API_KEY`      |
| `real-e2e-omp`              | omp                | `OMP_API_KEY`             |
| `real-e2e-agent-mux-remote` | agent-mux-remote   | `AGENT_MUX_REMOTE_URL`    |
| `real-e2e-droid`            | droid              | `DROID_API_KEY`           |
| `real-e2e-amp`              | amp                | `SOURCEGRAPH_ACCESS_TOKEN`|
| `real-e2e-qwen`             | qwen               | `QWEN_API_KEY`            |
| `real-e2e-claude-agent-sdk` | claude-agent-sdk   | `ANTHROPIC_API_KEY`       |
| `real-e2e-codex-sdk`        | codex-sdk          | `OPENAI_API_KEY`          |
| `real-e2e-codex-websocket`  | codex-websocket    | `OPENAI_API_KEY`          |
| `real-e2e-opencode-http`    | opencode-http      | `ANTHROPIC_API_KEY`       |
| `real-e2e-pi-sdk`           | pi-sdk             | `INFLECTION_API_KEY`      |

Each real service declares its credentials with `${VAR:?}` guards, so compose
fails fast with a readable error if the variable is unset.

```bash
# Export required credentials
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export CURSOR_API_KEY=...
export GOOGLE_API_KEY=AIza...
export GITHUB_TOKEN=ghp_...
export DROID_API_KEY=...
export SOURCEGRAPH_ACCESS_TOKEN=sgp_...
export QWEN_API_KEY=...
# ... other API keys as needed

# Run individual real E2E tests
docker compose -f docker/e2e/docker-compose.yml run --rm real-e2e-claude
docker compose -f docker/e2e/docker-compose.yml run --rm real-e2e-droid
docker compose -f docker/e2e/docker-compose.yml run --rm real-e2e-amp
docker compose -f docker/e2e/docker-compose.yml run --rm real-e2e-codex
# ... or any other real-e2e-* service
```

## Running the Full Matrix

To run all mock services (no credentials needed):
```bash
# Run all mock services in parallel
docker compose -f docker/e2e/docker-compose.yml up --abort-on-container-exit

# Or run individually
docker compose -f docker/e2e/docker-compose.yml up --exit-code-from mock-e2e-claude mock-e2e-claude
docker compose -f docker/e2e/docker-compose.yml up --exit-code-from mock-e2e-droid mock-e2e-droid
docker compose -f docker/e2e/docker-compose.yml up --exit-code-from mock-e2e-amp mock-e2e-amp
```

Only the mock matrix runs in CI. The real matrix is opt-in per maintainer.
