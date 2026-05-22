# googleworkspace/cli

- **Archetype**: domain-skill-pack
- **Stars**: 24,477
- **Last pushed**: 2026-04-08
- **License**: Apache-2.0
- **Discovered**: 2026-04-12
- **Source**: gh-search (topic: agent-skills)
- **Skills found**: 20+

## Summary
Official Google Workspace CLI tool with 200+ commands and 19+ AI agent skills. Written in Rust, dynamically built from Google Discovery Service. Skills are organized into: service skills (gws-docs, gws-sheets, gws-calendar, gws-gmail, gws-chat, gws-drive, gws-script, gws-classroom, gws-modelarmor), persona skills (project-manager, IT-admin, customer-support, content-creator), and recipe/workflow skills (standup-report, weekly-digest, file-announce, share-doc-and-notify, etc.).

## Assessment
HIGH VALUE for domain-specific process extraction. The persona skills (project-manager, IT-admin, customer-support, content-creator) contain workflow procedures that map to specializations/business/. The recipe skills demonstrate composable workflow patterns. The skill architecture (service skills as primitives, personas as compositions, recipes as workflows) is an excellent design pattern.

## Extraction Priority
HIGH -- Persona workflow patterns are directly extractable:
- persona-project-manager -> specializations/business/project-management
- persona-it-admin -> specializations/business/it-administration
- persona-customer-support -> specializations/business/customer-support
- Recipe composition pattern -> methodologies/ (skill composition methodology)

## Processes
1. **project-management-workflow** -- Weekly digest -> task tracking -> artifact sharing -> standup reporting cycle
2. **customer-support-triage** -- Email triage -> categorization -> response drafting -> escalation workflow
3. **content-creation-pipeline** -- Ideation -> draft in Docs -> review cycle -> publish/announce
4. **it-admin-audit** -- User audit -> permission review -> security compliance checks
5. **skill-composition-pattern** -- Meta-pattern: service primitives -> persona compositions -> recipe workflows

## Plugin Ideas
- **google-workspace-bridge plugin**: Babysitter plugin that wraps gws CLI commands as task definitions for Google Workspace automation within orchestrated processes

## Implicit Procedural Knowledge
- Three-tier skill architecture: primitives (API wrappers) -> personas (domain compositions) -> recipes (specific workflows)
- `--dry-run` pattern before write operations
- OpenClaw metadata format for skill categorization and dependency declaration
- Auto-discovery of CLI help as skill documentation

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Project Management Workflow | NEW | Weekly digest, task tracking, artifact sharing cycle | - | specializations/business/project-management-workflow.js |
| Customer Support Triage | NEW | Email triage, categorization, response drafting workflow | - | specializations/business/customer-support-triage.js |
| Content Creation Pipeline | NEW | Ideation, drafting, review, publish workflow | - | specializations/business/content-creation-pipeline.js |
| IT Admin Audit | NEW | User audit, permission review, compliance checks | - | specializations/business/it-admin-audit.js |
| Skill Composition Pattern | NEW | Three-tier skill architecture methodology | - | methodologies/skill-composition-pattern/ |
| Three-Tier Skill Architecture | NEW | Service primitives → personas → recipes pattern | - | specializations/shared/three-tier-architecture.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Google Workspace Bridge | NEW | Google Workspace automation within orchestrated processes | - | plugins/a5c/marketplace/plugins/google-workspace-bridge/ |
