# Sound Hooks -- Uninstall Instructions

Time to go silent? No hard feelings. Here's how to cleanly remove Sound Hooks.

---

## Step 1: Remove All Plugin Files

Delete the sound hook scripts, downloaded sounds, configuration, and logs:

```bash
rm -rf .a5c/sound-hooks/
```

This removes:
- `hooks/` -- all the shell scripts
- `sounds/` -- all the downloaded mp3 files
- `config.json` -- the plugin configuration
- `hook-events.log` -- the event log (if it exists)

---

## Step 2: Remove from Registry

Unregister the plugin from babysitter's plugin registry:

```bash
babysitter plugin:remove-from-registry --plugin-name sound-hooks --project --json
```

---

That's it. Two steps and the silence is deafening. If you ever want the sounds back, just reinstall -- your ears will thank you.
