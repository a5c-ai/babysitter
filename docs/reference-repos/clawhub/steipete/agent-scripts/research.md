# steipete/agent-scripts

- **Archetype**: mega-skill-pack
- **Stars**: 2,383
- **Last pushed**: 2026-03-13
- **License**: NOASSERTION
- **Discovered**: 2026-04-12
- **Source**: ClawHub skills (multiple skills published from this repo)
- **Skills found**: 19 skill directories in skills/
- **Fork**: No

## Summary

steipete's shared agent scripts repository containing 19 skills used across his projects and published individually to ClawHub. This is the source repo for several popular ClawHub skills including nano-banana-pro, oracle, brave-search, and others.

Skills found:
1. **1password** - 1Password CLI integration
2. **brave-search** - Web search via Brave Search API
3. **create-cli** - CLI creation tooling
4. **discord-clawd** - Discord integration
5. **domain-dns-ops** - Domain/DNS operations
6. **frontend-design** - Frontend design assistance
7. **instruments-profiling** - macOS Instruments profiling
8. **markdown-converter** - Markdown conversion
9. **nano-banana-pro** - Image generation/editing via Gemini 3 Pro Image
10. **native-app-performance** - Native app performance analysis
11. **openai-image-gen** - OpenAI image generation
12. **openclaw-relay** - OpenClaw relay/orchestration
13. **oracle** - Cross-model review via GPT-5 Pro
14. **swift-concurrency-expert** - Swift concurrency guidance
15. **swiftui-liquid-glass** - SwiftUI Liquid Glass design
16. **swiftui-performance-audit** - SwiftUI performance auditing
17. **swiftui-view-refactor** - SwiftUI view refactoring
18. **video-transcript-downloader** - Video transcript extraction
19. **xurl** - URL expansion/resolution

The repo is macOS/Apple-ecosystem heavy (Swift, SwiftUI, Instruments) with cross-cutting utility skills (brave-search, oracle, nano-banana-pro, markdown-converter).

## Assessment

MEDIUM extractable value. Many skills are Apple-ecosystem-specific (SwiftUI, Instruments, native app). The cross-cutting utilities (brave-search, oracle, nano-banana-pro, video-transcript-downloader) have broader value. The oracle skill's cross-model validation pattern is notable -- using one model to review another's work.

**Extraction priority**: MEDIUM

# Extractable Value: steipete/agent-scripts

## Processes

### 1. Cross-Model Code Review
- **Source**: oracle skill (bundle prompt + files, send to GPT-5 Pro for second opinion)
- **Placement**: `specializations/shared/cross-model-code-review.js`
- **Description**: Process for getting a second AI model's review on code changes: select relevant files -> prepare context bundle -> submit to secondary model (API or browser) -> compare responses -> surface disagreements and insights -> create actionable review notes. Uses breakpoints to present findings to the user.

### 2. AI Image Generation Pipeline
- **Source**: nano-banana-pro skill (draft -> iterate -> final workflow)
- **Placement**: `specializations/shared/ai-image-generation-pipeline.js`
- **Description**: Multi-step image generation process: draft at 1K resolution -> review with user -> iterate on prompt adjustments -> upscale to 4K when prompt is locked. Supports both text-to-image and image-to-image editing. Breakpoints for user review at each draft iteration.

### 3. Video Content Summarization
- **Source**: video-transcript-downloader + summarize patterns
- **Placement**: `specializations/shared/video-content-summarization.js`
- **Description**: Process for extracting and summarizing video content: download transcript (YouTube/direct URL) -> extract key segments -> generate structured summary -> identify action items and key quotes -> export as Markdown.

## Plugin Ideas

### 1. Web Search Plugin (Brave)
- **Category**: Tools Integration
- **install.md**: Installs brave-search skill dependencies (node), configures BRAVE_API_KEY, provides babysitter tasks for web search (query with result count) and page content extraction (URL to markdown). Lightweight alternative to browser automation for information retrieval.

### 2. Cross-Model Validation Plugin (Oracle)
- **Category**: QA & Testing
- **install.md**: Installs oracle CLI (@steipete/oracle), configures secondary model access (OpenAI API key or browser automation). Provides a babysitter task that bundles process context + files and gets a second model's opinion. Useful as a quality gate in any process -- the "phone a friend" pattern.

### 3. Image Asset Generation Plugin
- **Category**: Tools Integration
- **install.md**: Installs nano-banana-pro dependencies (uv, Python), configures GEMINI_API_KEY. Provides babysitter tasks for image generation (text-to-image) and image editing (image-to-image) at configurable resolutions. Useful for processes that need to generate visual assets (documentation, marketing, UI mockups).

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Cross-Model Code Review | NEW | Second AI model review for code changes with disagreement surfacing and actionable notes | - | specializations/shared/cross-model-code-review.js |
| AI Image Generation Pipeline | NEW | Multi-step image generation: draft → iterate → final with resolution progression | - | specializations/shared/ai-image-generation-pipeline.js |
| Video Content Summarization | NEW | Video transcript extraction and summarization with key segments and action items | - | specializations/shared/video-content-summarization.js |
| Draft-Iterate-Final Resolution Pattern | NEW | Low-resolution drafts for iteration, upscale only when locked (for expensive operations) | - | specializations/shared/draft-iterate-final-resolution.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Web Search Integration (Brave) | NEW | Brave Search API integration for web search and page content extraction | - | plugins/a5c/marketplace/plugins/web-search-integration/ |
| Cross-Model Validation Oracle | NEW | Second model opinion as quality gate with adversarial review pattern | - | plugins/a5c/marketplace/plugins/cross-model-validation-oracle/ |
| Image Asset Generation | NEW | Gemini-powered image generation and editing with configurable resolutions | - | plugins/a5c/marketplace/plugins/image-asset-generation/ |

## Implicit Procedural Knowledge

- **Draft-iterate-final resolution pattern**: nano-banana-pro's workflow of starting at low resolution for fast iteration then upscaling only when prompt is locked. This pattern applies to any expensive generative operation -- do cheap drafts first.
- **Cross-model review as quality gate**: oracle demonstrates using a different model (GPT-5 Pro) to review work done by the primary model. This "adversarial review" pattern is a powerful quality mechanism for babysitter processes.
- **Skill as thin CLI wrapper**: Many skills here are thin SKILL.md wrappers around CLI tools (brave-search, oracle). The pattern of SKILL.md -> bash script -> CLI tool is the most common skill architecture on ClawHub.
