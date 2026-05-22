# anthropics/skills

- **Archetype**: mega-skill-pack
- **Stars**: 115,745
- **Last pushed**: 2026-04-09
- **License**: No explicit license (partial Apache-2.0 per skill)
- **Discovered**: 2026-04-12
- **Skills found**: 17

## Summary
Official Anthropic skills repository and the canonical reference for Claude Code agent skills. Contains 17 first-party skills covering document generation (pdf, docx, xlsx, pptx), frontend design, MCP server building, webapp testing, algorithmic art, skill creation, brand guidelines, and more. This is the highest-starred agent skills repo on GitHub by a wide margin (115k+).

## Assessment
This is the upstream source for the agent skills standard. The MCP builder skill is directly relevant to babysitter's MCP integration surface. The skill-creator meta-skill provides patterns for programmatic skill generation. Frontend-design, webapp-testing, and doc-coauthoring skills map to babysitter process specializations. The template/SKILL.md defines the canonical skill format that all other repos follow.

## Extraction Priority
- High
- Rationale: Canonical skill definitions from the platform vendor. The MCP builder skill pattern is directly applicable to babysitter's mcp:serve surface. Document generation skills (pdf/docx/xlsx/pptx) are high-value specializations. The skill-creator meta-skill pattern could inform babysitter's process-builder skill.

## Processes
- `mcp-server-development` -- Multi-phase MCP server creation workflow (research, design, implement, test) extractable as `specializations/devx/mcp-server-development.js`
- `document-generation` -- PDF/DOCX/XLSX/PPTX generation workflows extractable as `specializations/business/document-generation.js`
- `frontend-design-review` -- Frontend design quality assessment extractable as `specializations/devx/frontend-design.js`
- `webapp-testing` -- End-to-end webapp testing workflow extractable as `specializations/devx/webapp-testing.js`
- `skill-scaffolding` -- Meta-process for creating new skills, relevant to process-builder

## Plugin Ideas
- **DevX**: MCP server builder plugin that scaffolds MCP servers following Anthropic's canonical patterns, with test harness generation
- **tools integration**: Document generation plugin wrapping pdf/docx/xlsx/pptx skills into a unified document factory with template support
- **QA & testing**: Webapp testing plugin that orchestrates Playwright-based visual and functional testing following the webapp-testing skill pattern
- **theming**: Brand guidelines enforcement plugin that validates UI output against configurable brand standards

## Patterns
- Phased workflow pattern: skills consistently follow Discovery -> Analysis -> Implementation -> Verification phases
- YAML frontmatter with `name`, `description`, `license`, optional `allowed-tools` and `metadata` fields
- Template-driven skill creation via `template/SKILL.md` -- defines the canonical skill format
- Skills are self-contained markdown with no external dependencies beyond specified tools

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| MCP Server Development | NEW | Multi-phase MCP server creation workflow | - | specializations/devops-sre-platform/mcp-server-development.js |
| Document Generation | NEW | PDF/DOCX/XLSX/PPTX generation workflows | - | specializations/business/document-generation.js |
| Frontend Design Review | NEW | Frontend design quality assessment | - | specializations/frontend/frontend-design-review.js |
| Webapp Testing | NEW | End-to-end webapp testing workflow | - | specializations/frontend/webapp-testing.js |
| Skill Scaffolding | UPGRADE | Meta-process for creating new skills | library/methodologies/superpowers/using-superpowers.js | specializations/shared/skill-scaffolding.js |
| Phased Workflow Pattern | NEW | Discovery-Analysis-Implementation-Verification pattern | - | specializations/shared/phased-workflow.js |
| Brand Guidelines Enforcement | NEW | UI validation against brand standards | - | specializations/frontend/brand-guidelines.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| DevX MCP Builder | NEW | MCP server scaffolding with test harness | - | plugins/a5c/marketplace/plugins/mcp-builder/ |
| Document Factory | NEW | Unified document generation with templates | - | plugins/a5c/marketplace/plugins/document-factory/ |
| Webapp Testing | NEW | Playwright-based visual and functional testing | - | plugins/a5c/marketplace/plugins/webapp-testing/ |
| Brand Guidelines Enforcer | NEW | UI validation against brand standards | - | plugins/a5c/marketplace/plugins/brand-enforcer/ |
