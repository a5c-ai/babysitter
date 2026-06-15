# safishamsi/graphify

- **Full name**: safishamsi/graphify
- **Description**: Turn any folder of code, docs, papers, images, or videos into a queryable knowledge graph
- **Stars**: 23,358
- **License**: MIT
- **Last pushed**: 2026-04-12
- **Topics**: antigravity, claude-code, codex, gemini, graphrag, knowledge-graph, openclaw, skills
- **Fork**: No
- **Source**: gh-search

## Archetype

**utility-with-skill** -- A Python-based knowledge graph generator that works as a skill for 10+ AI coding assistants. Three-pass pipeline: deterministic AST extraction (no LLM), local Whisper transcription for audio/video, then Claude subagent extraction for docs/papers/images. Outputs interactive HTML, GraphRAG-ready JSON, and a plain-language audit report.

## Structure

```
graphify/
  __init__.py
  __main__.py
  analyze.py          # Graph analysis
  benchmark.py        # Performance benchmarking
  build.py            # Main build pipeline
  cache.py            # SHA256 file caching
  cluster.py          # Leiden community detection
  detect.py           # File type detection
  export.py           # HTML/JSON/GraphML/Neo4j export
  extract.py          # LLM-based concept extraction
  hooks.py            # IDE hook integration
  ingest.py           # File ingestion pipeline
  manifest.py         # Build manifest
  report.py           # GRAPH_REPORT.md generation
  security.py         # Security scanning
  serve.py            # MCP server mode
  skill.md            # Claude Code skill definition
  skill-codex.md      # Codex variant
  skill-*.md          # Other platform variants
  transcribe.py       # Whisper audio/video transcription
  validate.py         # Graph validation
  watch.py            # File watcher for auto-rebuild
  wiki.py             # Wiki generation from graph
pyproject.toml        # Python package config
tests/                # Test suite
ARCHITECTURE.md       # Architecture documentation
```

## Key Techniques

1. **Three-pass extraction** -- Pass 1: deterministic AST for code (22 languages via tree-sitter). Pass 2: Whisper transcription for audio/video. Pass 3: Claude subagents for docs/papers/images
2. **Honest audit trail** -- Every edge tagged EXTRACTED (from source), INFERRED (with confidence score), or AMBIGUOUS (flagged for review)
3. **Topology-based clustering** -- Leiden community detection on graph topology (no embeddings needed); semantic similarity edges from Claude influence clustering directly
4. **SHA256 caching** -- Re-runs only process changed files
5. **Incremental updates** -- `--update` flag re-extracts only new/changed files
6. **Multi-format output** -- Interactive HTML, JSON, GraphML, Neo4j Cypher, SVG, Obsidian vault, wiki
7. **MCP server mode** -- Exposes graph as MCP tools for agent access
8. **71.5x token reduction** -- Query the graph instead of reading raw files
9. **Domain-aware transcription** -- Whisper prompt derived from corpus god nodes for better accuracy
10. **Always-on hook integration** -- PreToolUse hooks make agents consult graph before file searches

---

## Processes

SKIP -- Knowledge graph building is fundamentally a tool/utility, not a development methodology or workflow process. The core value is in the tool itself, not in a reusable process pattern.

## Plugin Ideas

### 1. Knowledge Graph Builder Plugin (Category: Knowledge Management)

A babysitter plugin that integrates graphify's knowledge graph generation into the babysitter workflow. When a run starts on an unfamiliar codebase, the plugin builds (or updates) a knowledge graph and makes it available to all tasks in the run.

**install.md**: Installs graphify as a dependency (`pip install graphifyy`). Registers an `on-run-start` hook that checks for existing `graphify-out/graph.json`. If missing or stale, triggers an incremental build. Injects GRAPH_REPORT.md summary into task context via `on-task-start` hook. Provides `graph:build`, `graph:query`, and `graph:explain` commands.

Key value: 71.5x token reduction per query compared to reading raw files. The always-on hook pattern (consult graph before file searches) maps directly to babysitter's hook system.

### 2. Codebase Architecture Visualizer (Category: Developer Experience & UX)

A babysitter plugin that generates interactive architecture visualizations from the knowledge graph. Integrates with the observer dashboard to show god nodes, community structure, and surprising cross-module connections.

**install.md**: Extends the observer dashboard with a graph visualization widget. Reads `graphify-out/graph.json` and renders an interactive HTML view. Highlights nodes involved in the current run's tasks. Provides `graph:viz` command to open visualization in browser.

### 3. Graph-Aware Code Navigation (Category: Context & Memory)

A babysitter plugin that uses graphify's knowledge graph to provide intelligent code navigation hints. Before a task reads files, the plugin suggests which files are most architecturally relevant based on graph community structure and shortest-path analysis.

**install.md**: Installs `pre-tool-use` hook on Read/Glob/Grep operations. When a task is about to search files, the plugin queries the knowledge graph for related nodes and suggests the most relevant files. Reduces unnecessary file reads and helps tasks find the right code faster.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Three-Pass Knowledge Extraction | NEW | Multi-modal content extraction methodology | - | specializations/shared/three-pass-extraction.js |
| Graph-Based Codebase Analysis | NEW | Knowledge graph generation for code understanding | - | specializations/shared/graph-codebase-analysis.js |
| Incremental Knowledge Building | NEW | SHA256-based caching for incremental processing | - | specializations/shared/incremental-knowledge-building.js |
| Multi-Format Knowledge Export | NEW | Knowledge graph output in multiple formats | - | specializations/shared/multi-format-export.js |
| Topology-Based Content Clustering | NEW | Leiden community detection for content organization | - | specializations/shared/topology-clustering.js |
| Domain-Aware Transcription | NEW | Context-driven audio/video transcription | - | specializations/shared/domain-aware-transcription.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Knowledge Graph Builder | NEW | Codebase knowledge graph generation and querying | - | plugins/a5c/marketplace/blueprints/knowledge-graph-builder/ |
| Codebase Architecture Visualizer | NEW | Interactive architecture visualization from knowledge graph | - | plugins/a5c/marketplace/blueprints/architecture-visualizer/ |
| Graph-Aware Code Navigation | NEW | Intelligent code navigation using knowledge graph | - | plugins/a5c/marketplace/blueprints/graph-aware-navigation/ |
