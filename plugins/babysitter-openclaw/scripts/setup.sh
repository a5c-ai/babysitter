#!/usr/bin/env bash
set -euo pipefail

# setup.sh — Full setup script for babysitter-openclaw plugin
#
# Installs npm dependencies, verifies the babysitter SDK,
# creates necessary directories, and prints usage instructions.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log()   { echo -e "${GREEN}[babysitter]${NC} $1"; }
warn()  { echo -e "${YELLOW}[babysitter] WARNING:${NC} $1"; }
error() { echo -e "${RED}[babysitter] ERROR:${NC} $1"; }

# ── Check Node.js ──────────────────────────────────────────────────────
log "Checking Node.js version..."
if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Please install Node.js >= 18."
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  error "Node.js v$(node -v) detected. babysitter-openclaw requires Node.js >= 18."
  exit 1
fi
log "Node.js v$(node -v | tr -d 'v') — OK"

# ── Check OpenClaw ────────────────────────────────────────────────────
log "Checking for OpenClaw..."
if command -v openclaw &>/dev/null; then
  OPENCLAW_VERSION=$(openclaw --version 2>/dev/null || echo "unknown")
  log "OpenClaw ${OPENCLAW_VERSION} — OK"
else
  warn "OpenClaw CLI not found in PATH. Install it or ensure it is on your PATH."
fi

# ── Install npm dependencies ──────────────────────────────────────────
log "Installing npm dependencies..."
cd "$PLUGIN_DIR"
if [ -f "package.json" ]; then
  npm install --no-audit --no-fund 2>&1 || {
    warn "npm install encountered issues, but continuing setup."
  }
  log "Dependencies installed."
else
  warn "No package.json found in $PLUGIN_DIR — skipping npm install."
fi

# ── Verify babysitter SDK ─────────────────────────────────────────────
log "Checking for @a5c-ai/babysitter-sdk..."
SDK_CHECK=$(node -e "try { require('@a5c-ai/babysitter-sdk'); console.log('ok'); } catch(e) { console.log('missing'); }" 2>/dev/null)
if [ "$SDK_CHECK" = "ok" ]; then
  log "@a5c-ai/babysitter-sdk — OK"
else
  warn "@a5c-ai/babysitter-sdk not found. Install it with: npm install @a5c-ai/babysitter-sdk"
fi

# ── Ensure hook scripts are executable ───────────────────────────────
log "Setting hook script permissions..."
if [ -d "$PLUGIN_DIR/hooks" ]; then
  chmod +x "$PLUGIN_DIR/hooks/"*.sh 2>/dev/null || true
  log "Hook scripts are executable."
fi

# ── Create state directory ───────────────────────────────────────────
log "Creating state directory..."
STATE_DIR="${BABYSITTER_GLOBAL_STATE_DIR:-$HOME/.a5c}"
mkdir -p "$STATE_DIR"
log "State directory ready: $STATE_DIR"

# ── Print usage instructions ─────────────────────────────────────────
echo ""
echo "============================================"
echo "  babysitter-openclaw plugin setup complete"
echo "============================================"
echo ""
echo "Install methods:"
echo ""
echo "  PRIMARY (marketplace):"
echo "    babysitter plugin:install babysitter"
echo ""
echo "  SECONDARY (npm, for development):"
echo "    npm install -g @a5c-ai/babysitter-openclaw"
echo "    babysitter-openclaw install --global"
echo ""
echo "  PROJECT-LOCAL:"
echo "    babysitter-openclaw install --workspace ."
echo ""
echo "For more information, see: $PLUGIN_DIR/README.md"
echo ""

log "Done."
