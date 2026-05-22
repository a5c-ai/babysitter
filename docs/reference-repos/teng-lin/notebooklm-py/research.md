# teng-lin/notebooklm-py

## Metadata
- **Stars**: 10,300
- **License**: MIT
- **Last pushed**: 2026-04-05
- **Topics**: agentic-skill, api, claude, claude-skills, google-notebooklm, notebooklm-api, python, sdk, skills
- **Fork**: No

## Overview
Unofficial Python API and agentic skill for Google NotebookLM. Full programmatic access to NotebookLM features — notebooks, sources (URLs, PDFs, YouTube, Drive), chat, research agents, content generation (audio/video overviews, slide decks, quizzes, flashcards, infographics, reports, mind maps), sharing, and downloads. Ships with SKILL.md for Claude Code/Codex integration.

## Architecture
- Python package (`pip install notebooklm-py`) with CLI and Python API
- SKILL.md at repo root for agent discovery
- AGENTS.md for Codex guidance
- CLAUDE.md for Claude Code guidance
- Uses undocumented Google APIs (fragile, unofficial)

## Extractable Value

### Plugin idea: notebooklm-integration
A babysitter marketplace plugin that wraps notebooklm-py as a tool for research workflows. Would enable processes to:
- Create notebooks from research sources
- Generate audio/video overviews of research findings
- Create quizzes and flashcards for learning material
- Export mind maps and data tables
- Run web/Drive research queries with auto-import

This is a legitimate tool-integration plugin (install.md-driven) that adds research capabilities to babysitter processes. The API surface is rich enough to warrant a dedicated plugin rather than inline usage.

## Classification
- **Archetype**: Tool API + agent skill
- **Primary value**: Plugin idea for NotebookLM integration in research workflows
- **Process placement**: N/A (tool integration, not a methodology)

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Research Workflow with NotebookLM | NEW | Automated research workflow using NotebookLM for source management and content generation | - | specializations/shared/research-workflow-notebooklm.js |
| Content Generation Pipeline | NEW | Multi-format content creation process (audio/video overviews, slides, quizzes, reports, mind maps) | - | specializations/shared/content-generation-pipeline.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| NotebookLM Integration | NEW | NotebookLM API wrapper for research workflows with content generation capabilities | - | plugins/a5c/marketplace/plugins/notebooklm-integration/ |
