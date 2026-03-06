# Sound Hooks -- Configuration

Sound Hooks is highly configurable. Whether you want to swap themes, fine-tune which events trigger sounds, or drop in your own custom audio, this guide has you covered.

All configuration lives in `.a5c/sound-hooks/config.json`.

---

## 1. Change Theme

Want to switch from Video Games to Sci-Fi? Or maybe Movies are more your style now? Here's how:

1. Ask the user which new theme they'd like:
   - **TV Shows** -- laugh tracks, dramatic stings, applause
   - **Movies** -- cinematic hits, orchestral reveals, Wilhelm screams
   - **Video Games** -- coin collects, level ups, game overs
   - **Sci-Fi** -- warp drives, phasers, computer beeps
   - **Custom** -- user provides their own files

2. Search the web for new royalty-free mp3 sound effects matching the new theme (see the sound mapping table in `install.md` for search keywords per event).

3. Download each new mp3 to `.a5c/sound-hooks/sounds/`, replacing the existing files:
   ```
   .a5c/sound-hooks/sounds/on-run-start.mp3
   .a5c/sound-hooks/sounds/on-run-complete.mp3
   .a5c/sound-hooks/sounds/on-run-fail.mp3
   .a5c/sound-hooks/sounds/on-task-start.mp3
   .a5c/sound-hooks/sounds/on-task-complete.mp3
   .a5c/sound-hooks/sounds/on-breakpoint.mp3
   ```

4. Update the `"theme"` field in `config.json` to reflect the new choice:
   ```json
   {
     "theme": "sci-fi"
   }
   ```

---

## 2. Adjust Volume

Edit the `"volume"` field in `.a5c/sound-hooks/config.json`:

```json
{
  "volume": 50
}
```

Valid range: `0` (muted) to `100` (full blast).

**Important caveat**: Actual volume control depends on the playback command available on your system. Not all audio players support volume flags via CLI. The volume value is stored for reference and for players that support it. If your sounds are too loud or too quiet, consider normalizing the mp3 files themselves using a tool like `ffmpeg`:

```bash
ffmpeg -i input.mp3 -filter:a "volume=0.5" output.mp3
```

---

## 3. Toggle Events

Control which lifecycle events trigger sounds by editing the `"events"` object in `config.json`:

```json
{
  "events": {
    "on-run-start": true,
    "on-run-complete": true,
    "on-run-fail": true,
    "on-task-start": false,
    "on-task-complete": false,
    "on-breakpoint": true
  }
}
```

- Set to `true` to enable a sound for that event.
- Set to `false` to silence it.

**Pro tip**: If you're running tasks in a tight loop, keep `on-task-start` and `on-task-complete` disabled unless you enjoy a relentless barrage of beeps and dings. They're great for slower, deliberate workflows though.

---

## 4. Custom Sounds

Want to use your own audio files? Just drop them in:

1. Place your mp3 file in `.a5c/sound-hooks/sounds/`.
2. If using a different filename than the default (`<event>.mp3`), update the `"soundFiles"` mapping in `config.json`:

```json
{
  "soundFiles": {
    "on-run-start": "sounds/my-custom-startup.mp3",
    "on-run-complete": "sounds/victory-dance.mp3",
    "on-run-fail": "sounds/sad-violin.mp3",
    "on-task-start": "sounds/on-task-start.mp3",
    "on-task-complete": "sounds/on-task-complete.mp3",
    "on-breakpoint": "sounds/attention-please.mp3"
  }
}
```

All paths are relative to the `.a5c/sound-hooks/` directory.

**Tip**: Keep sound files short (under 5 seconds). Long audio clips will overlap with subsequent events and create a wall of noise nobody asked for.

---

## 5. Replace Individual Sounds

Don't want to change the whole theme, just one sound? No problem:

1. Search the web for a new royalty-free mp3 for the specific event (see the search keyword suggestions in `install.md`).
2. Download it and save it to `.a5c/sound-hooks/sounds/<event>.mp3`, replacing the existing file.
3. That's it -- the hook script will pick up the new file on the next event.

For example, to replace just the failure sound:

```bash
# Download a new failure sound (example URL)
curl -L -o .a5c/sound-hooks/sounds/on-run-fail.mp3 "https://example.com/sad-trombone.mp3"
```

No config changes needed if you keep the same filename.

---

## 6. Log File

Sound Hooks logs every event it handles to a log file. Configure this via the `"logFile"` field:

```json
{
  "logFile": ".a5c/sound-hooks/hook-events.log"
}
```

**Options**:
- Set a path (relative to project root) to log events with timestamps.
- Set to `null` to disable logging entirely:
  ```json
  {
    "logFile": null
  }
  ```

The log format is one line per event:
```
on-run-start 2026-03-06T14:30:00+00:00
on-task-start 2026-03-06T14:30:01+00:00
on-task-complete 2026-03-06T14:30:05+00:00
on-run-complete 2026-03-06T14:30:06+00:00
```

Useful for debugging which events are firing and when, or for building your own analytics on top.

---

## Full Configuration Reference

Here's the complete `config.json` with all fields:

```json
{
  "version": "1.0.0",
  "theme": "video-games",
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

Now go make some noise.
