# wshobson/agents

**Repository**: https://github.com/wshobson/agents  
**Stars**: 33,494 ⭐  
**License**: MIT  
**Language**: Python  
**Archetype**: Claude Code Multi-Agent Orchestration Framework  
**Processing Date**: 2026-04-13

## Overview

A comprehensive production-ready system combining 182 specialized AI agents, 16 multi-agent workflow orchestrators, 149 agent skills, and 96 commands organized into 77 focused, single-purpose plugins for Claude Code. This represents one of the largest organized collections of agent orchestration patterns and workflows.

## Repository Structure

```
wshobson/agents/
├── .claude-plugin/          # Claude Code plugin configuration
├── plugins/                 # 77 focused plugins (main content)
│   ├── accessibility-compliance/
│   ├── agent-orchestration/
│   └── ...
├── docs/                    # Comprehensive documentation
│   ├── plugins.md           # Plugin reference
│   ├── agents.md            # Agent reference
│   ├── agent-skills.md      # Skills documentation
│   ├── usage.md             # Usage patterns
│   └── architecture.md      # Design principles
└── tools/                   # Supporting tooling
```

## Key Features & Architectural Patterns

### Granular Plugin Architecture
- **77 focused plugins** optimized for minimal token usage and composability
- Average 3.6 components per plugin (follows Anthropic's 2-8 pattern)
- Each plugin completely isolated with its own agents, commands, and skills
- Install only what you need - no unnecessary resources loaded into context

### Agent Orchestration Models
- **182 specialized agents** across domain expertise areas
- **16 workflow orchestrators** for complex multi-agent operations
- **Progressive disclosure** - skills load knowledge only when activated
- **Three-tier model strategy** for Opus 4.6, Sonnet 4.6 & Haiku 4.5

### Skills System (149 Skills)
- Modular knowledge packages with progressive disclosure
- Token efficiency through selective loading
- Specialized expertise across domains
- Compatible with agent orchestration patterns

## Notable Orchestration Patterns

### Multi-Agent Review Systems
- `comprehensive-review` plugin with architect-review, code-reviewer, security-auditor
- Parallel analysis with different perspectives
- Coordinated feedback synthesis

### Full-Stack Orchestration
- `full-stack-orchestration` plugin for complex development workflows
- Multi-agent coordination for end-to-end development
- Phase-based execution with handoffs

### Agent Teams (Experimental)
- Parallel code review with specialized reviewers
- Hypothesis-driven debugging with multiple agents
- Research teams with parallel investigation streams

### Context-Driven Development (Conductor Plugin)
- Structured Context → Spec & Plan → Implement workflow
- Track-based development with semantic organization
- TDD workflow with verification checkpoints

## Quality Framework (PluginEval)

Three-layer evaluation framework:
- **Static analysis** (instant)
- **LLM judge** (semantic)
- **Monte Carlo simulation** (statistical)

Quality dimensions:
- Triggering accuracy, orchestration fitness, output quality
- Scope calibration, progressive disclosure, token efficiency
- Robustness, structural completeness, ecosystem coherence

## Technology Integration

- **Claude Code** as primary harness
- **Agent Skills** for knowledge management
- **Plugin marketplace** distribution model
- **Makefile** for development automation
- **CI/CD** integration patterns

## Extractable Processes

### Core Orchestration Patterns
1. **Multi-perspective review processes** - parallel expert analysis
2. **Progressive skill disclosure** - token-efficient knowledge loading
3. **Plugin composition strategies** - modular system assembly
4. **Agent handoff protocols** - structured workflow transitions

### Development Methodologies
1. **Context-driven development** - vision → spec → implementation
2. **Track-based organization** - semantic work unit management
3. **Verification checkpoint patterns** - quality gates in workflows
4. **Semantic revert strategies** - logical undo operations

### Quality Assurance Frameworks
1. **Multi-layer evaluation** - static, semantic, statistical analysis
2. **Anti-pattern detection** - automated quality assessment
3. **Statistical rigor** - Wilson score CI, bootstrap validation
4. **CI gate integration** - threshold-based quality control

## Value for Babysitter Marketplace

**High Value** - This repository contains the most comprehensive collection of agent orchestration patterns discovered, with well-documented architectural principles and proven workflows. The progressive disclosure patterns, multi-agent coordination strategies, and quality evaluation frameworks provide substantial value for babysitter process development.

### Key Extractable Elements
- Multi-agent orchestration patterns for complex workflows
- Progressive disclosure mechanisms for token efficiency
- Quality evaluation frameworks with statistical rigor
- Plugin composition and modular architecture principles

## Classification

**Category**: Multi-Agent Orchestration Framework  
**Subcategory**: Claude Code Plugin Ecosystem  
**Complexity**: Enterprise-grade  
**Maturity**: Production-ready  
**Adoption**: High (33K+ stars, active development)

## Research Notes

This repository represents the current state-of-the-art in Claude Code agent orchestration, with sophisticated approaches to:
- Token efficiency through modular loading
- Multi-agent coordination patterns
- Quality measurement and validation
- Enterprise-scale deployment patterns

The architectural principles and orchestration patterns here could significantly inform babysitter's multi-agent workflow capabilities.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Multi-Perspective Review Processes | NEW | Parallel expert analysis with perspective coordination | - | specializations/shared/multi-perspective-review.js |
| Progressive Skill Disclosure | NEW | Token-efficient knowledge loading | - | specializations/shared/progressive-disclosure.js |
| Agent Handoff Protocols | NEW | Structured workflow transitions between specialized agents | - | specializations/shared/agent-handoff-protocols.js |
| Context-Driven Development | NEW | Vision → spec → implementation methodology | - | methodologies/context-driven-development/ |
| Track-Based Organization | NEW | Semantic work unit management | - | specializations/shared/track-based-organization.js |
| Multi-Layer Quality Evaluation | NEW | Static, semantic, statistical analysis framework | - | specializations/shared/multi-layer-evaluation.js |
| Plugin Composition Strategies | NEW | Modular system assembly patterns | - | specializations/shared/plugin-composition.js |
| Agent Team Coordination | NEW | Multi-agent parallel coordination patterns | - | specializations/shared/agent-team-coordination.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Progressive Disclosure Engine | NEW | Token-efficient knowledge loading system | - | plugins/a5c/marketplace/blueprints/progressive-disclosure-engine/ |
| Context-Driven Development | NEW | Vision-to-implementation workflow automation | - | plugins/a5c/marketplace/blueprints/context-driven-development/ |
| Multi-Layer Quality Framework | NEW | Comprehensive quality evaluation with statistical rigor | - | plugins/a5c/marketplace/blueprints/multi-layer-quality-framework/ |