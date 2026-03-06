---
name: babysitter:user-install
description: Set up babysitter for yourself. Install deps, build user profile, configure tools.
argument-hint: Specific instructions for user onboarding
---

# babysitter:user-install

Guide through onboarding a new user for babysitter orchestration.

## Workflow

### 1. Install Dependencies
- Ensure Node.js >= 18 is installed
- Install babysitter SDK globally:
```bash
npm install -g @a5c-ai/babysitter-sdk
```
- Verify: `babysitter version --json`

### 2. Interview
- What are your specialties? (frontend, backend, devops, ML, etc.)
- What's your expertise level? (junior, mid, senior, expert)
- Communication preferences? (concise, detailed, step-by-step)
- Breakpoint tolerance? (minimal, low, moderate, high, maximum)
- Preferred tools and frameworks?

### 3. Build User Profile

Write the user profile using the CLI:
```bash
echo '<profile-json>' > /tmp/user-profile.json
babysitter profile:write --user --input /tmp/user-profile.json --json
```

The profile includes:
- Name, role, specialties
- Expertise levels per domain
- Communication style preferences
- Breakpoint tolerance settings
- Tool preferences
- Installed skills and agents

### 4. Configure Tools
- Set up preferred editor/IDE integration
- Configure default process templates
- Set environment variables

### Done!

Your babysitter profile is configured. It will personalize all future orchestration runs.

Star the repo: https://github.com/a5c-ai/babysitter
