# Sound Hooks -- Uninstall Instructions

Time to go silent? No hard feelings. Here's how to cleanly remove Sound Hooks.

---

## Step 1: Remove Claude Code Hooks

Edit `.claude/settings.json` and remove all sound-hooks entries from the `hooks` object.

Remove any hook entries whose `command` contains `.claude/sound-hooks/` from these event arrays:
- `SessionStart`
- `Stop`
- `PostToolUse` (may have multiple per-tool entries -- remove all of them)
- `PostToolUseFailure`
- `Notification`
- `UserPromptSubmit`

If removing the sound-hooks entry leaves an event array empty, remove the entire event key. Preserve all other hook entries.

---

## Step 2: Remove Babysitter Hooks (if configured)

If babysitter hooks were set up (the advanced option), remove any sound-hooks entries from `.a5c/hooks.json` or the babysitter hooks configuration.

---

## Step 3: Remove All Plugin Files

Delete the sound hook scripts, downloaded sounds, and configuration:

```bash
rm -rf .claude/sound-hooks/
```

This removes:
- `scripts/` -- the play script
- `sounds/` -- all downloaded audio files (WAV and MP3)
- `config.json` -- the plugin configuration

---

## Step 4: Remove from Registry

Unregister the plugin from babysitter's plugin registry:

```bash
babysitter plugin:remove-from-registry --plugin-name sound-hooks --global|--project --json
```

Use `--global` or `--project` matching the scope the plugin was installed at.

---

That's it. Four steps and the silence is deafening. If you ever want the sounds back, just reinstall -- your ears will thank you.
