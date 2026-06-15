# supabase/agent-skills

- **GitHub**: https://github.com/supabase/agent-skills
- **Stars**: 1,925
- **License**: MIT
- **Last pushed**: 2026-04-09
- **Topics**: ai, ai-agents, skills, supabase
- **Source**: gh-search

## Description

Official Supabase agent skills for AI-assisted development. Provides 2 skills covering all Supabase products (Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues) and Postgres performance best practices. Compatible with 18+ AI agents. Packaged as both Agent Skills (agentskills.io) and Claude Code marketplace plugin.

## Archetype

**claude-plugin** -- Ships as a Claude Code marketplace plugin (`.claude-plugin/marketplace.json`) with 2 plugins: `supabase` and `postgres-best-practices`. Also installable via `npx skills add`.

## Structure

- `.claude-plugin/marketplace.json` -- Claude Code marketplace manifest (name: `supabase-agent-skills`)
- `skills/supabase/SKILL.md` -- Comprehensive Supabase development skill
- `skills/supabase-postgres-best-practices/SKILL.md` -- Postgres optimization guidelines
- `.mcp.json` -- MCP server configuration
- `CLAUDE.md` -- Claude Code instructions
- `AGENTS.md` -- GitHub Copilot agent instructions
- `test/` -- Test suite
- `vitest.config.ts` -- Vitest config

## Key Capabilities

- Covers all Supabase products: Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues
- Client library guidance: supabase-js, @supabase/ssr with Next.js, React, SvelteKit, Astro, Remix
- Auth troubleshooting: login, logout, sessions, JWT, cookies, RLS
- CLI and MCP server integration
- Postgres best practices across 8 categories prioritized by impact (Query Performance, Connection Management, Schema Design, etc.)

---

## Processes

None directly extractable. The skills are instruction sets (reference material for Supabase development), not multi-step workflows. The Postgres best practices skill is a decision tree / checklist, not an orchestratable process.

## Plugin Ideas

### 1. Database Performance Audit Plugin

- **Category**: Quality Assurance & Testing
- **Plugin name**: `db-performance-audit`
- **Description**: Generalizes the Supabase Postgres best practices into a database-agnostic performance audit plugin. Not Supabase-specific -- applies the 8-category prioritized framework to any Postgres (or SQL) project.
- **install.md approach**: Detect database type (Postgres, MySQL, SQLite), configure connection, install query analysis tools
- **Key features**:
  - 8-category audit framework: Query Performance (Critical), Connection Management (Critical), Schema Design (High), Concurrency & Locking (Medium-High), Security & RLS (Critical), Data Access Patterns (Medium), Monitoring & Diagnostics (Low-Medium), Advanced Features (Low)
  - Schema review via breakpoints before migration
  - Index recommendation engine
  - RLS/security policy review
  - Connection pooling configuration check
- **Integration surface**: hooks (`pre-commit` for migration files), commands (`db:audit`, `db:review-migration`), breakpoint rules

### 2. Marketplace Plugin Pattern Reference

- **Not a plugin idea**, but supabase/agent-skills is a clean reference implementation for how external teams build Claude Code marketplace plugins. The `marketplace.json` structure, skill organization, and dual-distribution (skills CLI + Claude plugin marketplace) pattern is worth studying for babysitter's own marketplace plugin authoring docs.

## Skipped

- The Supabase-specific skill content is too vendor-specific for babysitter processes
- The MCP server configuration is Supabase-specific infrastructure
- The Agent Skills format (agentskills.io) is a different ecosystem

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Database Performance Audit Framework | NEW | 8-category prioritized database performance audit methodology | - | specializations/devops-sre-platform/database-performance-audit.js |
| Postgres Best Practices Decision Tree | NEW | Systematic Postgres optimization checklist and decision framework | - | specializations/devops-sre-platform/postgres-best-practices.js |
| Auth Troubleshooting Workflow | NEW | Systematic authentication debugging process (login/logout/sessions/JWT) | - | specializations/security-compliance/auth-troubleshooting.js |
| Schema Design Review Process | NEW | Database schema design review with RLS and security considerations | - | specializations/backend/schema-design-review.js |
| Migration Review Workflow | NEW | Pre-commit migration review with performance and security checks | - | specializations/shared/migration-review-workflow.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Database Performance Audit | NEW | Database-agnostic performance audit with 8-category framework | - | plugins/a5c/marketplace/blueprints/database-performance-audit/ |
| Migration Review Automation | NEW | Pre-commit hooks and breakpoints for database migration review | - | plugins/a5c/marketplace/blueprints/migration-review-automation/ |
