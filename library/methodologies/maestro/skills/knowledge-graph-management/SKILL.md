---
name: knowledge-graph-management
description: Capture, validate, query, and sync architectural patterns and design decisions in the knowledge graph
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---
# Knowledge Graph Management

## Capabilities

Manages the `.maestro/knowledge.dot` knowledge graph. Captures architectural patterns and design decisions. Validates graph consistency. Queries for relevant patterns. Syncs graph with codebase reality. Exports to DOT format.

## Tool Use Instructions

- Use **Read** to load the knowledge graph file
- Use **Grep/Glob** to find patterns referenced in the graph within the codebase
- Use **Write** to export the updated knowledge graph
- Use **Edit** to make targeted graph updates
- Use **Bash** to generate DOT visualizations

## Process Integration

- Used in `maestro-knowledge-graph.js` (All operations)
- Used in `maestro-orchestrator.js` (Post-merge update)
- Used in `maestro-development.js` (Story completion capture)
- Used in `maestro-hotfix.js` (Postmortem recording)
- Used in `maestro-maintenance.js` (Knowledge sync)
- Agent: Knowledge Curator
- Operations: capture, validate, query, sync, full-cycle
