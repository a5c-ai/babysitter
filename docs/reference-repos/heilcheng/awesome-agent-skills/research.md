# heilcheng/awesome-agent-skills

- **Archetype**: awesome-list
- **Stars**: 3,921
- **Last pushed**: 2026-04-05
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 0

## Summary

A community-curated awesome-list of agent skills, tutorials, and guides. Maintained by Hailey Cheng with a companion website at agent-skill.co. Multi-language README (EN, ZH-CN, ZH-TW, JA, KO, ES). Covers official skill directories, community skills, quality standards, and compatible agents (Claude Code, Codex, Copilot, Gemini CLI, Cursor, Antigravity, etc.). Does not contain SKILL.md files itself -- it is a directory/index pointing to external skill repos.

## Assessment

Primarily valuable as a discovery surface and competitive intelligence source. The curated categorization (AI Platforms, Cloud & Infrastructure, Developer Tools, Google Ecosystem, Business/Productivity, Security, Vector Databases, Marketing, Context Engineering) maps well to babysitter plugin/specialization domains. The quality standards section and compatible-agent matrix are useful references for skill authoring guidelines.

## Extraction Priority
- Low
- Rationale: No executable skills or processes to extract. Value is as a discovery feed for the `assimilate-popular-workflows` and `catalog-babysitter-users` skills, and as a reference for how the broader ecosystem categorizes agent skills.

## Processes

None directly extractable. The categorization taxonomy could inform process library organization.

## Plugin Ideas

- **Skill Discovery Feed plugin**: Periodically scrape awesome-list repos (like this one) to surface new skills for assimilation into the babysitter process library. Category: knowledge management.

## Patterns

- Multi-language README pattern for international reach
- Awesome-list as skill discovery hub with companion website
- Quality standards section defining what makes a good skill (useful reference for babysitter skill validation)

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Skill Categorization Taxonomy | NEW | Domain categorization system for agent skills and processes | - | specializations/shared/skill-categorization-taxonomy.js |
| Quality Standards Assessment | NEW | Skill quality evaluation criteria and validation methodology | - | specializations/shared/quality-standards-assessment.js |
| Multi-Platform Compatibility Matrix | NEW | Agent compatibility assessment and cross-platform validation | - | specializations/shared/multi-platform-compatibility-matrix.js |
| Skill Discovery Feed Management | NEW | Automated discovery and curation of external skill repositories | - | specializations/shared/skill-discovery-feed-management.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Skill Discovery Feed | NEW | Automated scraping of awesome-list repos for new skill discovery | - | plugins/a5c/marketplace/blueprints/skill-discovery-feed/ |
