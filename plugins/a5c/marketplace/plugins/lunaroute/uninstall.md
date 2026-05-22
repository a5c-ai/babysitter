# LunaRoute Uninstallation Instructions

Clean removal of LunaRoute server and restoration of original AI harness configuration.

## Pre-Uninstall Checklist

- [ ] Save any important session data from LunaRoute dashboard if needed
- [ ] Note current LunaRoute configuration for potential future reinstallation
- [ ] Ensure you have access to original harness configuration backups

## Uninstallation Steps

### Step 1: Stop LunaRoute Server

```bash
# Stop the running server process
if [ -f "<project-root>/.lunaroute/lunaroute-server.pid" ]; then
  PID=$(cat <project-root>/.lunaroute/lunaroute-server.pid)
  if kill -0 $PID 2>/dev/null; then
    echo "Stopping LunaRoute server (PID: $PID)"
    kill $PID
    
    # Wait for graceful shutdown
    sleep 3
    
    # Force kill if still running
    if kill -0 $PID 2>/dev/null; then
      echo "Force stopping LunaRoute server"
      kill -9 $PID
    fi
  fi
  rm -f <project-root>/.lunaroute/lunaroute-server.pid
else
  echo "No PID file found - checking for running processes"
  pkill -f "lunaroute-server" || echo "No LunaRoute processes found"
fi
```

### Step 2: Restore Original Harness Configuration

```bash
cd <project-root>/.lunaroute/backup

# Check which harness type was backed up
if [ -f "harness-type.txt" ]; then
  HARNESS_TYPE=$(cat harness-type.txt)
  echo "Restoring $HARNESS_TYPE configuration"
  
  case $HARNESS_TYPE in
    "claude-code")
      if [ -f "claude-settings-backup.json" ]; then
        cp claude-settings-backup.json "<home-dir>/.claude/settings.json"
        echo "✅ Claude Code settings restored"
      else
        echo "❌ No Claude Code backup found"
      fi
      ;;
    "cursor")
      if [ -f "cursor-settings-backup.json" ]; then
        cp cursor-settings-backup.json "<home-dir>/.cursor/settings.json"
        echo "✅ Cursor settings restored"
      else
        echo "❌ No Cursor backup found"
      fi
      ;;
    "unknown")
      echo "⚠️  Unknown harness - manual restoration required"
      echo "Remove proxy URLs from your harness configuration:"
      echo "- Remove: anthropic_api_base_url: http://localhost:8081/v1"
      echo "- Remove: openai_api_base_url: http://localhost:8081/v1"
      ;;
  esac
else
  echo "⚠️  No harness type information found - manual restoration required"
fi
```

### Step 3: Remove LunaRoute Files and Directories

```bash
# Remove the entire LunaRoute installation
cd <project-root>

if [ -d ".lunaroute" ]; then
  echo "Removing LunaRoute installation directory"
  rm -rf .lunaroute
  echo "✅ LunaRoute files removed"
else
  echo "LunaRoute directory not found - already removed?"
fi
```

### Step 4: Clean Up Environment Configuration

```bash
# Remove LunaRoute aliases from shell profiles
for profile in ~/.bashrc ~/.zshrc ~/.bash_profile ~/.profile; do
  if [ -f "$profile" ]; then
    # Create backup before modification
    cp "$profile" "${profile}.lunaroute-backup"
    
    # Remove LunaRoute aliases
    sed -i.tmp '/# LunaRoute aliases/,/^$/d' "$profile" 2>/dev/null || true
    sed -i.tmp '/lunaroute-start\|lunaroute-stop\|lunaroute-dashboard/d' "$profile" 2>/dev/null || true
    
    # Clean up temporary files
    rm -f "${profile}.tmp"
    
    echo "Cleaned $profile"
  fi
done

echo "⚠️  Restart your shell or run 'source ~/.bashrc' to apply changes"
```

### Step 5: Remove System Service (if configured)

```bash
# Check for systemd service (Linux)
if command -v systemctl >/dev/null 2>&1; then
  if systemctl is-enabled lunaroute 2>/dev/null; then
    sudo systemctl stop lunaroute
    sudo systemctl disable lunaroute
    sudo rm -f /etc/systemd/system/lunaroute.service
    sudo systemctl daemon-reload
    echo "✅ Systemd service removed"
  fi
fi

# Check for launchd service (macOS)
if [ -f "<home-dir>/Library/LaunchAgents/com.lunaroute.plist" ]; then
  launchctl unload "<home-dir>/Library/LaunchAgents/com.lunaroute.plist"
  rm -f "<home-dir>/Library/LaunchAgents/com.lunaroute.plist"
  echo "✅ LaunchAgent removed"
fi
```

### Step 6: Verify Complete Removal

```bash
# Check that LunaRoute is no longer running
if ! curl -s http://localhost:8081 >/dev/null 2>&1 && ! curl -s http://localhost:8082 >/dev/null 2>&1; then
  echo "✅ LunaRoute servers are no longer accessible"
else
  echo "❌ LunaRoute may still be running - check for remaining processes"
  ps aux | grep lunaroute | grep -v grep || echo "No lunaroute processes found"
fi

# Check that directories are removed
if [ ! -d "<project-root>/.lunaroute" ]; then
  echo "✅ LunaRoute directory successfully removed"
else
  echo "❌ LunaRoute directory still exists"
fi

# Test harness connectivity
echo "Testing harness connectivity..."
echo "Please test your AI harness to ensure it's working normally without LunaRoute"
```

## Post-Uninstall Verification

### Manual Checks Required

1. **Test your AI harness**: Send a test prompt to ensure normal operation
2. **Check API endpoints**: Verify your harness is using original API endpoints
3. **Verify authentication**: Ensure API keys are working properly
4. **Check for route commands**: Route commands like `#!sonnet` should no longer work

### Verification Checklist

- [ ] LunaRoute server process stopped
- [ ] Original harness configuration restored
- [ ] LunaRoute files and directories removed
- [ ] Shell aliases removed from profiles
- [ ] System services removed (if any)
- [ ] Ports 8081 and 8082 no longer respond to LunaRoute
- [ ] AI harness works normally without proxy
- [ ] No LunaRoute processes running
- [ ] Route commands no longer functional

## Troubleshooting Uninstall Issues

### If LunaRoute Server Won't Stop

```bash
# Find all LunaRoute processes
ps aux | grep -i lunaroute

# Force kill all LunaRoute processes
pkill -f lunaroute

# Check if ports are still in use
lsof -i :8081
lsof -i :8082
```

### If Harness Configuration Backup Is Missing

```bash
# Manually remove proxy settings from your harness config
# For Claude Code (~/.claude/settings.json):
jq 'del(.anthropic_api_base_url)' ~/.claude/settings.json > temp.json && mv temp.json ~/.claude/settings.json

# For Cursor (~/.cursor/settings.json):
jq 'del(.anthropic_api_base_url) | del(.openai_api_base_url)' ~/.cursor/settings.json > temp.json && mv temp.json ~/.cursor/settings.json
```

### If Files Cannot Be Removed

```bash
# Check file permissions
ls -la <project-root>/.lunaroute/

# Change ownership if needed
sudo chown -R $USER:$USER <project-root>/.lunaroute/

# Force removal
sudo rm -rf <project-root>/.lunaroute/
```

## Emergency Rollback

If you need to quickly restore LunaRoute after uninstallation:

1. Re-run the installation process
2. Check backup files in shell profiles (`.lunaroute-backup` suffixes)
3. Restore from version control if the plugin directory was committed

## Support

For issues during uninstallation:

1. Check the LunaRoute repository: https://github.com/erans/lunaroute
2. Verify your harness documentation for configuration locations
3. Use your system's process manager to ensure clean shutdown

Uninstallation complete! Your system should now be in the same state as before LunaRoute installation.