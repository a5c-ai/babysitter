# Sound Hooks -- Install Instructions

Welcome to **Sound Hooks** -- the plugin that gives your babysitter runs a soundtrack! Every lifecycle event gets its own audio cue, so you'll *hear* your code succeed (or fail) in real time.

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

---

## Step 2: Create Directory Structure

Set up the plugin's home:

```bash
mkdir -p .a5c/sound-hooks/hooks
mkdir -p .a5c/sound-hooks/sounds
```

This gives us:
- `hooks/` -- shell scripts that fire on each lifecycle event
- `sounds/` -- the mp3 files that bring the noise

---

## Step 3: Search and Download Sound Files

Based on the chosen theme, search the web for **royalty-free** or **Creative Commons** licensed mp3 sound effects. For each hook event, find and download an appropriate sound.

### Sound Mapping by Event

| Hook Event | What It Means | Suggested Search Keywords | Example Sounds |
|---|---|---|---|
| `on-run-start` | A new run is kicking off | "start sound effect", "engine ignition", "launch sound" | Coin insert, ignition rev, "engage!", rocket launch |
| `on-run-complete` | Run finished successfully | "success fanfare", "victory sound", "celebration jingle" | Level complete, applause, triumphant brass, confetti pop |
| `on-run-fail` | Run hit an error | "failure sound effect", "error buzzer", "game over" | Game over melody, sad trombone, buzzer, record scratch |
| `on-task-start` | A task is being dispatched | "notification click", "subtle alert", "task start beep" | Soft click, digital beep, whoosh, keyboard tap |
| `on-task-complete` | A task finished | "small success chime", "completion ding" | Ding, coin collect, gentle chime, checkbox tick |
| `on-breakpoint` | Waiting for human input | "attention alert", "doorbell sound", "intercom buzz" | Doorbell ring, intercom beep, "your attention please" |

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
.a5c/sound-hooks/sounds/on-run-start.mp3
.a5c/sound-hooks/sounds/on-run-complete.mp3
.a5c/sound-hooks/sounds/on-run-fail.mp3
.a5c/sound-hooks/sounds/on-task-start.mp3
.a5c/sound-hooks/sounds/on-task-complete.mp3
.a5c/sound-hooks/sounds/on-breakpoint.mp3
```

If a download fails or a suitable sound can't be found, note the missing sound in `config.json` (set that event's sound path to `null`) and continue with the rest. A missing sound file won't break anything -- the hook script will simply skip playback for that event.

---

## Step 4: Create Hook Scripts

For each event, create a shell script that plays the corresponding sound. These scripts are designed to work cross-platform.

Create the following scripts in `.a5c/sound-hooks/hooks/`:

### Template for each hook script

For each event (`on-run-start`, `on-run-complete`, `on-run-fail`, `on-task-start`, `on-task-complete`, `on-breakpoint`), create `.a5c/sound-hooks/hooks/<event>.sh`:

```bash
#!/bin/bash
# Sound Hooks -- <event> handler
# Plays a sound effect when this lifecycle event fires.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$SCRIPT_DIR/config.json"
SOUND="$SCRIPT_DIR/sounds/<event>.mp3"
LOG="$SCRIPT_DIR/hook-events.log"

# Check if this event is enabled in config
ENABLED=$(node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8'));console.log(c.events['<event>']||false)")
if [ "$ENABLED" != "true" ]; then
  exit 0
fi

# Log the event (if log file is configured)
LOG_ENABLED=$(node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8'));console.log(c.logFile!==null)")
if [ "$LOG_ENABLED" = "true" ]; then
  echo "<event> $(date -Iseconds)" >> "$LOG"
fi

# Check that the sound file exists
if [ ! -f "$SOUND" ]; then
  exit 0
fi

# Play the sound in the background (non-blocking, platform-appropriate)
if command -v afplay &>/dev/null; then
  # macOS
  afplay "$SOUND" &
elif command -v paplay &>/dev/null; then
  # Linux (PulseAudio)
  paplay "$SOUND" &
elif command -v aplay &>/dev/null; then
  # Linux (ALSA)
  aplay "$SOUND" &
elif command -v mpg123 &>/dev/null; then
  # Linux/macOS (mpg123)
  mpg123 -q "$SOUND" &
elif command -v powershell.exe &>/dev/null; then
  # Windows (WSL or Git Bash)
  powershell.exe -c "(New-Object Media.SoundPlayer '$SOUND').PlaySync()" &
fi
```

Replace `<event>` with the actual event name in each script.

Make all scripts executable:

```bash
chmod +x .a5c/sound-hooks/hooks/*.sh
```

---

## Step 5: Create Configuration

Write the configuration file at `.a5c/sound-hooks/config.json`:

```json
{
  "version": "1.0.0",
  "theme": "<selected-theme>",
  "volume": 75,
  "events": {
    "on-run-start": true,
    "on-run-complete": true,
    "on-run-fail": true,
    "on-task-start": false,
    "on-task-complete": false,
    "on-breakpoint": true
  },
  "logFile": ".a5c/sound-hooks/hook-events.log",
  "soundFiles": {
    "on-run-start": "sounds/on-run-start.mp3",
    "on-run-complete": "sounds/on-run-complete.mp3",
    "on-run-fail": "sounds/on-run-fail.mp3",
    "on-task-start": "sounds/on-task-start.mp3",
    "on-task-complete": "sounds/on-task-complete.mp3",
    "on-breakpoint": "sounds/on-breakpoint.mp3"
  }
}
```

Replace `<selected-theme>` with the theme chosen in Step 1 (e.g., `"tv-shows"`, `"movies"`, `"video-games"`, `"sci-fi"`, or `"custom"`).

**Note on the defaults**: `on-task-start` and `on-task-complete` are disabled by default because they fire frequently and can get noisy fast. Enable them if you enjoy living on the edge of audio chaos.

---

## Step 6: Register Plugin

Register the plugin with babysitter so it knows sound-hooks is installed:

```bash
babysitter plugin:update-registry --plugin-name sound-hooks --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

---

## You're All Set!

Your babysitter runs now have a soundtrack. Start a run and listen for the magic:

```bash
babysitter run:create --process my-process
```

Hear that? That's the sweet sound of automation.
