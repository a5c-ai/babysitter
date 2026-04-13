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
Harness assimilation opportunity — create a plugin FOR hermes-agent that integrates babysitter orchestration into the hermes ecosystem. Hermes already has a rich tool ecosystem, messaging gateway, and skill creator. A babysitter-hermes adapter plugin would enable hermes users to access babysitter's process library and deterministic orchestration capabilities within their existing hermes workflows.

## Classification
- **Archetype**: Full agent framework with skills ecosystem
- **Primary value**: Harness assimilation opportunity; research-paper-writing process (duplicate of Orchestra-Research)
- **SKIP reasoning for most content**: Software dev skills overlap with existing babysitter methodologies. Memory system is agent-internal (memory as processes = skip). Skill management is SDK-covered. Multi-model coordination is skip.
