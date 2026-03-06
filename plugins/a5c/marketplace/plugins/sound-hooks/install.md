# Sound Hooks -- Install Instructions

Welcome to **Sound Hooks** -- the plugin that gives your Claude Code sessions a soundtrack! Every lifecycle event gets its own audio cue, so you'll *hear* your code succeed (or fail) in real time.

These are **Claude Code hooks** configured in `.claude/settings.json` -- they fire on Claude Code lifecycle events like tool use, session start, errors, and notifications.

---

## Step 1: Interview the User

Before we start downloading sounds, let's pick a vibe. Ask which sound theme they prefer:

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

5. **Custom** -- Bring your own sounds
   - The user provides their own `.mp3` files for each event
   - Skip the download step and just copy their files into place

Also ask:
- Which events should play sounds? (see event table in Step 4 -- recommend enabling session-start, stop, and tool-failure at minimum)
- Should task-level sounds (PostToolUse) be enabled? (can get noisy -- disabled by default)

---

## Step 2: Create Directory Structure

Set up the plugin's home:

```bash
mkdir -p .claude/sound-hooks/scripts
mkdir -p .claude/sound-hooks/sounds
```

This gives us:
- `scripts/` -- the play script that handles cross-platform audio playback
- `sounds/` -- the mp3 files that bring the noise

---

## Step 3: Ensure Audio Player is Available

The play script needs an audio player that can play mp3 files from the command line. Check what's available and install if needed:

### Windows (Git Bash / MSYS2 / WSL)

**mpv** is the recommended player on Windows -- lightweight, fast, CLI-friendly, and plays mp3 natively with no GUI popup.

Check if mpv is available:

```bash
command -v mpv &>/dev/null && echo "mpv is installed" || echo "mpv not found"
```

If mpv is not found, install it using one of these methods (try in order):

```bash
# Option 1: winget (built into Windows 10+)
winget install mpv-player.mpv

# Option 2: scoop
scoop install mpv

# Option 3: chocolatey (run from elevated terminal)
choco install mpv
```

After installing, verify mpv is in PATH:

```bash
mpv --version
```

If `mpv` is not in PATH after install, add its install directory. Common locations:
- winget: `C:\Users\<user>\AppData\Local\Microsoft\WinGet\Packages\mpv-player.mpv_*\mpv\`
- scoop: `C:\Users\<user>\scoop\apps\mpv\current\`
- choco: `C:\ProgramData\chocolatey\bin\`

### macOS

`afplay` is built-in -- no install needed. Falls back to `mpg123` if needed:

```bash
# Only if afplay doesn't work for some reason:
brew install mpg123
```

### Linux

Most distributions have `paplay` (PulseAudio) or `aplay` (ALSA) built-in. For mp3 support:

```bash
# Ubuntu/Debian
sudo apt install mpv
# or
sudo apt install mpg123

# Fedora/RHEL
sudo dnf install mpv

# Arch
sudo pacman -S mpv
```

---

## Step 4: Search and Download Sound Files

Based on the chosen theme, search the web for **royalty-free** or **Creative Commons** licensed mp3 sound effects. For each hook event, find and download an appropriate sound.

### Sound Mapping by Event

| Claude Code Event | What It Means | Suggested Search Keywords | Example Sounds |
|---|---|---|---|
| `SessionStart` | A new Claude Code session begins | "start sound effect", "engine ignition", "launch sound" | Coin insert, ignition rev, "engage!", rocket launch |
| `Stop` | Claude finished responding / session idle | "success fanfare", "victory sound", "completion chime" | Level complete, gentle chime, triumphant brass, task done |
| `PostToolUse` | A tool call completed successfully | "small success chime", "completion ding", "subtle click" | Ding, coin collect, gentle chime, checkbox tick |
| `PostToolUseFailure` | A tool call failed | "failure sound effect", "error buzzer", "game over" | Game over melody, sad trombone, buzzer, record scratch |
| `Notification` | Claude Code notification (rate limit, permission, etc.) | "attention alert", "doorbell sound", "intercom buzz" | Doorbell ring, intercom beep, "your attention please" |
| `UserPromptSubmit` | User sent a message | "notification click", "subtle alert", "message sent" | Soft click, digital beep, whoosh, keyboard tap |

### Theme-Specific Search Tips

- **TV Shows**: Search for "sitcom sound effect", "laugh track mp3", "dramatic sting", "game show buzzer"
- **Movies**: Search for "cinematic hit", "orchestra stinger", "dramatic reveal", "Wilhelm scream free"
- **Video Games**: Search for "retro game sound", "8-bit coin", "level up chime", "power up sound effect"
- **Sci-Fi**: Search for "sci-fi computer beep", "spaceship alert", "futuristic notification", "warp drive sound"

### Recommended Free Sources

Search these sites for royalty-free sound effects:

- **[Pixabay Sound Effects](https://pixabay.com/sound-effects/)** -- Free, CC0 license, no account needed. Great first choice.
- **[Mixkit](https://mixkit.co/free-sound-effects/)** -- Free, no account needed, high quality.
- **[Freesound.org](https://freesound.org/)** -- Huge library, Creative Commons licensed. Requires a free account.
- **[SoundBible](https://soundbible.com/)** -- Various CC licenses, straightforward downloads.

### Download Process

For each event, download the chosen mp3 to:

```
.claude/sound-hooks/sounds/session-start.mp3
.claude/sound-hooks/sounds/stop.mp3
.claude/sound-hooks/sounds/tool-success.mp3
.claude/sound-hooks/sounds/tool-failure.mp3
.claude/sound-hooks/sounds/notification.mp3
.claude/sound-hooks/sounds/user-prompt.mp3
```

If a download fails or a suitable sound can't be found, note the missing sound in `config.json` (set that event's `enabled` to `false`) and continue with the rest. A missing sound file won't break anything -- the play script silently skips missing files.

---

## Step 5: Create the Play Script

Create `.claude/sound-hooks/scripts/play.sh`:

```bash
#!/bin/bash
# Sound Hooks -- play a sound effect for a Claude Code event
# Usage: play.sh <sound-file>
#
# Plays the sound in the background (non-blocking) using whatever
# audio player is available on the system.
# Priority: mpv > afplay > paplay > aplay > mpg123 > powershell

SOUND="$1"

# Check that the sound file exists
if [ ! -f "$SOUND" ]; then
  exit 0
fi

# Play the sound in the background (non-blocking, platform-appropriate)
if command -v mpv &>/dev/null; then
  # Cross-platform (recommended on Windows, also works on macOS/Linux)
  mpv --no-video --really-quiet "$SOUND" &
elif command -v afplay &>/dev/null; then
  # macOS built-in
  afplay "$SOUND" &
elif command -v paplay &>/dev/null; then
  # Linux (PulseAudio)
  paplay "$SOUND" &
elif command -v aplay &>/dev/null; then
  # Linux (ALSA) -- note: aplay only supports wav, not mp3
  aplay "$SOUND" &
elif command -v mpg123 &>/dev/null; then
  # Linux/macOS fallback
  mpg123 -q "$SOUND" &
elif command -v powershell.exe &>/dev/null; then
  # Windows last resort (slower startup, blocks briefly)
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

Write the configuration file at `.claude/sound-hooks/config.json`:

```json
{
  "version": "1.0.0",
  "theme": "<selected-theme>",
  "events": {
    "SessionStart": { "enabled": true, "sound": "sounds/session-start.mp3" },
    "Stop": { "enabled": true, "sound": "sounds/stop.mp3" },
    "PostToolUse": { "enabled": false, "sound": "sounds/tool-success.mp3" },
    "PostToolUseFailure": { "enabled": true, "sound": "sounds/tool-failure.mp3" },
    "Notification": { "enabled": true, "sound": "sounds/notification.mp3" },
    "UserPromptSubmit": { "enabled": false, "sound": "sounds/user-prompt.mp3" }
  }
}
```

Replace `<selected-theme>` with the theme chosen in Step 1 (e.g., `"tv-shows"`, `"movies"`, `"video-games"`, `"sci-fi"`, or `"custom"`).

**Note on the defaults**: `PostToolUse` and `UserPromptSubmit` are disabled by default because they fire frequently and can get noisy fast. Enable them if you enjoy living on the edge of audio chaos.

---

## Step 7: Configure Claude Code Hooks

Add hooks to the project's `.claude/settings.json`. Read the existing file first, then merge these hook entries into the `hooks` object.

The play script path is relative to the project root. Each hook calls the play script with the appropriate sound file:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/session-start.mp3"
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
            "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/stop.mp3"
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
            "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-failure.mp3"
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
            "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/notification.mp3"
          }
        ]
      }
    ]
  }
}
```

**Important**: When merging into existing settings.json:
- If `hooks` already exists, add these entries to the existing hook arrays (don't overwrite)
- If any of these hook event arrays already have entries, append to them
- Preserve all existing hooks and settings
- Only add hook entries for events the user chose to enable in Step 1

Optionally, if the user enabled `PostToolUse` or `UserPromptSubmit`, add those too:

```json
"PostToolUse": [
  {
    "matcher": ".*",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-success.mp3"
      }
    ]
  }
],
"UserPromptSubmit": [
  {
    "matcher": "",
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/user-prompt.mp3"
      }
    ]
  }
]
```

---

## Step 8: Register Plugin

Register the plugin with babysitter so it knows sound-hooks is installed:

```bash
babysitter plugin:update-registry --plugin-name sound-hooks --plugin-version 1.0.0 --marketplace-name babysitter --project --json
```

---

## Step 9: Verify

Test the setup by playing a sound manually:

```bash
bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/session-start.mp3
```

If you hear the sound, you're all set. If not, troubleshoot:

1. **Check player**: Run `mpv --version` (Windows) or `afplay --help` (macOS) to confirm the player works
2. **Check file**: Run `file .claude/sound-hooks/sounds/session-start.mp3` to verify it's a valid audio file
3. **Try directly**: Run `mpv --no-video --really-quiet .claude/sound-hooks/sounds/session-start.mp3` to test the player with the file
4. **Windows PATH**: If mpv was just installed, you may need to restart your terminal for PATH changes to take effect

---

## Advanced: Babysitter Hooks Integration

If you also want sounds on babysitter-specific lifecycle events (run start, run complete, run fail, task dispatch, breakpoints), you can additionally configure babysitter hooks. This is separate from the Claude Code hooks above and only applies when running babysitter orchestration.

Create additional sound files:

```
.claude/sound-hooks/sounds/on-run-start.mp3
.claude/sound-hooks/sounds/on-run-complete.mp3
.claude/sound-hooks/sounds/on-run-fail.mp3
.claude/sound-hooks/sounds/on-task-start.mp3
.claude/sound-hooks/sounds/on-task-complete.mp3
.claude/sound-hooks/sounds/on-breakpoint.mp3
```

Then register babysitter hooks by adding to your project's `.a5c/hooks.json` or via the babysitter hooks configuration. Each hook calls the same play script:

```json
{
  "on-run-start": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-run-start.mp3",
  "on-run-complete": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-run-complete.mp3",
  "on-run-fail": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-run-fail.mp3",
  "on-task-start": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-task-start.mp3",
  "on-task-complete": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-task-complete.mp3",
  "on-breakpoint": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/on-breakpoint.mp3"
}
```

This is entirely optional and only needed if you want audio feedback on babysitter orchestration events specifically.
