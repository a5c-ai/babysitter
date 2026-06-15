# Sound Hooks -- Configuration

Sound Hooks is highly configurable. Whether you want to swap themes, add per-tool differentiation, fine-tune which events trigger sounds, or drop in custom audio, this guide covers it.

**Important**: Sound paths live in **two files** that must stay in sync:
- `.claude/sound-hooks/config.json` -- records theme, enabled events, and sound paths (informational)
- `.claude/settings.json` -- the actual hook commands that trigger playback

When changing a sound filename or path, update both files.

---

## 1. Change Theme

1. Ask the user which new theme they'd like:
   - **TV Shows** -- laugh tracks, dramatic stings, applause
   - **Movies** -- cinematic hits, orchestral reveals, Wilhelm screams
   - **Video Games** -- coin collects, level ups, game overs
   - **Sci-Fi** -- warp drives, phasers, computer beeps
   - **Medieval** -- fanfares, sword clashes, temple bells
   - **Custom** -- user provides their own files

2. Search for new royalty-free sound effects matching the theme (see `install.md` Step 4 for search keywords per event and agent-friendly download sources).

3. Download each new sound to `.claude/sound-hooks/sounds/`, replacing existing files. Keep the same filenames to avoid config changes:
   ```
   .claude/sound-hooks/sounds/session-start.wav
   .claude/sound-hooks/sounds/stop.wav
   .claude/sound-hooks/sounds/tool-success.wav
   .claude/sound-hooks/sounds/tool-failure.wav
   .claude/sound-hooks/sounds/notification.wav
   .claude/sound-hooks/sounds/user-prompt.wav
   ```

4. If per-tool sounds are configured, also replace:
   ```
   .claude/sound-hooks/sounds/tool-read.wav
   .claude/sound-hooks/sounds/tool-edit.wav
   .claude/sound-hooks/sounds/tool-bash.wav
   .claude/sound-hooks/sounds/tool-search.wav
   .claude/sound-hooks/sounds/tool-agent.wav
   .claude/sound-hooks/sounds/tool-web.wav
   ```

5. Update the `"theme"` field in `config.json`:
   ```json
   {
     "theme": "medieval"
   }
   ```

---

## 2. Toggle Events

Control which Claude Code events trigger sounds.

### Enable an event

1. Set `enabled` to `true` in `config.json`:
   ```json
   {
     "events": {
       "PostToolUse": { "enabled": true, "sound": "sounds/tool-success.wav" }
     }
   }
   ```

2. Add the corresponding hook entry to `.claude/settings.json` (if not already present):
   ```json
   "PostToolUse": [
     {
       "matcher": ".*",
       "hooks": [
         {
           "type": "command",
           "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-success.wav"
         }
       ]
     }
   ]
   ```

### Disable an event

1. Set `enabled` to `false` in `config.json`.
2. Remove the corresponding hook entry from `.claude/settings.json`.

### Available events

| Event | Default | Notes |
|---|---|---|
| `SessionStart` | enabled | Plays when a new Claude Code session begins |
| `Stop` | enabled | Plays when Claude finishes responding |
| `PostToolUse` | disabled | Plays after every successful tool call -- noisy without per-tool filtering |
| `PostToolUseFailure` | enabled | Plays when a tool call fails |
| `Notification` | enabled | Plays on Claude Code notifications |
| `UserPromptSubmit` | disabled | Plays when user sends a message |

---

## 3. Per-Tool Sound Mapping (PostToolUse)

The most useful feature -- hear *what* Claude is doing without looking at the screen. Instead of one sound for all tools, assign different sounds to tool groups.

### Enable per-tool mapping

1. Update `config.json` to use the `toolSounds` schema:
   ```json
   {
     "events": {
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
       }
     }
   }
   ```

2. Download a distinct sound for each tool group (see `install.md` Step 1 for sound concept suggestions per group).

3. Replace the PostToolUse hooks in `.claude/settings.json` with per-tool entries. **Each tool group gets its own matcher entry**:

   ```json
   "PostToolUse": [
     {
       "matcher": "^Read$",
       "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-read.wav" }]
     },
     {
       "matcher": "^(Edit|Write)$",
       "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-edit.wav" }]
     },
     {
       "matcher": "^Bash$",
       "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-bash.wav" }]
     },
     {
       "matcher": "^(Grep|Glob)$",
       "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-search.wav" }]
     },
     {
       "matcher": "^Agent$",
       "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-agent.wav" }]
     },
     {
       "matcher": "^(WebSearch|WebFetch)$",
       "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-web.wav" }]
     },
     {
       "matcher": "^(?!Read$|Edit$|Write$|Bash$|Grep$|Glob$|Agent$|WebSearch$|WebFetch$)",
       "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-success.wav" }]
     }
   ]
   ```

### Matcher double-firing gotcha

Claude Code fires hooks for **every matcher** that matches a given tool name. If you have both `"^Read$"` and `".*"`, both fire on a Read call -- two sounds play simultaneously.

The **fallback entry must use a negative lookahead** that excludes all explicitly-mapped tools:

```
^(?!Read$|Edit$|Write$|Bash$|Grep$|Glob$|Agent$|WebSearch$|WebFetch$)
```

**Whenever you add or remove a per-tool entry, update the fallback's negative lookahead to match.** Forgetting this causes double-firing for newly mapped tools.

### Revert to single-sound PostToolUse

Replace all per-tool entries with a single `".*"` matcher:

```json
"PostToolUse": [
  {
    "matcher": ".*",
    "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/tool-success.wav" }]
  }
]
```

And simplify `config.json`:
```json
"PostToolUse": { "enabled": true, "sound": "sounds/tool-success.wav" }
```

---

## 4. Custom Sounds

Drop your own audio files in:

1. Place your audio file in `.claude/sound-hooks/sounds/`. WAV or MP3 -- check player compatibility (see `install.md` Step 2).
2. If using a different filename, update the sound path in both `config.json` and the hook `command` in `.claude/settings.json`:

   config.json:
   ```json
   "PostToolUseFailure": { "enabled": true, "sound": "sounds/sad-violin.wav" }
   ```

   settings.json:
   ```json
   "command": "bash .claude/sound-hooks/scripts/play.sh .claude/sound-hooks/sounds/sad-violin.wav"
   ```

**Tip**: Keep files short (under 5 seconds). Long clips overlap with subsequent events.

---

## 5. Replace Individual Sounds

Don't want to change the whole theme, just one sound?

1. Search for a new royalty-free sound for the specific event (see `install.md` for search keywords and download sources).
2. Download and save to `.claude/sound-hooks/sounds/<name>.wav`, replacing the existing file.
3. If you kept the same filename, no config changes needed -- the play script picks up the new file on the next event.

---

## 6. Change Audio Format

If you need to switch between WAV and MP3 (e.g., switching to a Linux machine without mpv):

1. Re-download sounds in the target format, or convert existing files.
2. Update all filenames in `config.json` (change `.mp3` to `.wav` or vice versa).
3. Update all `command` entries in `.claude/settings.json` to reference the new filenames.

**Format compatibility reminder**:

| Player | MP3 | WAV | Notes |
|---|---|---|---|
| mpv | yes | yes | Best choice |
| afplay | yes | yes | macOS only |
| mpg123 | yes | no | |
| paplay/aplay | no | yes | Linux native |
| powershell SoundPlayer | no | yes | Windows fallback |

---

## 7. Temporarily Disable All Sounds

To silence everything without uninstalling, remove all sound-hooks entries from the `hooks` object in `.claude/settings.json`. Re-add them to re-enable (see `install.md` Step 7 for the hook configuration).

---

## 8. Add Babysitter Hooks

If you want sounds on babysitter-specific orchestration events (run start/complete/fail, task dispatch, breakpoints) in addition to the Claude Code hooks, see the "Advanced: Babysitter Hooks Integration" section at the bottom of `install.md`.

---

## Full Configuration Reference

### Basic (no per-tool)

```json
{
  "version": "1.0.0",
  "theme": "video-games",
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

### With per-tool mapping

```json
{
  "version": "1.0.0",
  "theme": "medieval",
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
