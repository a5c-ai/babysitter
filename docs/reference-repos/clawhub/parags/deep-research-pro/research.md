# parags/deep-research-pro

- **Archetype**: methodology-repo
- **Stars**: 1
- **Last pushed**: 2026-02-03
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: ClawHub skills
- **Skills found**: 1

## Summary

A multi-source deep research agent skill for OpenClaw/Clawdbot. Implements a 6-step research methodology: understand goal, plan sub-questions, execute multi-source search (DuckDuckGo web + news), deep-read key sources, synthesize cited report, save and deliver. No API keys required. Includes Python DDG search script and curl-based page reading.

The skill defines a clear, replayable research workflow with quality rules (every claim needs a source, cross-reference, recency preference, acknowledge gaps, no hallucination). Reports follow a structured template with executive summary, themed sections with inline citations, key takeaways, and methodology notes.

## Assessment

The research methodology is well-structured and directly maps to a babysitter process. The 6-step workflow (clarify -> plan sub-questions -> multi-source search -> deep-read -> synthesize -> deliver) is a clean multi-phase process with clear inputs/outputs at each stage. The quality rules are codifiable as verification criteria.

Low star count but high methodology quality. The DDG search dependency is ClawHub-specific but the methodology itself is tool-agnostic.

## Extraction Priority
- High
- Rationale: Clean multi-step research methodology that maps directly to a babysitter process. The plan-search-synthesize pattern is domain-agnostic and reusable. Good candidate for specializations/shared/ or specializations/research/.

# Extractable Value: parags/deep-research-pro

## Processes

- **deep-research**: Multi-source research with cited report synthesis
  - Source: SKILL.md 6-step workflow
  - Placement: specializations/shared/deep-research
  - Complexity: moderate
  - Steps: (1) Clarify goal with 1-2 questions, (2) Break topic into 3-5 sub-questions, (3) Execute multi-source search with keyword variations, (4) Deep-read 3-5 key sources, (5) Synthesize structured report with inline citations, (6) Save and deliver
  - Quality gates: Every claim sourced, cross-referencing required, recency preference, gap acknowledgment, no hallucination
  - Output template: Executive summary, themed sections with citations, key takeaways, sources list, methodology notes

## Plugin Ideas

None directly. The DDG search dependency is ClawHub-specific infrastructure, not a babysitter plugin pattern.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Deep Research Methodology | NEW | 6-step research workflow: clarify → plan sub-questions → multi-source search → deep-read → synthesize → deliver | - | specializations/shared/deep-research-methodology.js |
| Sub-Question Decomposition | NEW | Breaking research topics into 3-5 orthogonal sub-questions for systematic coverage | - | specializations/shared/sub-question-decomposition.js |
| Multi-Keyword Search Strategy | NEW | 2-3 keyword variations per sub-question with web/news source mixing | - | specializations/shared/multi-keyword-search-strategy.js |
| Confidence-Scored Report Generation | NEW | Research report synthesis with High/Medium/Low confidence ratings based on source quality | - | specializations/shared/confidence-scored-report-generation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | No plugin ideas identified - DDG search dependency is ClawHub-specific | - | N/A |

## Implicit Procedural Knowledge

- **Sub-question decomposition pattern**: Breaking a research topic into 3-5 orthogonal sub-questions before searching is a reusable strategy for any information-gathering process.
- **Multi-keyword search strategy**: Using 2-3 keyword variations per sub-question, mixing web + news sources, and aiming for 15-30 unique sources provides a template for thorough coverage.
- **Confidence scoring**: The report includes a High/Medium/Low confidence rating based on source quality and cross-referencing, which maps well to babysitter breakpoint decisions.
- **Sub-agent delegation pattern**: The SKILL.md includes explicit sub-agent spawn instructions with task description, model selection, and wake-on-completion -- directly relevant to babysitter orchestrator task patterns.
