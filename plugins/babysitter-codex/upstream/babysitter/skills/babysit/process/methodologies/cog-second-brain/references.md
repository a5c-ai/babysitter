# References

## Source Attribution

The COG Second Brain babysitter process definitions are adapted from the COG Second Brain open-source project.

- **Repository:** https://github.com/huytieu/COG-second-brain
- **Author:** Huy Tieu
- **License:** See source repository for license terms

## COG Second Brain Components Referenced

### Vault Structure (from repository documentation)
- `00-inbox/` - Profiles, interests, integrations
- `01-daily/` - Briefs & check-ins
- `02-personal/` - Private braindumps
- `03-professional/` - Professional notes & strategy
- `04-projects/` - Per-project tracking
- `05-knowledge/` - Consolidated frameworks

### Core Skills Referenced (10 skills)

#### Personal Skills (7)
1. **onboarding** - Personalize workflow (run first)
2. **braindump** - Capture raw thoughts with classification
3. **daily-brief** - News intelligence (7-day freshness, verification-first)
4. **url-dump** - Save URLs with auto-extracted insights
5. **weekly-checkin** - Cross-domain pattern analysis
6. **knowledge-consolidation** - Build frameworks from scattered notes
7. **update-cog** - Framework updates (preserves user content)

#### Team Skills (3)
8. **team-brief** - Cross-reference GitHub+Linear+Slack+PostHog with bidirectional sync
9. **meeting-transcript** - Process recordings into decisions, action items, team dynamics
10. **comprehensive-analysis** - Deep 7-day analysis for planning (~8-12 min)

### Role Packs Referenced (7)
- Product Manager
- Engineering Lead
- Engineer
- Designer
- Founder
- Marketer
- Custom

### Quality Patterns Referenced
- Sources required, 7-day freshness, confidence levels
- Verification-First with sourced intelligence
- 95%+ source accuracy, strict domain separation
- Self-Healing: rename/restructure auto-updates cross-references

### Key Concepts Referenced
- No vendor lock-in (pure markdown + Git)
- Multi-agent support (Claude, Kiro, Gemini, Codex)
- Content-safe updates (framework separates from personal data)
- Privacy-first, local-first
- Role-based context switching via role packs

## Adaptation Notes

This babysitter adaptation translates COG Second Brain concepts into the babysitter SDK process definition format:
- COG skills become `kind: 'agent'` tasks with agent-specific instructions
- COG vault operations become process functions with `ctx.task()` calls
- COG quality patterns become quality-gated convergence loops (`while score < targetQuality`)
- COG role packs become configurable input parameters
- COG cross-reference maintenance becomes self-healing vault management
- Human review gates use `ctx.breakpoint()` for approval checkpoints
- Parallel operations (daily capture + intelligence + team sync) use `ctx.parallel.all()`
- COG evolution cycle (daily/weekly/monthly) maps to orchestrator phases
