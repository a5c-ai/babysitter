# Babysitter Docker Guide

Run Claude Code with the Babysitter SDK and plugin in a Docker container.

## Prerequisites

- Docker and Docker Compose installed
- An Anthropic API key or Azure Foundry credentials

## Quick Start

### Option A: Use Pre-built Images (Recommended)

Pull from GitHub Container Registry:

```bash
# Production (stable)
docker pull ghcr.io/a5c-ai/babysitter/babysitter:production

# Staging (pre-release)
docker pull ghcr.io/a5c-ai/babysitter/babysitter:staging

# Development (latest features)
docker pull ghcr.io/a5c-ai/babysitter/babysitter:develop
```

### Option B: Build Locally

```bash
docker build -t babysitter .
```

Or with docker-compose:

```bash
docker-compose build
```

### Run with a Prompt

Set your API key and run with a prompt:

```bash
# Using docker run with Anthropic API
docker run -it \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e PROMPT="Create a simple hello world app" \
  -v $(pwd):/workspace \
  babysitter

# Using Azure Foundry
docker run -it \
  -e CLAUDE_CODE_USE_FOUNDRY=1 \
  -e ANTHROPIC_FOUNDRY_RESOURCE=your-resource-name \
  -e ANTHROPIC_FOUNDRY_API_KEY=$ANTHROPIC_FOUNDRY_API_KEY \
  -e PROMPT="Create a simple hello world app" \
  -v $(pwd):/workspace \
  babysitter
```

### 3. Interactive Mode

Start an interactive Claude Code session:

```bash
docker run -it \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd):/workspace \
  babysitter
```

### 4. Pass Prompt as Command Arguments

```bash
docker run -it \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd):/workspace \
  babysitter "Build a REST API with Express"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes* | Your Anthropic API key |
| `CLAUDE_CODE_USE_FOUNDRY` | No | Set to `1` to use Azure Foundry |
| `ANTHROPIC_FOUNDRY_RESOURCE` | Yes** | Azure Foundry resource name |
| `ANTHROPIC_FOUNDRY_API_KEY` | Yes** | Azure Foundry API key |
| `PROMPT` | No | The prompt to pass to `/babysitter:babysit` |
| `OUTPUT_FORMAT` | No | Output format: `text` (default), `json`, or `stream-json` |

\* Required if not using Azure Foundry
\** Required if using Azure Foundry

## Volume Mounts

Mount your project directory to `/workspace`:

```bash
-v /path/to/your/project:/workspace
```

The container's working directory is `/workspace` by default.

## How It Works

The entrypoint automatically invokes the `/babysitter:babysit` skill with your prompt. This enables:
- Orchestrated workflow execution
- Event-sourced state management
- Human-in-the-loop approval (when running interactively)

## Examples

### Run a Babysitter Orchestration

```bash
docker run -it \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e PROMPT="Implement TDD for a calculator module" \
  -v $(pwd):/workspace \
  babysitter
```

### Use with an Existing Project

```bash
cd /path/to/your/project
docker run -it \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd):/workspace \
  babysitter "Add unit tests for the user service"
```

### Run in Detached Mode

```bash
docker run -d \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e PROMPT="Long running task" \
  -v $(pwd):/workspace \
  --name my-babysitter \
  babysitter

# Check logs
docker logs -f my-babysitter

# Stop
docker stop my-babysitter
```

### Run with Task File

Create a `task.md` file in your workspace:

```markdown
Create a file named `output.txt` with the text "Task completed!"
```

Then run:

```bash
docker run -it \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd):/workspace \
  babysitter "Read task.md and execute the instructions"
```

## Building for Different Architectures

```bash
# Build for ARM64 (Apple Silicon)
docker buildx build --platform linux/arm64 -t babysitter:arm64 .

# Build for AMD64
docker buildx build --platform linux/amd64 -t babysitter:amd64 .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t babysitter:latest .
```

## Troubleshooting

### "Error: ANTHROPIC_API_KEY or ANTHROPIC_FOUNDRY_API_KEY environment variable is required"

Make sure to pass your API credentials:

```bash
# For Anthropic API
export ANTHROPIC_API_KEY=your-api-key-here
docker run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY ...

# For Azure Foundry
export ANTHROPIC_FOUNDRY_API_KEY=your-foundry-key
docker run -e CLAUDE_CODE_USE_FOUNDRY=1 \
  -e ANTHROPIC_FOUNDRY_RESOURCE=your-resource \
  -e ANTHROPIC_FOUNDRY_API_KEY=$ANTHROPIC_FOUNDRY_API_KEY ...
```

### Plugin not loading

The babysitter plugin is pre-installed and loaded via `--plugin-dir`. To verify:

```bash
# Enter the container
docker run -it --entrypoint /bin/bash babysitter

# Check plugin installation
ls -la /home/claude/.claude/plugins/cache/a5c-ai/babysitter/4.0.128/
cat /home/claude/.claude/plugins/cache/a5c-ai/babysitter/4.0.128/plugin.json
```

### Permission issues with mounted volumes

The container runs as a non-root `claude` user. On Linux, you may need to ensure the mounted directory is accessible:

```bash
# Option 1: Make the directory world-readable/writable
chmod -R 777 /path/to/your/project

# Option 2: Match the container user's UID (1000 by default)
docker run -it \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd):/workspace \
  --user 1000:1000 \
  babysitter
```

## Image Details

- **Base Image**: `node:20-bookworm`
- **User**: `claude` (non-root, required for `--dangerously-skip-permissions`)
- **Includes**: Claude Code, Babysitter SDK CLI, jq, git, bash
- **Plugin Path**: `/home/claude/.claude/plugins/cache/a5c-ai/babysitter/4.0.128`
- **Working Directory**: `/workspace`
- **Entrypoint**: Invokes `/babysitter:babysit` with the provided prompt

## CI/CD Pipeline

Docker images are automatically built and published to GitHub Container Registry on push to specific branches:

| Branch | Image Tag | Description |
|--------|-----------|-------------|
| `main` | `production`, `latest` | Stable production releases |
| `staging` | `staging` | Pre-release testing |
| `develop` | `develop` | Latest development features |

### Image Tags

Each build also creates a SHA-tagged image for traceability:
- `ghcr.io/a5c-ai/babysitter/babysitter:main-abc1234`
- `ghcr.io/a5c-ai/babysitter/babysitter:staging-def5678`
- `ghcr.io/a5c-ai/babysitter/babysitter:develop-ghi9012`

### Manual Builds

Trigger a manual build via GitHub Actions:

1. Go to Actions → "Docker Manual Build"
2. Click "Run workflow"
3. Enter a custom tag and select target platforms

### Supported Platforms

All images are built for:
- `linux/amd64` (Intel/AMD)
- `linux/arm64` (Apple Silicon, ARM servers)
