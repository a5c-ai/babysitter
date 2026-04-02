# Welcome Screen -- Install Instructions

Welcome to **Welcome Screen** -- the plugin that gives every Claude Code session a contextual landing page. When a session starts, you see a snapshot of what matters: project status, recent activity, pending work, and suggested next actions -- all tailored to the project and your role.

Everything is configured at the **project level**. The installer interviews you, researches the project, and crafts a welcome skill and session-start hook specific to this repository.

---

## Step 1: Interview the User

Before researching the project, gather these preferences:

### 1.1 Role and Focus

Ask the user:

1. **What is your role on this project?** (e.g., lead developer, contributor, reviewer, new team member onboarding, DevOps, designer)
2. **What do you primarily work on?** (e.g., backend API, frontend UI, infrastructure, testing, documentation, full-stack)
3. **What information is most useful when you start a session?** Let them pick from or expand on:
   - Recent git activity (commits, branches, PRs)
   - Open issues or TODO items
   - Test status / CI health
   - Build or deployment status
   - Project metrics (code coverage, lint warnings, bundle size)
   - Pending code reviews
   - Documentation gaps
   - Custom items (ask what)

### 1.2 Suggested Actions

Ask:

1. **What actions do you typically take at the start of a session?** Examples:
   - Check git status / pull latest changes
   - Run tests
   - Review open PRs
   - Continue work on a specific feature
   - Check CI/CD pipeline
   - Read recent commit messages to catch up
2. **Should the welcome screen suggest actions based on project state?** (e.g., "Tests are failing -- run `npm test` to investigate", "You have uncommitted changes on branch X")
   - Default: yes
3. **Should it suggest babysitter-specific actions?** (e.g., pending runs, incomplete tasks, available processes)
   - Default: yes, if babysitter is installed in the project

### 1.3 Display Preferences

Ask:

1. **How verbose should the welcome screen be?**
   - **Compact** -- 5-10 lines, key stats only, minimal decoration
   - **Standard** -- 15-25 lines, sections with headers, moderate detail
   - **Detailed** -- Full dashboard with all available information, tips, and context
   - Default: standard
2. **Should the welcome screen include a greeting or personality?** (e.g., motivational quote, project tagline, themed intro)
   - Default: no (just the facts)
   - If yes, ask what tone: professional, casual, humorous, themed (which theme?)
3. **Should it show a project logo or ASCII art header?**
   - Default: no
   - If yes, ask for the project name to render as ASCII art

### 1.4 Scope

Confirm: This plugin installs at the **project level** only. The welcome screen is tailored to this specific project. Ask which project directory to configure (default: current working directory).

---

## Step 2: Research the Project

Before crafting the welcome skill, deeply investigate the project to understand its structure, tooling, and conventions. This research drives the content of the welcome screen.

### 2.1 Repository Basics

```bash
# Project name and description
cat package.json 2>/dev/null | head -5
cat setup.py 2>/dev/null | head -10
cat Cargo.toml 2>/dev/null | head -10
cat go.mod 2>/dev/null | head -3
cat pyproject.toml 2>/dev/null | head -15

# Git info
git remote -v 2>/dev/null | head -2
git branch --show-current
git log --oneline -10
```

### 2.2 Tech Stack Detection

Examine the project to identify:

- **Language(s)**: Check file extensions, config files (tsconfig.json, setup.py, Cargo.toml, go.mod, pom.xml, etc.)
- **Framework(s)**: Check dependencies (package.json, requirements.txt, Gemfile, build.gradle, etc.)
- **Build system**: Check for Makefile, webpack.config.js, vite.config.ts, CMakeLists.txt, etc.
- **Test framework**: Check for vitest.config.ts, jest.config.js, pytest.ini, .mocharc, etc.
- **CI/CD**: Check .github/workflows/, .gitlab-ci.yml, Jenkinsfile, .circleci/, etc.
- **Package manager**: npm, yarn, pnpm, pip, cargo, go modules, maven, etc.
- **Monorepo**: Check for workspaces in package.json, lerna.json, nx.json, turbo.json, pnpm-workspace.yaml

### 2.3 Project Health Indicators

Gather data that the welcome script will display:

```bash
# Recent activity
git log --oneline --since="7 days ago" | wc -l
git shortlog --since="7 days ago" -s -n 2>/dev/null | head -5

# Branch status
git status --porcelain 2>/dev/null | wc -l
git stash list 2>/dev/null | wc -l

# Test commands (detect from scripts)
cat package.json 2>/dev/null | grep -E '"test"' | head -1
cat Makefile 2>/dev/null | grep -E '^test:' | head -1

# Open TODOs
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.js" --include="*.py" --include="*.go" --include="*.rs" -l 2>/dev/null | wc -l
```

### 2.4 Babysitter Integration

Check if babysitter is set up in this project:

```bash
# Check for babysitter artifacts
ls .a5c/ 2>/dev/null
ls .a5c/runs/ 2>/dev/null | tail -5
ls .a5c/processes/ 2>/dev/null

# Check for babysitter in dependencies
grep -l "babysitter" package.json .claude/settings.json 2>/dev/null
```

If babysitter is present, the welcome screen should include run status and available processes in its output.

### 2.5 Existing Conventions

Check for existing documentation and conventions that inform the welcome content:

```bash
# Check for instruction files
ls CLAUDE.md README.md CONTRIBUTING.md CHANGELOG.md docs/ 2>/dev/null

# Check for existing hooks or plugins
cat .claude/settings.json 2>/dev/null | head -30
ls .a5c/skills/ 2>/dev/null
```

### 2.6 Compile Research Summary

After gathering all data, compile a brief research summary. Present it to the user for confirmation:

> **Project Profile:**
> - Name: [detected]
> - Stack: [languages, frameworks]
> - Test command: [detected or "none found"]
> - CI/CD: [detected or "none"]
> - Monorepo: [yes/no, packages if yes]
> - Babysitter: [installed/not installed]
> - Recent activity: [N commits in last 7 days by M contributors]
>
> **Welcome screen will show:** [list of sections based on interview + research]
> **Suggested actions will include:** [list based on detected tooling]

Get user approval before proceeding.

---

## Step 3: Create Directory Structure

```bash
mkdir -p .a5c/skills/welcome
mkdir -p .a5c/welcome/scripts
```

---

## Step 4: Create the Welcome Script

Create `.a5c/welcome/scripts/welcome.sh` -- a shell script that gathers live project data and outputs the welcome screen.

The script should be **crafted specifically for this project** based on the research from Step 2. Do not use a generic template -- write the script to use the exact commands, paths, and tools relevant to this project.

### Script Structure

The script should:

1. **Header** -- Project name, current branch, current date/time
2. **Git Status** -- Uncommitted changes, current branch vs remote, stashes
3. **Recent Activity** -- Last N commits (configurable), active contributors
4. **Project Health** -- Test status hint (last CI run if detectable), TODO/FIXME count, lint status
5. **Suggested Actions** -- Dynamic suggestions based on current state:
   - If uncommitted changes exist: suggest committing or stashing
   - If behind remote: suggest pulling
   - If tests haven't been run recently: suggest running tests
   - If on a feature branch: suggest checking PR status
   - If babysitter runs exist: show pending/recent run status
6. **Quick Commands** -- A cheat sheet of project-specific commands (test, build, lint, deploy) detected from the project

### Script Guidelines

- Output plain text with light formatting (dashes, pipes, indentation) -- no ANSI colors (hooks run in non-TTY context)
- Keep it fast -- the script runs on every session start, so avoid slow operations (no `npm test`, no network calls)
- Use `git` commands liberally -- they're fast and informative
- Respect the user's verbosity preference from Step 1
- Exit 0 always -- a welcome screen failure should never block a session

### Example Script (Standard verbosity, Node.js project)

```bash
#!/bin/bash
# Welcome Screen -- [Project Name]
# Generated by welcome plugin installer

set -euo pipefail

# ── Header ──────────────────────────────────────────
PROJECT="[Project Name]"
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
DATE=$(date "+%Y-%m-%d %H:%M")

echo ""
echo "  $PROJECT | $BRANCH | $DATE"
echo "  ────────────────────────────────────────────────"

# ── Git Status ──────────────────────────────────────
CHANGES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
STASHES=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
AHEAD=$(git rev-list --count @{upstream}..HEAD 2>/dev/null || echo "?")
BEHIND=$(git rev-list --count HEAD..@{upstream} 2>/dev/null || echo "?")

echo ""
echo "  Git: ${CHANGES} uncommitted | ${STASHES} stashed | +${AHEAD}/-${BEHIND} vs remote"

# ── Recent Commits ──────────────────────────────────
echo ""
echo "  Recent:"
git log --oneline -5 2>/dev/null | sed 's/^/    /'

# ── Health ──────────────────────────────────────────
TODOS=$(grep -r "TODO\|FIXME" --include="*.ts" --include="*.js" -l 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "  Health: ${TODOS} files with TODOs"

# ── Suggested Actions ───────────────────────────────
echo ""
echo "  Suggested actions:"
if [ "$CHANGES" -gt 0 ]; then
  echo "    - You have uncommitted changes -- review with 'git diff' or commit"
fi
if [ "$BEHIND" != "?" ] && [ "$BEHIND" -gt 0 ]; then
  echo "    - Branch is ${BEHIND} commits behind remote -- consider 'git pull'"
fi
echo "    - Run tests: npm test"
echo "    - Check lint: npm run lint"

# ── Quick Commands ──────────────────────────────────
echo ""
echo "  Commands: test='npm test' | build='npm run build' | lint='npm run lint'"
echo ""

exit 0
```

**Important:** This is only an *example*. The actual script must be customized based on:
- The detected tech stack (use `cargo test` for Rust, `pytest` for Python, etc.)
- The user's verbosity preference
- The sections the user requested
- Whether babysitter integration was detected
- Any custom items the user mentioned

If the user requested a greeting or ASCII art header, include that in the script header section.

---

## Step 5: Create the Welcome Skill

Create `.a5c/skills/welcome/SKILL.md` with the following structure:

```markdown
---
name: welcome
description: Show the project welcome screen with status, recent activity, and suggested next actions. Use when the user types /welcome or asks to see the project dashboard / status overview.
---

# Welcome

Display the project welcome screen.

## Usage

Run the welcome script to see current project status and suggested actions:

` ``bash
bash .a5c/welcome/scripts/welcome.sh
` ``

## What It Shows

[List the sections configured during install, e.g.:]
- Current branch and git status
- Recent commits
- Project health indicators
- Suggested next actions based on current state
- Quick command reference

## Customization

Edit `.a5c/welcome/scripts/welcome.sh` to modify what the welcome screen displays.
Edit `.a5c/welcome/config.json` for settings like verbosity and enabled sections.
```

Adjust the description and "What It Shows" section based on the actual configuration from the interview.

---

## Step 6: Create Configuration

Write `.a5c/welcome/config.json` recording the user's preferences and detected project info:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "[detected project name]",
    "stack": "[detected stack summary]",
    "testCommand": "[detected test command]",
    "buildCommand": "[detected build command]",
    "lintCommand": "[detected lint command]"
  },
  "preferences": {
    "verbosity": "standard",
    "greeting": false,
    "greetingTone": null,
    "asciiArt": false,
    "suggestActions": true,
    "suggestBabysitter": true
  },
  "sections": {
    "header": true,
    "gitStatus": true,
    "recentActivity": true,
    "projectHealth": true,
    "suggestedActions": true,
    "quickCommands": true,
    "babysitterStatus": false
  }
}
```

Fill in all values based on the interview (Step 1) and research (Step 2).

---

## Step 7: Configure Session-Start Hook

Read the existing `.claude/settings.json` first, then **merge** the session-start hook. Preserve all existing hooks and settings.

Add a `SessionStart` hook entry that runs the welcome script:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .a5c/welcome/scripts/welcome.sh"
          }
        ]
      }
    ]
  }
}
```

### Merging rules

- If `hooks` already exists, add entries to the existing object (don't overwrite)
- If `SessionStart` already has entries (e.g., babysitter session-start hook), **append** the welcome hook entry to the array
- The welcome hook should run **before** other session-start hooks if possible (place it first in the array) so the user sees the dashboard immediately

---

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name welcome --plugin-version 1.0.0 --marketplace-name babysitter --project --json
```

---

## Step 9: Verify

Test the welcome screen by running the script directly:

```bash
bash .a5c/welcome/scripts/welcome.sh
```

Verify:
1. The script exits cleanly (exit code 0)
2. Output is readable and correctly formatted
3. Git information is accurate
4. Suggested actions reflect the current project state
5. All sections the user requested are present
6. No errors or warnings in output

Then test the skill:
```bash
# The /welcome skill should now be discoverable
ls .a5c/skills/welcome/SKILL.md
```

Finally, verify the session-start hook is registered:
```bash
cat .claude/settings.json | grep -A5 "welcome"
```

Present the welcome screen output to the user and ask if they want any adjustments before finalizing.

---

## Step 10: Post-Install Summary

Show the user what was installed:

```
Welcome Screen installed successfully.

Files created:
  .a5c/skills/welcome/SKILL.md     -- /welcome skill definition
  .a5c/welcome/scripts/welcome.sh  -- welcome screen script
  .a5c/welcome/config.json         -- configuration and preferences

Hooks configured:
  SessionStart -> bash .a5c/welcome/scripts/welcome.sh

Usage:
  - The welcome screen appears automatically at the start of each session
  - Type /welcome to show it again at any time
  - Edit .a5c/welcome/scripts/welcome.sh to customize the content
  - See /babysitter:plugins configure welcome for more options
```
