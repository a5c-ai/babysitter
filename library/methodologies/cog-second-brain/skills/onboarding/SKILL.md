---
name: cog-onboarding
description: Personalize COG Second Brain workflow through role pack selection and vault initialization
allowed-tools:
  - file-read
  - file-write
  - directory-create
  - git-init
  - git-commit
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Configure one of 7 role packs: Product Manager, Engineering Lead, Engineer, Designer, Founder, Marketer, Custom
- Set up user profile with interests, domains, and news sources
- Configure external integrations (GitHub, Linear, Slack, PostHog)
- Create personalized workflow templates based on role
- Initialize Git tracking for the vault

## Tool Use Instructions

1. Use `file-read` to check for existing vault at the specified path
2. Use `directory-create` to build the COG directory structure
3. Use `file-write` to create profile.md in 00-inbox with role pack configuration
4. Use `git-init` to initialize Git repository in the vault
5. Use `file-write` to create .gitignore with privacy-sensitive patterns
6. Use `git-commit` to commit initial vault structure

## Examples

```json
{
  "userName": "Alex",
  "rolePack": "engineer",
  "vaultPath": "./cog-vault",
  "integrations": {
    "github": { "org": "my-org", "repos": ["main-repo"] }
  }
}
```
