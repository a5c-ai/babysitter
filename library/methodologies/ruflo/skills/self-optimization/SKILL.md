---
name: self-optimization
description: SONA self-optimizing neural architecture with ReasoningBank trajectory learning, EWC++ anti-forgetting, and reinforcement learning feedback loops.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Self-Optimization

## Overview

Implements the SONA (Self-Optimizing Neural Architecture) adaptation cycle with sub-millisecond weight updates, EWC++ to prevent catastrophic forgetting, and a ReasoningBank for trajectory-based learning.

## When to Use

- After task completion to extract and persist learnings
- Improving routing and agent selection over time
- Adapting to new project patterns without forgetting old ones
- Building cross-session intelligence

## SONA Cycle

1. **Extract Patterns** - Mine execution data for recurring patterns
2. **RETRIEVE** - Search ReasoningBank for matching trajectories
3. **JUDGE** - Evaluate trajectory applicability in current context
4. **DISTILL** - Compress and store new entries
5. **Adapt** - Update weights with EWC++ regularization

## Anti-Forgetting (EWC++)

- Elastic Weight Consolidation prevents overwriting previously learned patterns
- Fisher information matrix tracks parameter importance
- Configurable regularization penalty for new adaptations

## RL Algorithms

Q-Learning, SARSA, PPO, DQN, A2C, TD3, SAC, DDPG, Rainbow

## Agents Used

- `agents/optimizer/` - Performance tuning
- `agents/adaptive-queen/` - Real-time adaptation

## Tool Use

Invoke via babysitter process: `methodologies/ruflo/ruflo-intelligence`
