# clawhub/NousResearch/hermes-agent

- **Archetype**: Full-stack AI agent platform with skills, plugins, and learning loop
- **Stars**: 65,657 (GitHub) / Discovered via ClawHub skill author ShawnPana (fork)
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: clawhub-skills (indirect -- ShawnPana/browser-use ClawHub skill led to hermes-agent fork)
- **Skills found**: 25+ skill directories across 15 categories

## Summary

NousResearch's Hermes Agent is a self-improving AI agent with a built-in learning loop, skill system, plugin architecture, multi-platform messaging gateway, and cron scheduler. It is the most feature-rich open-source agent platform found in this research batch.

### Key Architecture Components

- **Skills system**: Organized by domain category (software-development, research, creative, data-science, devops, productivity, social-media, etc.) with SKILL.md files containing structured front matter + procedural content
- **Plugin system**: Context engine and memory plugins (mem0, honcho, openviking, byterover, holographic, retaindb, supermemory, hindsight)
- **Learning loop**: Agent creates skills from experience, improves them during use, builds user model across sessions
- **Multi-platform gateway**: Telegram, Discord, Slack, WhatsApp, Signal, Email
- **Cron scheduler**: Natural language scheduled automations with cross-platform delivery
- **Terminal backends**: Local, Docker, SSH, Daytona, Singularity, Modal (serverless)
- **Trajectory compression**: For training next-gen tool-calling models
- **ACP (Agent Communication Protocol)**: Registry and adapter for agent-to-agent communication
- **Batch runner**: Trajectory generation for reinforcement learning
- **Toolset distributions**: Configurable toolset combinations

### Notable Skills

1. **software-development/systematic-debugging**: 4-phase root cause investigation with "Iron Law: NO FIXES WITHOUT ROOT CAUSE" -- extremely well structured
2. **software-development/test-driven-development**: Full TDD workflow skill
3. **software-development/writing-plans**: Planning methodology
4. **software-development/subagent-driven-development**: Multi-agent delegation patterns
5. **software-development/requesting-code-review**: Code review workflow
6. **research/research-paper-writing**: End-to-end ML paper pipeline (experiment design -> analysis -> drafting -> revision -> submission) targeting NeurIPS/ICML/ICLR/ACL/AAAI/COLM with statistical analysis, citation verification, and iterative feedback loops
7. **research/arxiv**: arXiv paper discovery and analysis
8. **creative/creative-ideation**: Constraint-driven project generation with rich constraint library
9. **creative/songwriting-and-ai-music**: Music creation workflow
10. **creative/manim-video**: Mathematical animation creation
11. **productivity/linear**: Linear issue tracker integration
12. **autonomous-ai-agents/**: Skills for claude-code, codex, hermes-agent, opencode agent management

### Memory Plugins

9 memory backend integrations: mem0, honcho, openviking, byterover, holographic, retaindb, supermemory, hindsight -- each providing different persistence and retrieval strategies.

## Assessment

**HIGHEST VALUE** -- This is the single most valuable repository discovered in this batch, and possibly the most valuable external reference repo for babysitter overall. Reasons:

1. **Skills architecture is directly comparable to babysitter's process library**: Same SKILL.md pattern, same domain categorization, same structured front matter with metadata
2. **Learning loop patterns**: Hermes Agent's self-improving skill creation could inform babysitter's retrospect and process improvement workflows
3. **Research paper writing pipeline**: One of the most sophisticated domain-specific skills seen anywhere -- iterative multi-phase workflow with feedback loops, perfect for babysitter process extraction
4. **Systematic debugging methodology**: Already proven and battle-tested, with clear phases and "Iron Law" enforcement
5. **Multi-platform delivery model**: Gateway pattern for Telegram/Discord/Slack could inform babysitter's harness adapter architecture
6. **Trajectory compression**: Token optimization patterns relevant to babysitter's compression layer
7. **Cron scheduler integration**: Natural language cron patterns relevant to babysitter's scheduled orchestration

## Extraction Priority

**P0 -- Highest priority extraction target**

### Processes

1. **Research Paper Writing Pipeline** (specializations/domains/science/ml-research/): 8-phase iterative pipeline covering literature review, experiment design, execution/monitoring, analysis, drafting, self-review, revision, and submission. Targets NeurIPS/ICML/ICLR/ACL/AAAI/COLM. Includes statistical analysis, citation verification, and feedback loops.

2. **Systematic Debugging Methodology** (methodologies/): 4-phase root cause investigation with strict "no fixes without understanding" enforcement. Directly maps to a babysitter process with breakpoint gates between phases.

3. **Creative Ideation Process** (specializations/domains/creative/): Constraint-driven project generation with rich constraint library across developer, artist, writer, and maker domains.

4. **Subagent-Driven Development** (methodologies/): Multi-agent delegation patterns for parallel workstream execution with coordination protocols.

5. **Self-Improving Skill Creation** (methodologies/): Meta-process for creating new skills from agent experience, improving them during use, and maintaining a skill library.

### Plugin Ideas

1. **Hermes Gateway Bridge Plugin**: Enable babysitter to receive work from Telegram/Discord/Slack via Hermes Agent's gateway protocol, extending babysitter's reach beyond CLI harnesses.

2. **Trajectory Compression Plugin**: Adapt Hermes Agent's trajectory_compressor.py for babysitter's run journal compression, reducing storage and improving replay performance.

3. **Memory Backend Abstraction Plugin**: Abstract over multiple memory backends (mem0, honcho, etc.) for babysitter's state persistence, similar to Hermes Agent's plugin/memory architecture.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Research Paper Writing Pipeline | NEW | 8-phase ML research paper pipeline targeting top-tier conferences | - | specializations/academic-research/research-paper-writing.js |
| Systematic Debugging Methodology | UPGRADE | 4-phase root cause investigation with "Iron Law: NO FIXES WITHOUT ROOT CAUSE" | library/methodologies/debugging/ | methodologies/systematic-debugging/ |
| Creative Ideation Process | NEW | Constraint-driven project generation with rich constraint library | - | specializations/creative/creative-ideation-process.js |
| Subagent-Driven Development | NEW | Multi-agent delegation patterns for parallel workstream execution | - | methodologies/subagent-driven-development/ |
| Self-Improving Skill Creation | NEW | Meta-process for creating and improving skills from agent experience | - | methodologies/self-improving-skill-creation/ |
| Test-Driven Development Workflow | UPGRADE | Complete TDD methodology with breakpoint gates and validation | library/methodologies/tdd/ | methodologies/tdd/ |
| Code Review Request Process | NEW | Structured code review workflow with preparation and submission | - | specializations/shared/code-review-request-process.js |
| ArXiv Paper Discovery and Analysis | NEW | Academic paper discovery, analysis, and integration workflow | - | specializations/academic-research/arxiv-paper-analysis.js |
| Linear Issue Management | NEW | Linear project management integration and workflow automation | - | specializations/business/linear-issue-management.js |
| Multi-Platform Messaging Gateway | NEW | Cross-platform agent communication via Telegram/Discord/Slack | - | specializations/shared/multi-platform-messaging-gateway.js |
| Natural Language Cron Scheduling | NEW | Natural language scheduled automation with cross-platform delivery | - | specializations/shared/natural-language-cron-scheduling.js |
| Agent Communication Protocol (ACP) | NEW | Registry and adapter for agent-to-agent communication | - | specializations/shared/agent-communication-protocol.js |
| Trajectory Compression Patterns | UPGRADE | Token optimization for agent interaction compression | library/compression/ | specializations/shared/trajectory-compression-patterns.js |
| Toolset Distribution Management | NEW | Configurable toolset combinations for different agent configurations | - | specializations/shared/toolset-distribution-management.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Hermes Gateway Bridge | NEW | Telegram/Discord/Slack integration for babysitter via Hermes Agent gateway | - | plugins/a5c/marketplace/blueprints/hermes-gateway-bridge/ |
| Trajectory Compression | NEW | Hermes-inspired trajectory compression for babysitter run journal optimization | - | plugins/a5c/marketplace/blueprints/trajectory-compression/ |
| Memory Backend Abstraction | NEW | Multi-backend memory persistence (mem0, honcho, etc.) for babysitter state | - | plugins/a5c/marketplace/blueprints/memory-backend-abstraction/ |
| Research Paper Assistant | NEW | Complete ML research paper pipeline with conference targeting and feedback loops | - | plugins/a5c/marketplace/blueprints/research-paper-assistant/ |
