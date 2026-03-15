---
name: swarm-orchestration
description: Multi-agent swarm formation and coordinated execution with topology-aware agent deployment, consensus protocols, and anti-drift enforcement.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Swarm Orchestration

## Overview

Form and coordinate multi-agent swarms with topology-aware deployment. Supports Mesh, Hierarchical, Ring, and Star topologies with automatic selection based on task complexity and agent count.

## When to Use

- Complex tasks requiring multiple specialized agents
- Tasks needing coordinated parallel execution
- When consensus among agents is required for quality
- Projects requiring anti-drift enforcement during execution

## Process

1. **Topology Selection** - Analyze task and agent pool to select optimal topology
2. **Agent Assignment** - Assign Queen (Strategic/Tactical/Adaptive) and Worker roles
3. **Consensus Init** - Initialize Raft/Byzantine/Gossip/CRDT protocol
4. **Parallel Execution** - Distribute subtasks with shared memory
5. **Anti-Drift Checkpoints** - Validate alignment every N subtasks
6. **Consensus Voting** - Weighted voting (Queen=3x) for final decision

## Topologies

- **Mesh**: All-to-all communication, best for small swarms (<8 agents)
- **Hierarchical**: Queen coordinates workers, best for large/structured tasks
- **Ring**: Sequential handoff, best for pipeline/transformation tasks
- **Star**: Central coordinator fan-out, best for independent subtasks

## Agents Used

- `agents/strategic-queen/` - Long-term planning swarms
- `agents/tactical-queen/` - Execution coordination swarms
- `agents/adaptive-queen/` - Real-time optimization swarms
- `agents/swarm-coordinator/` - Topology management

## Tool Use

Invoke via babysitter process: `methodologies/ruflo/ruflo-swarm-coordination`
