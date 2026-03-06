# Sound Hooks -- Install Instructions

Welcome to **Sound Hooks** -- the plugin that gives your Claude Code sessions a soundtrack! Every lifecycle event gets its own audio cue, so you'll *hear* your code succeed (or fail) in real time.

These are **Claude Code hooks** configured in `.claude/settings.json` -- they fire on Claude Code lifecycle events like tool use, session start, errors, and notifications.

---

## Step 1: Interview the User

Before downloading sounds, gather these preferences:

### Theme

Ask which sound theme they prefer:

1. **TV Shows** -- Classic television sounds
   - Laugh track, dramatic sting, sitcom transition jingle, studio applause
   - Think: sitcom energy, daytime TV drama, game show excitement

2. **Movies** -- Cinematic sound effects
   - Inception horn, Wilhelm scream, dramatic orchestral reveal, orchestra hit
   - Think: blockbuster moments, epic reveals, Hollywood tension

3. **Video Games** -- Retro and modern game audio
   - Coin collect, level up fanfare, game over jingle, power up, 1-up
   - Think: 8-bit nostalgia, achievement unlocked, boss defeated

4. **Sci-Fi** -- Futuristic and spacey sounds
   - Warp drive hum, phaser blast, computer beep sequence, alert klaxon, transporter effect
   - Think: bridge of the Enterprise, space station ambiance, cyberpunk terminals

5. **Medieval** -- Castle and kingdom sounds
   - Trumpet fanfare, sword clash, temple bell, flame arrow, war horn
   - Think: castle gates, jousting tournaments, royal courts

6. **Custom** -- Bring your own sounds
   - The user provides their own audio files for each event
   - Skip the download step and just copy their files into place

### Per-Tool Sounds

Ask whether they want **per-tool differentiation** for PostToolUse. This is the most useful feature -- hearing *what* Claude is doing without reading the screen.

Recommended tool groups with sound concepts:

| Tool Group | Sound Concept | Suggested Search Keywords |
|---|---|---|
| `Read` | Scan / page turn | "page turn", "paper rustle", "scan beep" |
| `Edit\|Write` | Modify / craft | "hammer tap", "click confirm", "typewriter key" |
| `Bash` | Execute / forge | "anvil strike", "machine press", "terminal beep" |
| `Grep\|Glob` | Search / discover | "radar ping", "sonar sweep", "search whoosh" |
| `Agent` | Dispatch / summon | "messenger horn", "dispatch bell", "portal open" |
| `WebSearch\|WebFetch` | Transmit / receive | "modem dial", "radio static", "transmission beep" |

If the user just wants a single sound for all tools, that's fine too -- skip per-tool mapping.

### Events

Which events should play sounds?

| Event | Recommended | Notes |
|---|---|---|
| `SessionStart` | yes | Plays when a new Claude Code session begins |
| `Stop` | yes | Plays when Claude finishes responding |
| `PostToolUse` | per-tool or no | Plays after every successful tool call -- noisy without per-tool filtering |
| `PostToolUseFailure` | yes | Plays when a tool call fails |
| `Notification` | yes | Plays on Claude Code notifications (rate limit, permission) |
| `UserPromptSubmit` | no | Plays when user sends a message -- usually unnecessary |

---

## Step 2: Detect Platform and Audio Player

Before downloading anything, determine what audio player is available. This determines which sound **format** to prefer.

### Player Compatibility Matrix

| Player | MP3 | WAV | Platform | Notes |
|---|---|---|---|---|
| **mpv** | yes | yes | All | Best choice. Lightweight, CLI-friendly, plays everything. |
| afplay | yes | yes | macOS only | Built-in, no install needed. |
| paplay | **no** | yes | Linux (PulseAudio) | Cannot play MP3. |
| aplay | **no** | yes | Linux (ALSA) | Cannot play MP3. |
| mpg123 | yes | **no** | Linux/macOS | Cannot play WAV. |
| powershell.exe SoundPlayer | **no** | yes | Windows | Slow startup, WAV only. |

**Format decision**: If mpv or afplay is available, either MP3 or WAV works. On Linux without mpv, prefer WAV (paplay/aplay support). On Windows without mpv, WAV is safer (powershell SoundPlayer is WAV-only).

### Check for mpv

```bash
command -v mpv &>/dev/null && echo "mpv found in PATH"
```

**Windows gotcha**: mpv may be installed but not in the bash PATH. Check common install locations:

```bash
# Check common Windows install locations
for dir in \
  "/c/Program Files/MPV Player" \
  "/c/Program Files/mpv" \
  "/c/ProgramData/chocolatey/bin" \
  "$HOME/scoop/apps/mpv/current" \
  "$HOME/AppData/Local/Microsoft/WinGet/Packages"/mpv-player.mpv_*/mpv; do
  [ -x "$dir/mpv.exe" ] && echo "Found mpv at: $dir/mpv.exe" && break
done
```

Record the mpv path if found outside PATH -- the play script needs it.

### Install mpv if missing

**Windows:**
```bash
# Option 1: winget (built into Windows 10+)
winget install mpv-player.mpv

# Option 2: scoop
scoop install mpv

# Option 3: chocolatey (run from elevated terminal)
choco install mpv
```

**macOS:** Not needed -- `afplay` is built-in. But if you want mpv: `brew install mpv`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install mpv

# Fedora/RHEL
sudo dnf install mpv

# Arch
sudo pacman -S mpv
```

After installing, verify: `mpv --version`

---

## Step 3: Create Directory Structure

```bash
mkdir -p .claude/sound-hooks/scripts
mkdir -p .claude/sound-hooks/sounds
```

---

## Step 4: Search and Download Sound Files

Based on the chosen theme, search the web for **royalty-free** or **Creative Commons** licensed sound effects. Prefer **WAV** format when available for maximum player compatibility -- fall back to MP3 if WAV isn't offered.

### Sound Mapping by Event

| Claude Code Event | What It Means | Suggested Search Keywords | Example Sounds |
|---|---|---|---|
| `SessionStart` | New session begins | "start sound effect", "engine ignition", "launch sound" | Coin insert, ignition rev, "engage!", rocket launch |
| `Stop` | Claude finished responding | "success fanfare", "victory sound", "completion chime" | Level complete, gentle chime, triumphant brass |
| `PostToolUse` | Tool call succeeded | "small success chime", "completion ding", "subtle click" | Ding, coin collect, gentle chime, checkbox tick |
| `PostToolUseFailure` | Tool call failed | "failure sound effect", "error buzzer", "game over" | Game over melody, sad trombone, buzzer |
| `Notification` | Rate limit, permission, etc. | "attention alert", "bell chime", "intercom buzz" | Bell toll, doorbell ring, intercom beep |
| `UserPromptSubmit` | User sent a message | "notification click", "subtle alert", "message sent" | Soft click, digital beep, whoosh |

### Per-Tool Sounds (if enabled)

If the user chose per-tool differentiation, also download sounds for each tool group. Name them by group:

```
.claude/sound-hooks/sounds/tool-read.wav
.claude/sound-hooks/sounds/tool-edit.wav
.claude/sound-hooks/sounds/tool-bash.wav
.claude/sound-hooks/sounds/tool-search.wav
.claude/sound-hooks/sounds/tool-agent.wav
.claude/sound-hooks/sounds/tool-web.wav
.claude/sound-hooks/sounds/tool-success.wav    (fallback for unmapped tools)
```

### Download Sources -- Ranked by Agent Friendliness

Not all sources work the same way for automated downloads. Use this priority:

1. **[SoundBible](https://soundbible.com/)** -- Direct curl download via `http://soundbible.com/grab.php?id=<ID>&type=mp3`. Agent-friendly. Various CC licenses. Browse by tags: `soundbible.com/tags-<tag>.html`

2. **[Orange Free Sounds](https://orangefreesounds.com/)** -- Direct download URLs in page source. CC BY-NC 4.0. Good for themed sounds.

3. **[Mixkit](https://mixkit.co/free-sound-effects/)** -- High quality, royalty-free, no attribution. **Agent limitation**: Download URLs load via JavaScript -- use Playwright browser automation if curl/WebFetch fails. WAV format available.

4. **[Pixabay Sound Effects](https://pixabay.com/sound-effects/)** -- CC0 license, no account. **Agent limitation**: Returns 403 on automated fetch. Use Playwright or ask user to download manually.

5. **[Freesound.org](https://freesound.org/)** -- Huge library, CC licensed. **Agent limitation**: Requires account login -- agent cannot authenticate. Have user download these manually.

### Download Process

For each event, download to `.claude/sound-hooks/sounds/` using the canonical filename:

```
.claude/sound-hooks/sounds/session-start.wav    (or .mp3)
.claude/sound-hooks/sounds/stop.wav
.claude/sound-hooks/sounds/tool-success.wav
.claude/sound-hooks/sounds/tool-failure.wav
.claude/sound-hooks/sounds/notification.wav
.claude/sound-hooks/sounds/user-prompt.wav
```

Verify each download is a valid audio file:
```bash
file .claude/sound-hooks/sounds/session-start.wav
# Should show: RIFF (little-endian) data, WAVE audio  (for WAV)
# or: MPEG ADTS, layer III  (for MP3)
```

**Tip**: Keep sound files short (under 5 seconds). Long audio clips overlap with subsequent events.

If a download fails or no suitable sound is found, set that event's `enabled` to `false` in `config.json` and continue. The play script silently skips missing files.

---

## Step 5: Create the Play Script

Create `.claude/sound-hooks/scripts/play.sh`.

The script must handle two realities:
- mpv may be installed but not in the bash PATH (common on Windows)
- The file format may be WAV or MP3, so the player must handle both

```bash
#!/bin/bash
# Sound Hooks -- play a sound effect for a Claude Code event
# Usage: play.sh <sound-file>
#
# Plays the sound in the background (non-blocking) using whatever
# audio player is available on the system.
# Priority: mpv (PATH or known locations) > afplay > mpg123 > paplay > aplay > powershell

SOUND="$1"

# Check that the sound file exists
if [ ! -f "$SOUND" ]; then
  exit 0
fi

# Find mpv -- may be installed but not in bash PATH (common on Windows)
MPV_BIN=""
if command -v mpv &>/dev/null; then
  MPV_BIN="mpv"
else
  # Check common Windows install locations
  for dir in \
    "/c/Program Files/MPV Player" \
    "/c/Program Files/mpv" \
    "/c/ProgramData/chocolatey/bin" \
    "$HOME/scoop/apps/mpv/current"; do
    if [ -x "$dir/mpv.exe" ]; then
      MPV_BIN="$dir/mpv.exe"
      break
    fi
  done
  # Check winget packages (glob pattern)
  if [ -z "$MPV_BIN" ]; then
    for f in "$HOME/AppData/Local/Microsoft/WinGet/Packages"/mpv-player.mpv_*/mpv/mpv.exe; do
      [ -x "$f" ] && MPV_BIN="$f" && break
    done
  fi
fi

# Play the sound in the background (non-blocking, platform-appropriate)
if [ -n "$MPV_BIN" ]; then
  # Best: handles MP3 + WAV on all platforms
  "$MPV_BIN" --no-video --really-quiet "$SOUND" &
elif command -v afplay &>/dev/null; then
  # macOS built-in: handles MP3 + WAV
  afplay "$SOUND" &
elif command -v mpg123 &>/dev/null; then
  # MP3 only -- will fail on WAV
  mpg123 -q "$SOUND" &
elif command -v paplay &>/dev/null; then
  # Linux PulseAudio: WAV only -- will fail on MP3
  paplay "$SOUND" &
elif command -v aplay &>/dev/null; then
  # Linux ALSA: WAV only -- will fail on MP3
  aplay "$SOUND" &
elif command -v powershell.exe &>/dev/null; then
  # Windows last resort: WAV only, slow startup
  powershell.exe -c "(New-Object Media.SoundPlayer '$SOUND').PlaySync()" &
fi

exit 0
```

Make it executable:

```bash
chmod +x .claude/sound-hooks/scripts/play.sh
```

---

## Step 6: Create Configuration

Write `.claude/sound-hooks/config.json`.

### Basic config (no per-tool sounds)

```json
{
  "version": "1.0.0",
  "theme": "<selected-theme>",
  "events": {
    "SessionStart": { "enabled": true, "sound": "sounds/session-start.wav" },
    "Stop": { "enabled": true, "sound": "sounds/stop.wav" },
    "PostToolUse": { "enabled": false, "sound": "sounds/tool-success.wav" },
    "PostToolUseFailure": { "enabled": true, "sound": "sounds/tool-failure.wav" },
    "Notification": { "enabled": true, "sound": "sounds/notification.wav" },
    "UserPromptSubmit": { "enabled": false, "sound": "sounds/user-prompt.wav" }
  }
}
```

### Config with per-tool sounds

```json
{
  "version": "1.0.0",
  "theme": "<selected-theme>",
  "events": {
    "SessionStart": { "enabled": true, "sound": "sounds/session-start.wav" },
    "Stop": { "enabled": true, "sound": "sounds/stop.wav" },
    "PostToolUse": {
      "enabled": true,
      "defaultSound": "sounds/tool-success.wav",
      "toolSounds": {
        "Read": "sounds/tool-read.wav",
        "Edit|Write": "sounds/tool-edit.wav",
        "Bash": "sounds/tool-bash.wav",
        "Grep|Glob": "sounds/tool-search.wav",
        "Agent": "sounds/tool-agent.wav",
        "WebSearch|WebFetch": "sounds/tool-web.wav"
      }
    },
    "PostToolUseFailure": { "enabled": true, "sound": "sounds/tool-failure.wav" },
    "Notification": { "enabled": true, "sound": "sounds/notification.wav" },
    "UserPromptSubmit": { "enabled": false, "sound": "sounds/user-prompt.wav" }
  }
}
```

Replace `<selected-theme>` with the chosen theme (e.g., `"medieval"`, `"video-games"`, `"sci-fi"`, `"custom"`).

**Note**: The config file records intent. The actual playback is driven by the hook entries in `.claude/settings.json` (next step). Both files reference the same sound paths -- if you change a filename, update both.

---

## Step 7: Configure Claude Code Hooks

Read the existing `.claude/settings.json` first, then **merge** these hook entries into the `hooks` object. Preserve all existing hooks and settings.

### Basic hooks (no per-tool)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/session-start.wav"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/stop.wav"
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-failure.wav"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/notification.wav"
          }
        ]
      }
    ]
  }
}
```

### Per-tool PostToolUse hooks

If the user chose per-tool differentiation, add one matcher entry per tool group **plus a fallback** with a negative lookahead to prevent double-firing:

```json
"PostToolUse": [
  {
    "matcher": "^Read$",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-read.wav"
      }
    ]
  },
  {
    "matcher": "^(Edit|Write)$",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-edit.wav"
      }
    ]
  },
  {
    "matcher": "^Bash$",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-bash.wav"
      }
    ]
  },
  {
    "matcher": "^(Grep|Glob)$",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-search.wav"
      }
    ]
  },
  {
    "matcher": "^Agent$",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-agent.wav"
      }
    ]
  },
  {
    "matcher": "^(WebSearch|WebFetch)$",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-web.wav"
      }
    ]
  },
  {
    "matcher": "^(?!Read$|Edit$|Write$|Bash$|Grep$|Glob$|Agent$|WebSearch$|WebFetch$)",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-success.wav"
      }
    ]
  }
]
```

**Critical: matcher double-firing gotcha.** Claude Code fires hooks for *every* matcher that matches a given tool name. If you have both `"^Read$"` and `".*"`, both fire on a Read call and two sounds play simultaneously. The fallback entry **must** use a negative lookahead regex (`^(?!Read$|Edit$|...)`) that excludes all explicitly-mapped tools. Adjust the lookahead whenever you add or remove tool-specific entries.

### Merging rules

- If `hooks` already exists, add entries to the existing object (don't overwrite)
- If an event array already has entries (e.g., existing PostToolUse lint hooks), **append** sound-hooks entries to the array
- Only add hook entries for events the user enabled in Step 1

### Optional events

If the user enabled `UserPromptSubmit`:

```json
"UserPromptSubmit": [
  {
    "matcher": "",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/user-prompt.wav"
      }
    ]
  }
]
```

---

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name sound-hooks --plugin-version 1.0.0 --marketplace-name babysitter --global|--project --json
```

Use `--global` or `--project` matching the scope the user chose.

---

## Step 9: Verify

Test the setup by playing a sound manually:

```bash
bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/session-start.wav
```

If you hear the sound, you're all set. If not, troubleshoot:

1. **Check player**: Run `mpv --version` or `afplay --help` (macOS) to confirm the player works
2. **Check file**: Run `file .claude/sound-hooks/sounds/session-start.wav` to verify it's a valid audio file
3. **Try directly**: Run `mpv --no-video --really-quiet .claude/sound-hooks/sounds/session-start.wav`
4. **Windows PATH**: If mpv is installed but the play script doesn't find it, check `Step 2` -- the script searches common locations but your install path may differ. Add the mpv directory to the script's search list.
5. **Format mismatch**: If using paplay/aplay (Linux) and sound doesn't play, check if the file is MP3 -- these players need WAV. Re-download in WAV format or install mpv.

---

## Advanced: Babysitter Hooks Integration

If you also want sounds on babysitter-specific lifecycle events (run start, run complete, run fail, task dispatch, breakpoints), configure babysitter hooks. This is separate from the Claude Code hooks above and only applies during babysitter orchestration.

Create additional sound files:

```
.claude/sound-hooks/sounds/on-run-start.wav
.claude/sound-hooks/sounds/on-run-complete.wav
.claude/sound-hooks/sounds/on-run-fail.wav
.claude/sound-hooks/sounds/on-task-start.wav
.claude/sound-hooks/sounds/on-task-complete.wav
.claude/sound-hooks/sounds/on-breakpoint.wav
```

Register babysitter hooks by adding to your project's `.a5c/hooks.json`:

```json
{
  "on-run-start": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-run-start.wav",
  "on-run-complete": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-run-complete.wav",
  "on-run-fail": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-run-fail.wav",
  "on-task-start": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-task-start.wav",
  "on-task-complete": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-task-complete.wav",
  "on-breakpoint": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-breakpoint.wav"
}
```
