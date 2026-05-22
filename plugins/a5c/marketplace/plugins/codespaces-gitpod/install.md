# codespaces-gitpod — Install Instructions

Configure your project for cloud development environments — GitHub Codespaces (`.devcontainer/devcontainer.json` + prebuilds) and Gitpod (`.gitpod.yml` + prebuild configuration). Sets up port forwarding, task automation, VS Code extensions, and parallel setup hooks so a fresh cloud workspace is productive in under a minute.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect primary language(s) from `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`
2. Detect package manager: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `uv.lock`, `poetry.lock`
3. Read `scripts` / `[tool.poetry.scripts]` to identify dev commands (`dev`, `start`, `build`, `test`)
4. Check for existing cloud config: `.devcontainer/`, `.gitpod.yml`, `.gitpod.Dockerfile`
5. Detect default ports from framework conventions (Next: 3000, Vite: 5173, Django: 8000, Rails: 3000, Go: 8080)
6. Check for sidecar services in `docker-compose.yml`
7. Summarize findings to the user

### Stage 2: Target Platforms

Ask which platforms to configure (multi-select):

1. **GitHub Codespaces** — `.devcontainer/devcontainer.json` + prebuild via repo settings
2. **Gitpod** — `.gitpod.yml` + optional `.gitpod.Dockerfile` + prebuilds via `.gitpod.yml` `prebuilds:` key
3. **Both** — Cross-compatible setup (recommended)

### Stage 3: Tasks

Ask which tasks should run on workspace start (multi-select):
- `install` — package manager install (runs once during prebuild)
- `build` — project build (runs during prebuild when possible)
- `dev` — dev server (runs every time workspace opens; stays running)
- `db` — start database / run migrations
- `test` — seed test run to prove environment

### Stage 4: Ports

Confirm the ports to expose, their visibility (`private`, `org`, `public`), and labels. Codespaces and Gitpod both support auto-preview on forward.

### Stage 5: Extensions & Dotfiles

Ask:
- Enable user dotfiles repo support? (Codespaces and Gitpod both support this via user settings — no repo config needed; just document it)
- VS Code extensions list? (default: stack-curated)

## Step 2: GitHub Codespaces — `devcontainer.json`

If `.devcontainer/devcontainer.json` does not already exist (or the user wants to overwrite), create it:

```jsonc
{
  "name": "cloud-dev",
  "image": "mcr.microsoft.com/devcontainers/universal:3-linux",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "forwardPorts": [3000, 5173, 8000],
  "portsAttributes": {
    "3000": { "label": "web", "onAutoForward": "openPreview", "visibility": "private" },
    "5173": { "label": "vite", "onAutoForward": "openPreview" },
    "8000": { "label": "api", "onAutoForward": "notify" }
  },
  "onCreateCommand": "bash .devcontainer/on-create.sh",
  "postCreateCommand": "bash .devcontainer/post-create.sh",
  "postStartCommand": "bash .devcontainer/post-start.sh",
  "waitFor": "postCreateCommand",
  "hostRequirements": { "cpus": 4, "memory": "8gb", "storage": "32gb" },
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-python.python",
        "charliermarsh.ruff",
        "github.vscode-github-actions",
        "GitHub.copilot",
        "anthropic.claude-code"
      ]
    }
  }
}
```

### Setup Scripts

`.devcontainer/on-create.sh` — runs once at container creation (cached in prebuild):

```bash
#!/usr/bin/env bash
set -euo pipefail
if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm fetch; fi
if [ -f uv.lock ]; then uv sync --frozen; fi
```

`.devcontainer/post-create.sh` — runs after create, source tree available:

```bash
#!/usr/bin/env bash
set -euo pipefail
if [ -f pnpm-lock.yaml ]; then pnpm install --offline --frozen-lockfile; fi
if [ -f package-lock.json ]; then npm ci; fi
if [ -f poetry.lock ]; then poetry install; fi
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f go.mod ]; then go mod download; fi
if [ -f Cargo.toml ]; then cargo fetch; fi
```

`.devcontainer/post-start.sh` — runs every time the workspace resumes:

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "Workspace resumed at $(date)"
```

```bash
chmod +x .devcontainer/*.sh
```

## Step 3: Codespaces Prebuilds

Prebuilds are configured via the GitHub UI, not a file. Document the steps:

1. Navigate to `Settings → Codespaces → Set up prebuild`
2. Choose branches (`main` + release branches)
3. Trigger: `Every push` (fast) or `Configuration changes` (cheap)
4. Region(s): pick based on team location
5. Machine size: at least 4-core for Node/Python monorepos
6. Retention: 1 latest prebuild per branch (default)

Create `.github/CODEOWNERS` entry (optional) so `.devcontainer/**` changes require review before invalidating prebuilds.

## Step 4: Gitpod — `.gitpod.yml`

```yaml
image: gitpod/workspace-full:latest

tasks:
  - name: install
    init: |
      if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; fi
      if [ -f package-lock.json ]; then npm ci; fi
      if [ -f uv.lock ]; then uv sync; fi
      if [ -f poetry.lock ]; then poetry install; fi
      if [ -f go.mod ]; then go mod download; fi
      if [ -f Cargo.toml ]; then cargo fetch; fi
    command: echo "Dependencies ready"
  - name: dev
    command: npm run dev --if-present || python manage.py runserver 0.0.0.0:8000 || echo "no dev command"

ports:
  - port: 3000
    onOpen: open-preview
    visibility: private
  - port: 5173
    onOpen: open-preview
  - port: 8000
    onOpen: notify

prebuilds:
  master: true
  branches: true
  pullRequests: true
  pullRequestsFromForks: false
  addCheck: true
  addComment: false
  addBadge: true

vscode:
  extensions:
    - dbaeumer.vscode-eslint
    - esbenp.prettier-vscode
    - ms-python.python
    - charliermarsh.ruff
    - anthropic.claude-code

github:
  prebuilds:
    master: true
    branches: true
    pullRequests: true
```

For a custom image, create `.gitpod.Dockerfile`:

```dockerfile
FROM gitpod/workspace-full:latest
RUN sudo apt-get update && sudo apt-get install -y --no-install-recommends \
    postgresql-client \
    && sudo rm -rf /var/lib/apt/lists/*
```

And in `.gitpod.yml`:

```yaml
image:
  file: .gitpod.Dockerfile
```

## Step 5: Add Gitpod Button to README (Optional)

```markdown
[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/OWNER/REPO)
```

## Step 6: Codespaces Secrets

Document in repo `CONTRIBUTING.md` how to set user/repo secrets for Codespaces (`Settings → Codespaces → Secrets`) — e.g. `DATABASE_URL`, `ANTHROPIC_API_KEY`.

## Step 7: CI Smoke Test

Create `.github/workflows/cloud-dev.yml` to verify the config builds:

```yaml
name: Cloud Dev Config Check
on:
  pull_request:
    paths: ['.devcontainer/**', '.gitpod.yml', '.gitpod.Dockerfile']
jobs:
  devcontainer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: devcontainers/ci@v0.3
        with:
          runCmd: bash .devcontainer/post-create.sh
  gitpod-yaml:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: npx -y js-yaml .gitpod.yml > /dev/null
```

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name codespaces-gitpod --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify

1. Open the repo in Codespaces — dependencies install, dev server boots, port preview opens
2. Open in Gitpod — `init` completes, `command` runs, ports forward
3. Prebuild status visible on PR checks
4. Extensions auto-install
5. README badge (if added) routes correctly

## Reference

- Codespaces config: https://docs.github.com/en/codespaces
- Gitpod config reference: https://www.gitpod.io/docs/references/gitpod-yml
- Dev Containers spec: https://containers.dev/
