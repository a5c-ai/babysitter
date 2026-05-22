---
name: vector-memory
description: HNSW vector search for pattern similarity retrieval and knowledge graph maintenance with PageRank scoring, community detection, and 3-tier memory management.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Building and querying knowledge graphs for project context
- Managing cross-session memory across project/local/user scopes
- Fast similarity search for routing decisions

## HNSW Performance

- Search latency: ~61 microseconds
- Query throughput: ~16,400 QPS
- Configurable embedding dimensions (default: 128)

## Knowledge Graph

- **PageRank**: Importance scoring for knowledge nodes
- **Community Detection**: Cluster related patterns
- **LRU Cache**: Fast access to frequently used patterns
- **SQLite Backing**: Persistent cross-session storage

## 3-Tier Memory

| Scope | Persistence | Content |
|-------|------------|---------|
| Project | Codebase-level | Patterns, architecture decisions, dependencies |
| Local | Session-level | Context, adaptations, temporary patterns |
| User | Cross-project | Preferences, learned behaviors, global patterns |

## Agents Used

- `agents/optimizer/` - Memory and cache optimization

## Tool Use

Invoke via babysitter process: `methodologies/ruflo/ruflo-intelligence`
