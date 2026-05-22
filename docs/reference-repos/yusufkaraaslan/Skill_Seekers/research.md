# yusufkaraaslan/Skill_Seekers

- **URL**: https://github.com/yusufkaraaslan/Skill_Seekers
- **Stars**: 12,681
- **License**: MIT
- **Last pushed**: 2026-04-12
- **Description**: Convert documentation websites, GitHub repositories, and PDFs into Claude AI skills with automatic conflict detection

## Overview

Skill Seekers is a "data layer for AI systems" -- a universal preprocessing tool that turns documentation sites, GitHub repos, PDFs, videos, notebooks, wikis, and 10+ source types into structured knowledge assets. These assets can then be exported as Claude Skills, Gemini Skills, OpenAI GPTs, LangChain Documents, LlamaIndex TextNodes, Cursor rules, and more.

## Key Features

- 18 input source types (docs sites, GitHub repos, local projects, PDFs, videos, notebooks, wikis, etc.)
- 20 export targets (12 LLM + 8 RAG/vector): Claude, Gemini, OpenAI, LangChain, LlamaIndex, Haystack, Pinecone, ChromaDB, FAISS, Qdrant, Cursor, etc.
- AST-based code analysis for structural understanding
- Smart chunking that preserves code blocks and context
- Conflict detection for overlapping knowledge
- MCP server integration
- 3,194+ tests, 24+ framework presets
- Claude Code plugin available (`skill-seekers-plugin`)
- Multi-repo ecosystem: core CLI, website, community configs, GitHub Action, Claude Code plugin, Homebrew tap

## Architecture

- Python CLI (`skill-seekers create <source>`, `skill-seekers package <output> --target <platform>`)
- Embedding support for vector DB targets
- Benchmark tooling
- Workflow system for multi-step processing

## Skills Found

- `skills/skill-seekers/SKILL.md` -- Core skill for the tool itself
- `distribution/claude-plugin/skills/skill-builder/SKILL.md` -- Skill builder within Claude Code plugin
- `docs/features/BOOTSTRAP_SKILL.md` -- Bootstrap skill documentation

## Extractable Value for Babysitter

### Plugin Ideas
1. **Documentation-to-skill converter plugin** -- A babysitter marketplace plugin that wraps Skill Seekers' core capability: point it at documentation (URL, repo, PDF) and automatically generate a SKILL.md with structured knowledge, examples, and patterns. This could be used to bootstrap new babysitter process specializations from existing documentation.
2. **Knowledge asset indexing plugin** -- Integrate Skill Seekers' multi-source preprocessing into babysitter's process library, enabling automatic knowledge extraction from external documentation into process context.

### Processes (specializations/shared/)
1. **Documentation-driven skill generation** -- A process that takes a documentation source, extracts structured knowledge, resolves conflicts with existing skills, and produces a validated SKILL.md. The multi-source + conflict-detection + validation pipeline is a reusable methodology.

## Classification

- **Archetype**: Universal documentation-to-skill converter
- **Primary value**: The concept of automated skill generation from documentation sources with conflict detection and multi-target export. Direct relevance to babysitter's assimilation workflow.
- **Skip**: Skill management primitives (SDK-covered), the preprocessing engine itself (external tool)

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Documentation-Driven Skill Generation | NEW | Multi-source knowledge extraction with conflict detection and validation pipeline | - | specializations/shared/documentation-driven-skill-generation.js |
| Multi-Source Knowledge Extraction | NEW | Universal preprocessing from 18+ source types with AST-based analysis | - | specializations/shared/multi-source-knowledge-extraction.js |
| Conflict Detection for Knowledge Assets | NEW | Automatic detection and resolution of overlapping knowledge across sources | - | specializations/shared/conflict-detection-knowledge-assets.js |
| Smart Chunking with Context Preservation | NEW | Intelligent content segmentation that preserves code blocks and contextual relationships | - | specializations/shared/smart-chunking-context-preservation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Documentation-to-Skill Converter Plugin | NEW | Skill Seekers wrapper for automated skill generation from documentation sources | - | plugins/a5c/marketplace/plugins/documentation-skill-converter/ |
| Knowledge Asset Indexing Plugin | NEW | Multi-source preprocessing integration for process library knowledge extraction | - | plugins/a5c/marketplace/plugins/knowledge-asset-indexing/ |
