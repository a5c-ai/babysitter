# claude-world/notebooklm-skill

- **Archetype**: domain-skill-pack
- **Stars**: 167
- **Last pushed**: 2026-03-24
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1 (with MCP server providing 13 tools)
- **Source**: gh-search

## Summary

A full-stack research-to-content pipeline bridging Google NotebookLM (free research engine with cited Q&A and 10 artifact types) with Claude (content creation). Delivered as a Claude Code skill, MCP server (13 tools), and CLI with named pipeline workflows. The key insight: NotebookLM handles research indexing at zero cost, Claude handles only the creative writing.

## Assessment

The multi-phase pipeline pattern (Ingest -> Synthesize -> Create -> Publish) with clear phase boundaries is a textbook orchestration template. The MCP server architecture (FastMCP, 13 tools, async context manager, fuzzy resolution) is a strong reference implementation. The SKILL.md is one of the best-authored in the wild (800+ lines, phase-by-phase instructions, CLI examples for every operation). The dual-interface pattern (CLI + MCP + Python API from one implementation) is worth noting. Depends on notebooklm-py library.

## Extraction Priority
- **High**
- Rationale: Most sophisticated Claude Code skill found. The pipeline pattern, MCP architecture, and SKILL.md authoring quality are all directly extractable as process templates and skill patterns.

---

## Processes

- **research-to-content-pipeline**: 4-phase flow: Ingest sources -> Synthesize via cited Q&A and artifact generation -> Claude creates original content -> Optional social publishing
  - Source: SKILL.md pipeline section and scripts/pipeline.py
  - Placement: specializations/shared/research-pipeline
  - Inputs: source URLs/PDFs/YouTube, research questions, output format (article/social/slides)
  - Outputs: research findings with citations, content drafts, optional social posts
  - Complexity: complex
  - Notes: Uses NotebookLM as zero-cost research backend; Claude only handles creative writing

- **deep-web-research**: Use NotebookLM's web/Drive research to auto-discover and import sources the user didn't know existed
  - Source: SKILL.md research section
  - Placement: specializations/shared/web-research
  - Inputs: notebook ID, research query, mode (fast 10-30s / deep 1-5min)
  - Outputs: research report (Markdown) + discovered source URLs
  - Complexity: moderate
  - Notes: Discovery amplification pattern -- finds sources beyond what user provided

- **async-artifact-generation**: Generate and download 10 artifact types (podcast, video, slides, report, quiz, flashcards, mind map, infographic, data table, study guide) with async polling
  - Source: SKILL.md artifact section
  - Placement: specializations/shared/artifact-generation
  - Inputs: notebook ID, artifact type, output directory, language
  - Outputs: downloaded artifact files
  - Complexity: moderate
  - Notes: Polling pattern for external async service; documents known limitations (infographic unreliable)

## Plugin Ideas

- **research-automation**: A babysitter plugin that sets up automated research workflows for a project
  - What install.md would do: Check if notebooklm-py and MCP server are available, interview user about research needs (competitive analysis, market research, technical research, content creation), copy research pipeline processes into `.a5c/processes/research/`, create `/research` and `/deep-research` slash commands, configure MCP server connection in `.claude/settings.json`
  - Processes it would copy: research-to-content-pipeline, deep-web-research, artifact-generation
  - Configs/hooks it would create: `.a5c/commands/research.md`, `.a5c/commands/deep-research.md`, MCP server configuration, output directory structure for research artifacts
  - Source evidence: The repo's complete 4-phase pipeline with named workflows and MCP tool surface

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Research-to-Content Pipeline | NEW | 4-phase flow: Ingest → Synthesize → Create → Publish with NotebookLM backend | - | specializations/shared/research-to-content-pipeline.js |
| Deep Web Research | NEW | NotebookLM web/Drive research with source discovery amplification | - | specializations/shared/deep-web-research.js |
| Async Artifact Generation | NEW | Generate and poll 10 artifact types with async polling pattern | - | specializations/shared/async-artifact-generation.js |
| Research Pipeline Orchestration | NEW | Multi-phase pipeline orchestration with typed inputs/outputs and named workflows | - | specializations/shared/research-pipeline-orchestration.js |
| MCP Server Architecture | NEW | FastMCP-based server pattern with 13 tools and async context management | - | specializations/shared/mcp-server-architecture.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Research Automation | NEW | Automated research workflows with NotebookLM integration and MCP server setup | - | plugins/a5c/marketplace/blueprints/research-automation/ |

## Implicit Procedural Knowledge

- **research-pipeline-orchestration**: Full pipeline from source ingestion to published content
  - Source: SKILL.md phase descriptions and scripts/pipeline.py named workflows
  - Placement: specializations/shared/research-pipeline
  - Why codify: The pipeline has 4 clear phases with typed inputs/outputs and async polling between them. Named workflows (research-to-article, research-to-social, trend-to-content, batch-digest) show different compositions of the same phases.
  - Sketch: Phase 1 (shell: create notebook, add sources, wait for processing), Phase 2 (agent: formulate research questions, run cited Q&A), Phase 3 (agent: Claude writes original content from research), Breakpoint (human reviews content), Phase 4 (optional shell: publish to platforms)
