# LunaRoute Installation Instructions

Install and configure LunaRoute - a local proxy server that provides complete visibility into LLM interactions, session recording, token tracking, and PII protection for any AI coding harness.

## Prerequisites

1. **Rust toolchain** (required for building LunaRoute from source)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Git** (for cloning the LunaRoute repository)
   ```bash
   # On macOS: brew install git
   # On Ubuntu/Debian: sudo apt install git
   # On Windows: Download from https://git-scm.com/
   ```

3. **jq** (for JSON processing in configuration scripts)
   ```bash
   # On macOS: brew install jq
   # On Ubuntu/Debian: sudo apt install jq
   # On Windows: Download from https://jqlang.github.io/jq/
   ```

4. **Available ports**: Ensure ports 8081 (proxy) and 8082 (dashboard) are available
   ```bash
   # Check if ports are in use
   lsof -i :8081 || echo "Port 8081 available"
   lsof -i :8082 || echo "Port 8082 available"
   ```

5. **AI harness configuration access** (write permissions to harness config files)

## Installation Steps

### Step 1: Create Working Directory

```bash
cd <project-root>
mkdir -p .lunaroute/{server,config,backup}
cd .lunaroute
```

### Step 2: Clone and Build LunaRoute Server

```bash
# Clone the LunaRoute repository
git clone https://github.com/erans/lunaroute.git server/lunaroute
cd server/lunaroute

# Build the server
cargo build --release

# Verify the build
./target/release/lunaroute-server --version
```

### Step 3: Create LunaRoute Configuration

```bash
cd <project-root>/.lunaroute/config

# Create lunaroute configuration file
cat > lunaroute-config.json << 'EOF'
{
  "proxy_port": 8081,
  "dashboard_port": 8082,
  "enable_pii_protection": true,
  "enable_session_recording": true,
  "model_routes": {
    "sonnet": "claude-3-5-sonnet-20241022",
    "opus": "claude-3-opus-20240229",
    "haiku": "claude-3-haiku-20240307",
    "gpt-4o": "gpt-4o-2024-11-20"
  }
}
EOF
```

### Step 4: Backup Original Harness Configuration

```bash
cd <project-root>/.lunaroute/backup

# Backup based on detected harness type
if [ -f "<home-dir>/.claude/settings.json" ]; then
  echo "Detected Claude Code harness"
  cp "<home-dir>/.claude/settings.json" claude-settings-backup.json
  echo "claude-code" > harness-type.txt
elif [ -f "<home-dir>/.cursor/settings.json" ]; then
  echo "Detected Cursor harness"
  cp "<home-dir>/.cursor/settings.json" cursor-settings-backup.json
  echo "cursor" > harness-type.txt
else
  echo "Unknown harness - manual configuration required"
  echo "unknown" > harness-type.txt
fi
```

### Step 5: Configure AI Harness Proxy Settings

#### For Claude Code:

```bash
# Add proxy configuration to Claude Code settings
jq '.anthropic_api_base_url = "http://localhost:8081/v1"' \
  "<home-dir>/.claude/settings.json" > temp.json && \
  mv temp.json "<home-dir>/.claude/settings.json"
```

#### For Cursor:

```bash
# Add proxy configuration to Cursor settings
jq '.anthropic_api_base_url = "http://localhost:8081/v1" | .openai_api_base_url = "http://localhost:8081/v1"' \
  "<home-dir>/.cursor/settings.json" > temp.json && \
  mv temp.json "<home-dir>/.cursor/settings.json"
```

#### For Other Harnesses:

```bash
echo "Configure your AI harness to use:"
echo "- Anthropic API Base URL: http://localhost:8081/v1"
echo "- OpenAI API Base URL: http://localhost:8081/v1"
echo "- Keep your original API keys"
```

### Step 6: Start LunaRoute Server

```bash
cd <project-root>/.lunaroute/server/lunaroute

# Start the server with config
CONFIG_FILE="../../config/lunaroute-config.json" \
  ./target/release/lunaroute-server &

# Save the process ID
echo $! > <project-root>/.lunaroute/lunaroute-server.pid

# Wait for server to start
sleep 3
```

### Step 7: Verify Installation

```bash
# Check if server is running
if curl -s http://localhost:8082/health > /dev/null; then
  echo "✅ LunaRoute dashboard accessible at http://localhost:8082"
else
  echo "❌ LunaRoute server not responding"
fi

# Check if proxy is working
if curl -s http://localhost:8081/v1/health > /dev/null; then
  echo "✅ LunaRoute proxy accessible at http://localhost:8081"
else
  echo "❌ LunaRoute proxy not responding"
fi

# Test harness integration
echo "Test your harness integration by:"
echo "1. Opening your AI coding harness"
echo "2. Sending a test prompt"
echo "3. Checking http://localhost:8082 for recorded interactions"
echo "4. Testing route commands like: #!sonnet What is LunaRoute?"
```

### Step 8: Configure Route Commands (Optional)

For harnesses that support hooks or plugins, set up route command detection:

```bash
# Create route commands reference
cat > <project-root>/.lunaroute/config/route-commands.md << 'EOF'
# LunaRoute Route Commands

Use these commands in your AI harness to switch models mid-session:

- `#!sonnet` - Route to Claude 3.5 Sonnet
- `#!opus` - Route to Claude 3 Opus  
- `#!haiku` - Route to Claude 3 Haiku
- `#!gpt-4o` - Route to GPT-4o
- `#!clear` - Remove active route

Commands can be used standalone or inline:
- `#!sonnet`
- `#!sonnet rewrite this function`
EOF
```

## Post-Installation

### Environment Setup

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
# LunaRoute aliases
alias lunaroute-start='cd <project-root>/.lunaroute/server/lunaroute && CONFIG_FILE="../../config/lunaroute-config.json" ./target/release/lunaroute-server &'
alias lunaroute-stop='kill $(cat <project-root>/.lunaroute/lunaroute-server.pid) 2>/dev/null'
alias lunaroute-dashboard='open http://localhost:8082'
```

### Auto-start (Optional)

To start LunaRoute automatically with your system, create a startup script or use your system's service manager.

## Verification Checklist

- [ ] Rust toolchain installed and working
- [ ] LunaRoute server built successfully
- [ ] Configuration file created
- [ ] Original harness config backed up
- [ ] Harness configured with proxy URLs
- [ ] LunaRoute server running on ports 8081/8082
- [ ] Dashboard accessible at http://localhost:8082
- [ ] Test prompt sent through harness
- [ ] Interaction recorded in dashboard
- [ ] Route commands working (if supported)

## Troubleshooting

If installation fails:

1. **Check Rust installation**: `rustc --version`
2. **Check port availability**: `lsof -i :8081` and `lsof -i :8082`
3. **Check server logs**: Look in the terminal where you started the server
4. **Verify harness config**: Ensure proxy URLs are correctly set
5. **Test without proxy**: Temporarily restore original harness config to isolate issues

For support, see the LunaRoute repository: https://github.com/erans/lunaroute