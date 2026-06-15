# TanStack/cli

- **Archetype**: utility-with-skill
- **Stars**: 1,229
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 5

## Summary
Official TanStack CLI for project scaffolding, MCP server, and agent skills installation. 5 skills covering the TanStack app lifecycle: create-app-scaffold (deterministic `tanstack create` command construction), choose-ecosystem-integrations, add-addons-existing-app, maintain-custom-addons-dev-watch, and query-docs-library-metadata. The create-app-scaffold skill is notable for its focus on deterministic, non-interactive command construction with flag compatibility rules and common mistake documentation. Version-pinned to library_version 0.62.1.

## Assessment
LOW-MEDIUM VALUE for process extraction. The skills are TanStack-ecosystem-specific (React/Solid scaffolding with TanStack Router/Query/etc.). However, the create-app-scaffold skill demonstrates a valuable pattern: encoding CLI flag compatibility rules and common mistakes into a skill that constructs commands deterministically. The `type: core` and `library_version` metadata in the skill frontmatter show how to version-pin skills to specific tool versions. The five skills together form a complete app lifecycle: create -> choose integrations -> add addons -> maintain -> query docs.

## Extraction Priority
- Low
- Rationale: TanStack-ecosystem-specific content with limited cross-domain applicability. The deterministic command construction pattern and version-pinned skill metadata are the only transferable elements.

## Processes
- **Deterministic CLI Scaffolding**: Analyze user intent -> select compatible flags (framework, toolchain, deployment, add-ons) -> validate flag combinations -> construct non-interactive command -> execute. A reusable pattern for any CLI wrapper skill.
- **App Lifecycle Skills Suite**: Create -> integrate -> addon -> maintain -> query. Five skills covering the full lifecycle of a framework-specific application.

## Plugin Ideas
- **CLI Command Builder plugin**: A generic babysitter marketplace plugin for encoding CLI flag compatibility rules and generating deterministic commands. Install.md would configure which CLIs to wrap and their flag compatibility matrices.

## Patterns
- **Deterministic command construction**: Build CLI commands by validating flag compatibility before execution, not after. Prevent invalid flag combinations at construction time.
- **Version-pinned skills**: `library_version: "0.62.1"` in skill frontmatter. Skills explicitly declare which version of external tools they are compatible with. Prevents version drift.
- **Common mistakes documentation**: Dedicated section listing what NOT to do with specific examples. Negative examples are often more instructive than positive ones.
- **Skill type taxonomy**: `type: core` distinguishes essential skills from optional ones within a collection. A simple but useful categorization.
- **Non-interactive defaults**: `-y` flag pattern for CI/automation compatibility. Skills should prefer deterministic, non-interactive execution paths.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Deterministic CLI Scaffolding | NEW | Analyze intent → validate flag compatibility → construct non-interactive command | - | specializations/shared/deterministic-cli-scaffolding.js |
| App Lifecycle Skills Suite | NEW | Complete app lifecycle pattern: create → integrate → addon → maintain → query | - | specializations/shared/app-lifecycle-skills-suite.js |
| CLI Command Compatibility Validation | NEW | Flag compatibility matrix validation for CLI command construction | - | specializations/shared/cli-command-compatibility-validation.js |
| Version-Pinned Skill Management | NEW | Skill versioning and compatibility management for external tools | - | specializations/shared/version-pinned-skill-management.js |
| Framework Scaffolding Patterns | NEW | Generic framework project scaffolding with ecosystem integration | - | specializations/shared/framework-scaffolding-patterns.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| CLI Command Builder | NEW | Generic CLI wrapper with flag compatibility rules and deterministic command generation | - | plugins/a5c/marketplace/blueprints/cli-command-builder/ |
