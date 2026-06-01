# prompt-master -- Configure Instructions

Adjust prompt-master behavior, hook sensitivity, and profile integration.

## Configuration Options

| Setting | Location | Default | Description |
|---------|----------|---------|-------------|
| Install scope | Skill directory location | global | `~/.claude/skills/prompt-master/` (global) or `.a5c/skills/prompt-master/` (project) |
| UserPromptSubmit hook | `.claude/settings.json` | disabled | Auto-detect prompt-generation requests and inject a nudge |
| Hook trigger patterns | `detect-prompt-request.sh` | See below | Regex patterns that trigger the nudge |
| User profile recommendation | `~/.config/babysitter/user-profile.json` | disabled | Recommend prompt-master in new process generation |
| Project profile recommendation | `.a5c/project-profile.json` | disabled | Recommend prompt-master in project-specific processes |

## 1. Enable or Disable the UserPromptSubmit Hook

### Enable

Follow Step 4 of `install.md` to create the hook script and add the settings.json entry.

### Disable

Remove the `UserPromptSubmit` matcher that references `prompt-master/detect-prompt-request.sh` from `.claude/settings.json`. Optionally delete the script directory:

```bash
# Global
rm -rf ~/.claude/prompt-master/
# Project-local
rm -rf .a5c/prompt-master/
```

## 2. Customize Hook Trigger Patterns

Edit the `detect-prompt-request.sh` script (global: `~/.claude/prompt-master/`, project: `.a5c/prompt-master/`). The trigger regex is on the `grep -iqE` line:

```bash
# Default pattern:
if echo "$PROMPT" | grep -iqE '(write|create|generate|make|build|craft|optimize|fix|improve|adapt|convert|translate)\s+(a\s+|me\s+a\s+|an?\s+)?(prompt|instruction|system\s*prompt|meta.?prompt)'; then
```

**To broaden** (match more requests), add verbs or nouns:
```bash
# Example: also match "design a prompt", "refine a prompt"
grep -iqE '(write|create|generate|make|build|craft|optimize|fix|improve|adapt|convert|translate|design|refine|draft)\s+(a\s+|me\s+a\s+|an?\s+)?(prompt|instruction|system\s*prompt|meta.?prompt|query)'
```

**To narrow** (fewer false positives), remove broad verbs:
```bash
# Example: only match explicit prompt generation verbs
grep -iqE '(generate|create|write)\s+(a\s+|me\s+a\s+)?(prompt|system\s*prompt)'
```

**To add tool-specific triggers** (match even without the word "prompt"):
```bash
# Example: also match "write for Midjourney", "optimize for Cursor"
grep -iqE '(write|create|generate|make|build|craft|optimize|fix|improve|adapt|convert|translate)\s+(a\s+|me\s+a\s+|an?\s+)?(prompt|instruction|system\s*prompt|meta.?prompt)|for\s+(midjourney|dall-?e|stable\s*diffusion|cursor|windsurf|copilot|chatgpt|gpt-[45])'
```

## 3. Enable or Disable Profile Recommendations

### Enable user profile recommendation

```bash
cat > /tmp/prompt-master-profile-merge.json << 'EOF'
{
  "toolPreferences": {
    "promptGeneration": {
      "preferredSkill": "prompt-master",
      "recommendation": "When generating prompts for external AI tools in babysitter processes, integrate the prompt-master skill for tool-specific optimization. Supports 30+ AI tools with automatic template selection.",
      "triggerPatterns": ["prompt generation", "write a prompt", "optimize prompt", "fix prompt"]
    }
  }
}
EOF
babysitter profile:merge --user --input /tmp/prompt-master-profile-merge.json --json
rm /tmp/prompt-master-profile-merge.json
```

### Enable project profile recommendation

```bash
cat > /tmp/prompt-master-project-merge.json << 'EOF'
{
  "tools": {
    "promptMaster": {
      "name": "prompt-master",
      "type": "skill",
      "description": "Generates optimized prompts for 30+ AI tools with automatic template selection",
      "recommendation": "Integrate into processes that generate prompts for external AI tools. Use agent tasks with prompt-master skill for tool-specific prompt optimization.",
      "source": "https://github.com/nidhinjs/prompt-master"
    }
  }
}
EOF
babysitter profile:merge --project --input /tmp/prompt-master-project-merge.json --json
rm /tmp/prompt-master-project-merge.json
```

### Disable profile recommendations

See Step 3 of `uninstall.md` for removal commands.

## 4. Update the Skill

To pull the latest version from the upstream repository:

```bash
# Global
cd ~/.claude/skills/prompt-master && git pull && cd -
# Project-local
cd .a5c/skills/prompt-master && git pull && cd -
```

## 5. Move Between Scopes

To move from project-local to global (or vice versa):

1. Run the uninstall steps for the current scope
2. Run the install steps for the new scope
3. Re-apply any hook or profile configuration for the new scope
