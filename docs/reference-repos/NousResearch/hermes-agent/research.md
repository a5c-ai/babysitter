# NousResearch/hermes-agent

## Metadata
- **Stars**: 65,493
- **License**: MIT
- **Last pushed**: 2026-04-12
- **Topics**: ai, ai-agent, claude, claude-code, codex, hermes, hermes-agent, llm, nous-research, openclaw
- **Fork**: No

## Overview
Self-improving AI agent by Nous Research (formerly OpenClaw). Features a built-in learning loop — creates skills from experience, improves them during use, persistent memory, cross-session recall, user modeling. Supports Telegram, Discord, Slack, WhatsApp, Signal. Runs on local machines, Docker, SSH, Daytona, Singularity, Modal. 65K+ stars makes it one of the most popular agent projects.

## Architecture
- Python-based agent with CLI (`hermes`) and messaging gateway
- Skills system organized by category: research, software-development, productivity, creative, devops, gaming, social-media, etc.
- Skills follow SKILL.md format (compatible with agentskills.io spec)
- Software development skills include: TDD, code review, systematic debugging, subagent-driven-development, writing-plans
- Research skills: arxiv, blogwatcher, research-paper-writing, polymarket, llm-wiki
- Optional skills in separate directory
- Built-in skill creator — agent creates skills from successful task patterns
- ClawHub integration for skill marketplace
- Cron scheduling, subagent delegation, trajectory compression for RL training

## Extractable Value

### Process: specializations/science/research-paper-writing
The research-paper-writing skill (authored by Orchestra Research, shipped in hermes) is a comprehensive 7-phase pipeline for ML/AI papers. Already identified via Orchestra-Research repo — same content.

### Methodology patterns (already covered by babysitter)
The software-development skills (TDD, code review, debugging, plans, subagent-driven-development) overlap significantly with babysitter's existing methodologies/ and the superpowers skills. No new methodology to extract.

### Harness Integration: hermes-agent adapter

**Capability Assessment for Babysitter Integration:**

| Capability | Status | Details |
|------------|---------|---------|
| **Custom Tools/MCP** | ✅ SUPPORTED | Python-based plugin system with `ctx.register_tool()`. Custom handlers follow `def my_handler(args: dict, **kwargs) -> str` pattern |
| **Stop Hooks** | ❌ NOT SUPPORTED | 6 lifecycle hooks available (`pre_tool_call`, `post_tool_call`, `pre_llm_call`, `post_llm_call`, `on_session_start`, `on_session_end`) but **no interruption hooks to stop agent mid-conversation** |
| **Plugin System** | ✅ SUPPORTED | Robust plugin.yaml manifest system with tool/hook registration, environment variable prompting, CLI subcommand registration, plugin marketplace support |

**Integration Viability:** PARTIAL - Hermes has excellent plugin infrastructure and tool execution but **lacks critical stop-hook capability** needed for babysitter's orchestration loop where the harness must be interrupted between iterations for feedback.

**Harness assimilation opportunity** — Create a plugin FOR hermes-agent that integrates babysitter orchestration into the hermes ecosystem. However, integration would require developing a custom mechanism to pause/resume hermes conversations since native stop hooks don't exist.

## Processes

None extractable. Software development skills overlap with existing babysitter methodologies, and research-paper-writing process is duplicate of Orchestra-Research content.

## Plugin Ideas

None suitable for babysitter marketplace. Primary value is harness assimilation opportunity (plugin FOR hermes-agent, not babysitter marketplace plugin).

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No new processes identified - content overlaps with existing babysitter methodologies | methodologies/ | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | No babysitter marketplace plugins identified - primary value is harness integration | - | N/A |

## Classification
- **Archetype**: Full agent framework with skills ecosystem
- **Primary value**: Harness assimilation opportunity; research-paper-writing process (duplicate of Orchestra-Research)
- **SKIP reasoning for most content**: Software dev skills overlap with existing babysitter methodologies. Memory system is agent-internal (memory as processes = skip). Skill management is SDK-covered. Multi-model coordination is skip.
