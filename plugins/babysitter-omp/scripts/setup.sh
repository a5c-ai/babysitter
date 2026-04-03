#!/usr/bin/env bash
set -euo pipefail

# setup.sh — Full setup script for babysitter-pi plugin
#
# Installs npm dependencies, verifies the babysitter SDK,
# creates necessary directories, and prints usage instructions.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log()   { echo -e "${GREEN}[setup]${NC} $1"; }
warn()  { echo -e "${YELLOW}[setup] WARNING:${NC} $1"; }
error() { echo -e "${RED}[setup] ERROR:${NC} $1"; }

# ── Check Node.js ──────────────────────────────────────────────────────
log "Checking Node.js version..."
if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Please install Node.js >= 18."
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  error "Node.js v$(node -v) detected. babysitter-pi requires Node.js >= 18."
  exit 1
fi
log "Node.js v$(node -v | tr -d 'v') — OK"

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

# ── Create necessary directories ─────────────────────────────────────
log "Creating directories..."
mkdir -p "$PLUGIN_DIR/state"
log "State directory ready: $PLUGIN_DIR/state"

# ── Print usage instructions ─────────────────────────────────────────
echo ""
echo "============================================"
echo "  babysitter-pi plugin setup complete"
echo "============================================"
echo ""
echo "Usage:"
echo "  babysitter plugin:install pi --marketplace-name <name> --project"
echo "  babysitter plugin:configure pi --marketplace-name <name> --project"
echo ""
echo "For more information, see: $PLUGIN_DIR/README.md"
echo ""

log "Done."
