# wshuyi/x-article-publisher-skill

- **Archetype**: utility-with-skill
- **Stars**: 715
- **Last pushed**: 2026-01-25
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1

## Summary
Claude Code skill for publishing Markdown articles to X (Twitter) Articles via browser automation (Playwright MCP). Handles Markdown parsing, rich text conversion, cover image upload, table-to-image conversion, and clipboard-based content transfer. A cross-platform publishing pipeline with Python helper scripts.

## Assessment
LOW-MEDIUM VALUE for process extraction. The skill is a specific integration pipeline (Markdown -> X Articles) that depends heavily on Playwright browser automation and platform-specific clipboard utilities. The multi-script pipeline architecture (parse_markdown.py, copy_to_clipboard.py, table_to_image.py) demonstrates a pattern of decomposing a publishing workflow into reusable helper scripts. The cross-platform clipboard handling (macOS pyobjc vs Windows pywin32) is a useful implementation pattern but not a methodology. Transferable patterns are limited to the general "content publishing pipeline" structure.

## Extraction Priority
- Low
- Rationale: Platform-specific integration (X/Twitter Articles), heavy browser automation dependency, and narrow use case. The publishing pipeline pattern exists in simpler forms elsewhere.

## Processes
- **Markdown-to-Platform Publishing Pipeline**: Parse markdown -> extract metadata/images -> convert tables to images -> rich text conversion -> clipboard transfer -> browser automation publish. Could be generalized as a content publishing process template.

## Plugin Ideas
- **Content Publisher plugin**: A generalized Markdown-to-platform publisher framework as a babysitter marketplace plugin. Install.md would set up Playwright MCP, configure target platforms (X, Medium, Dev.to, LinkedIn), and provide per-platform publishing skills. Each platform adapter would handle format conversion and automation.

## Patterns
- **Helper script decomposition**: Breaking a complex publishing workflow into focused Python scripts (parse, clipboard, convert) that the skill orchestrates. Each script is independently testable.
- **Cross-platform clipboard abstraction**: Platform-detection-based clipboard handling for rich content (images + HTML).
- **Mermaid pre-processing**: Detecting and converting Mermaid diagrams in Markdown before publishing to platforms that lack native support.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Markdown-to-Platform Publishing Pipeline | NEW | Parse markdown → extract metadata/images → convert tables → browser automation publish | - | specializations/shared/markdown-platform-publishing.js |
| Helper Script Decomposition | NEW | Breaking complex workflows into focused, independently testable scripts | - | specializations/shared/helper-script-decomposition.js |
| Cross-Platform Clipboard Abstraction | NEW | Platform-detection-based clipboard handling for rich content | - | specializations/shared/cross-platform-clipboard-abstraction.js |
| Mermaid Pre-Processing | NEW | Detecting and converting Mermaid diagrams for platforms lacking native support | - | specializations/shared/mermaid-preprocessing.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Content Publisher Plugin | NEW | Generalized Markdown-to-platform publisher with Playwright automation and multi-platform support | - | plugins/a5c/marketplace/blueprints/content-publisher/ |
