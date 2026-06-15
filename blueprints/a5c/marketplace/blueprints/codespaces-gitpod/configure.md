# codespaces-gitpod — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `platforms` | `codespaces`, `gitpod`, `both` | `both` | which files to maintain |
| `codespacesImage` | any container image | `universal:3-linux` | `devcontainer.json` `image` |
| `gitpodImage` | image ref or `.gitpod.Dockerfile` | `workspace-full:latest` | `.gitpod.yml` `image` |
| `forwardPorts` | list of port numbers | detected | both configs |
| `portVisibility` | `private`, `org`, `public` | `private` | `portsAttributes` / `ports:` |
| `tasks` | install/build/dev/db/test | install+dev | `.gitpod.yml` tasks / `postCreateCommand` |
| `prebuilds` | `off`, `on` | `on` | Codespaces UI / `.gitpod.yml` prebuilds |
| `prebuildBranches` | `main`, `branches`, `pullRequests` | all | `.gitpod.yml` prebuilds + GH settings |
| `hostCpus` / `hostMemory` | number / size | `4` / `8gb` | `hostRequirements` |
| `vscodeExtensions` | list of ids | stack-curated | both configs |
| `gitpodBadge` | `on`, `off` | `off` | README |

## 2. Change Base Image

### Codespaces

```jsonc
// .devcontainer/devcontainer.json
"image": "mcr.microsoft.com/devcontainers/python:1-3.13-bookworm"
```

### Gitpod

```yaml
image: gitpod/workspace-python-3.12:latest
```

Or use a custom Dockerfile:

```yaml
image:
  file: .gitpod.Dockerfile
  context: .
```

## 3. Adjust Forwarded Ports

### Codespaces

```jsonc
"forwardPorts": [3000, 5173, 8000, 9229],
"portsAttributes": {
  "3000": { "label": "web", "onAutoForward": "openPreview", "visibility": "private" }
}
```

### Gitpod

```yaml
ports:
  - port: 3000
    onOpen: open-preview
    visibility: private
  - port: 9229
    onOpen: ignore
    visibility: private
```

## 4. Add / Modify Tasks

### Gitpod

```yaml
tasks:
  - name: db
    before: docker compose up -d db
    command: sleep infinity
  - name: migrate
    init: npm run db:migrate
    command: echo "migrated"
```

`init` runs during prebuild; `before`/`command` run on open.

### Codespaces

Use `onCreateCommand` (prebuild-cacheable), `postCreateCommand` (after clone), `postStartCommand` (every resume):

```jsonc
"onCreateCommand": "pnpm fetch",
"postCreateCommand": "pnpm install --offline && pnpm run db:migrate",
"postStartCommand": "pnpm run dev &"
```

## 5. Tune Prebuilds

### Codespaces prebuilds

Via UI: `Settings → Codespaces → Prebuild configurations → Edit`. No file change required.

Tune: branches, trigger (every push / config change only), region(s), machine size, retention.

### Gitpod prebuilds

```yaml
prebuilds:
  master: true
  branches: true
  pullRequests: true
  pullRequestsFromForks: false
  addCheck: prevent-merge-on-error
  addComment: false
  addBadge: true
  addLabel: false
```

## 6. Host Machine Size

### Codespaces

```jsonc
"hostRequirements": { "cpus": 8, "memory": "16gb", "storage": "64gb" }
```

Codespaces will offer machine sizes meeting these floors.

### Gitpod

Machine class is set per-user in Gitpod settings; no repo override.

## 7. VS Code Extensions

### Codespaces

```jsonc
"customizations": { "vscode": { "extensions": ["anthropic.claude-code"] } }
```

### Gitpod

```yaml
vscode:
  extensions:
    - anthropic.claude-code
    - dbaeumer.vscode-eslint
```

## 8. Environment Variables & Secrets

### Codespaces

- Repo secrets: `Settings → Secrets and variables → Codespaces`
- User secrets: profile `Settings → Codespaces → Secrets`
- Reference in `devcontainer.json`:
  ```jsonc
  "containerEnv": { "NODE_ENV": "development" }
  ```

### Gitpod

- Per-user env: `gp env KEY=value`
- Per-repo env: `.gitpod.yml`:
  ```yaml
  env:
    NODE_ENV: development
  ```

Never commit secrets to `.gitpod.yml` — use `gp env` for user-scoped secrets.

## 9. Enable Docker-in-Docker

### Codespaces

```jsonc
"features": { "ghcr.io/devcontainers/features/docker-in-docker:2": {} }
```

### Gitpod

Use image `gitpod/workspace-full` (includes Docker). Add to `.gitpod.yml`:

```yaml
tasks:
  - init: sudo service docker start
```

## 10. Dotfiles

Both Codespaces and Gitpod support user-level dotfiles repos — configured per-user in the platform UI, not in repo config. Document the recommended dotfiles repo in `CONTRIBUTING.md`.

## 11. Pin Prebuild Cache

To prevent cache thrash, isolate environment setup in `onCreateCommand` (Codespaces) or `init` (Gitpod). Avoid running anything in these hooks that depends on secrets, since prebuilds run without user secrets.
