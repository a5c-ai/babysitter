# Welcome Screen -- Configure Instructions

Adjust the welcome screen's content, verbosity, sections, and behavior.

All configuration lives in two files:
- `.a5c/welcome/config.json` -- preferences and settings
- `.a5c/welcome/scripts/welcome.sh` -- the actual display script

---

## Option 1: Change Verbosity

Edit `.a5c/welcome/config.json` and set `preferences.verbosity` to one of:
- `"compact"` -- 5-10 lines, key stats only
- `"standard"` -- 15-25 lines, sections with headers
- `"detailed"` -- Full dashboard with all available information

Then regenerate the welcome script by re-running the interview and research steps from install.md (Steps 1-4), or manually edit `.a5c/welcome/scripts/welcome.sh` to add/remove sections.

---

## Option 2: Toggle Sections

Edit `.a5c/welcome/config.json` and toggle individual sections:

```json
{
  "sections": {
    "header": true,
    "gitStatus": true,
    "recentActivity": true,
    "projectHealth": true,
    "suggestedActions": true,
    "quickCommands": true,
    "babysitterStatus": false
  }
}
```

After changing the config, update `.a5c/welcome/scripts/welcome.sh` to match -- comment out or remove the corresponding section blocks in the script.

---

## Option 3: Change Suggested Actions

Edit the "Suggested Actions" section in `.a5c/welcome/scripts/welcome.sh`. Actions are conditional bash statements that check project state:

```bash
# Add a new suggestion
if [ -f "docker-compose.yml" ] && ! docker ps --format '{{.Names}}' | grep -q myservice; then
  echo "    - Docker services not running -- start with 'docker-compose up -d'"
fi

# Remove a suggestion
# Comment out or delete the conditional block you don't want
```

---

## Option 4: Update Quick Commands

Edit the quick commands line in `.a5c/welcome/scripts/welcome.sh` to reflect current project commands:

```bash
echo "  Commands: test='npm test' | build='npm run build' | lint='npm run lint' | deploy='npm run deploy'"
```

---

## Option 5: Add or Change Greeting

To add a greeting, set in `.a5c/welcome/config.json`:

```json
{
  "preferences": {
    "greeting": true,
    "greetingTone": "casual"
  }
}
```

Then add a greeting line to the header section of `.a5c/welcome/scripts/welcome.sh`:

```bash
# Greeting options
GREETINGS=("Ready to ship." "Let's build something." "Back at it." "Code awaits.")
GREETING=${GREETINGS[$((RANDOM % ${#GREETINGS[@]}))]}
echo "  $GREETING"
```

---

## Option 6: Add ASCII Art Header

To add an ASCII art project name, add to the top of `.a5c/welcome/scripts/welcome.sh` before the header section:

```bash
cat << 'ASCII'
   ___           _           _
  | _ \_ _ ___  (_)___ __| |_
  |  _/ '_/ _ \ | / -_) _|  _|
  |_| |_| \___/_/ \___\__|\__|
             |__/
ASCII
```

Generate ASCII art for your project name using a tool like `figlet` if available:
```bash
command -v figlet &>/dev/null && figlet -f small "ProjectName"
```

---

## Option 7: Add Babysitter Status

If babysitter was not initially configured but is now installed, enable the babysitter section:

1. Set `sections.babysitterStatus` to `true` in `.a5c/welcome/config.json`
2. Add to `.a5c/welcome/scripts/welcome.sh` before the closing:

```bash
# ── Babysitter Status ───────────────────────────────
if [ -d ".a5c/runs" ]; then
  RUNS=$(ls .a5c/runs/ 2>/dev/null | wc -l | tr -d ' ')
  RECENT=$(ls -t .a5c/runs/ 2>/dev/null | head -1)
  echo ""
  echo "  Babysitter: ${RUNS} runs | latest: ${RECENT:-none}"
  if [ -n "$RECENT" ] && [ -f ".a5c/runs/$RECENT/state/state.json" ]; then
    STATUS=$(cat ".a5c/runs/$RECENT/state/state.json" 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 || echo "unknown")
    echo "    Last run status: $STATUS"
  fi
fi
```

---

## Option 8: Disable Session-Start Hook (Keep Skill)

To stop the automatic welcome screen but keep the `/welcome` skill available:

Edit `.claude/settings.json` and remove the welcome entry from the `SessionStart` hooks array. The `/welcome` skill will still work when invoked manually.

To re-enable, add the hook back:

```json
{
  "matcher": "",
  "hooks": [
    {
      "type": "command",
      "command": "bash .a5c/welcome/scripts/welcome.sh"
    }
  ]
}
```

---

## Option 9: Refresh Project Detection

If the project's tech stack or commands have changed since install, re-run the research phase:

1. Re-examine the project (Step 2 from install.md)
2. Update `.a5c/welcome/config.json` with new project details
3. Update `.a5c/welcome/scripts/welcome.sh` to reflect new commands, test runners, etc.
