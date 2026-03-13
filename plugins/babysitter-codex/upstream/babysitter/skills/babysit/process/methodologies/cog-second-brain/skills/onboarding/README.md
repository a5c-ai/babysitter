# COG Onboarding Skill

Personalize your COG Second Brain workflow through role pack selection and vault initialization.

## Quick Start

Run onboarding as the first step when setting up a new COG vault:

```bash
babysitter run:create --process methodologies/cog-second-brain/cog-orchestrator \
  --input '{"userName":"Alex","rolePack":"engineer","vaultPath":"./cog-vault","cycleMode":"setup"}'
```

## Role Packs

| Pack | Best For |
|------|----------|
| Product Manager | Product strategy, market research, stakeholder management |
| Engineering Lead | Technical architecture, team management, code quality |
| Engineer | Code, technical learning, debugging, architecture |
| Designer | UX research, design systems, user testing |
| Founder | Strategy, fundraising, hiring, product-market fit |
| Marketer | Content strategy, analytics, growth, campaigns |
| Custom | Define your own focus areas |

## Examples

- [Full setup with integrations](../../examples/full-setup-engineer.json)
- [Minimal setup](../../examples/minimal-setup.json)
