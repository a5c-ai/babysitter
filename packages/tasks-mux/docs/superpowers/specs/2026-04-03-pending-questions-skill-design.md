# Pending Questions Skill Design

## Purpose

A Claude Code skill for the **expert-answering side** of the BMUX system. A human expert uses Claude Code as an assistant to check for pending questions, get enriched context, review AI-proposed draft answers, and submit answers.

Counterpart to the existing `skills/ask-expert/SKILL.md` which covers the question-asking side.

## Target User

A human domain expert using Claude Code. The agent does the legwork (context enrichment, code analysis, draft answer generation) and the expert provides judgment, edits, and approval before submission.

## Trigger Conditions

The skill activates when the user:
- Wants to check for pending expert questions ("any questions for me?", "check my queue", "/pending-questions")
- Wants to answer a specific question by ID
- Wants to continuously monitor for incoming questions ("keep watching for questions")

## Workflow

### On-Demand Mode (default)

1. **Resolve expert identity** (see Identity Resolution below)
2. **Poll** via `poll_breakpoints` with the expert's ID
3. **Present** pending questions in a summary (ID, question text, tags, urgency, created time)
4. **Expert selects** a question to answer (or agent picks if only one)
5. **Claim** the question via `claim_breakpoint`
6. **Enrich context**: read referenced files, analyze code snippets, check git history for relevant changes
7. **Propose draft answer** based on analysis of the question and enriched context
8. **Expert reviews** the draft via AskUserQuestion -- approve, edit, or reject
9. **Submit** via `respond_to_breakpoint` with the expert's identity and confidence level
10. **Return to queue** -- offer to answer the next question or exit

### Continuous Mode

Activated when the expert says "keep watching", "monitor", or passes `--loop`.

1. Poll with `waitSeconds` for long-polling (30s intervals)
2. When questions arrive, present them and enter the interactive answer flow
3. After answering (or skipping), resume polling
4. Exit on explicit request ("stop watching", Ctrl+C)

## Expert Identity Resolution

Resolution order (first match wins):

1. **Explicit arguments**: expert ID/name passed directly to the skill
2. **Environment variables**: `BMUX_EXPERT_ID` and `BPX_EXPERT_NAME`
3. **GitHub auto-detection**: When routing config uses the GitHub Issues backend (`defaultBackend: "github-issues"` in `.a5c/routing.json` or `BMUX_BACKEND=github-issues`), detect the authenticated GitHub user via `gh api user --jq .login`. The GitHub login IS the expert ID for the GitHub Issues backend (it maps to issue assignees).
4. **Prompt**: Ask the expert for their ID as a last resort.

Cache the resolved identity for the session to avoid repeated lookups.

## Context Enrichment

When presenting a question to the expert, the skill enriches context by:

- **Reading referenced files**: If the question context includes `fileReferences`, read those files from the workspace and summarize relevant sections.
- **Analyzing code snippets**: If the question includes `codeSnippets`, analyze them in the context of the codebase.
- **Checking git history**: If the question relates to recent changes, run `git log` / `git diff` to surface relevant commits.
- **Resolving links**: If the question includes links (e.g., PR URLs, issue URLs), fetch metadata via `gh` CLI.

This is the key value-add -- the agent handles reconnaissance so the expert focuses on judgment.

## Draft Answer Generation

The agent proposes a draft answer by:

1. Synthesizing the enriched context with the question
2. Structuring the answer clearly (recommendation, reasoning, caveats)
3. Including confidence assessment
4. Suggesting references (files, docs, PRs) that support the answer

The expert then reviews, edits, sets their confidence level (0-100), and approves for submission.

## MCP Tools Used

| Tool | Phase | Purpose |
|------|-------|---------|
| `poll_breakpoints` | Poll | Find pending questions for this expert |
| `claim_breakpoint` | Claim | Signal intent to answer |
| `respond_to_breakpoint` | Submit | Submit the final answer |
| `check_breakpoint_status` | Optional | Check status of a specific question |
| `cancel_breakpoint` | Optional | Cancel if expert decides to pass |
| `list_responders` | Identity | Verify expert ID is valid |

## File Location

`skills/pending-questions/SKILL.md` -- alongside the existing `skills/ask-expert/SKILL.md`.

## Backend Support

Works with both backends transparently:
- **BMUX HTTP server**: Uses ServerClient-based polling and answer submission
- **GitHub Issues**: Uses GitHub API -- questions are issues, answers are comments, experts are assignees

The skill does not need to know which backend is active; the MCP tools handle routing via the backend resolver.

## Non-Goals

- The skill does NOT handle the question-asking side (covered by `ask-expert`)
- The skill does NOT check status of questions the user submitted (use `check_breakpoint_status` directly)
- The skill does NOT create a new MCP tool or CLI command -- it orchestrates existing tools
