# blessonism/openclaw-search-skills

## Metadata
- **Stars:** 408
- **License:** MIT
- **Last pushed:** 2026-03-18
- **Topics:** (none)
- **Fork:** No

## Archetype: domain-skill-pack

OpenClaw-specific search skills providing multi-source parallel search, content extraction, and document parsing. Three composable skills: search-layer, content-extract, mineru-extract.

## Structure
- `search-layer/` -- SKILL.md + scripts + references
  - Four-source parallel search (Brave + Exa + Tavily + Grok)
  - Intent-aware retrieval (factual/status/comparison/tutorial/exploratory/news/resource)
  - Chain reference tracing (GitHub issues, HN, Reddit threads)
  - Research-light lane for deep queries
- `content-extract/` -- URL to clean Markdown with anti-scraping fallback
- `mineru-extract/` -- MinerU API wrapper for PDF/Office/HTML to Markdown

## Extractable Value

### Processes
- **Deep research methodology** (specializations/shared/): The two-path retrieval architecture (standard retrieval path + thread-pulling path) combined with intent classification is a solid research methodology. Maps to a babysitter process: classify intent -> multi-source retrieve -> score/dedup -> optionally deep-pull threads -> synthesize.
- **Content extraction pipeline** (specializations/shared/): The graduated fallback pattern (direct fetch -> anti-scraping fallback -> MinerU parse) for converting arbitrary URLs to clean markdown is a reusable extraction process.

### Plugin Ideas
- **Multi-source search plugin:** A babysitter marketplace plugin providing a `search` task kind that dispatches to multiple search APIs in parallel (Brave/Exa/Tavily), with intent-aware routing and result fusion. Install.md configures API keys per source.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Deep Research Methodology | NEW | Two-path retrieval architecture with intent classification and multi-source search | - | specializations/shared/deep-research-methodology.js |
| Content Extraction Pipeline | NEW | Graduated fallback pattern (direct fetch → anti-scraping → MinerU parse) for URL to Markdown | - | specializations/shared/content-extraction-pipeline.js |
| Multi-Source Parallel Search | NEW | Four-source parallel search with result fusion and deduplication | - | specializations/shared/multi-source-parallel-search.js |
| Intent-Aware Retrieval | NEW | Search intent classification (factual/status/comparison/tutorial/exploratory/news/resource) | - | specializations/shared/intent-aware-retrieval.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Multi-Source Search Engine | NEW | Search task kind dispatching to multiple APIs (Brave/Exa/Tavily) with API key configuration | - | plugins/a5c/marketplace/blueprints/multi-source-search-engine/ |

### SKIP
- OpenClaw-specific skill loading mechanics
- The Grok integration (model-specific, not generalizable)
