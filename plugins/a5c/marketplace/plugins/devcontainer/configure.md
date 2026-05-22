# devcontainer — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `baseImage` | `node`, `python`, `go`, `rust`, `universal`, `custom` | detected | `devcontainer.json` `image` |
| `imageTag` | any valid tag | stack-specific | `devcontainer.json` `image` |
| `features` | list of feature refs | stack-specific | `devcontainer.json` `features` |
| `forwardPorts` | list of port numbers | detected | `devcontainer.json` `forwardPorts` |
| `postCreateCommand` | shell command | `bash .devcontainer/post-create.sh` | `devcontainer.json` |
| `postStartCommand` | shell command | (none) | `devcontainer.json` |
| `mounts` | list of bind/volume mounts | `[]` | `devcontainer.json` `mounts` |
| `remoteUser` | username | `node`/`vscode`/`root` | `devcontainer.json` |
| `runArgs` | list of `docker run` args | `[]` | `devcontainer.json` `runArgs` |
| `containerEnv` | object of env vars | `{}` | `devcontainer.json` `containerEnv` |
| `vscodeExtensions` | list of extension ids | stack-curated | `customizations.vscode.extensions` |
| `composeMode` | `off`, `on` | `off` | adds `dockerComposeFile` |
| `hostRequirements` | cpus/memory/storage | unset | `devcontainer.json` `hostRequirements` |

## 2. Upgrade the Base Image

```jsonc
// devcontainer.json
"image": "mcr.microsoft.com/devcontainers/python:1-3.13-bookworm"
```

Rebuild: `Dev Containers: Rebuild Container` in VS Code, or `devcontainer up --remove-existing-container --workspace-folder .`

## 3. Add a Feature

```jsonc
"features": {
  "ghcr.io/devcontainers/features/terraform:1": { "version": "latest" },
  "ghcr.io/devcontainers-extra/features/mise:1": {}
}
```

## 4. Expose Additional Ports

```jsonc
"forwardPorts": [3000, 5173, 8000, 9229],
"portsAttributes": {
  "3000": { "label": "web", "onAutoForward": "openBrowser" },
  "9229": { "label": "node debug", "onAutoForward": "silent" }
}
```

## 5. Mount Secrets and SSH

```jsonc
"mounts": [
  "source=${localEnv:HOME}/.ssh,target=/home/node/.ssh,type=bind,consistency=cached,readonly",
  "source=${localEnv:HOME}/.aws,target=/home/node/.aws,type=bind,readonly"
]
```

For Codespaces, use Codespaces user secrets instead of host bind mounts — bind mounts do not exist in Codespaces.

## 6. Add Sidecar Services

Switch to compose mode. Create `.devcontainer/docker-compose.yml`:

```yaml
services:
  app:
    image: mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm
    volumes: ['..:/workspace:cached']
    command: sleep infinity
    network_mode: service:db
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: devpass
    volumes: ['postgres-data:/var/lib/postgresql/data']
volumes: { postgres-data: {} }
```

Update `devcontainer.json`:

```jsonc
{
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace"
}
```

## 7. GPU Support

```jsonc
"runArgs": ["--gpus=all"],
"hostRequirements": { "gpu": "optional" }
```

Use a CUDA base image: `nvidia/cuda:12.6.1-devel-ubuntu24.04` — then install Python/Node on top via features.

## 8. Customize VS Code Extensions

```jsonc
"customizations": {
  "vscode": {
    "extensions": [
      "dbaeumer.vscode-eslint",
      "anthropic.claude-code",
      "GitHub.copilot"
    ],
    "settings": {
      "terminal.integrated.defaultProfile.linux": "zsh",
      "files.eol": "\n"
    }
  }
}
```

## 9. Environment Variables

Project-wide variables:

```jsonc
"containerEnv": {
  "NODE_ENV": "development",
  "DATABASE_URL": "postgres://postgres:devpass@db:5432/postgres"
}
```

User-specific (not committed): set via Codespaces user secrets or a local `.devcontainer/.env` loaded in `post-create.sh`.

## 10. Host Requirements & Codespaces Machine Sizes

```jsonc
"hostRequirements": { "cpus": 4, "memory": "8gb", "storage": "32gb" }
```

## 11. Prebuilds (GitHub Codespaces)

Enable via `Settings → Codespaces → Prebuild configurations` on the repo. Prebuilds run `postCreateCommand` ahead of time so Codespaces boots in seconds.

## 12. Non-Root User

If the container must run as root for tooling, add:

```jsonc
"remoteUser": "root",
"containerUser": "root"
```

Otherwise keep the image default (`node`, `vscode`) — it is safer.
