# agentskills/agentskills

- **Archetype**: methodology-repo
- **Stars**: 15,904
- **Last pushed**: 2026-04-10
- **License**: Apache-2.0
- **Discovered**: 2026-04-12
- **Skills found**: 0 (specification repo, no SKILL.md files)

## Summary
The official Agent Skills specification and documentation repository maintained by the agentskills organization. Defines the SKILL.md format, client implementation guidelines, and the overall skills ecosystem standard. Contains specification docs, a Python SDK reference implementation (`skills-ref/`), and client implementation guides. This is the standards body, not a skills collection.

## Assessment
Critical reference for understanding the agent skills specification that all other repos implement. The specification defines the SKILL.md format, metadata schema, and client integration contracts. The Python reference implementation in `skills-ref/` provides validation patterns. The client implementation docs explain how harnesses should discover, load, and execute skills -- directly relevant to babysitter's harness adapter layer and skill:discover command.

## Extraction Priority
- Medium
- Rationale: No extractable skills or processes, but the specification itself is essential reference material for babysitter's skill discovery and execution infrastructure. The client implementation guide should inform harness adapter improvements.

## Processes
- No direct process extraction -- this is a specification, not a skills collection
- The specification's skill lifecycle (discover -> load -> validate -> execute) could inform a `methodologies/skill-lifecycle-validation.js` process for validating skill packs

## Plugin Ideas
- **DevX**: Skill validator plugin that validates SKILL.md files against the official agentskills specification, checking frontmatter schema, required fields, and tool declarations
- **workflow automation**: Skill conformance checker plugin that audits installed skills for spec compliance and reports deviations

## Patterns
- YAML frontmatter specification with required fields: `name`, `description`; optional: `license`, `allowed-tools`, `metadata`
- Client implementation pattern: discovery via filesystem walk, SKILL.md parsing, tool permission gating
- Python reference implementation using standard packaging (pyproject.toml, uv.lock)
- Mintlify-based documentation (docs.json, .mdx files) for the specification website at agentskills.io

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Skill Lifecycle Validation | NEW | Discover → load → validate → execute skill processing workflow | - | methodologies/skill-lifecycle-validation/ |
| Agent Skills Specification Compliance | NEW | SKILL.md frontmatter and format validation against official spec | - | specializations/shared/agent-skills-spec-compliance.js |
| Skill Discovery and Loading Patterns | NEW | Filesystem-based skill discovery with permission gating | - | specializations/shared/skill-discovery-loading-patterns.js |
| Tool Permission Gating | NEW | Skill tool declaration validation and permission management | - | specializations/shared/tool-permission-gating.js |
| SKILL.md Format Validation | NEW | YAML frontmatter and content validation for skill files | - | specializations/shared/skill-md-format-validation.js |
| Client Implementation Guidelines | NEW | Harness client implementation patterns for skill integration | - | specializations/shared/client-implementation-guidelines.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Skill Validator | NEW | Validate SKILL.md files against official agentskills specification | - | plugins/a5c/marketplace/blueprints/skill-validator/ |
| Skill Conformance Checker | NEW | Audit installed skills for specification compliance and report deviations | - | plugins/a5c/marketplace/blueprints/skill-conformance-checker/ |
