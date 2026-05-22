# devcontainer — Install Instructions

Set up reproducible development containers for your project — a `.devcontainer/` directory with a base image matched to your primary stack (Node, Python, Go, Rust, or polyglot), dev container features (git, GitHub CLI, docker-in-docker), post-create provisioning scripts, and a curated list of VS Code extensions. Works locally with VS Code / Cursor, remotely with GitHub Codespaces, and in CI via `devcontainers/ci`.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json`, `pyproject.toml`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `Gemfile` to identify primary language(s)
2. Detect tool versions:
   - Node: `engines.node` in `package.json`, `.nvmrc`, `.tool-versions`
   - Python: `python_requires` in `pyproject.toml`, `.python-version`
   - Go: `go` directive in `go.mod`
   - Rust: `rust-toolchain.toml`, `rust-toolchain`
3. Check for existing container config: `.devcontainer/devcontainer.json`, `Dockerfile`, `docker-compose.yml`
4. Check for package manager: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `poetry.lock`, `uv.lock`, `Pipfile.lock`
5. Check for workspace features: monorepo (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`), Docker services (`docker-compose.yml`)
6. Check for GPU / native deps: `torch`, `tensorflow`, `cuda`, `playwright`, `puppeteer`, `sharp`
7. Summarize findings to the user

### Stage 2: Stack Selection

Ask the user which base image to use (pick one or multi-stack):

1. **Node** — `mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm`
2. **Python** — `mcr.microsoft.com/devcontainers/python:1-3.12-bookworm`
3. **Go** — `mcr.microsoft.com/devcontainers/go:1-1.23-bookworm`
4. **Rust** — `mcr.microsoft.com/devcontainers/rust:1-bookworm`
5. **Universal** — `mcr.microsoft.com/devcontainers/universal:3-linux` (multi-language)
6. **Custom Dockerfile** — Build from project `Dockerfile`

### Stage 3: Features

Multi-select from the dev container features catalog:

- `ghcr.io/devcontainers/features/git:1`
- `ghcr.io/devcontainers/features/github-cli:1`
- `ghcr.io/devcontainers/features/docker-in-docker:2`
- `ghcr.io/devcontainers/features/common-utils:2` (sudo, zsh, oh-my-zsh)
- `ghcr.io/devcontainers/features/node:1` (layer on top)
- `ghcr.io/devcontainers/features/python:1`
- `ghcr.io/devcontainers-extra/features/mise:1`

### Stage 4: Services

Ask if the project needs sidecar services:
- PostgreSQL, MySQL, Redis, RabbitMQ, MinIO, LocalStack
- If yes, generate a `docker-compose.yml` in `.devcontainer/` and reference it via `dockerComposeFile`

### Stage 5: Ports & Post-Create

Ask:
- Which ports to forward? (default: detect from `package.json` scripts, `manage.py`, common 3000/8000/5173)
- Install dependencies on create? (default: yes — matches detected package manager)
- Run database migrations? (default: ask)

## Step 2: Generate `.devcontainer/devcontainer.json`

### Node stack

```jsonc
{
  "name": "node-dev",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "forwardPorts": [3000, 5173],
  "postCreateCommand": "bash .devcontainer/post-create.sh",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-azuretools.vscode-docker",
        "github.vscode-github-actions",
        "eamodio.gitlens",
        "GitHub.copilot",
        "anthropic.claude-code"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
      }
    }
  },
  "remoteUser": "node"
}
```

### Python stack

```jsonc
{
  "name": "python-dev",
  "image": "mcr.microsoft.com/devcontainers/python:1-3.12-bookworm",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers-extra/features/uv:1": {}
  },
  "forwardPorts": [8000],
  "postCreateCommand": "bash .devcontainer/post-create.sh",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "charliermarsh.ruff",
        "ms-python.black-formatter",
        "njpwerner.autodocstring",
        "anthropic.claude-code"
      ]
    }
  }
}
```

### Go stack

```jsonc
{
  "name": "go-dev",
  "image": "mcr.microsoft.com/devcontainers/go:1-1.23-bookworm",
  "features": { "ghcr.io/devcontainers/features/github-cli:1": {} },
  "forwardPorts": [8080],
  "postCreateCommand": "go mod download",
  "customizations": {
    "vscode": { "extensions": ["golang.go", "anthropic.claude-code"] }
  }
}
```

### Rust stack

```jsonc
{
  "name": "rust-dev",
  "image": "mcr.microsoft.com/devcontainers/rust:1-bookworm",
  "postCreateCommand": "cargo fetch",
  "customizations": {
    "vscode": {
      "extensions": [
        "rust-lang.rust-analyzer",
        "tamasfe.even-better-toml",
        "vadimcn.vscode-lldb",
        "anthropic.claude-code"
      ]
    }
  }
}
```

## Step 3: Post-Create Script

Create `.devcontainer/post-create.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing project dependencies"

if [ -f "pnpm-lock.yaml" ]; then
  corepack enable && pnpm install --frozen-lockfile
elif [ -f "package-lock.json" ]; then
  npm ci
elif [ -f "yarn.lock" ]; then
  corepack enable && yarn install --immutable
elif [ -f "uv.lock" ]; then
  uv sync
elif [ -f "poetry.lock" ]; then
  pipx install poetry && poetry install
elif [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
elif [ -f "go.mod" ]; then
  go mod download
elif [ -f "Cargo.toml" ]; then
  cargo fetch
fi

if [ -f ".husky/install.mjs" ]; then
  node .husky/install.mjs || true
fi

echo "==> Done"
```

Make executable:

```bash
chmod +x .devcontainer/post-create.sh
```

## Step 4: Compose-Based Setup (Optional)

If sidecar services were requested, create `.devcontainer/docker-compose.yml` with an `app` service referencing the chosen image plus `db`, `redis`, etc. Replace the `image` field in `devcontainer.json` with:

```jsonc
"dockerComposeFile": "docker-compose.yml",
"service": "app",
"workspaceFolder": "/workspace"
```

## Step 5: CI Integration (devcontainers/ci)

Create `.github/workflows/devcontainer.yml`:

```yaml
name: Dev Container CI
on:
  pull_request:
    paths: ['.devcontainer/**', '.github/workflows/devcontainer.yml']
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: devcontainers/ci@v0.3
        with:
          runCmd: |
            bash .devcontainer/post-create.sh
            npm test --if-present || true
```

## Step 6: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name devcontainer --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 7: Verify

1. `.devcontainer/devcontainer.json` parses cleanly (`devcontainer read-configuration --workspace-folder .`)
2. `devcontainer up --workspace-folder .` brings the container up
3. Post-create script completes without error
4. Extensions install automatically in VS Code / Cursor
5. Forwarded ports are reachable from the host
6. User can open the repo in GitHub Codespaces without modification

## Reference

- Dev Containers spec: https://containers.dev/
- Features index: https://containers.dev/features
- devcontainers/ci action: https://github.com/devcontainers/ci
- Base images: https://github.com/devcontainers/images
