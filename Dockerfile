# syntax=docker/dockerfile:1.7

# Babysitter Docker Image
# Runs Claude Code with the babysitter plugin pre-installed
#
# Build: docker build -t babysitter .
# Run: docker run -it -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY -e PROMPT="your task" babysitter

FROM node:22-bookworm

LABEL maintainer="a5c.ai"
LABEL description="Claude Code with Babysitter SDK and plugin for orchestrating complex workflows"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    jq \
    git \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (Claude Code doesn't allow --dangerously-skip-permissions as root)
RUN groupadd -r claude && useradd -r -g claude -m -d /home/claude claude

# Set environment variables
ENV HOME=/home/claude \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_PREFER_OFFLINE=true

# Configure npm global prefix for non-root user so hooks can install packages
RUN mkdir -p /home/claude/.local && \
    echo "prefix=/home/claude/.local" > /home/claude/.npmrc

# Install Claude Code globally
RUN --mount=type=cache,target=/root/.npm \
    npm install -g @anthropic-ai/claude-code --cache=/root/.npm

# Create workspace and app directories
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/agent-catalog/package.json ./packages/agent-catalog/
COPY packages/babysitter-agent/package.json ./packages/babysitter-agent/
COPY packages/agent-core/package.json ./packages/agent-core/
COPY packages/agent-mux/sdk/package.json ./packages/agent-mux/sdk/
COPY packages/agent-mux/core/package.json ./packages/agent-mux/core/
COPY packages/agent-mux/cli/package.json ./packages/agent-mux/cli/
COPY packages/agent-mux/adapters/package.json ./packages/agent-mux/adapters/
COPY packages/agent-mux/gateway/package.json ./packages/agent-mux/gateway/
COPY packages/agent-mux/observability/package.json ./packages/agent-mux/observability/
COPY packages/agent-mux/harness-mock/package.json ./packages/agent-mux/harness-mock/
COPY packages/agent-mux/ui/package.json ./packages/agent-mux/ui/
COPY packages/agent-mux/webui/package.json ./packages/agent-mux/webui/
COPY packages/agent-mux/tui/package.json ./packages/agent-mux/tui/
COPY third_party/webpackbar ./third_party/webpackbar

# Install all dependencies (including dev for build) from the committed lockfile.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --cache=/root/.npm

# Copy the rest of the application
COPY . .

# Build the SDK and runtime-only agent graph
RUN npm run build:runtime

# Clean up dev dependencies after build
ENV NODE_ENV=production

# Install the SDK and agent runtime packages globally
RUN --mount=type=cache,target=/root/.npm \
    npm install -g ./packages/sdk ./packages/agent-core ./packages/babysitter-agent --cache=/root/.npm

RUN --mount=type=cache,target=/root/.npm \
    npm install -g @mariozechner/pi-coding-agent --cache=/root/.npm

# Read plugin version from plugin.json (single source of truth)
RUN PLUGIN_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('plugins/babysitter/plugin.json','utf8')).version)") && \
    PLUGIN_CACHE="/home/claude/.claude/plugins/cache/a5c-ai/babysitter/${PLUGIN_VERSION}" && \
    mkdir -p "${PLUGIN_CACHE}" && \
    cp -r plugins/babysitter/* "${PLUGIN_CACHE}/" && \
    chmod +x "${PLUGIN_CACHE}/hooks/"*.sh && \
    find "${PLUGIN_CACHE}/skills" -name "*.sh" -exec chmod +x {} + 2>/dev/null || true && \
    mkdir -p "${PLUGIN_CACHE}/.claude-plugin" && \
    echo "{\"name\": \"babysitter\", \"version\": \"${PLUGIN_VERSION}\", \"description\": \"Orchestrate complex workflows with babysitter\", \"author\": {\"name\": \"a5c.ai\", \"email\": \"info@a5c.ai\"}}" > "${PLUGIN_CACHE}/.claude-plugin/plugin.json" && \
    mkdir -p /home/claude/.claude/plugins && \
    echo "{\"version\": 2, \"plugins\": {\"babysitter@a5c.ai\": [{\"scope\": \"user\", \"installPath\": \"${PLUGIN_CACHE}\", \"version\": \"${PLUGIN_VERSION}\", \"installedAt\": \"2026-02-05T00:00:00.000Z\", \"lastUpdated\": \"2026-02-05T00:00:00.000Z\"}]}}" > /home/claude/.claude/plugins/installed_plugins.json && \
    echo '{"enabledPlugins": {"babysitter@a5c.ai": true}}' > /home/claude/.claude/settings.json

# Set ownership of claude home directory
RUN chown -R claude:claude /home/claude

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create workspace directory for mounting projects
RUN mkdir -p /workspace && chown claude:claude /workspace
WORKDIR /workspace

# Ensure user-local npm bin is on PATH (for hooks installing packages at runtime)
ENV PATH="/home/claude/.local/bin:${PATH}"

# Switch to non-root user
USER claude

# Document environment variables
# Standard Anthropic API
ENV ANTHROPIC_API_KEY=""
# Azure Foundry support
ENV CLAUDE_CODE_USE_FOUNDRY=""
ENV ANTHROPIC_FOUNDRY_RESOURCE=""
ENV ANTHROPIC_FOUNDRY_API_KEY=""
ENV ANTHROPIC_DEFAULT_SONNET_MODEL=""
ENV ANTHROPIC_DEFAULT_HAIKU_MODEL=""
ENV ANTHROPIC_DEFAULT_OPUS_MODEL=""
# Azure OpenAI support
ENV AZURE_OPENAI_API_KEY=""
ENV AZURE_OPENAI_PROJECT_NAME=""
# Prompt for babysitter
ENV PROMPT=""

ENTRYPOINT ["/entrypoint.sh"]
