# daymade/claude-code-skills

- **Archetype**: mega-skill-pack
- **Stars**: 822
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 51

## Summary
Massive collection of 51 Claude Code skills organized as a marketplace. Covers an extraordinarily diverse range: research (deep-research with lead agent + subagent architecture, competitors-analysis, product-analysis), development (iOS-APP-developer, terraform, cloudflare-troubleshooting), media (ASR transcribe, video-comparer, youtube-downloader, capture-screen), productivity (excel-automation, i18n-expert, github-ops, github-contributor), documentation (suites/daymade-docs/ with 6 doc skills), content (wechat-article-scraper, twitter-reader, teams-channel-post-writer), DevOps (tunnel-doctor, windows-remote-desktop-connection-doctor), and meta-skills (skill-creator, skill-reviewer, skills-search, marketplace-dev). The deep-research skill is standout -- a multi-agent architecture with lead coordinator + parallel subagents for context-efficient research.

## Assessment
HIGH VALUE. The deep-research skill alone justifies high priority: it implements a lead agent + subagent architecture where subagents write distilled notes to files, achieving ~60-70% context reduction. The six-phase pipeline (environment setup -> task board -> parallel dispatch -> citation registry -> evidence-mapped outline -> counter-review -> verify -> polish) is a sophisticated methodology. The source governance model (source types, freshness checks, circular verification forbidden) adds rigor. Beyond deep-research, the collection demonstrates remarkable breadth across domains. The daymade-docs suite (doc-to-markdown, docs-cleaner, meeting-minutes, mermaid-tools, pdf-creator, ppt-creator) is a cohesive document workflow. The meta-skills (skill-creator, skill-reviewer, skills-search) form a self-sustaining skill ecosystem.

## Extraction Priority
- High
- Rationale: deep-research is a sophisticated multi-agent research methodology directly extractable as a babysitter process. The lead agent + subagent pattern with file-based context passing maps perfectly to babysitter's orchestration model. The document suite and meta-skills provide additional extraction targets.

## Processes
- **Deep Research Process**: Setup source policy -> build research task board with roles/queries/parallel groups -> dispatch subagents in parallel -> build citation registry with source_type + as_of + authority -> create evidence-mapped outline with counter-claim flags -> draft from notes (never from raw search) -> counter-review (claims, confidence, alternatives) -> verify traceability -> polish with confidence markers. A 7-phase babysitter process with parallel subagent dispatch.
- **Document Conversion Suite**: 6 interconnected document workflows (Markdown conversion, cleaning, meeting minutes, Mermaid diagrams, PDF creation, PPT creation) that could be a babysitter process library under specializations/shared/document-processing.
- **Skill Development Lifecycle**: skill-creator -> skill-reviewer -> skills-search -> marketplace-dev. A meta-process for creating, evaluating, and distributing skills.
- **Competitive Analysis Process**: Research competitors -> analyze product positioning -> compare features -> generate report. Extractable to specializations/business/competitive-analysis.

## Plugin Ideas
- **Deep Research plugin**: Install.md-driven plugin implementing the lead agent + subagent research architecture with source governance, citation registry, and counter-review. Configurable for enterprise research, general research, standard, or lightweight modes.
- **Document Processing Suite plugin**: Bundle of 6 document skills (Markdown, cleaning, meeting minutes, diagrams, PDF, PPT) as a cohesive document workflow plugin.
- **Skill Ecosystem Toolkit plugin**: Meta-skills for creating, reviewing, searching, and publishing skills. A self-bootstrapping skill development environment.

## Patterns
- **Lead agent + subagent architecture**: Coordinator agent dispatches parallel subagents who write distilled notes to files. Lead agent synthesizes from notes only, never from raw search results. ~60-70% context reduction.
- **Source governance model**: Source types, as_of freshness checks, authority levels, circular verification forbidden, exclusive advantage encouraged. Adds rigor to research processes.
- **Citation registry**: Structured tracking of every source with type, freshness date, authority level. Enables traceability verification in final output.
- **Counter-review phase**: Mandatory phase that challenges claims, assesses confidence levels, and identifies alternatives. Prevents confirmation bias in research.
- **Mode selection matrix**: Two dimensions (topic mode x depth mode) producing four configurations. Clean parameterization of process behavior.
- **Document workflow suite**: Cohesive set of related skills (suites/daymade-docs/) that share context and can be chained. A skill-suite organizational pattern.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Deep Research Process | UPGRADE | 7-phase multi-agent research with source governance and citation registry | library/specializations/shared/research-methodologies.js | specializations/academic-research/deep-research-process.js |
| Lead Agent + Subagent Architecture | NEW | Coordinator-subagent pattern with file-based context passing and 60-70% reduction | - | specializations/shared/lead-agent-subagent-architecture.js |
| Document Conversion Suite | NEW | 6-skill document processing workflow (Markdown, cleaning, minutes, diagrams, PDF, PPT) | - | specializations/shared/document-conversion-suite.js |
| Skill Development Lifecycle | NEW | Meta-process for creating, reviewing, searching, and publishing skills | - | methodologies/skill-development-lifecycle/ |
| Competitive Analysis Process | NEW | Systematic competitor research and product positioning analysis | - | specializations/business/competitive-analysis-process.js |
| Source Governance Framework | NEW | Research source validation with types, freshness, authority, and verification rules | - | specializations/academic-research/source-governance-framework.js |
| Citation Registry Management | NEW | Structured source tracking with traceability verification | - | specializations/academic-research/citation-registry-management.js |
| Counter-Review Methodology | NEW | Bias prevention through claim challenge and confidence assessment | - | specializations/shared/counter-review-methodology.js |
| iOS App Development Process | NEW | iOS development workflow with Swift and Xcode patterns | - | specializations/business/ios-app-development.js |
| DevOps Troubleshooting Suite | NEW | Tunnel doctor and Windows RDP connection diagnostic workflows | - | specializations/devops-sre-platform/devops-troubleshooting-suite.js |
| Media Processing Automation | NEW | ASR transcription, video comparison, and screen capture workflows | - | specializations/creative/media-processing-automation.js |
| Excel Automation Workflows | NEW | Spreadsheet automation and data processing methodologies | - | specializations/business/excel-automation-workflows.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| ASR Transcription Integration | NEW | Automated Speech Recognition API integration for media processing workflows | - | plugins/a5c/marketplace/blueprints/asr-transcription-integration/ |
