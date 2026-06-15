# trsoliu/mini-wiki
- **Archetype**: utility-with-skill
- **Stars**: 63
- **Last pushed**: 2026-02-05
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1
- **Source**: gh-search

## Summary
AI-powered wiki generator skill that produces structured project documentation in a `.mini-wiki/` directory. Features deep code analysis with semantic understanding, Mermaid diagram generation, cross-linked documentation, incremental updates via checksum-based change detection, business domain auto-detection, and a plugin system for extensions. Includes dynamic quality standards that scale documentation depth based on module complexity.

## Assessment
The wiki generation workflow is a genuine multi-phase process: project analysis -> code analysis -> change detection -> content generation -> cross-linking -> save. The progressive scanning strategy for large projects (priority-based module batching) is a transferable orchestration pattern. The dynamic quality standards (documentation depth scaled by source lines, export count, file count) are an interesting approach to avoiding skeleton docs. The business domain auto-detection (keyword/package-based clustering) is a useful sub-procedure. The plugin system (instruction-only hooks, no code execution) is a lightweight extensibility pattern. The source code traceability requirement (every section must reference source files with line numbers) is a quality enforcement pattern.

## Extraction Priority
- Medium
- Rationale: Solid documentation generation process with clear phases and quality gates. The progressive scanning / priority-based batching pattern is genuinely useful for any large-project analysis workflow. However, the process is primarily prompt engineering -- it instructs the AI how to generate docs rather than defining a replayable multi-step orchestration.

---

## Processes

- **project-wiki-generation**: Multi-phase automated project documentation pipeline
  - Source: SKILL.md (full file, ~500+ lines)
  - Placement: specializations/shared/ (cross-domain; applies to any software project)
  - Inputs: Project root path, language preference (zh/en), optional config.yaml overrides
  - Outputs: `.mini-wiki/` directory containing: index.md, architecture.md, getting-started.md, doc-map.md, domain-organized module docs, API reference docs, meta.json, cache/
  - Complexity: complex
  - Phases:
    1. Initialization check (create or resume from existing .mini-wiki/)
    2. Plugin discovery (read registry, load manifests, register hooks)
    3. Project analysis (tech stack, entry points, modules, existing docs)
    4. Deep code analysis (read source files, extract semantics, identify relationships)
    5. Change detection (checksum comparison: new/modified/deleted files)
    6. Content generation (6 document types with strict quality standards)
    7. Source code linking (attach file:// links with line numbers)
    8. Save and update cache

- **progressive-project-scanning**: Priority-based batched analysis for large projects
  - Source: SKILL.md "Large Project Progressive Scanning" section
  - Placement: specializations/shared/
  - Inputs: Module list with metadata (source lines, file count, exports, dependencies, dependents, last modified)
  - Outputs: Prioritized module batches with progress checkpointing
  - Complexity: moderate
  - Notes: Triggered when modules > 10 or source files > 50 or LOC > 10K. Priority scoring: entry point (weight 5), dependent count (4), existing docs (3), code size (2), recency (1). Batches processed sequentially with user-prompted continuation between batches.

## Plugin Ideas

- **wiki-generator**: Automated project documentation generator
  - What install.md would do: Copy the wiki generation process definition, create .mini-wiki/ scaffolding script, register the process for invocation via "generate wiki" / "create docs" commands
  - Processes it would copy: project-wiki-generation, progressive-project-scanning
  - Configs/hooks it would create: PostToolUse hook on project initialization that suggests wiki generation; process alias for `agent-platform call --process wiki-generation`; config for output directory and language preference
  - Source evidence: SKILL.md workflow sections, output structure specification, quality standards
  - Category: Knowledge Management

## Implicit Procedural Knowledge

- **Dynamic quality scaling**: Complexity-proportional documentation standards
  - Source: SKILL.md "Dynamic Quality Standards" section
  - Placement: specializations/shared/
  - Why codify: Prevents both skeleton docs (too thin) and over-documentation (too thick) by tying documentation depth to measurable complexity factors. The formula approach (doc lines = max(100, source_lines * 0.3 + export_count * 20)) is reusable.
  - Sketch: For each module to document: (1) Measure complexity factors (source lines, file count, export count, dependency count, dependent count). (2) Classify module role (core/util/config/test/example) with role weights (+4/+2/+1/+0/+0). (3) Calculate target metrics: doc lines, code examples, diagrams, sections. (4) Adapt content focus by project type (frontend: component props; backend: API interfaces; library: type definitions). (5) Quality gate: check generated doc meets calculated minimums before accepting.

- **Business domain auto-clustering**: Keyword and package-based module grouping
  - Source: SKILL.md "Domain Auto-Detection" section
  - Placement: specializations/shared/
  - Why codify: The flat `modules/` directory anti-pattern is common. Auto-clustering by keyword/package affinity produces more navigable hierarchical documentation. Transferable to any codebase organization task.
  - Sketch: (1) Define domain keyword maps (e.g., AI: [agent, ai, llm, chat, mcp], Storage: [store, persist, state]). (2) For each module, scan names, imports, and exports for keyword matches. (3) Score each module against each domain. (4) Assign to highest-scoring domain. (5) Create hierarchical directory structure. Each domain gets _index.md with overview, sub-domains group related modules.

- **Source-traced documentation**: Mandatory source file references in generated docs
  - Source: SKILL.md "Source Code Traceability" section
  - Placement: specializations/shared/
  - Why codify: Documentation that cannot be traced to source code becomes stale immediately. The requirement that every section and every diagram includes `file://path#L1-L50` references creates a verifiable link between docs and code. Useful as a quality gate for any documentation generation process.
  - Sketch: For each documentation section: (1) Track which source files were analyzed to produce the section. (2) Append a "Section sources" block with file:// links including line ranges. (3) For each diagram, append a "Diagram sources" block. (4) Quality gate: reject any section that has zero source references.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Project Wiki Generation | NEW | Multi-phase automated project documentation pipeline with quality gates | - | specializations/shared/project-wiki-generation.js |
| Progressive Project Scanning | NEW | Priority-based batched analysis for large projects with checkpointing | - | specializations/shared/progressive-project-scanning.js |
| Dynamic Quality Scaling | NEW | Complexity-proportional documentation standards with formula-based depth calculation | - | specializations/shared/dynamic-quality-scaling.js |
| Business Domain Auto-Clustering | NEW | Keyword and package-based module grouping for hierarchical documentation organization | - | specializations/shared/business-domain-auto-clustering.js |
| Source-Traced Documentation | NEW | Mandatory source file references in generated documentation with verifiable links | - | specializations/shared/source-traced-documentation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Wiki Generator | NEW | Automated project documentation generator with progressive scanning and quality gates | - | plugins/a5c/marketplace/blueprints/wiki-generator/ |
