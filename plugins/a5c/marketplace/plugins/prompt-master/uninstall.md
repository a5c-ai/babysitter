# prompt-master -- Uninstall Instructions

Remove the prompt-master skill, its hook integration, and profile recommendations.

## Step 1: Remove UserPromptSubmit Hook (if installed)

Read `.claude/settings.json` and check if a `UserPromptSubmit` hook entry references `prompt-master/detect-prompt-request.sh`. If found:

- Remove that specific matcher object from the `UserPromptSubmit` array.
- If the array becomes empty after removal, remove the entire `UserPromptSubmit` key.
- Preserve all other hooks.

Then remove the hook script directory:

**Global:**
```bash
rm -rf ~/.claude/prompt-master/
```

**Project-local:**
```bash
rm -rf .a5c/prompt-master/
```

## Step 2: Remove CLAUDE.md Section (if added)

If the project's `CLAUDE.md` contains a `## prompt-master` section, remove it (from the `## prompt-master` heading through to the next `##` heading or end of file). Do not remove any other content.

## Step 3: Remove Profile Recommendations (if added)

If the user profile contains a `toolPreferences.promptGeneration` entry with `preferredSkill: "prompt-master"`, remove that key:

```bash
cat > /tmp/prompt-master-profile-remove.json << 'EOF'
{
  "toolPreferences": {
    "promptGeneration": null
  }
}
EOF
babysitter profile:merge --user --input /tmp/prompt-master-profile-remove.json --json
rm /tmp/prompt-master-profile-remove.json
```

If the project profile contains a `tools.promptMaster` entry, remove it:

```bash
cat > /tmp/prompt-master-project-remove.json << 'EOF'
{
  "tools": {
    "promptMaster": null
  }
}
EOF
babysitter profile:merge --project --input /tmp/prompt-master-project-remove.json --json
rm /tmp/prompt-master-project-remove.json
```

If profile:merge does not support null-deletion, read the profile with `babysitter profile:read --user --json`, manually remove the key from the JSON, and write it back with `babysitter profile:write --user --input <file> --json`.

## Step 4: Remove Skill Directory

**Global:**
```bash
rm -rf ~/.claude/skills/prompt-master/
```

**Project-local:**
```bash
rm -rf .a5c/skills/prompt-master/
```

## Step 5: Remove from Plugin Registry

Use the scope matching the original installation:

```bash
babysitter plugin:remove-from-registry --plugin-name prompt-master --project --json
```

Or for global:
```bash
babysitter plugin:remove-from-registry --plugin-name prompt-master --global --json
```

## Post-Uninstall Notes

- The git clone is fully removed. No cached data remains.
- If other plugins or hooks reference prompt-master, they will fail silently (no skill found). Check `.claude/settings.json` hooks and any custom processes for stale references.
- Profile merge operations are idempotent. Running uninstall twice is safe.
