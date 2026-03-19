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

### 3. Build Project Profile

Write the project profile using the CLI:
```bash
echo '<profile-json>' > /tmp/project-profile.json
babysitter profile:write --project --input /tmp/project-profile.json --json
```

The profile includes:
- Project name, description, language, framework
- Build and test commands
- Quality gates configuration
- Preferred skills and agents
- CI/CD integration settings

### 4. Install Tools
- Ensure `@a5c-ai/babysitter-sdk` is in package.json
- Create `.a5c/` directory structure
- Set up `.codex/config.toml` using real Codex settings (sandbox, approval, optional notify)
- Create AGENTS.md if not present

### 5. Optional: Configure CI/CD
- Add babysitter orchestration to CI pipeline
- Set up automated quality gates
- Configure deployment hooks

### Done!

Project is ready for babysitting. Try `babysitter call ...` to start your first orchestrated workflow.

Star the repo: https://github.com/a5c-ai/babysitter
