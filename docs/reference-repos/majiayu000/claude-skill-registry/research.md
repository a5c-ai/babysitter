# majiayu000/claude-skill-registry

- **Archetype**: mega-skill-pack
- **Stars**: 187
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 153,744 (auto-crawled from GitHub)
- **Source**: gh-search

## Summary

A three-repo architecture (core/data/main) that functions as an automated skill discovery, indexing, and distribution platform. Crawls GitHub for SKILL.md files, downloads, security-scans, deduplicates, categorizes into 78+ categories, and publishes a searchable index via GitHub Pages. Includes formal JSON Schema for SKILL.md frontmatter and a Python security scanner.

## Assessment

The formalized skill schema (`schema/skill.schema.json`) is the closest thing to a standard SKILL.md metadata specification in the wild. The security scanner (detecting eval, exec, command injection, prompt injection, credential leaks, obfuscated payloads) is directly useful for marketplace ingestion safety. The discovery pipeline and provenance tracking (pinned SHAs for reproducibility) are production patterns. Individual skills vary wildly in quality since they are bulk-crawled.

## Extraction Priority
- **High**
- Rationale: Contains the only formalized skill schema, a production security scanner, and a complete discovery-to-index pipeline. Directly useful for babysitter's marketplace and plugin system.

---

## Processes

(No transferable processes after filtering skill-related patterns.)

## Plugin Ideas

- **marketplace-security-gate**: A babysitter plugin that adds security scanning to the plugin installation flow
  - What install.md would do: Copy the security scanner patterns into `.a5c/security/`, set up a pre-install hook that scans SKILL.md files for dangerous patterns before they are installed, create a `/security-scan-skill` slash command for on-demand scanning, configure alert thresholds in `.a5c/profiles/security.json`
  - Processes it would copy: security scanning process (pattern-based SKILL.md analysis)
  - Configs/hooks it would create: Pre-install security scan hook, `.a5c/commands/security-scan-skill.md`, security pattern database in `.a5c/security/patterns.json`
  - Source evidence: The repo's production security scanner with 25+ dangerous patterns and credential detection

- **skill-registry-browser**: A babysitter plugin that enables browsing and installing skills from public registries
  - What install.md would do: Configure registry endpoints (claude-skill-registry, awesome-omni-skill), set up local skill cache in `.a5c/skill-cache/`, create `/browse-skills` and `/install-skill` slash commands, integrate with babysitter catalog for search
  - Processes it would copy: metadata validation, registry search
  - Configs/hooks it would create: `.a5c/commands/browse-skills.md`, `.a5c/commands/install-skill.md`, registry config in `.a5c/registries.json`
  - Source evidence: The repo's search index schema and category taxonomy with 78+ categories

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No transferable processes identified after filtering skill-related patterns | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Marketplace Security Gate | NEW | Security scanning for plugin installation with dangerous pattern detection | - | plugins/a5c/marketplace/plugins/marketplace-security-gate/ |
| Skill Registry Browser | NEW | Browsing and installing skills from public registries with search and caching | - | plugins/a5c/marketplace/plugins/skill-registry-browser/ |

## Implicit Procedural Knowledge

(No transferable implicit procedures after filtering skill-related patterns.)
