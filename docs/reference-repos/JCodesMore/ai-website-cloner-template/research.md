# JCodesMore/ai-website-cloner-template

- **URL**: https://github.com/JCodesMore/ai-website-cloner-template
- **Stars**: 10,759
- **License**: MIT
- **Last pushed**: 2026-03-30
- **Description**: Clone any website with one command using AI coding agents

## Overview

A reusable template for reverse-engineering any website into a clean, modern Next.js codebase using AI coding agents. The `/clone-website` skill runs a multi-phase pipeline: reconnaissance, foundation, component specs, parallel build (dispatching builder agents in git worktrees), and assembly + QA.

## Architecture

- Next.js 16 + React 19 + shadcn/ui + Tailwind CSS v4 scaffold
- Multi-agent architecture: a foreman agent extracts and specs, then dispatches parallel builder agents in git worktrees
- Browser MCP required for extraction (Chrome MCP, Playwright MCP, etc.)
- Supports 13+ AI agent platforms (Claude Code, Codex, Cursor, Gemini, Copilot, etc.)
- Skills exported to `.claude/skills/`, `.codex/skills/`, `.github/skills/` (identical content)

## The Clone-Website Skill (Detailed)

An exceptionally well-crafted skill definition (~400+ lines) with deep extraction methodology:

### Guiding Principles
1. **Completeness beats speed** -- every builder gets everything needed, no guessing
2. **Small tasks, perfect results** -- complexity budget rule: if spec exceeds ~150 lines, break it down
3. **Real content, real assets** -- extract actual text/images/SVGs, not mockups
4. **Foundation first** -- global CSS tokens, TypeScript types, global assets before any parallel work
5. **Extract appearance AND behavior** -- computed CSS + interaction triggers, transitions, scroll behaviors
6. **Identify interaction model before building** -- scroll-driven vs click-driven vs hover-driven determination
7. **Extract every state, not just default** -- tab states, scroll states, hover states
8. **Spec files are source of truth** -- every component gets a spec file before builder dispatch
9. **Build must always compile** -- `tsc --noEmit` for builders, `npm run build` for final assembly

### Multi-Phase Pipeline
1. Reconnaissance -- screenshots, design token extraction, interaction sweep
2. Foundation -- fonts, colors, globals, asset downloads
3. Component Specs -- detailed spec files with exact computed CSS
4. Parallel Build -- dispatches builder agents in git worktrees, one per section/component
5. Assembly & QA -- merge worktrees, wire up page, visual diff against original

## Extractable Value for Babysitter

### Processes (specializations/domains/)
1. **Website reverse-engineering process** -- The multi-phase pipeline (recon, foundation, spec, parallel-build, assembly+QA) is a well-structured process with clear phase gates, parallel agent dispatch, and quality verification. Could be `specializations/domains/web-development/website-cloning.js`.

### Methodologies
1. **Parallel worktree builder pattern** -- The pattern of writing detailed spec files, then dispatching independent builder agents in git worktrees with those specs, then merging -- is a reusable methodology for any large parallel construction task. Generalizable beyond web cloning.
2. **Spec-then-build decomposition** -- The "complexity budget rule" (>150 lines = split) and the principle of spec files as source-of-truth contracts between extraction and building phases.

## Processes

### 1. Website Reverse-Engineering Process
- **Source**: Multi-phase pipeline (recon → foundation → spec → parallel-build → assembly+QA)
- **Placement**: `specializations/frontend/website-reverse-engineering.js`
- **Description**: Multi-phase website cloning: reconnaissance (screenshots, design tokens, interaction sweep) → foundation (fonts, colors, globals, asset downloads) → component specs → parallel build (dispatch builder agents in git worktrees) → assembly & QA (merge worktrees, visual diff).

## Plugin Ideas

- **Website Cloning Template**: Babysitter marketplace plugin for reverse-engineering websites into modern codebases using parallel agent dispatch and git worktree methodology.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Website Reverse-Engineering Process | NEW | Multi-phase website cloning with parallel agent dispatch in git worktrees | - | specializations/frontend/website-reverse-engineering.js |
| Parallel Worktree Builder Pattern | NEW | Methodology for parallel construction using spec files and git worktree dispatch | - | methodologies/parallel-worktree-builder/ |
| Spec-Then-Build Decomposition | NEW | Complexity budget rule (>150 lines = split) with spec-as-contract methodology | - | methodologies/spec-then-build-decomposition/ |
| Multi-Agent Parallel Dispatch | NEW | Pattern for dispatching independent agents with detailed specs in isolated environments | - | specializations/shared/multi-agent-parallel-dispatch.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Website Cloning Template | NEW | Multi-agent website reverse-engineering with parallel git worktree builders | - | plugins/a5c/marketplace/plugins/website-cloning-template/ |

## Classification

- **Archetype**: Multi-agent website cloning template with parallel execution
- **Primary value**: The parallel worktree builder pattern and spec-then-build methodology are genuinely novel and reusable. The skill itself is a masterclass in detailed agent instruction writing.
- **Skip**: The Next.js scaffold, the website cloning use case itself (too domain-specific for methodologies/)
