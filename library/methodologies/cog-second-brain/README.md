# COG Second Brain

A self-evolving second brain system combining AI agents with markdown files and version control. COG = Cognition + Obsidian + Git.

**Source:** [COG Second Brain](https://github.com/huytieu/COG-second-brain) by Huy Tieu

## Overview

COG Second Brain is a privacy-first, local-first knowledge management methodology that uses pure markdown files with Git version control. It provides a structured evolution cycle from daily capture through monthly knowledge consolidation, personalized through role packs.

## Process Files

| Process | File | Description |
|---------|------|-------------|
| Main Orchestrator | `cog-orchestrator.js` | Full lifecycle: setup, onboarding, daily/weekly/monthly cycles |
| Knowledge Capture | `cog-knowledge-capture.js` | Braindump, URL dump, meeting transcript processing |
| Intelligence Cycle | `cog-intelligence-cycle.js` | Daily brief, team brief, comprehensive analysis |
| Reflection & Synthesis | `cog-reflection-synthesis.js` | Weekly check-in, knowledge consolidation, monthly synthesis |
| Vault Management | `cog-vault-management.js` | Update COG, self-healing, cross-reference maintenance |

## Agents

| Agent | Role |
|-------|------|
| vault-architect | Vault structure design and maintenance |
| knowledge-curator | Content classification and curation |
| intelligence-analyst | News and source verification |
| team-synthesizer | Cross-platform integration |
| reflection-coach | Pattern analysis and reflection |
| framework-builder | Knowledge consolidation |
| meeting-analyst | Transcript processing |
| role-advisor | Role pack customization |

## Skills

| Skill | Purpose |
|-------|---------|
| onboarding | Initial vault setup and role pack configuration |
| braindump-capture | Raw thought capture with domain classification |
| daily-intelligence | Personalized verified news briefs |
| url-extraction | URL insight extraction with credibility scoring |
| weekly-reflection | Cross-domain pattern analysis |
| knowledge-consolidation | Framework building from scattered notes |
| team-intelligence | Cross-platform team briefs |
| meeting-processing | Transcript to decisions and action items |

## Vault Structure

```
cog-vault/
  00-inbox/        # Profiles, interests, integrations
  01-daily/        # Briefs & check-ins
  02-personal/     # Private braindumps
  03-professional/ # Professional notes & strategy
  04-projects/     # Per-project tracking
  05-knowledge/    # Consolidated frameworks
```

## Evolution Cycle

1. **Daily capture** - Braindump raw thoughts, classify by domain
2. **Daily intelligence** - Personalized verified news
3. **Daily team sync** - Cross-reference GitHub/Linear/Slack/PostHog
4. **Meeting processing** - Extract structured decisions/action items
5. **Weekly reflection** - Pattern analysis across domains
6. **Weekly deep-dive** - Comprehensive strategic analysis
7. **Monthly synthesis** - Scattered notes become consolidated frameworks

## Role Packs

Product Manager, Engineering Lead, Engineer, Designer, Founder, Marketer, Custom

## Key Principles

- No vendor lock-in (pure markdown + Git)
- Privacy-first, local-first
- 7-day freshness on intelligence sources
- 95%+ source accuracy
- Strict domain separation
- Self-healing cross-references
- Content-safe updates (framework separates from personal data)

## Quick Start

```bash
# Initialize vault and onboard
babysitter run:create --process methodologies/cog-second-brain/cog-orchestrator \
  --input '{"userName":"Alex","rolePack":"engineer","cycleMode":"setup"}'

# Daily cycle
babysitter run:create --process methodologies/cog-second-brain/cog-orchestrator \
  --input '{"userName":"Alex","rolePack":"engineer","cycleMode":"daily"}'

# Weekly cycle
babysitter run:create --process methodologies/cog-second-brain/cog-orchestrator \
  --input '{"userName":"Alex","rolePack":"engineer","cycleMode":"weekly"}'

# Full lifecycle
babysitter run:create --process methodologies/cog-second-brain/cog-orchestrator \
  --input '{"userName":"Alex","rolePack":"engineer","cycleMode":"full"}'
```
