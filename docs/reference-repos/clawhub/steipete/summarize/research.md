# steipete/summarize

- **Archetype**: utility-with-skill
- **Stars**: 5,561
- **Last pushed**: 2026-04-09
- **License**: NOASSERTION
- **Discovered**: 2026-04-12
- **Source**: ClawHub skills (published as "steipete/tavily" or similar search skill)
- **Skills found**: 0 SKILL.md in repo (skill published to ClawHub separately)
- **Fork**: No

## Summary

Chrome Side Panel extension + CLI for fast summaries from URLs, files, and media. Written in TypeScript, distributed via npm and Homebrew. Supports URLs, files, podcasts, YouTube, audio/video, PDFs, and RSS. Features include:

- Chrome Side Panel chat with streaming agent and history
- Video slide extraction (screenshots + OCR + transcript cards) for YouTube and direct video
- Transcript-first media flow with multiple transcription backends (Groq, ONNX, whisper.cpp, AssemblyAI, Gemini, OpenAI, FAL)
- Multiple coding CLI backends: Codex, Claude, Gemini, Cursor Agent, OpenClaw, OpenCode
- Local daemon architecture (launchd/systemd) for always-on browser extension
- Output modes: Markdown, JSON diagnostics, extract-only, metrics, cost estimates

The CLI portion is agent-friendly with JSON output, multiple model backends, and cost-aware operation. The daemon architecture (local service with shared token) is notable for bridge-to-browser patterns.

## Assessment

MEDIUM extractable value. The summarization itself is a common utility, but the multi-source extraction pipeline (URL -> media detection -> transcript -> summary) and the daemon-bridge architecture are valuable patterns. The video slide extraction (screenshots + OCR + timestamps) is unique.

**Extraction priority**: MEDIUM

# Extractable Value: steipete/summarize

## Processes

### 1. Multi-Source Content Research Pipeline
- **Source**: CLI's URL/media/file summarization with extraction modes
- **Placement**: `specializations/shared/multi-source-content-research.js`
- **Description**: Process for researching a topic across multiple content types: collect URLs + video links + PDFs -> detect content type per source -> extract content (web scrape, transcript, PDF parse) -> summarize each -> synthesize cross-source summary -> generate research briefing with citations. Breakpoint for user to review source selection.

### 2. Video Knowledge Extraction
- **Source**: Video slide extraction (screenshots + OCR + transcript cards)
- **Placement**: `specializations/shared/video-knowledge-extraction.js`
- **Description**: Process for extracting structured knowledge from video content: download video/transcript -> extract slide screenshots at key frames -> OCR each slide -> align with transcript timestamps -> generate structured notes with visual references -> export as searchable Markdown document.

## Plugin Ideas

### 1. Content Summarization Plugin
- **Category**: Knowledge Management
- **install.md**: Installs summarize CLI (@steipete/summarize) via npm, configures model backend (supports multiple providers), optionally sets up daemon for browser extension integration. Provides babysitter tasks for URL summarization, file summarization, and video transcript extraction. Useful as a building block in research and documentation processes.

### 2. Local Daemon Bridge Plugin
- **Category**: Tools Integration
- **install.md**: Extracts the daemon-bridge pattern from summarize (local service with shared token, auto-started via launchd/systemd/Scheduled Task) as a reusable plugin pattern. Enables any babysitter plugin to expose a local HTTP service that browser extensions or other tools can call into.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Multi-Source Content Research Pipeline | NEW | Cross-source research with content type detection and synthesis | - | specializations/shared/multi-source-content-research.js |
| Video Knowledge Extraction | NEW | Video slide extraction with screenshots, OCR, and transcript alignment | - | specializations/shared/video-knowledge-extraction.js |
| Content-Type Detection Pipeline | NEW | Auto-detection and routing for webpage/video/audio/PDF/RSS content processing | - | specializations/shared/content-type-detection-pipeline.js |
| Cost-Aware Model Selection | NEW | Tiered quality/cost tradeoffs with cost estimation and free model presets | - | specializations/shared/cost-aware-model-selection.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Content Summarization Engine | NEW | Multi-provider content summarization with CLI backend and cost-aware operation | - | plugins/a5c/marketplace/plugins/content-summarization-engine/ |
| Local Daemon Bridge | NEW | Background service pattern for browser extension integration with token-based auth | - | plugins/a5c/marketplace/plugins/local-daemon-bridge/ |

## Implicit Procedural Knowledge

- **Content-type detection pipeline**: Auto-detecting whether a URL points to a webpage, video, audio, PDF, or RSS feed, then routing to the appropriate extraction backend. This branching pattern is reusable for any multi-format content processing.
- **Cost-aware model selection**: The CLI supports `--force-summary`, cost estimates, and a free model preset via OpenRouter. This pattern of being aware of generation costs and offering tiered quality/cost tradeoffs is relevant for babysitter process design.
- **Daemon-bridge architecture**: Running a local background service with token-based auth that bridges between a browser extension and heavy CLI tooling. This is a pattern for extending agent capabilities into the browser context.
