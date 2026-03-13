# Ruflo Methodology

**Source**: [ruvnet/ruflo](https://github.com/ruvnet/ruflo) by ruvnet
**Category**: Multi-Agent Swarm Orchestration / Self-Learning Architecture
**License**: See upstream repository

## Overview

Ruflo v3 is a multi-agent orchestration platform deploying 60+ specialized agents in coordinated swarms with self-learning and self-optimizing architecture. It features Q-Learning-based smart routing, hierarchical agent topologies (Queen/Worker), multiple consensus protocols, and the RuVector intelligence layer for continuous self-improvement.

## Core Principles

- **Smart Routing** - Q-Learning router selects optimal execution path (Booster/Medium/Complex)
- **Swarm Coordination** - Topology-aware agent deployment with anti-drift enforcement
- **Weighted Consensus** - Queen agents have 3x voting weight; supports Raft/Byzantine/Gossip/CRDT
- **Self-Optimization** - SONA adaptation with EWC++ anti-forgetting and ReasoningBank learning
- **Security First** - AIDefence layer with prompt injection blocking and sandboxed execution
- **Agent Booster** - WASM fast-path for simple transforms (352x faster, $0 cost)

## Process Files

| Process | File | Description | Task Count |
|---------|------|-------------|------------|
| Swarm Orchestrator | `ruflo-orchestrator.js` | Main pipeline: routing -> swarm -> execution -> consensus -> verify | 8 |
| Swarm Coordination | `ruflo-swarm-coordination.js` | Topology, consensus, anti-drift, agent lifecycle | 8 |
| RuVector Intelligence | `ruflo-intelligence.js` | Pattern extraction, ReasoningBank, SONA, knowledge graph | 8 |
| Smart Task Routing | `ruflo-task-routing.js` | Complexity assessment, Agent Booster, Q-Learning, MoE | 7 |
| Security Audit | `ruflo-security-audit.js` | AIDefence: injection, validation, SAST, sandbox, compliance | 8 |

## Skills Catalog

| Skill | Directory | Description |
|-------|-----------|-------------|
| swarm-orchestration | `skills/swarm-orchestration/` | Multi-agent swarm formation and coordination |
| smart-routing | `skills/smart-routing/` | Complexity-based task routing and model selection |
| consensus-mechanisms | `skills/consensus-mechanisms/` | Raft/Byzantine/Gossip/CRDT consensus |
| self-optimization | `skills/self-optimization/` | SONA adaptation and ReasoningBank learning |
| vector-memory | `skills/vector-memory/` | HNSW vector search and knowledge graph |
| agent-booster | `skills/agent-booster/` | WASM-based instant code transforms |
| anti-drift | `skills/anti-drift/` | Hierarchical coordination and drift detection |
| security-hardening | `skills/security-hardening/` | AIDefence layer and sandboxed execution |

## Agents Catalog

| Agent | Directory | Role |
|-------|-----------|------|
| strategic-queen | `agents/strategic-queen/` | Long-term planning and goal setting |
| tactical-queen | `agents/tactical-queen/` | Execution coordination and resource allocation |
| adaptive-queen | `agents/adaptive-queen/` | Real-time optimization and adaptation |
| swarm-coordinator | `agents/swarm-coordinator/` | Topology management and consensus |
| coder | `agents/coder/` | Code implementation and modification |
| tester | `agents/tester/` | Test creation and execution |
| reviewer | `agents/reviewer/` | Code quality analysis |
| architect | `agents/architect/` | System design and architecture |
| security-auditor | `agents/security-auditor/` | Vulnerability detection and hardening |
| optimizer | `agents/optimizer/` | Performance tuning and token optimization |

## Architecture Layers

```
User Layer (CLI/MCP) -> Routing Layer (Q-Learning + 8 MoE) -> Swarm Coordination (Topology + Consensus) -> Agent Execution (Queen + Workers) -> Intelligence Layer (RuVector/SONA) -> Resource Layer (Memory/Workers)
```

## Task-to-Agent Mapping

| Task Type | Agents |
|-----------|--------|
| Bug Fix | swarm-coordinator + coder + tester |
| Feature | swarm-coordinator + architect + coder + tester + reviewer |
| Refactor | swarm-coordinator + architect + coder + reviewer |
| Performance | swarm-coordinator + optimizer + coder |
| Security | swarm-coordinator + security-auditor + coder |

## Swarm Topologies

| Topology | Best For | Communication |
|----------|----------|---------------|
| Mesh | Small swarms (<8), high collaboration | All-to-all |
| Hierarchical | Large swarms, clear delegation | Queen-to-Workers |
| Ring | Pipeline/sequential tasks | Neighbor-to-neighbor |
| Star | Fan-out/fan-in patterns | Central coordinator |

## Consensus Protocols

| Protocol | Fault Model | Quorum |
|----------|-------------|--------|
| Raft | Crash faults | n/2 + 1 |
| Byzantine | Byzantine faults | 2n/3 + 1 |
| Gossip | Partition tolerant | Eventual |
| CRDT | Always convergent | None needed |

## Anti-Drift Mechanisms

- Hierarchical coordinator checkpoints every 2 subtasks
- Shared memory coherence validation
- Role specialization enforcement
- Short task cycles with bounded execution windows
- Drift scoring with configurable threshold (default: 0.3)

## Quality Gates

1. **Anti-Drift Checkpoint** - Drift score < threshold (blocking)
2. **Consensus Voting** - Weighted majority with Queen 3x (blocking)
3. **Output Verification** - Quality score >= threshold (blocking, max 3 attempts)
4. **Security Audit** - No critical vulnerabilities (blocking)
