---
name: consensus-mechanisms
description: Multi-protocol consensus for agent swarms supporting Raft leader election, Byzantine fault tolerance, Gossip state propagation, and CRDT conflict-free merging.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Consensus Mechanisms

## Overview

Implement distributed consensus among agent swarms. Select the appropriate protocol based on fault tolerance requirements, swarm size, and communication topology.

## When to Use

- Multiple agents have produced independent solutions needing reconciliation
- Byzantine fault tolerance is required (untrusted or unreliable agents)
- State synchronization across distributed agent swarms
- Conflict-free data merging in concurrent operations

## Protocols

| Protocol | Use Case | Fault Tolerance | Complexity |
|----------|----------|-----------------|------------|
| Raft | Leader-based consensus, ordered log | Crash faults (f < n/2) | Medium |
| Byzantine | Untrusted agents, adversarial conditions | Byzantine faults (f < n/3) | High |
| Gossip | Eventual consistency, state propagation | Partition tolerant | Low |
| CRDT | Conflict-free replicated data types | Always convergent | Low |

## Weighted Voting

- Queen agents: 3x weight multiplier
- Worker agents: 1x weight
- Configurable consensus threshold (majority, supermajority, unanimous)

## Agents Used

- `agents/swarm-coordinator/` - Protocol orchestration
- `agents/strategic-queen/` - Weighted voting leadership

## Tool Use

Invoke via babysitter process: `methodologies/ruflo/ruflo-swarm-coordination`
