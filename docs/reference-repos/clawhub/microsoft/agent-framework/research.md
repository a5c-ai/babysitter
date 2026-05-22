# clawhub/microsoft/agent-framework

- **Archetype**: Multi-agent framework with graph-based orchestration
- **Stars**: 9,365 (GitHub) / Discovered via ClawHub skill author jgarrison929 (fork)
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: clawhub-skills (indirect -- jgarrison929/security-auditor skill led to fork discovery)
- **Skills found**: 0 (framework repo)

## Summary

Microsoft Agent Framework (formerly AutoGen/Semantic Kernel agents) is a comprehensive multi-language framework (Python + .NET) for building, orchestrating, and deploying AI agents. Key features:

- **Graph-based workflows**: Connect agents and deterministic functions using data flows with streaming, checkpointing, human-in-the-loop, and time-travel capabilities
- **Declarative agents**: YAML/JSON-based agent definition (declarative package)
- **Multiple orchestration patterns**: Sequential, parallel, group chat, handoff, nested
- **DurableTask integration**: Durable workflow execution with checkpointing
- **DevUI**: Interactive developer UI for agent development and debugging
- **A2A protocol support**: Agent-to-Agent communication standard
- **AG-UI integration**: Agent-UI protocol for frontend rendering
- **Lab package**: Experimental features including benchmarking and reinforcement learning
- **Multi-provider**: OpenAI, Anthropic (Claude), Azure, Bedrock, Ollama support

Architecture packages: core, orchestrations, declarative, durabletask, devui, a2a, ag-ui, lab, plus provider-specific adapters.

## Assessment

**MEDIUM VALUE** -- While massive in scope, the framework is mostly infrastructure/SDK code rather than extractable process methodology. However, several architectural patterns are relevant to babysitter:

1. **Declarative agent definitions**: Microsoft's YAML-based agent definition pattern could inform babysitter's process definition format
2. **DurableTask integration**: Their approach to durable workflow execution with checkpointing is philosophically similar to babysitter's event-sourced replay
3. **DevUI**: Their interactive debugging UI is similar in concept to babysitter's observer dashboard
4. **Graph-based orchestration**: Their DAG-based workflow model could inspire enhancements to babysitter's parallel.all()/parallel.map()
5. **A2A protocol**: Agent-to-Agent communication standard could be useful for babysitter's multi-harness orchestration

The codebase is too large (1500+ files) for deep extraction but worth studying specific patterns.

## Extraction Priority

**P2 -- Study for patterns, low urgency**

### Processes

1. **Graph-Based Orchestration Methodology** (methodologies/): A methodology for defining agent workflows as DAGs with typed edges, checkpointing, and human-in-the-loop gates. Study their `orchestrations` package for patterns.

### Plugin Ideas

1. **A2A Protocol Plugin**: Implement Agent-to-Agent protocol support in babysitter, enabling cross-framework agent communication (e.g., a babysitter-orchestrated agent talking to a Microsoft Agent Framework agent).

2. **Declarative Process Plugin**: YAML/JSON-based process definition format (inspired by Microsoft's declarative package) as an alternative to JavaScript process files.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Graph-Based Orchestration Methodology | NEW | DAG-based agent workflow definition with typed edges and checkpointing | - | methodologies/graph-based-orchestration/ |
| Declarative Agent Definition Patterns | NEW | YAML/JSON-based agent definition format and validation | - | specializations/shared/declarative-agent-patterns.js |
| DurableTask Integration Patterns | UPGRADE | Durable workflow execution with checkpointing for agent systems | library/runtime/ | specializations/shared/durable-task-integration.js |
| Multi-Provider Agent Communication | NEW | Cross-framework agent communication protocols and adapters | - | specializations/shared/multi-provider-agent-communication.js |
| Agent Development UI Patterns | NEW | Interactive developer UI for agent debugging and workflow visualization | - | specializations/shared/agent-development-ui-patterns.js |
| A2A Protocol Implementation | NEW | Agent-to-Agent communication standard for cross-framework integration | - | specializations/shared/a2a-protocol-implementation.js |
| Reinforcement Learning Agent Training | NEW | RL patterns for agent optimization and benchmarking | - | specializations/ai-agents-conversational/rl-agent-training.js |
| Human-in-the-Loop Orchestration | NEW | HITL patterns for workflow gating and approval processes | - | specializations/shared/human-in-loop-orchestration.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| A2A Protocol | NEW | Agent-to-Agent protocol support for cross-framework agent communication | - | plugins/a5c/marketplace/plugins/a2a-protocol/ |
| Declarative Process | NEW | YAML/JSON-based process definition as alternative to JavaScript process files | - | plugins/a5c/marketplace/plugins/declarative-process/ |
