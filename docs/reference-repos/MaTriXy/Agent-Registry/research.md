# MaTriXy/Agent-Registry

- **Archetype**: agent-optimization-tool
- **Stars**: 8
- **Last pushed**: 2026 (v2.0.1)
- **License**: MIT
- **Discovered**: 2026-04-13
- **Skills found**: 1 (lazy-loading agent registry)

## Summary
A lazy-loading system for Claude Code agents that reduces context window usage by 70-90% through on-demand loading rather than eager loading. Features smart BM25 + keyword matching search engine for intent-based agent discovery, interactive migration UI with multi-level selection, and lightweight index architecture. Real-world test with 140 agents showed context reduction from 16.4k to 2.7k tokens (83% decrease). Includes UserPromptSubmit hook for automatic agent discovery.

## Assessment
HIGH VALUE for babysitter process discovery optimization. The lazy-loading pattern and context reduction techniques directly apply to babysitter's process library management. The BM25 search algorithm, automatic agent discovery via prompt analysis, and token efficiency optimization are highly relevant. The shift from eager to lazy loading with metadata-only indexes provides a proven pattern for scaling large process libraries without context window exhaustion.

## Extraction Priority
- High
- Rationale: The lazy-loading pattern, BM25 search implementation, and context optimization techniques are directly transferable to babysitter's process discovery. The automatic intent analysis and confidence-based matching (score ≥ 0.5) provide sophisticated process recommendation capabilities. Real-world validation with 83% token reduction proves effectiveness.

## Processes
- **Lazy-Loading Process Discovery**: Replace eager loading with metadata-only indexes for large process libraries
- **Intent-Based Process Recommendation**: Analyze user prompts to automatically suggest relevant processes
- **BM25 Search for Process Discovery**: Implement BM25 + keyword matching for intelligent process search
- **Context Window Optimization**: Reduce token usage through selective loading and metadata caching
- **Confidence-Based Process Matching**: Score process relevance and auto-inject high-confidence matches

## Plugin Ideas
None - the functionality is best implemented as core babysitter enhancement rather than external plugin.

## Patterns
- Lazy loading with metadata-only indexes
- BM25 + keyword search for relevance scoring
- Automatic prompt analysis for intent detection
- Multi-level selection UI with keyboard navigation
- Content hash-based change detection
- Confidence thresholding (≥ 0.5) for auto-injection
- Graceful fallback to text mode

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Lazy-Loading Process Discovery | UPGRADE | Replace eager loading with metadata indexes for large process libraries | library/skills/babysit/ | specializations/shared/lazy-loading-process-discovery.js |
| Intent-Based Process Recommendation | NEW | Analyze user prompts to automatically suggest relevant processes | - | specializations/shared/intent-based-process-recommendation.js |
| BM25 Search for Process Discovery | NEW | BM25 + keyword matching for intelligent process search and ranking | - | specializations/shared/bm25-search-process-discovery.js |
| Context Window Optimization | UPGRADE | Token reduction through selective loading and metadata caching | library/compression/ | specializations/shared/context-window-optimization.js |
| Confidence-Based Process Matching | NEW | Score process relevance and auto-inject high-confidence matches | - | specializations/shared/confidence-based-process-matching.js |
| Process Registry Management | NEW | Lightweight index architecture with content hash change detection | - | specializations/shared/process-registry-management.js |
| Automatic Prompt Intent Analysis | NEW | Parse user prompts to determine development intent and suggest processes | - | specializations/shared/automatic-prompt-intent-analysis.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | Functionality best implemented as core babysitter enhancement | - | N/A |