---
name: babysitter:project-install
description: Set up a project for babysitting. Research the codebase, build project profile, install tools.
argument-hint: Specific instructions for project onboarding
---

# babysitter:project-install

Guide through onboarding a new or existing project for Babysitter orchestration.

## Workflow

### 1. Research the Codebase
- Analyze project structure, language, framework, build tools
- Check for existing `.a5c/` and `.codex/`
- Detect CI/CD configuration
- Identify key entry points and test suites

### 2. Interview
- What workflows should be orchestrated?
- What quality gates matter most?
- Any harness, model, or tool preferences to preserve?

### 3. Install the Real Codex Payload
- Verify the user has installed `@a5c-ai/babysitter-sdk`
- Verify the user has installed `@a5c-ai/babysitter-codex`
- Run `babysitter harness:install-plugin codex --workspace <repo>`
- Confirm:
  - `.codex/hooks.json`
  - `.codex/config.toml`
  - `.a5c/team/install.json`
  - `.a5c/active/process-library.json`

Treat the installed skill root as the source of truth for Codex-facing assets
only: hooks, skills, commands, and installer scripts. Treat the active
process-library binding as the source of truth for process content.

### 4. Build Project Profile
- Prefer `babysitter profile:*` CLI commands for project profile work
- Capture build/test/gate choices in the project profile or `.a5c` notes

The profile should cover:
- project name, description, language, framework
- build and test commands
- quality gates configuration
- preferred skills and agents
- CI/CD integration settings

### 5. Install Project-Level Codex Settings
- Ensure `.codex/hooks.json` points at the installed hook scripts
- Ensure `.codex/config.toml` contains the required Codex features and writable roots
- Ensure `.a5c` contains active process-library binding state
- Do not add a fake plugin manifest, command catalog, or external supervisor loop

### 6. Optional: Configure CI/CD
- Add Babysitter orchestration to CI pipelines where relevant
- Add verification or artifact capture around the native/internal harness

### Done

Project is ready for babysitting. Try `babysitter call ...` to start the first
orchestrated workflow.
