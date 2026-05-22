# VoltAgent/awesome-agent-skills

- **Archetype**: mega-skill-pack
- **Stars**: 15,334
- **Last pushed**: 2026-04-11
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1,086+ (curated list, no SKILL.md files in repo itself)

## Summary
Curated awesome-list of 1,086+ agent skills from official development teams and the community. Unlike bulk-generated repositories, this collection is hand-picked and features official skills from Anthropic, Google Labs, Vercel, Stripe, Cloudflare, Netlify, Trail of Bits, Sentry, Expo, Hugging Face, Figma, and more. Compatible with Claude Code, Codex, Antigravity, Gemini CLI, Cursor, GitHub Copilot, and OpenCode. Maintained by the VoltAgent organization which also curates companion lists for Claude Code subagents, Codex subagents, and OpenClaw skills.

## Assessment
This is primarily a link aggregator/directory rather than a skills source itself -- the README catalogs skills hosted in other repositories. Its value is as a discovery index: it maps the entire agent skills ecosystem with direct links to source repos. The categorization scheme and quality curation ("hand-picked, not AI-slop generated") makes this useful for identifying high-value extraction targets that may not appear in GitHub search results. The companion lists (awesome-claude-code-subagents, awesome-openclaw-skills) are additional discovery surfaces.

## Extraction Priority
- Low
- Rationale: No extractable skills or processes in the repo itself -- it is a curated link directory. However, it is a high-value discovery resource for finding additional repos to research. The categorization data could feed into the babysitter catalog's process library indexing.

## Processes
- No direct process extraction -- this is a curated list, not a skills source
- The curation methodology (hand-picked, categorized by domain/vendor) could inform a `methodologies/skill-curation.js` process for evaluating and onboarding external skills

## Plugin Ideas
- **knowledge management**: Skills directory plugin that indexes and searches the awesome-agent-skills catalog, providing quick lookup of skills by category, vendor, or harness compatibility
- **workflow automation**: Skills onboarding plugin that takes a skill URL from the directory and automates installation, validation, and integration into the babysitter process library

## Patterns
- Awesome-list curation pattern with badge-based categorization
- Multi-harness compatibility matrix (Claude Code, Codex, Gemini CLI, Cursor, Copilot, OpenCode, Windsurf)
- Vendor-grouped skill organization (official team skills vs community skills)
- Companion list pattern: separate awesome-lists for subagents, OpenClaw skills, and research papers

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Skill Curation Methodology | NEW | Hand-picked skill evaluation and onboarding process | - | methodologies/skill-curation/ |
| Multi-Harness Compatibility Assessment | NEW | Cross-platform agent skill compatibility evaluation | - | specializations/shared/multi-harness-compatibility.js |
| Vendor-Based Skill Organization | NEW | Official vs community skill categorization patterns | - | specializations/shared/vendor-skill-organization.js |
| Skills Directory Management | NEW | Curated skill catalog indexing and maintenance | - | specializations/shared/skills-directory-management.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Skills Directory Browser | NEW | Index and search awesome-agent-skills catalog | - | plugins/a5c/marketplace/plugins/skills-directory-browser/ |
| Skills Onboarding Automation | NEW | Automated skill installation and validation from directory | - | plugins/a5c/marketplace/plugins/skills-onboarding-automation/ |
