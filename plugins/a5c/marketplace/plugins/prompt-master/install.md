# prompt-master -- Install Instructions

Install the [prompt-master](https://github.com/nidhinjs/prompt-master) skill for generating optimized prompts across 30+ AI tools. Includes optional `UserPromptSubmit` hook integration and profile recommendations for process authoring.

## Step 1: Interview the User

Ask the user the following questions before proceeding. Present them as a numbered list and let the user respond to all at once or one at a time.

1. **Install scope**: Global (`~/.claude/skills/prompt-master/`, available everywhere) or project-local (`.a5c/skills/prompt-master/`, this project only)?
   - Default: global

2. **UserPromptSubmit hook**: Would you like to add a `UserPromptSubmit` hook that automatically detects when your prompt is requesting AI-tool output (e.g., "write a prompt for Cursor", "generate a Midjourney prompt") and injects a reminder to use the prompt-master skill?
   - Default: no
   - Note: This hook runs a lightweight shell script on every prompt submission. It pattern-matches against common trigger phrases and, when matched, appends a one-line nudge: `[prompt-master skill is available -- consider using it for this request]`.

3. **Profile recommendation**: Would you like to add a recommendation to your user profile (or project profile) that encourages new babysitter processes to integrate prompt-master when generating prompts for external AI tools?
   - Options: user profile, project profile, both, none
   - Default: none

Record the user's choices and proceed accordingly.

## Step 2: Clone the prompt-master Repository

Clone the repository to the appropriate skill directory based on the user's scope choice.

**Global install:**
```bash
mkdir -p ~/.claude/skills
git clone --depth 1 https://github.com/nidhinjs/prompt-master.git ~/.claude/skills/prompt-master
```

**Project-local install:**
```bash
mkdir -p .a5c/skills
git clone --depth 1 https://github.com/nidhinjs/prompt-master.git .a5c/skills/prompt-master
```

Verify the clone succeeded by checking that `SKILL.md` exists in the target directory:
```bash
# Global
ls ~/.claude/skills/prompt-master/SKILL.md
# OR Project-local
ls .a5c/skills/prompt-master/SKILL.md
```

## Step 3: Add CLAUDE.md Section (project-local only)

If the user chose project-local install, append the following section to the project's `CLAUDE.md` (create the file if it doesn't exist). If the user chose global install, skip this step -- global skills are discovered automatically.

```markdown

## prompt-master

The prompt-master skill is available for generating optimized prompts for 30+ AI tools.
Use it when the task involves writing, fixing, or adapting prompts for external AI tools
(Claude, ChatGPT, GPT-5.x, Cursor, Midjourney, DALL-E 3, Stable Diffusion, etc.).

Invoke with: "Write me a prompt for [tool] to [task]" or "/prompt-master [request]"
```

## Step 4: Configure UserPromptSubmit Hook (optional)

**Skip this step if the user declined the hook in Step 1.**

Create the hook script that detects prompt-generation requests and injects a nudge:

**Global install -- create at `~/.claude/prompt-master/detect-prompt-request.sh`:**
```bash
mkdir -p ~/.claude/prompt-master
cat > ~/.claude/prompt-master/detect-prompt-request.sh << 'HOOKEOF'
#!/usr/bin/env bash
# prompt-master UserPromptSubmit hook
# Reads the Claude Code UserPromptSubmit JSON payload from stdin,
# checks if the user's message matches common prompt-generation triggers,
# and appends a one-line nudge if so.

set -euo pipefail

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // .message // ""' 2>/dev/null || echo "")

# Case-insensitive match against common trigger phrases
if echo "$PROMPT" | grep -iqE '(write|create|generate|make|build|craft|optimize|fix|improve|adapt|convert|translate)\s+(a\s+|me\s+a\s+|an?\s+)?(prompt|instruction|system\s*prompt|meta.?prompt)'; then
  echo ""
  echo "[prompt-master skill is available -- consider using it for optimized, tool-specific prompt generation]"
fi
HOOKEOF
chmod +x ~/.claude/prompt-master/detect-prompt-request.sh
```

**Project-local install -- create at `.a5c/prompt-master/detect-prompt-request.sh`:**
```bash
mkdir -p .a5c/prompt-master
cat > .a5c/prompt-master/detect-prompt-request.sh << 'HOOKEOF'
#!/usr/bin/env bash
# prompt-master UserPromptSubmit hook
# Reads the Claude Code UserPromptSubmit JSON payload from stdin,
# checks if the user's message matches common prompt-generation triggers,
# and appends a one-line nudge if so.

set -euo pipefail

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // .message // ""' 2>/dev/null || echo "")

# Case-insensitive match against common trigger phrases
if echo "$PROMPT" | grep -iqE '(write|create|generate|make|build|craft|optimize|fix|improve|adapt|convert|translate)\s+(a\s+|me\s+a\s+|an?\s+)?(prompt|instruction|system\s*prompt|meta.?prompt)'; then
  echo ""
  echo "[prompt-master skill is available -- consider using it for optimized, tool-specific prompt generation]"
fi
HOOKEOF
chmod +x .a5c/prompt-master/detect-prompt-request.sh
```

Then merge the hook into `.claude/settings.json`. Read the file first, then add the `UserPromptSubmit` entry to the `hooks` object. **Preserve all existing hooks -- append, do not overwrite.**

The hook entry to add:
```json
{
  "UserPromptSubmit": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "bash <SCRIPT_PATH>"
        }
      ]
    }
  ]
}
```

Replace `<SCRIPT_PATH>` with:
- Global: `~/.claude/prompt-master/detect-prompt-request.sh`
- Project-local: `.a5c/prompt-master/detect-prompt-request.sh`

If `UserPromptSubmit` already exists in hooks (e.g., from the babysitter compression hook), append the new matcher object to the existing array rather than replacing it.

## Step 5: Add Profile Recommendation (optional)

**Skip this step if the user chose "none" in Step 1.**

Create a temporary JSON file with the partial profile merge payload, then call the babysitter CLI to merge it.

**For user profile:**
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

**For project profile:**
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

Run whichever merge commands match the user's choice (user, project, or both).

## Step 6: Register in Plugin Registry

```bash
babysitter plugin:update-registry --plugin-name prompt-master --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

If the user chose global scope in Step 1, use `--global` instead of `--project`:
```bash
babysitter plugin:update-registry --plugin-name prompt-master --plugin-version 1.0.0 --marketplace-name marketplace --global --json
```

## Post-Installation Summary

Display to the user:

```
prompt-master installed successfully.

  Skill location:  <path where cloned>
  Scope:           <global | project>
  Hook installed:  <yes | no>
  Profile updated: <user | project | both | none>

Usage:
  "Write me a prompt for [tool] to [task]"
  "Generate a Midjourney prompt for [description]"
  "Fix this prompt for GPT-4o: [paste]"
  "/prompt-master [request]"

To update: babysitter plugin:update --plugin-name prompt-master --marketplace-name marketplace --<scope> --json
To configure: babysitter plugin:configure --plugin-name prompt-master --marketplace-name marketplace --<scope> --json
```
