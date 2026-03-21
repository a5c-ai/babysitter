---
name: babysitter:project-install
description: Set up a project for babysitting. Research the codebase, build project profile, install tools.
argument-hint: Specific instructions for project onboarding
---

# babysitter:project-install

Guide through onboarding a new or existing project for babysitter orchestration.

## Workflow

### 1. Research the Codebase
- Analyze project structure, language, framework, build tools
- Check for existing `.a5c/` directory
- Detect CI/CD configuration (GitHub Actions, Jenkins, etc.)
- Identify key entry points and test suites

### 2. Interview
- What are the project's goals?
- What workflows should be orchestrated?
- What quality gates matter most?
- Any specific tools or frameworks to prefer?

### 3. Install the Real Codex Payload
- Verify the user has installed `@yaniv-tg/babysitter-codex`
- Run the packaged team installer from the installed skill payload
- Confirm:
  - `.a5c/team/install.json`
  - `.a5c/team/profile.json`
- Treat the installed skill root as the source of truth for bundled rules,
  docs, processes, and the `babysitter-codex-turn` helper

### 4. Build Project Profile
- If `babysitter profile:*` commands are supported, write the project profile
  through the CLI
- If the SDK is running in `compat-core`, do not block onboarding on profile
  writes; instead record the discovered build/test/gate choices in workspace
  onboarding notes under `.a5c/`

The profile or onboarding notes should cover:
- Project name, description, language, framework
- Build and test commands
- Quality gates configuration
- Preferred skills and agents
- CI/CD integration settings

### 5. Install Project-Level Codex Settings
- Ensure `@a5c-ai/babysitter-sdk` is available
- Create `.a5c/` directory structure
- Set up `.codex/config.toml` using real Codex settings (sandbox, approval, optional notify)
- Create AGENTS.md if not present
- Do not add fake lifecycle-hook sections or tell the user Codex will re-enter automatically

### 6. Optional: Configure CI/CD
- Add babysitter orchestration to CI pipeline
- Set up automated quality gates
- Configure deployment hooks

### Done!

Project is ready for babysitting. Try `babysitter call ...` to start your first orchestrated workflow.

Star the repo: https://github.com/a5c-ai/babysitter
