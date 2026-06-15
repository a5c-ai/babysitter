# Themes -- Uninstall Instructions

Ready to go vanilla? Here's how to cleanly remove the Themes plugin and all its artifacts.

---

## Step 1: Remove Theme Section from CLAUDE.md

Edit the project's `CLAUDE.md` and remove everything between the theme markers (inclusive):

```
<!-- THEMES PLUGIN START — do not edit manually, managed by themes plugin -->
...
<!-- THEMES PLUGIN END -->
```

Delete those lines and both marker comments. Preserve all other content.

---

## Step 2: Remove Claude Code Hooks

Edit `.claude/settings.json` and remove all theme/sound-hooks entries from the `hooks` object.

Remove any hook entries whose `command` contains `.a5c/theme/sounds/` or `.claude/sound-hooks/` from these event arrays:
- `SessionStart`
- `Stop`
- `PostToolUse` (may have multiple per-tool entries -- remove all of them)
- `PostToolUseFailure`
- `Notification`
- `UserPromptSubmit`

If removing an entry leaves an event array empty, remove the entire event key. Preserve all other hook entries.

---

## Step 3: Remove Babysitter Hooks (if configured)

If babysitter hooks were set up (the advanced option), remove any theme sound entries from `.a5c/hooks.json`.

---

## Step 4: Remove the Active Theme Symlink

```bash
# Remove the symlink (or junction on Windows)
rm .a5c/theme 2>/dev/null || cmd //c "rmdir .a5c\\theme" 2>/dev/null
```

---

## Step 5: Remove Theme Directories

Delete all theme data:

```bash
# Remove all themes
rm -rf .a5c/themes/

# Remove sound hooks scripts
rm -rf .claude/sound-hooks/
```

This removes:
- All theme directories under `.a5c/themes/` (sounds, assets, design system, theme.yaml for each theme)
- The play script and sound-hooks scripts directory

**Note**: If you want to keep some themes for potential re-use, selectively delete only unwanted themes:
```bash
rm -rf .a5c/themes/<specific-theme-name>
```

---

## Step 6: Remove from Registry

Unregister the plugin:

```bash
babysitter plugin:remove-from-registry --plugin-name themes --project --json
```

---

## Step 7: Clean Up Empty Directories

```bash
# Remove .a5c/themes/ if empty
rmdir .a5c/themes 2>/dev/null

# Remove .claude/sound-hooks/ if empty (should already be gone from Step 5)
rmdir .claude/sound-hooks 2>/dev/null
```

---

That's it. Your project is back to its unthemed self -- no personality, no sounds, no flair. If you miss it, just reinstall with a new theme.
